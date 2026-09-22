import { describe, expect, it } from "vitest";
import { TAROT_CARDS } from "./cards";
import { buildReadingTeaser } from "./teaser";
import type { DrawnCard, Orientation } from "./draw";

function pick(category: string, index = 0) {
  const card = TAROT_CARDS.filter((c) => c.category === category)[index];
  if (!card) throw new Error(`no card for ${category}[${index}]`);
  return card;
}

function spread(
  specs: Array<[string, Orientation]>,
  indexes: number[] = [0, 1, 2],
): DrawnCard[] {
  return specs.map(([category, orientation], i) => ({
    card: pick(category, indexes[i]),
    orientation,
  }));
}

describe("buildReadingTeaser", () => {
  it("returns nothing for a spread that is not three cards", () => {
    expect(buildReadingTeaser(spread([["cups", "upright"]]).slice(0, 1))).toEqual([]);
  });

  it("calls out a spread that is all major arcana", () => {
    const lines = buildReadingTeaser(
      spread([
        ["major-arcana", "upright"],
        ["major-arcana", "upright"],
        ["major-arcana", "upright"],
      ]),
    );
    expect(lines[0]).toContain("Cả ba lá đều là Ẩn Chính");
  });

  it("names the position of a lone major arcana, since that is the specific part", () => {
    const lines = buildReadingTeaser(
      spread([
        ["cups", "upright"],
        ["major-arcana", "upright"],
        ["wands", "upright"],
      ]),
    );
    expect(lines[0]).toContain("Hiện tại");
  });

  it("reports a spread with no major arcana as everyday", () => {
    const lines = buildReadingTeaser(
      spread([
        ["cups", "upright"],
        ["wands", "upright"],
        ["swords", "upright"],
      ]),
    );
    expect(lines[0]).toContain("Ẩn Phụ");
  });

  it("flags a dominant suit but stays quiet when the suits are all different", () => {
    const dominant = buildReadingTeaser(
      spread(
        [
          ["cups", "upright"],
          ["cups", "upright"],
          ["wands", "upright"],
        ],
        [0, 1, 0],
      ),
    );
    expect(dominant.some((line) => line.includes("bộ Cốc"))).toBe(true);

    const mixed = buildReadingTeaser(
      spread([
        ["cups", "upright"],
        ["wands", "upright"],
        ["swords", "upright"],
      ]),
    );
    expect(mixed.some((line) => line.includes("bộ "))).toBe(false);
    expect(mixed).toHaveLength(2);
  });

  it("does not count major arcana toward suit dominance", () => {
    const lines = buildReadingTeaser(
      spread([
        ["major-arcana", "upright"],
        ["major-arcana", "upright"],
        ["cups", "upright"],
      ]),
    );
    expect(lines.some((line) => line.includes("bộ "))).toBe(false);
  });

  it("describes reversals by position, and says so when there are none", () => {
    const someReversed = buildReadingTeaser(
      spread([
        ["cups", "upright"],
        ["wands", "reversed"],
        ["swords", "upright"],
      ]),
    );
    expect(someReversed.at(-1)).toContain("Hiện tại");
    expect(someReversed.at(-1)).toContain("đang");

    const noneReversed = buildReadingTeaser(
      spread([
        ["cups", "upright"],
        ["wands", "upright"],
        ["swords", "upright"],
      ]),
    );
    expect(noneReversed.at(-1)).toContain("đều xuôi");

    const allReversed = buildReadingTeaser(
      spread([
        ["cups", "reversed"],
        ["wands", "reversed"],
        ["swords", "reversed"],
      ]),
    );
    expect(allReversed.at(-1)).toContain("Cả ba lá đều ngược");
  });

  it("never repeats a card's own meaning — that is already on screen above it", () => {
    const cards = spread([
      ["cups", "upright"],
      ["wands", "reversed"],
      ["major-arcana", "upright"],
    ]);
    const joined = buildReadingTeaser(cards).join(" ");
    for (const { card, orientation } of cards) {
      const meaning = orientation === "reversed" ? card.reversedMeaning : card.basicMeaning;
      expect(joined).not.toContain(meaning);
      expect(joined).not.toContain(card.name);
    }
  });

  // `AiUnlockPanel` dùng chính chuỗi làm React key, nên hai dòng trùng nhau là
  // một lỗi render chứ không chỉ là văn vụng.
  it("never emits the same line twice in one spread", () => {
    const spreads: DrawnCard[][] = [
      spread([["swords", "reversed"], ["swords", "reversed"], ["swords", "reversed"]], [0, 1, 2]),
      spread([["major-arcana", "upright"], ["major-arcana", "upright"], ["major-arcana", "upright"]]),
      spread([["cups", "reversed"], ["cups", "upright"], ["wands", "reversed"]], [0, 1, 0]),
      spread([["pentacles", "upright"], ["pentacles", "reversed"], ["major-arcana", "upright"]], [0, 1, 0]),
    ];
    for (const cards of spreads) {
      const lines = buildReadingTeaser(cards);
      expect(new Set(lines).size).toBe(lines.length);
    }
  });

  it("is deterministic, so the same spread never teases two different things", () => {
    const cards = spread([
      ["swords", "reversed"],
      ["swords", "upright"],
      ["cups", "upright"],
    ]);
    expect(buildReadingTeaser(cards)).toEqual(buildReadingTeaser(cards));
  });
});
