"use server";

import { revalidatePath } from "next/cache";
import type { Prisma } from "@prisma/client";
import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";
import { checkRateLimit } from "@/lib/auth/rate-limit";
import type { Orientation } from "@/lib/tarot/draw";

export interface StoredCard {
  cardId: string;
  orientation: Orientation;
  position: string;
}

export async function saveReadingAction(question: string, cards: StoredCard[]) {
  const session = await auth();
  if (!session?.user) return;

  if (!checkRateLimit(`save-reading:${session.user.id}`, 30, 60 * 60 * 1000)) {
    return;
  }

  const trimmedQuestion = question.trim().slice(0, 300);
  if (!trimmedQuestion || cards.length !== 3) return;

  await prisma.reading.create({
    data: {
      userId: session.user.id,
      question: trimmedQuestion,
      cards: cards as unknown as Prisma.InputJsonValue,
    },
  });

  revalidatePath("/history");
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
