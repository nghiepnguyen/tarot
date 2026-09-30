import { describe, expect, it } from "vitest";
import { assessInterpretationQuality, assertPositions, InterpretationValidationError } from "./quality";
import { SPREAD_POSITIONS } from "../tarot/draw";

const words = (n: number) => Array(n).fill("từ").join(" ");
const valid = {
  summary: words(45), overview: words(100), themes: ["Một chủ đề", "Chủ đề khác", "Một góc nhìn"],
  perCard: SPREAD_POSITIONS.map(position => ({ position, keyMessage: words(15), text: words(60) })),
  connections: words(150), actionSuggestions: [words(40) + " một", words(40) + " hai", words(40) + " ba"],
  reflectiveQuestion: "Bạn muốn thay đổi điều gì?", closingNote: words(70),
};

describe("quality validation", () => {
  it("rejects wrong or reordered positions without leaking generated text", () => {
    expect(() => assertPositions(valid, SPREAD_POSITIONS)).not.toThrow();
    const bad = { ...valid, perCard: [...valid.perCard].reverse() };
    try { assertPositions(bad, SPREAD_POSITIONS); throw new Error("not rejected"); }
    catch (error) { expect(error).toBeInstanceOf(InterpretationValidationError); expect((error as Error).message).not.toContain("Bối cảnh"); }
  });
  it("records length warnings without rejecting the reading", () => {
    const report = assessInterpretationQuality({ ...valid, overview: words(116), closingNote: words(91) });
    expect(report.overLengthFields).toBe(2);
    expect(report.warnings).toEqual(expect.arrayContaining([expect.objectContaining({ code: "over_length", field: "overview" })]));
  });
  it("detects normalized duplicate items and repeated sentences across fields", () => {
    const report = assessInterpretationQuality({ ...valid, themes: ["Chủ đề một", " chủ ĐỀ một! ", "Chủ đề hai"], summary: "Bạn có thể ghi lại ba điều mình đang quan sát.", overview: "Bạn có thể ghi lại ba điều mình đang quan sát." });
    expect(report.duplicateItems).toBe(1);
    expect(report.repeatedSentences).toBeGreaterThan(0);
  });
});
