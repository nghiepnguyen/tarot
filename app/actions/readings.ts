"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { reportHandledError } from "@/lib/monitoring/report";
import type { Prisma } from "@prisma/client";
import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";
import { checkRateLimit } from "@/lib/auth/rate-limit";
import { parseReadingInput } from "@/lib/validation/reading";
import { SAVE_READING_LIMIT_PER_HOUR } from "@/lib/tarot/limits";
import type { Orientation } from "@/lib/tarot/draw";

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
  requestId: string,
): Promise<SaveReadingResult> {
  const session = await auth();
  if (!session?.user) return { ok: false, reason: "unauthenticated" };
  const input = parseReadingInput(question, cards);
  if (!input || !z.uuid().safeParse(requestId).success) return { ok: false, reason: "invalid" };
  const replay = (row: { id: string; userId: string; question: string; cards: Prisma.JsonValue }): SaveReadingResult => {
    const stored = parseReadingInput(row.question, row.cards);
    return row.userId === session.user.id && stored && JSON.stringify(stored) === JSON.stringify(input)
      ? { ok: true, id: row.id } : { ok: false, reason: "invalid" };
  };
  const existing = await prisma.reading.findUnique({ where: { id: requestId } });
  if (existing) return replay(existing);
  if (!(await checkRateLimit(`save-reading:${session.user.id}`, SAVE_READING_LIMIT_PER_HOUR, 60 * 60 * 1000))) return { ok: false, reason: "rate_limited" };
  try {
    await prisma.reading.create({ data: {
      id: requestId, userId: session.user.id, question: input.question,
      cards: input.cards as unknown as Prisma.InputJsonValue,
    } });
  } catch (error) {
    // Resolve a duplicate or lost acknowledgement only from the committed owned payload.
    const committed = await prisma.reading.findUnique({ where: { id: requestId } });
    if (committed) return replay(committed);
    throw error;
  }
  try { revalidatePath("/history"); }
  catch {
    try { reportHandledError(new Error("Saved reading cache refresh failed"), { area: "reading-save", userId: session.user.id, extra: { readingId: requestId } }); } catch { /* The reading is committed. */ }
  }
  return { ok: true, id: requestId };
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
