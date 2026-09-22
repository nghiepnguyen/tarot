"use server";

import { revalidatePath } from "next/cache";
import type { Prisma } from "@prisma/client";
import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";
import { checkRateLimit } from "@/lib/auth/rate-limit";
import { TAROT_CARDS } from "@/lib/tarot/cards";
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

export async function saveReadingAction(
  question: string,
  cards: StoredCard[],
): Promise<{ id: string } | null> {
  const session = await auth();
  if (!session?.user) return null;

  if (!(await checkRateLimit(`save-reading:${session.user.id}`, 30, 60 * 60 * 1000))) {
    return null;
  }

  const trimmedQuestion = question.trim().slice(0, 300);
  if (!trimmedQuestion || cards.length !== 3 || !cards.every(isValidCard)) return null;

  const reading = await prisma.reading.create({
    data: {
      userId: session.user.id,
      question: trimmedQuestion,
      cards: cards as unknown as Prisma.InputJsonValue,
    },
  });

  revalidatePath("/history");
  return { id: reading.id };
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
