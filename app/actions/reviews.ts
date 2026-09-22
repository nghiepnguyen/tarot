"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";
import { checkRateLimit } from "@/lib/auth/rate-limit";
import { getModelPersona } from "@/lib/ai/models";
import { sendReviewEmail } from "@/lib/ai/reviews";
import { InterpretationReviewSchema } from "@/lib/validation/review";
import { reportHandledError } from "@/lib/monitoring/report";

export type SubmitReviewResult = { ok: true } | { ok: false; error: string };

/**
 * Ghi điểm người đọc chấm cho một bản diễn giải, rồi báo về hòm thư.
 *
 * Chỉ chủ bài đọc chấm được, và điều đó phải kiểm bằng *truy vấn*, không bằng
 * id gửi lên: `interpretationId` tới từ trình duyệt, nên `where` lọc luôn theo
 * `reading.userId`. Không tìm thấy thì trả lỗi chung chung — không xác nhận
 * giúp người lạ rằng id đó có tồn tại hay không.
 *
 * Upsert chứ không create: đánh giá sửa được. Lần đầu và lần sửa cùng đi một
 * đường, và `review !== null` từ lần đọc trước là thứ phân biệt hai trường hợp
 * trong tiêu đề thư.
 *
 * Email gửi *sau* khi đã ghi, và kết quả gửi không đổi kết quả trả về: điểm
 * nằm trong database rồi, Resend hỏng là chuyện của Sentry chứ không phải của
 * người vừa bấm năm sao.
 */
export async function submitInterpretationReviewAction(
  payload: unknown,
): Promise<SubmitReviewResult> {
  const session = await auth();
  if (!session?.user) return { ok: false, error: "Vui lòng đăng nhập để gửi đánh giá." };

  const parsed = InterpretationReviewSchema.safeParse(payload);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ." };
  }
  const { interpretationId, accuracy, clarity, actionability, comment } = parsed.data;

  if (!(await checkRateLimit(`review:${session.user.id}`, 30, 60 * 60 * 1000))) {
    return { ok: false, error: "Bạn thao tác quá nhanh, vui lòng thử lại sau ít phút." };
  }

  const interpretation = await prisma.aiInterpretation.findFirst({
    where: { id: interpretationId, reading: { userId: session.user.id } },
    select: {
      id: true,
      model: true,
      promptVersion: true,
      review: { select: { id: true } },
      reading: { select: { id: true, question: true } },
    },
  });
  if (!interpretation) return { ok: false, error: "Không tìm thấy bản diễn giải này." };

  const isUpdate = interpretation.review !== null;

  try {
    await prisma.interpretationReview.upsert({
      where: { interpretationId: interpretation.id },
      create: {
        interpretationId: interpretation.id,
        userId: session.user.id,
        accuracy,
        clarity,
        actionability,
        comment: comment ?? null,
      },
      update: { accuracy, clarity, actionability, comment: comment ?? null },
    });
  } catch (error) {
    reportHandledError(error, {
      area: "interpretation-review",
      userId: session.user.id,
      extra: { interpretationId: interpretation.id, model: interpretation.model },
    });
    return { ok: false, error: "Không lưu được đánh giá lúc này, vui lòng thử lại." };
  }

  await sendReviewEmail({
    reader: getModelPersona(interpretation.model),
    model: interpretation.model,
    promptVersion: interpretation.promptVersion,
    question: interpretation.reading.question,
    readingId: interpretation.reading.id,
    accuracy,
    clarity,
    actionability,
    comment: comment ?? null,
    isUpdate,
  });

  revalidatePath("/history");
  return { ok: true };
}
