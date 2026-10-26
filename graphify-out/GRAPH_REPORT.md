# Graph Report - lib  (2026-10-26)

## Corpus Check
- Corpus is ~49,829 words - fits in a single context window. You may not need a graph.

## Summary
- 530 nodes · 877 edges · 24 communities (23 shown, 1 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 2 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Prompt versions & quality|Prompt versions & quality]]
- [[_COMMUNITY_Email & order settlement|Email & order settlement]]
- [[_COMMUNITY_Benchmarks & tarot data|Benchmarks & tarot data]]
- [[_COMMUNITY_DeepSeek generation|DeepSeek generation]]
- [[_COMMUNITY_Consent & analytics|Consent & analytics]]
- [[_COMMUNITY_Tarot domain copy|Tarot domain copy]]
- [[_COMMUNITY_Prompt stats & pricing|Prompt stats & pricing]]
- [[_COMMUNITY_Model selection|Model selection]]
- [[_COMMUNITY_Card wheel geometry|Card wheel geometry]]
- [[_COMMUNITY_PayOS API client|PayOS API client]]
- [[_COMMUNITY_Admin credits & audit|Admin credits & audit]]
- [[_COMMUNITY_Auth & rate limits|Auth & rate limits]]
- [[_COMMUNITY_Admin dashboard metrics|Admin dashboard metrics]]
- [[_COMMUNITY_Order reconciliation tests|Order reconciliation tests]]
- [[_COMMUNITY_Verification flow tests|Verification flow tests]]
- [[_COMMUNITY_Auth form validation|Auth form validation]]
- [[_COMMUNITY_Google auth tests|Google auth tests]]
- [[_COMMUNITY_Cron monitoring|Cron monitoring]]
- [[_COMMUNITY_Admin labels|Admin labels]]
- [[_COMMUNITY_Review validation|Review validation]]
- [[_COMMUNITY_Sentry configuration|Sentry configuration]]
- [[_COMMUNITY_Payment alert tests|Payment alert tests]]
- [[_COMMUNITY_Quality statistics|Quality statistics]]

## God Nodes (most connected - your core abstractions)
1. `InterpretationCardInput` - 14 edges
2. `TAROT_CARDS` - 12 edges
3. `PromptVersion` - 11 edges
4. `SPREAD_POSITIONS` - 10 edges
5. `sendEmail()` - 8 edges
6. `reconcileOrder()` - 7 edges
7. `InterpretationValidationError` - 7 edges
8. `assessInterpretationQuality()` - 7 edges
9. `getAiModel()` - 7 edges
10. `buildReadingTeaser()` - 7 edges

## Surprising Connections (you probably didn't know these)
- `withCronCheckIn()` --calls--> `run()`  [INFERRED]
  monitoring/cron.ts → ai/deepseek.test.ts
- `getActiveAiSelection()` --calls--> `reportHandledIssue()`  [EXTRACTED]
  ai/settings.ts → monitoring/report.ts
- `creditPaidOrder()` --calls--> `reportHandledIssue()`  [EXTRACTED]
  payments/orders.ts → monitoring/report.ts
- `reconcileOrder()` --calls--> `reportHandledError()`  [EXTRACTED]
  payments/orders.ts → monitoring/report.ts
- `setup()` --calls--> `issueVerificationToken()`  [INFERRED]
  auth/verification.test.ts → auth/verification.ts

## Communities (24 total, 1 thin omitted)

### Community 0 - "Prompt versions & quality"
Cohesion: 0.07
Nodes (32): INTERPRETATION_RESPONSE_SCHEMA, InterpretationResult, InterpretationResultSchema, error, generated, mocks, assertPositions(), assessInterpretationQuality() (+24 more)

### Community 1 - "Email & order settlement"
Cohesion: 0.07
Nodes (35): REVIEW_CRITERIA, generateMeasuredInterpretation(), record(), buildReviewEmail(), ReviewEmailInput, sendReviewEmail(), base, { subject, text } (+27 more)

### Community 2 - "Benchmarks & tarot data"
Cohesion: 0.07
Nodes (36): BENCHMARK_CASES, script, topics, mocks, getPromptVersion(), ids, invalid, prompt (+28 more)

### Community 3 - "DeepSeek generation"
Cohesion: 0.08
Nodes (33): buildSystemInstruction(), ChatCompletion, generateInterpretation(), getApiKey(), body, cards, content, fetchMock (+25 more)

### Community 4 - "Consent & analytics"
Cohesion: 0.08
Nodes (31): closeConsentSettings(), ConsentState, ConsentValue, deleteGaCookies(), getConsentSnapshot(), listeners, openConsentSettings(), readStored() (+23 more)

### Community 5 - "Tarot domain copy"
Cohesion: 0.08
Nodes (27): TarotCategory, DrawnCard, Orientation, arcanaLine(), buildReadingTeaser(), detectTopic(), dominantSuit(), LONE_MAJOR_BY_POSITION (+19 more)

### Community 6 - "Prompt stats & pricing"
Cohesion: 0.1
Nodes (22): PromptUsageRow, PromptVersionSummary, summarizePromptVersions(), legacy, summaries, [summary], unpriced, estimateAiCostVnd() (+14 more)

### Community 7 - "Model selection"
Cohesion: 0.12
Nodes (22): AI_MODELS, AiProvider, getAiModel(), getModelPersona(), PROVIDER_API_KEY_ENV, persona, personas, AiModelSelection (+14 more)

### Community 8 - "Card wheel geometry"
Cohesion: 0.14
Nodes (24): CARD_SPACING, CARD_WIDTH, cardAngle(), carryOffset(), centerPosition(), computeWheelLayout(), mod(), offsetToCenter() (+16 more)

### Community 9 - "PayOS API client"
Cohesion: 0.13
Nodes (20): createPaymentLink(), CreatePaymentLinkInput, CreatePaymentLinkResult, getPaymentLink(), isPlainObject(), PaymentLinkInfo, payosHeaders(), PayosPaymentStatus (+12 more)

### Community 10 - "Admin credits & audit"
Cohesion: 0.12
Nodes (15): AdminAction, AdminAuditEntry, AuditWriter, writeAuditLog(), adjustCredits(), AdjustCreditsInput, AdjustOutcome, BASE (+7 more)

### Community 11 - "Auth & rate limits"
Cohesion: 0.11
Nodes (13): AdminUser, getAdminUser, requireAdmin(), cleanName(), GoogleAccountInput, LinkedGoogleUser, linkGoogleAccount(), checkRateLimit() (+5 more)

### Community 12 - "Admin dashboard metrics"
Cohesion: 0.16
Nodes (15): DashboardRaw, fetchDashboardRaw(), Funnel, FunnelInput, intersectUserIds(), ratio(), BASE, funnel (+7 more)

### Community 13 - "Order reconciliation tests"
Cohesion: 0.12
Nodes (14): alertAmountMismatch, BASE, consoleError, { fake }, { fake, order }, fresh, getPaymentLink, mine (+6 more)

### Community 14 - "Verification flow tests"
Cohesion: 0.13
Nodes (14): createFakeDb(), CreditRow, fake, FakeToken, FakeUser, findUnique, makeUser(), other (+6 more)

### Community 15 - "Auth form validation"
Cohesion: 0.15
Nodes (14): EmailField, ForgotPasswordFormState, ForgotPasswordSchema, LoginFormState, LoginSchema, PasswordField, ResendVerificationFormState, ResendVerificationSchema (+6 more)

### Community 16 - "Google auth tests"
Cohesion: 0.2
Nodes (6): CreditRow, { db, rows }, { db, rows, creditTransactions }, existing, FakeUser, prismaRef

### Community 17 - "Cron monitoring"
Cohesion: 0.25
Nodes (7): run(), CronMonitorConfig, boom, captureCheckIn, CONFIG, flush, withCronCheckIn()

### Community 18 - "Admin labels"
Cohesion: 0.29
Nodes (6): AUDIT_ACTION, CREDIT_TYPE, CREDIT_TYPES, ORDER_STATUS, ORDER_STATUSES, Tone

### Community 19 - "Review validation"
Cohesion: 0.33
Nodes (5): InterpretationReviewPayload, InterpretationReviewSchema, Stars, parsed, valid

### Community 20 - "Sentry configuration"
Cohesion: 0.33
Nodes (4): sentryEnabled, sharedSentryOptions, freshModule(), resolved

### Community 21 - "Payment alert tests"
Cohesion: 0.5
Nodes (3): checkRateLimit, MISMATCH, sendEmail

## Knowledge Gaps
- **244 isolated node(s):** `RefundOutcome`, `BASE`, `{ fake, db }`, `{ db }`, `getPaymentLink` (+239 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **1 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `issueVerificationToken()` connect `Email & order settlement` to `Verification flow tests`?**
  _High betweenness centrality (0.045) - this node is a cross-community bridge._
- **Why does `setup()` connect `Verification flow tests` to `Email & order settlement`?**
  _High betweenness centrality (0.042) - this node is a cross-community bridge._
- **What connects `RefundOutcome`, `BASE`, `{ fake, db }` to the rest of the system?**
  _244 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Prompt versions & quality` be split into smaller, more focused modules?**
  _Cohesion score 0.07 - nodes in this community are weakly interconnected._
- **Should `Email & order settlement` be split into smaller, more focused modules?**
  _Cohesion score 0.07 - nodes in this community are weakly interconnected._
- **Should `Benchmarks & tarot data` be split into smaller, more focused modules?**
  _Cohesion score 0.07 - nodes in this community are weakly interconnected._
- **Should `DeepSeek generation` be split into smaller, more focused modules?**
  _Cohesion score 0.08 - nodes in this community are weakly interconnected._