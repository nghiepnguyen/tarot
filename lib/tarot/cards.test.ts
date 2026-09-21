import { existsSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { getCardById, TAROT_CARDS } from "./cards";

describe("TAROT_CARDS", () => {
  it("has the full standard 78-card deck", () => {
    expect(TAROT_CARDS).toHaveLength(78);
  });

  it("has 22 major arcana and 14 cards in each of the four suits", () => {
    const counts = TAROT_CARDS.reduce<Record<string, number>>((acc, card) => {
      acc[card.category] = (acc[card.category] ?? 0) + 1;
      return acc;
    }, {});
    expect(counts).toEqual({
      "major-arcana": 22,
      cups: 14,
      pentacles: 14,
      swords: 14,
      wands: 14,
    });
  });

  it("has a unique id for every card", () => {
    const ids = TAROT_CARDS.map((card) => card.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("gives every card a non-empty basic and reversed meaning", () => {
    for (const card of TAROT_CARDS) {
      expect(card.basicMeaning.length).toBeGreaterThan(0);
      expect(card.reversedMeaning.length).toBeGreaterThan(0);
      expect(card.keywords.length).toBeGreaterThan(0);
    }
  });

  it("gives every card a meaning of its own", () => {
    // Ẩn Phụ từng sinh bằng công thức rank × chất, nên "three" ở bốn chất chỉ
    // khác nhau ở câu mở đầu — Three of Swords mang nghĩa "phát triển, hợp
    // tác" trong khi lá bài vẽ ba lưỡi kiếm xuyên qua một trái tim. Người dùng
    // nhìn thấy lá bài trong lúc đọc luận giải, nên chênh đó lộ ra ngay.
    const basics = TAROT_CARDS.map((card) => card.basicMeaning);
    const reversed = TAROT_CARDS.map((card) => card.reversedMeaning);
    expect(new Set(basics).size).toBe(basics.length);
    expect(new Set(reversed).size).toBe(reversed.length);
  });

  it("points every card at an image that exists on disk", () => {
    // `image` dựng từ id, nên gõ sai một id là hỏng một ảnh — mà lỗi đó chỉ
    // hiện ra dưới dạng một ô trống lúc người dùng lật bài.
    for (const card of TAROT_CARDS) {
      const file = path.join(process.cwd(), "public", card.image);
      expect(existsSync(file), card.image).toBe(true);
    }
  });
});

describe("getCardById", () => {
  it("finds every card in the deck by its own id", () => {
    for (const card of TAROT_CARDS) {
      expect(getCardById(card.id)).toEqual(card);
    }
  });

  it("returns undefined for an id that doesn't exist", () => {
    expect(getCardById("not-a-real-card")).toBeUndefined();
  });
});
