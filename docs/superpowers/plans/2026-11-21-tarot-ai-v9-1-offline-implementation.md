# v9.1 Offline Anchors Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans inline. User approved the design and requested implementation; execute without another approval handoff. One fresh code review and one sealed semantic review after artifacts exist.

**Goal:** Build an offline three-context renderer and three blinded comparisons from existing v9 artifacts, with zero new model calls.

**Architecture:** Reuse evidence validation/safety guard; match complete card fingerprints and return audited literals. A filesystem-only experiment script creates copies of three validated v9 results, changes only summary/keyMessage, records provenance, and reuses blind review preparation. No production integration.

**Tech Stack:** TypeScript, existing Zod/Vitest, Node filesystem/crypto; pnpm.

**Spec:** `docs/superpowers/specs/2026-11-21-tarot-ai-v9-1-offline-design.md`.

## Global Constraints

- Existing feature branch; preserve prior uncommitted work and user review edits. No commit/push/deploy.
- No APIs, keys, DB, credit, dependencies, prompt/registry/provider/parser edits.
- Three manual contexts, exact card/position/orientation scope, null on unsupported/safety; invalid structure redacted.
- SourcePromptVersion v9; transformVersion anchors-offline-2026-11-21. Human chooses A/B/tie only.
- Do not claim full reading is grounded; unchanged fields can retain known errors.

## Review Focus

- Mislabelled context is not an automatic semantic router: manual labels are trusted only in experiment manifest; test null context on negation/quotes/topic change.
- Valid orientation/card-order changes must abstain; invalid structure must still fail redacted.
- Caller mutation cannot modify template literals or canonical deck; renderer tests own this.
- Missing/duplicate/mismatched source artifacts must stop before writing outputs; experiment tests own this.
- Body fields, original source hashes and active v7 must remain unchanged; roundtrip tests and final fingerprint checks own this.

## Task A — Renderer

Files: new `lib/ai/reading-anchors.ts`, `lib/ai/reading-anchors.test.ts`.
Interface: `ReadingAnchorContext = transfer | restart_drawing | housework_schedule`; `renderReadingAnchors(question, cards, context) -> {summary,keyMessages:[string,string,string]} | null`; export `READING_ANCHORS_VERSION` for provenance.

- [x] Write tests for all three expected literal outputs, caller/canonical immutability, tuple copy, canonical ID fingerprint, safety, unsupported context and card changes; run RED.
- [x] Implement the smallest lookup with existing buildInterpretationEvidence/needsReadingSupport and ordered fingerprints; run GREEN/lint/typecheck.

## Task B — Filesystem-only experiment

Files: new `scripts/prepare-anchor-experiment.ts`, `lib/ai/reading-anchors-experiment.test.ts`.
Interface: `prepareAnchorExperiment(workspaceRoot: string, outputDir: string): Promise<string>`; CLI uses cwd and an explicit output dir.

- [x] Write real temporary-filesystem tests for three controls/copies and unchanged body/source; missing/duplicate sources, input mismatch and source hash drift reject without output; run RED.
- [x] Load the two task4 manifests; validate frozen prompt/evidence/relations hashes and source input/result metadata. Select exactly one v9 result per target fixture, validated against frozen inputs and schema.
- [x] Create six records in a new output directory, only four allowed fields changed per variant; sourceUsage labelled historical, no new latency/cost claims. Record source paths/hashes, context, fingerprint and transform hash; run GREEN/lint/typecheck.

## Task C — Deliver comparisons

- [x] Run the experiment on existing task4 artifacts; reuse prepare-benchmark-review into a new public directory with key outside it.
- [x] Tailor only the generated human Markdown to A/B/tie, preserve complete outputs and original comparisons; no numeric score request.
- [x] Fresh-context code review and independent sealed reviewer examine twelve target fields, remaining body errors and loss of card specificity. Fix important code findings; retain reviewer results sealed until human locks choices.
- [x] Full suite, lint, typecheck, source fingerprints and no-new-calls checks; update follow-up checklist and report with exact outcomes.
- [x] Hand over three pairs. Do not create held-out cases until targeted-field and human-preference gates permit next phase.

## Verification record

- Renderer15tests + experiment6tests observed RED→GREEN. Local run3applied/6records/0generation calls,source hashes preserved.
- Final full suite597passed/4skipped; lint/typecheck/diff-check exit0. Fresh code review: no important findings.
- Anonymous semantic review3pairs completed and sealed; no key/results opened before human preference lock.
- Human Markdown only requests A/B/tie. Prior8pair reviews unchanged; held-out examples not started pending gate.
- Existing branch; no API/DB/credit/dependency/production changes,commit or push.
