import { afterEach, expect, it, vi } from "vitest";
import { recordUnlockEvent } from "./unlock-observability";
afterEach(() => vi.restoreAllMocks());
it("logs only selected lifecycle metadata, never extra content or raw errors", () => {
  const log = vi.spyOn(console, "info").mockImplementation(() => {});
  const event = { event: "generated" as const, stage: "provider", operationId: "op", attemptToken: "attempt", userId: "user", readingId: "reading", model: "gemini-3.8-flash", promptVersion: "v7-2026-10-06", question: "PRIVATE question", output: "PRIVATE output", error: new Error("PRIVATE credential") };
  recordUnlockEvent(event);
  const payload = JSON.parse(log.mock.calls[0][1]);
  expect(payload).toMatchObject({ event: "generated", operationId: "op", attemptToken: "attempt" });
  expect(JSON.stringify(payload)).not.toContain("PRIVATE");
});
it("logging failures cannot fail settlement", () => {
  vi.spyOn(console, "info").mockImplementation(() => { throw new Error("Logger unavailable"); });
  expect(() => recordUnlockEvent({ event: "persisted", readingId: "reading" })).not.toThrow();
});
