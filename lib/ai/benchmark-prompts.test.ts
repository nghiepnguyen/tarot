import { mkdir, writeFile } from "node:fs/promises";
import { basename } from "node:path";
import { afterEach, expect, it, vi } from "vitest";
import { BENCHMARK_CASES } from "./benchmark-cases";
import { generateInterpretation } from "./generate";
import { PROVIDER_API_KEY_ENV } from "./models";
import { main } from "../../scripts/benchmark-prompts";

vi.mock("node:fs/promises", () => ({ mkdir: vi.fn(), writeFile: vi.fn() }));
vi.mock("./generate", () => ({ generateInterpretation: vi.fn() }));

const baseline = "v7-2026-10-06";
const candidate = "v8-2026-11-11";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
  vi.clearAllMocks();
});

it("rejects an unknown or duplicate version before calling the model", async () => {
  await expect(main(["--baseline=missing"])).rejects.toThrow("Unknown baseline prompt ID: missing");
  await expect(main([`--baseline=${baseline}`, `--candidate=${baseline}`])).rejects.toThrow("distinct");
  expect(generateInterpretation).not.toHaveBeenCalled();
  expect(mkdir).not.toHaveBeenCalled();
});

it("keeps paired inputs identical and balances blind labels even when a candidate fails", async () => {
  vi.stubEnv(PROVIDER_API_KEY_ENV.deepseek, "test-key");
  vi.spyOn(console, "log").mockImplementation(() => {});
  const fixture = BENCHMARK_CASES[0];
  vi.mocked(generateInterpretation).mockImplementation(async (question, _cards, version) => {
    if (question === fixture.question && version.id === baseline) throw new Error("private SDK error");
    return {
      result: {
        summary: "Tóm tắt.", overview: "Tổng quan.", themes: [], perCard: [],
        connections: "Liên kết.", actionSuggestions: [], reflectiveQuestion: "Câu hỏi?", closingNote: "Kết.",
      },
      usage: { inputTokens: 100, outputTokens: 20 },
    };
  });

  await main([`--baseline=${baseline}`, `--candidate=${candidate}`, "--model=deepseek-flash", "--limit=2"]);
  const calls = vi.mocked(generateInterpretation).mock.calls;
  expect(calls).toHaveLength(4);
  for (const [index, expected] of BENCHMARK_CASES.slice(0, 2).entries()) {
    for (const [question, cards, , model] of calls.slice(index * 2, index * 2 + 2)) {
      expect(question).toBe(expected.question);
      expect(cards).toBe(expected.cards);
      expect(model?.id).toBe("deepseek-flash");
    }
  }

  const files = new Map(vi.mocked(writeFile).mock.calls.map(([file, value]) => [basename(String(file)), String(value)]));
  const blind = files.get("blind-review.json")!;
  expect(blind).not.toContain(baseline);
  expect(blind).not.toContain(candidate);
  expect(JSON.parse(blind)[0]).toMatchObject({
    question: fixture.question,
    cards: fixture.cards.map(({ card, position, orientation }) => ({ name: card.name, position, orientation })),
    candidates: [{ label: "A", output: null }, { label: "B", output: { summary: "Tóm tắt." } }],
  });
  expect(JSON.parse(files.get("blind-key.json")!)).toEqual([
    { caseId: fixture.id, A: baseline, B: candidate },
    { caseId: BENCHMARK_CASES[1].id, A: candidate, B: baseline },
  ]);
  const results = JSON.parse(files.get("results.json")!);
  expect(results[0]).toMatchObject({ ok: false, error: "provider_error", latencyMs: expect.any(Number) });
  expect(results[1]).toMatchObject({ ok: true, usage: { inputTokens: 100, outputTokens: 20 }, costVnd: expect.any(Number), latencyMs: expect.any(Number) });
  expect(files.get("results.json")).not.toContain("private SDK error");
});
