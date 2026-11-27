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
      usage: { inputTokens: 100, outputTokens: 20, thinkingTokens: 0 },
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
  expect(results[1]).toMatchObject({ ok: true, usage: { inputTokens: 100, outputTokens: 20, thinkingTokens: 0 }, costVnd: expect.any(Number), latencyMs: expect.any(Number) });
  expect(files.get("results.json")).not.toContain("private SDK error");
});

it("persists both failures and successes in unique runs and records prompt fingerprints", async () => {
  vi.stubEnv(PROVIDER_API_KEY_ENV.deepseek, "test-key");
  vi.spyOn(console, "log").mockImplementation(() => {});
  vi.mocked(generateInterpretation).mockRejectedValue(new DOMException("PRIVATE TIMEOUT BODY", "TimeoutError"));
  const args = [`--baseline=${baseline}`, "--candidate=v9-2026-11-20", "--model=deepseek-flash", "--case=relation-weak-1"];
  const first = await main(args);
  const second = await main(args);
  expect(first).toEqual(expect.any(String));
  expect(second).not.toBe(first);
  const files = new Map(vi.mocked(writeFile).mock.calls.map(([file, value]) => [basename(String(file)), String(value)]));
  expect(JSON.parse(files.get("relation-weak-1--v9-2026-11-20.json")!)).toMatchObject({ ok: false, error: "timeout" });
  expect(JSON.parse(files.get("run.json")!)).toMatchObject({
    baseline, candidate: "v9-2026-11-20", model: "deepseek-flash", provider: "deepseek",
    prompts: [{ id: baseline, systemInstructionHash: expect.stringMatching(/^[a-f0-9]{64}$/) }, { id: "v9-2026-11-20", systemInstructionHash: expect.stringMatching(/^[a-f0-9]{64}$/) }],
  });
  expect([...files.values()].join(" ")).not.toContain("PRIVATE TIMEOUT BODY");
});

it("marks missing usage as unknown cost and stops before starting another pair", async () => {
  vi.stubEnv(PROVIDER_API_KEY_ENV.deepseek, "test-key");
  vi.spyOn(console, "log").mockImplementation(() => {});
  vi.mocked(generateInterpretation).mockResolvedValue({
    result: { summary: "Một", overview: "Hai", themes: [], perCard: [], connections: "Ba", actionSuggestions: [], reflectiveQuestion: "Bốn?", closingNote: "Năm" },
    usage: { inputTokens: 100 },
  });
  await main([`--baseline=${baseline}`, `--candidate=${candidate}`, "--model=deepseek-flash", "--limit=2"]);
  expect(generateInterpretation).toHaveBeenCalledTimes(2);
  const files = new Map(vi.mocked(writeFile).mock.calls.map(([file, value]) => [basename(String(file)), String(value)]));
  const rows = JSON.parse(files.get("results.json")!);
  expect(rows).toHaveLength(2);
  expect(rows.every((row: { costVnd: number | null }) => row.costVnd === null)).toBe(true);
});

it("selects frozen v9 holdout inputs for a pair without sending review labels to generation", async () => {
  vi.stubEnv(PROVIDER_API_KEY_ENV.deepseek, "test-key");
  vi.spyOn(console, "log").mockImplementation(() => {});
  vi.mocked(generateInterpretation).mockResolvedValue({
    result: { summary: "Một", overview: "Hai", themes: [], perCard: [], connections: "Ba", actionSuggestions: [], reflectiveQuestion: "Bốn?", closingNote: "Năm" },
    usage: { inputTokens: 100, outputTokens: 20, thinkingTokens: 0 },
  });
  await main([`--baseline=${baseline}`, "--candidate=v9-2026-11-20", "--model=deepseek-flash", "--case=holdout-strong-1"]);
  const calls = vi.mocked(generateInterpretation).mock.calls;
  expect(calls).toHaveLength(2);
  expect(calls[0][0]).toBe(calls[1][0]);
  expect(calls[0][1]).toBe(calls[1][1]);
  expect(calls[0][0]).toContain("nhóm đọc sách");
  expect(calls[0][1].map(input => input.card.id)).toEqual(["two-of-cups", "three-of-cups", "king-of-cups"]);
  expect(calls[0]).toHaveLength(4);
});

it.each([
  { total: 125, tools: undefined, wantThinking: 5, measured: true },
  { total: 120, tools: 0, wantThinking: 0, measured: true },
  { total: 119, tools: 0, wantThinking: undefined, measured: false },
  { total: 125.5, tools: 0, wantThinking: undefined, measured: false },
  { total: 125, tools: 1, wantThinking: undefined, measured: false },
  { total: undefined, tools: undefined, wantThinking: undefined, measured: false },
])("uses a verified tool-free total residual only when valid: $total / $tools", async ({ total, tools, wantThinking, measured }) => {
  vi.stubEnv(PROVIDER_API_KEY_ENV.gemini, "test-key");
  vi.spyOn(console, "log").mockImplementation(() => {});
  vi.mocked(generateInterpretation).mockResolvedValue({
    result: { summary: "Một", overview: "Hai", themes: [], perCard: [], connections: "Ba", actionSuggestions: [], reflectiveQuestion: "Bốn?", closingNote: "Năm" },
    usage: { inputTokens: 100, outputTokens: 20, totalTokens: total, toolInputTokens: tools },
  });
  await main([`--baseline=${baseline}`, `--candidate=${candidate}`, "--model=gemini-3.8-flash", "--case=relation-weak-1"]);
  const files = new Map(vi.mocked(writeFile).mock.calls.map(([file, value]) => [basename(String(file)), String(value)]));
  const rows = JSON.parse(files.get("results.json")!);
  for (const row of rows) {
    expect(row.usage.thinkingTokens).toBe(wantThinking);
    expect(row.usage.totalTokens).toBe(total);
    if (measured) expect(row.costVnd).toEqual(expect.any(Number));
    else expect(row.costVnd).toBeNull();
  }
});
