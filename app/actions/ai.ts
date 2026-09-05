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
  type InterpretationCardInput,
  type InterpretationResult,
} from "@/lib/ai/interpretation";
import { generateInterpretation, MissingApiKeyError } from "@/lib/ai/gemini";
import type { StoredCard } from "@/app/actions/readings";

export type UnlockResult =
  | { ok: true; data: InterpretationResult }
  | { ok: false; error: string };

export async function unlockAiInterpretationAction(readingId: string): Promise<UnlockResult> {
  const session = await auth();
  if (!session?.user) return { ok: false, error: "Vui lòng đăng nhập để mở khóa diễn giải AI." };

  const reading = await prisma.reading.findFirst({
    where: { id: readingId, userId: session.user.id },
    include: { aiInterpretation: true },
  });
  if (!reading) return { ok: false, error: "Không tìm thấy lần trải bài này." };

  if (reading.aiInterpretation) {
    const existing = reading.aiInterpretation;
    return {
      ok: true,
      data: {
        overview: existing.overview,
        perCard: existing.perCard as unknown as InterpretationResult["perCard"],
        connections: existing.connections,
        actionSuggestions: existing.actionSuggestions,
        reflectiveQuestion: existing.reflectiveQuestion,
      },
    };
  }

  if (!checkRateLimit(`ai-unlock:${session.user.id}`, 20, 60 * 60 * 1000)) {
    return { ok: false, error: "Bạn thao tác quá nhanh, vui lòng thử lại sau ít phút." };
  }

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

  const storedCards = reading.cards as unknown as StoredCard[];
  const cardInputs: InterpretationCardInput[] = storedCards.map((stored) => {
    const card = TAROT_CARDS.find((c) => c.id === stored.cardId);
    if (!card) throw new Error(`Không tìm thấy lá bài "${stored.cardId}".`);
    return { position: stored.position, card, orientation: stored.orientation };
  });

  try {
    const result = await generateInterpretation(reading.question, cardInputs);

    await prisma.aiInterpretation.create({
      data: {
        readingId: reading.id,
        overview: result.overview,
        perCard: result.perCard as unknown as Prisma.InputJsonValue,
        connections: result.connections,
        actionSuggestions: result.actionSuggestions,
        reflectiveQuestion: result.reflectiveQuestion,
        model: "gemini-2.5-flash",
      },
    });

    revalidatePath("/history");
    return { ok: true, data: result };
  } catch (error) {
    await prisma.user.update({
      where: { id: session.user.id },
      data: { credits: { increment: COST_PER_INTERPRETATION } },
    });

    const message =
      error instanceof MissingApiKeyError
        ? error.message
        : "Không thể tạo diễn giải AI lúc này, vui lòng thử lại.";
    return { ok: false, error: message };
  }
}

export async function topUpCreditsAction() {
  const session = await auth();
  if (!session?.user) return;

  if (!checkRateLimit(`topup:${session.user.id}`, 10, 60 * 60 * 1000)) return;

  await prisma.user.update({
    where: { id: session.user.id },
    data: { credits: { increment: DEMO_TOPUP_AMOUNT } },
  });

  revalidatePath("/profile");
}
