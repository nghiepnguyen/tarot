# Tarot AI v9 Offline Candidate Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans to implement these steps inline; task 3 is already authorized. No per-task implementer agents, paid model calls or commits.

**Goal:** Implement the evidence-grounded v9 candidate without changing the active v7 prompt.

**Architecture:** Extract the existing relation builder without changing v8/v8.1 bytes. Validate/canonicalize v9 inputs into F/C/R evidence and use a standalone v9 system instruction with the existing v7 output schema and provider path.

**Tech Stack:** TypeScript, Next.js 16.3.4, existing Zod and Vitest, pnpm.

**Spec:** `docs/superpowers/specs/2026-11-20-tarot-ai-v9-design.md`.

## Global Constraints

- Keep ACTIVE_PROMPT_VERSION v7, three-card schema, existing UI/history/Reflection/providers/credit.
- No dependency, DB, billing, payment, semantic detector, runtime retry, paid calls or upstream imports.
- F preserves the question after validation trim; C comes from the canonical deck; R has at most two structural observations; H remains prose guidance.
- Read installed Next.js guides; run focused RED/GREEN, full suite, lint and typecheck. Do not claim semantic quality without benchmark.
- Use the feature branch in this checkout, preserving the pre-existing untracked docs/tasks; no extra worktree or dependency installation needed for this scoped task.

## Review Focus

- Forged caller card metadata must never become canonical meaning/category; evidence tests own this.
- Negation, quotes, decomposed Unicode and injection must survive as source text; evidence tests own this.
- Reversed/descending ranks and court-only same-suit spreads must survive extraction; relation tests + golden input hashes own this.
- Invalid input/output must fail without exposing private question/output, without a second provider call; v9/provider tests own this.
- Registry candidate must not change active prompt or break legacy IDs/schema; registry and compatibility tests own this.

## Task A — Extract relations, preserve baseline

Files: `lib/tarot/relations.ts`, `lib/tarot/relations.test.ts`, `lib/ai/prompts/v8.ts`, `lib/ai/prompts/v8.test.ts`, test fixture hashes.
Interface: `buildCardRelations(cards: InterpretationCardInput[])`, same inferred return shapes and ordering as the current helper.

- [x] Capture SHA-256 of v8/v8.1 prompt input before extraction for every benchmark case and extra court/Major/same-suit cases; assert those fixtures still match before edits.
- [x] Write new module tests for descending ranks, equal ranks, max-two priority, court-only same suit, absent relations and input immutability; observe missing module RED.
- [x] Extract helper verbatim, replace local call with import; run relation and legacy prompt tests GREEN, then full suite.

## Task B — Build validated evidence

Files: `lib/ai/evidence.ts`, `lib/ai/evidence.test.ts`.
Interface: `buildInterpretationEvidence(question: string, cards: InterpretationCardInput[])`; return `{facts, cards, relations}` from the spec.

- [x] Write tests for F preservation/trim, canonical C, exact refs, absent relations, unknown/duplicate/missing cards and invalid positions/orientations/questions; observe RED.
- [x] Implement using parseReadingInput and canonical lookup, static redacted Error, type-only imports. No facts extraction, H payload or service layer.
- [x] Run evidence tests GREEN and lint/typecheck for the touched code.

## Task C — Register and validate the v9 candidate

Files: `lib/ai/prompts/v9.ts`, `lib/ai/prompts/v9.test.ts`, `lib/ai/prompts/index.ts`, `index.test.ts`, provider tests if needed.
Interface: `PROMPT_V9: PromptVersion`, id `v9-2026-11-20`, same schema/validator as v7; buildPrompt JSON-serializes evidence once.

- [x] Write tests selecting candidate from registry, same output schema, malformed JSON/schema/positions, valid provider output with editorial warnings and invalid inputs before provider; observe RED.
- [x] Implement standalone Vietnamese instruction: source boundaries, abstention, no presuppositions/mindreading, practical conditional actions and full safety boundaries. Register latest, keep v7 active.
- [x] Run focused tests GREEN and full suite, lint, `pnpm exec tsc --noEmit`. No live benchmark/build with external services.

## Completion

- [x] Fresh-context whole-diff review; fix meaningful findings and rerun affected checks.
- [x] Update task 0 and 3 checklists and record exact results; task 3.9 is deliberately deferred semantic runtime evaluation per spec.
- [x] Leave reviewable changes on feature branch without commit/push. Task 4 remains unstarted.

## Verification record — 20/11/2026

- Branch: `codex/tarot-ai-v9-evidence-grounded`, starting HEAD `81998706a409e2c1278217b8c87c552eef8bb622`; user docs preserved, no commit/push.
- Read installed Next.js Vitest and server/client-boundary guides before source edits.
- Before extraction: generated SHA-256 fixtures for 58 cases × v8/v8.1 and verified those against the original builders. Module tests first failed for absent relations/evidence/v9 modules; registry assertion first failed because candidate was missing; all are green after implementation.
- Added characterization tests for existing provider-error/timeout refund behavior, without changing the action or claiming the known out-of-try credit window is fixed.
- Final full suite: `pnpm test`, 46 passed files / 1 skipped; 556 passed tests / 4 skipped, exit 0. `pnpm lint`, `pnpm exec tsc --noEmit`, `git diff --check`: exit 0.
- Independent fresh-context reviewer: no actionable findings; reviewer also ran 211 focused tests successfully.
- Task 3.9: deliberately no semantic runtime warning/detector changes; quality remains editorial. No API calls, DB changes, dependencies, live benchmark, build, E2E or deployment. Candidate quality remains unproven until task 4.
