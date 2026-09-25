"use server";

import { revalidatePath } from "next/cache";
import type { Prisma } from "@prisma/client";
import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";
import { checkRateLimit } from "@/lib/auth/rate-limit";
import { TAROT_CARDS } from "@/lib/tarot/cards";
import { SAVE_READING_LIMIT_PER_HOUR } from "@/lib/tarot/limits";
import type { Orientation } from "@/lib/tarot/draw";

const CARD_IDS = new Set(TAROT_CARDS.map((card) => card.id));

/**
 * `cards` tới từ trình duyệt, nên không tin được. Một `cardId` bịa lọt vào
 * database sẽ ném khi mở khóa diễn giải (`ai.ts` tra lá bài theo id) — sau khi
 * đã trừ credit. Chặn ngay tại cửa vào rẻ hơn nhiều so với gỡ một hàng hỏng
 * sau này.
 */
function isValidCard(card: StoredCard): boolean {
  return (
    typeof card?.cardId === "string" &&
    CARD_IDS.has(card.cardId) &&
    (card.orientation === "upright" || card.orientation === "reversed") &&
    typeof card.position === "string" &&
    card.position.length > 0
  );
}

export interface StoredCard {
  cardId: string;
  orientation: Orientation;
  position: string;
}

/**
 * Trả về lý do thay vì chỉ `null`: phía client phải phân biệt được khách chưa
 * đăng nhập (mời đăng nhập), chạm giới hạn (bấm lại vô ích cho tới khi hết
 * cửa sổ) và bài hỏng (bấm lại cũng không bao giờ lưu được).
 */
export type SaveReadingResult =
  | { ok: true; id: string }
  | { ok: false; reason: "unauthenticated" | "rate_limited" | "invalid" };

export async function saveReadingAction(
  question: string,
  cards: StoredCard[],
): Promise<SaveReadingResult> {
  const session = await auth();
  if (!session?.user) return { ok: false, reason: "unauthenticated" };

  if (
    !(await checkRateLimit(
      `save-reading:${session.user.id}`,
      SAVE_READING_LIMIT_PER_HOUR,
      60 * 60 * 1000,
    ))
  ) {
    return { ok: false, reason: "rate_limited" };
  }

  const trimmedQuestion = question.trim().slice(0, 300);
  if (!trimmedQuestion || cards.length !== 3 || !cards.every(isValidCard)) {
    return { ok: false, reason: "invalid" };
  }

  const reading = await prisma.reading.create({
    data: {
      userId: session.user.id,
      question: trimmedQuestion,
      cards: cards as unknown as Prisma.InputJsonValue,
    },
  });

  revalidatePath("/history");
  return { ok: true, id: reading.id };
}

export async function deleteReadingAction(readingId: string) {
  const session = await auth();
  if (!session?.user) return;

  await prisma.reading.deleteMany({
    where: { id: readingId, userId: session.user.id },
  });

  revalidatePath("/history");
}

export async function deleteAllReadingsAction() {
  const session = await auth();
  if (!session?.user) return;

  await prisma.reading.deleteMany({ where: { userId: session.user.id } });

  revalidatePath("/history");
}
