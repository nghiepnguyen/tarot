"use server";

import { revalidatePath } from "next/cache";
import type { Prisma } from "@prisma/client";
import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";
import { checkRateLimit } from "@/lib/auth/rate-limit";
import { TAROT_CARDS } from "@/lib/tarot/cards";
import {
  COST_PER_INTERPRETATION,
  DEMO_TOPUP_AMOUNT,
  toDisplayInterpretation,
  type DisplayInterpretation,
  type InterpretationCardInput,
} from "@/lib/ai/interpretation";
import { ACTIVE_PROMPT_VERSION } from "@/lib/ai/prompts";
import { isPricedModel } from "@/lib/ai/pricing";
import { resolveAiModelForUnlock } from "@/lib/ai/settings";
import { MissingApiKeyError } from "@/lib/ai/generate";
import { generateMeasuredInterpretation } from "@/lib/ai/metrics";
import { reportHandledError, reportHandledIssue } from "@/lib/monitoring/report";
import type { StoredCard } from "@/app/actions/readings";

export type UnlockResult =
  | { ok: true; data: DisplayInterpretation }
  | { ok: false; error: string };

export async function unlockAiInterpretationAction(readingId: string): Promise<UnlockResult> {
  const session = await auth();
  if (!session?.user) return { ok: false, error: "Vui lòng đăng nhập để mở khóa diễn giải chuyên sâu." };

  const reading = await prisma.reading.findFirst({
    where: { id: readingId, userId: session.user.id },
    include: { aiInterpretation: { include: { review: true } } },
  });
  if (!reading) return { ok: false, error: "Không tìm thấy lần trải bài này." };

  if (reading.aiInterpretation) {
    return {
      ok: true,
      data: toDisplayInterpretation(
        reading.aiInterpretation,
        reading.aiInterpretation.review,
      ),
    };
  }

  if (!(await checkRateLimit(`ai-unlock:${session.user.id}`, 20, 60 * 60 * 1000))) {
    return { ok: false, error: "Bạn thao tác quá nhanh, vui lòng thử lại sau ít phút." };
  }

  // Đọc model trước khi trừ credit: đây là một truy vấn đọc, và nếu nó hỏng
  // thì hỏng lúc chưa ai mất gì. Đặt sau bước trừ thì một lỗi database ở đây
  // thành credit bay mà không có nhánh hoàn nào chạy.
  //
  // Ở chế độ ngẫu nhiên, đây cũng là chỗ con xúc xắc gieo — mỗi lượt mở khóa
  // một lần, và `model.id` ghi xuống database ngay bên dưới như mọi lượt khác.
  const model = await resolveAiModelForUnlock();

  const deducted = await prisma.user.updateMany({
    where: { id: session.user.id, credits: { gte: COST_PER_INTERPRETATION } },
    data: { credits: { decrement: COST_PER_INTERPRETATION } },
  });
  if (deducted.count === 0) {
    return {
      ok: false,
      error: `Không đủ credit. Cần ${COST_PER_INTERPRETATION} credit để mở khóa diễn giải này.`,
    };
  }

  const balanceAfterSpend = await prisma.user.findUniqueOrThrow({
    where: { id: session.user.id },
    select: { credits: true },
  });
  await prisma.creditTransaction.create({
    data: {
      userId: session.user.id,
      type: "UNLOCK_SPEND",
      amount: -COST_PER_INTERPRETATION,
      balanceAfter: balanceAfterSpend.credits,
      relatedReadingId: reading.id,
    },
  });

  const storedCards = reading.cards as unknown as StoredCard[];

  try {
    // Dựng đầu vào cho model *bên trong* `try`: một `cardId` không tra được
    // sẽ ném ở đây, và credit vừa trừ ngay phía trên phải đi qua nhánh hoàn
    // ở `catch`. Để ngoài `try` thì lỗi này thành credit bay không hoàn.
    const cardInputs: InterpretationCardInput[] = storedCards.map((stored) => {
      const card = TAROT_CARDS.find((c) => c.id === stored.cardId);
      if (!card) throw new Error(`Không tìm thấy lá bài "${stored.cardId}".`);
      return { position: stored.position, card, orientation: stored.orientation };
    });

    const version = ACTIVE_PROMPT_VERSION;
    const { result, usage } = await generateMeasuredInterpretation(
      reading.question,
      cardInputs,
      version,
      model,
    );

    // Model chạy mà không có trong bảng giá thì mọi con số tiền trên
    // `/admin` thành ước lượng, và không có gì khác kêu lên. Kêu ở đây, lúc
    // phát sinh, chứ không đợi ai đó mở dashboard và tin nhầm.
    if (!isPricedModel(model.id)) {
      reportHandledIssue("Model AI chưa có trong bảng giá", {
        area: "ai-unlock",
        extra: { model: model.id, promptVersion: version.id },
      });
    }

    const created = await prisma.aiInterpretation.create({
      data: {
        readingId: reading.id,
        summary: result.summary,
        overview: result.overview,
        themes: result.themes as unknown as Prisma.InputJsonValue,
        perCard: result.perCard as unknown as Prisma.InputJsonValue,
        connections: result.connections,
        // Legacy column: keep it populated (it's NOT NULL) with a joined
        // fallback in case anything ever reads it directly.
        actionSuggestions: result.actionSuggestions.join("\n"),
        actionSuggestionsList: result.actionSuggestions as unknown as Prisma.InputJsonValue,
        reflectiveQuestion: result.reflectiveQuestion,
        closingNote: result.closingNote,
        model: model.id,
        promptVersion: version.id,
        inputTokens: usage.inputTokens,
        outputTokens: usage.outputTokens,
        thinkingTokens: usage.thinkingTokens,
        latencyMs: usage.latencyMs,
      },
    });

    revalidatePath("/history");
    // Trả về bản đã ghi, không phải `result` thô: giao diện cần `id` của row để
    // hộp chấm điểm ghi ngược về, và bút danh của model vừa chạy.
    return { ok: true, data: toDisplayInterpretation(created) };
  } catch (error) {
    // Người dùng chỉ thấy một câu xin lỗi và được hoàn credit, nên nếu không
    // báo về Sentry ở đây thì nhà cung cấp hỏng bao lâu cũng không ai biết.
    // Ghi cả model: từ lúc đổi được model từ trang quản trị, "AI hỏng" và
    // "model vừa đổi hỏng" là hai chuyện khác nhau.
    reportHandledError(error, {
      area: "ai-unlock",
      extra: {
        readingId: reading.id,
        model: model.id,
        provider: model.provider,
        promptVersion: ACTIVE_PROMPT_VERSION.id,
      },
      userId: session.user.id,
    });

    const refunded = await prisma.user.update({
      where: { id: session.user.id },
      data: { credits: { increment: COST_PER_INTERPRETATION } },
    });
    await prisma.creditTransaction.create({
      data: {
        userId: session.user.id,
        type: "REFUND",
        amount: COST_PER_INTERPRETATION,
        balanceAfter: refunded.credits,
        relatedReadingId: reading.id,
      },
    });

    const message =
      error instanceof MissingApiKeyError
        ? error.message
        : "Không thể tạo diễn giải chuyên sâu lúc này, vui lòng thử lại.";
    return { ok: false, error: message };
  }
}

export interface CreditStatus {
  credits: number;
  hasPurchased: boolean;
}

export async function getCreditStatusAction(): Promise<CreditStatus | null> {
  const session = await auth();
  if (!session?.user) return null;

  const [user, purchase] = await Promise.all([
    prisma.user.findUnique({ where: { id: session.user.id }, select: { credits: true } }),
    prisma.creditTransaction.findFirst({
      where: { userId: session.user.id, type: "PURCHASE" },
      select: { id: true },
    }),
  ]);
  if (!user) return null;

  return { credits: user.credits, hasPurchased: purchase !== null };
}

export async function topUpCreditsAction() {
  if (process.env.NODE_ENV === "production") return;

  const session = await auth();
  if (!session?.user) return;

  if (!(await checkRateLimit(`topup:${session.user.id}`, 10, 60 * 60 * 1000))) return;

  await prisma.user.update({
    where: { id: session.user.id },
    data: { credits: { increment: DEMO_TOPUP_AMOUNT } },
  });

  revalidatePath("/credits");
}
