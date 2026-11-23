# Inventory workspace — task 7

Ngày 23/11/2026. Danh sách mở rộng từng file modified/untracked tại đầu task 7; không di chuyển/xóa/stage/commit các file. Hash/bytes và trạng thái tracked cho từng file nằm trong `.model-compare/v7-credit-task7/inventory.json` và `before.json`.

Packets: A = provider total/tool usage metadata; B = credit reliability/tasks 0–6; C = frozen research/benchmark/review. File A+B phải tách hunk, không stage nguyên file vào một nhóm.

| File | Nhóm | Packet | Quyết định/lý do |
| --- | --- | --- | --- |
| `app/actions/ai.ts` | sửa sản phẩm | B | Giữ trong fix credit/deadline/recovery/UI/audit và kiểm thử tương ứng. |
| `app/actions/readings.ts` | sửa sản phẩm | B | Giữ trong fix credit/deadline/recovery/UI/audit và kiểm thử tương ứng. |
| `app/api/cron/recover-unlocks/route.ts` | sửa sản phẩm | B | Giữ trong fix credit/deadline/recovery/UI/audit và kiểm thử tương ứng. |
| `components/tarot/AiUnlockPanel.tsx` | sửa sản phẩm | B | Giữ trong fix credit/deadline/recovery/UI/audit và kiểm thử tương ứng. |
| `components/tarot/TarotExperience.tsx` | sửa sản phẩm | B | Giữ trong fix credit/deadline/recovery/UI/audit và kiểm thử tương ứng. |
| `docs/benchmarks/v9-1-human-preferences-2026-11-21.json` | review artifacts | C | Giữ nguyên phiếu, preference locks, hashes và kết luận; không diễn giải lại kết quả. |
| `docs/benchmarks/v9-1-offline-2026-11-21.md` | review artifacts | C | Giữ nguyên phiếu, preference locks, hashes và kết luận; không diễn giải lại kết quả. |
| `docs/benchmarks/v9-1-result-2026-11-21.md` | review artifacts | C | Giữ nguyên phiếu, preference locks, hashes và kết luận; không diễn giải lại kết quả. |
| `docs/benchmarks/v9-1-results-2026-11-21.json` | review artifacts | C | Giữ nguyên phiếu, preference locks, hashes và kết luận; không diễn giải lại kết quả. |
| `docs/benchmarks/v9-1-review-2026-11-21/preferences.json` | review artifacts | C | Giữ nguyên phiếu, preference locks, hashes và kết luận; không diễn giải lại kết quả. |
| `docs/benchmarks/v9-1-review-2026-11-21/review.json` | review artifacts | C | Giữ nguyên phiếu, preference locks, hashes và kết luận; không diễn giải lại kết quả. |
| `docs/benchmarks/v9-1-review-2026-11-21/review.md` | review artifacts | C | Giữ nguyên phiếu, preference locks, hashes và kết luận; không diễn giải lại kết quả. |
| `docs/benchmarks/v9-2-human-preferences-2026-11-22.json` | review artifacts | C | Giữ nguyên phiếu, preference locks, hashes và kết luận; không diễn giải lại kết quả. |
| `docs/benchmarks/v9-2-offline-2026-11-22.md` | review artifacts | C | Giữ nguyên phiếu, preference locks, hashes và kết luận; không diễn giải lại kết quả. |
| `docs/benchmarks/v9-2-result-2026-11-22.md` | review artifacts | C | Giữ nguyên phiếu, preference locks, hashes và kết luận; không diễn giải lại kết quả. |
| `docs/benchmarks/v9-2-results-2026-11-22.json` | review artifacts | C | Giữ nguyên phiếu, preference locks, hashes và kết luận; không diễn giải lại kết quả. |
| `docs/benchmarks/v9-2-review-2026-11-22/preferences.json` | review artifacts | C | Giữ nguyên phiếu, preference locks, hashes và kết luận; không diễn giải lại kết quả. |
| `docs/benchmarks/v9-2-review-2026-11-22/review.json` | review artifacts | C | Giữ nguyên phiếu, preference locks, hashes và kết luận; không diễn giải lại kết quả. |
| `docs/benchmarks/v9-2-review-2026-11-22/review.md` | review artifacts | C | Giữ nguyên phiếu, preference locks, hashes và kết luận; không diễn giải lại kết quả. |
| `docs/benchmarks/v9-3-human-preferences-2026-11-22.json` | review artifacts | C | Giữ nguyên phiếu, preference locks, hashes và kết luận; không diễn giải lại kết quả. |
| `docs/benchmarks/v9-3-offline-2026-11-22.md` | review artifacts | C | Giữ nguyên phiếu, preference locks, hashes và kết luận; không diễn giải lại kết quả. |
| `docs/benchmarks/v9-3-result-2026-11-22.md` | review artifacts | C | Giữ nguyên phiếu, preference locks, hashes và kết luận; không diễn giải lại kết quả. |
| `docs/benchmarks/v9-3-results-2026-11-22.json` | review artifacts | C | Giữ nguyên phiếu, preference locks, hashes và kết luận; không diễn giải lại kết quả. |
| `docs/benchmarks/v9-3-review-2026-11-22/preferences.json` | review artifacts | C | Giữ nguyên phiếu, preference locks, hashes và kết luận; không diễn giải lại kết quả. |
| `docs/benchmarks/v9-3-review-2026-11-22/review.json` | review artifacts | C | Giữ nguyên phiếu, preference locks, hashes và kết luận; không diễn giải lại kết quả. |
| `docs/benchmarks/v9-3-review-2026-11-22/review.md` | review artifacts | C | Giữ nguyên phiếu, preference locks, hashes và kết luận; không diễn giải lại kết quả. |
| `docs/benchmarks/v9-diagnostic-result-2026-11-21.md` | review artifacts | C | Giữ nguyên phiếu, preference locks, hashes và kết luận; không diễn giải lại kết quả. |
| `docs/benchmarks/v9-diagnostic-results-2026-11-21.json` | review artifacts | C | Giữ nguyên phiếu, preference locks, hashes và kết luận; không diễn giải lại kết quả. |
| `docs/benchmarks/v9-human-preferences-2026-11-21.json` | review artifacts | C | Giữ nguyên phiếu, preference locks, hashes và kết luận; không diễn giải lại kết quả. |
| `docs/benchmarks/v9-review-2026-11-20/review.json` | review artifacts | C | Giữ nguyên phiếu, preference locks, hashes và kết luận; không diễn giải lại kết quả. |
| `docs/benchmarks/v9-review-2026-11-20/review.md` | review artifacts | C | Giữ nguyên phiếu, preference locks, hashes và kết luận; không diễn giải lại kết quả. |
| `docs/benchmarks/v9-review-2026-11-21/review.json` | review artifacts | C | Giữ nguyên phiếu, preference locks, hashes và kết luận; không diễn giải lại kết quả. |
| `docs/benchmarks/v9-review-2026-11-21/review.md` | review artifacts | C | Giữ nguyên phiếu, preference locks, hashes và kết luận; không diễn giải lại kết quả. |
| `docs/benchmarks/v9-review-index-2026-11-21.md` | review artifacts | C | Giữ nguyên phiếu, preference locks, hashes và kết luận; không diễn giải lại kết quả. |
| `docs/benchmarks/v9-task-4-2026-11-20.md` | review artifacts | C | Giữ nguyên phiếu, preference locks, hashes và kết luận; không diễn giải lại kết quả. |
| `docs/benchmarks/v9-task4-continuation-approval-2026-11-21.md` | review artifacts | C | Giữ nguyên phiếu, preference locks, hashes và kết luận; không diễn giải lại kết quả. |
| `docs/superpowers/plans/2026-11-20-tarot-ai-v9-implementation.md` | tài liệu nghiên cứu đóng | C | Giữ thiết kế/NO-GO/quyết định dừng; checklist chưa chạy không tự trở thành công việc tiếp theo. |
| `docs/superpowers/plans/2026-11-21-tarot-ai-v9-1-offline-implementation.md` | tài liệu nghiên cứu đóng | C | Giữ thiết kế/NO-GO/quyết định dừng; checklist chưa chạy không tự trở thành công việc tiếp theo. |
| `docs/superpowers/plans/2026-11-22-tarot-ai-v9-2-offline-implementation.md` | tài liệu nghiên cứu đóng | C | Giữ thiết kế/NO-GO/quyết định dừng; checklist chưa chạy không tự trở thành công việc tiếp theo. |
| `docs/superpowers/plans/2026-11-22-tarot-ai-v9-3-constraints-implementation.md` | tài liệu nghiên cứu đóng | C | Giữ thiết kế/NO-GO/quyết định dừng; checklist chưa chạy không tự trở thành công việc tiếp theo. |
| `docs/superpowers/specs/2026-11-20-tarot-ai-v9-design.md` | tài liệu nghiên cứu đóng | C | Giữ thiết kế/NO-GO/quyết định dừng; checklist chưa chạy không tự trở thành công việc tiếp theo. |
| `docs/superpowers/specs/2026-11-21-tarot-ai-v9-1-offline-design.md` | tài liệu nghiên cứu đóng | C | Giữ thiết kế/NO-GO/quyết định dừng; checklist chưa chạy không tự trở thành công việc tiếp theo. |
| `docs/superpowers/specs/2026-11-21-tarot-ai-v9-2-offline-design.md` | tài liệu nghiên cứu đóng | C | Giữ thiết kế/NO-GO/quyết định dừng; checklist chưa chạy không tự trở thành công việc tiếp theo. |
| `docs/superpowers/specs/2026-11-22-tarot-ai-v9-3-constraints-design.md` | tài liệu nghiên cứu đóng | C | Giữ thiết kế/NO-GO/quyết định dừng; checklist chưa chạy không tự trở thành công việc tiếp theo. |
| `docs/superpowers/specs/2026-11-22-v7-unlock-credit-reliability-design.md` | tài liệu credit | B | Giữ thiết kế, evidence và release gates cùng fix sản phẩm; chưa phát hành. |
| `docs/tarot-ai-v9-preflight.md` | tài liệu nghiên cứu đóng | C | Giữ thiết kế/NO-GO/quyết định dừng; checklist chưa chạy không tự trở thành công việc tiếp theo. |
| `docs/tarot-skill-integration-report-2026-11-20.md` | tài liệu nghiên cứu đóng | C | Giữ thiết kế/NO-GO/quyết định dừng; checklist chưa chạy không tự trở thành công việc tiếp theo. |
| `docs/v7-unlock-credit-incident-runbook.md` | tài liệu credit | B | Giữ thiết kế, evidence và release gates cùng fix sản phẩm; chưa phát hành. |
| `docs/v7-unlock-credit-task0-baseline-2026-11-22.md` | tài liệu credit | B | Giữ thiết kế, evidence và release gates cùng fix sản phẩm; chưa phát hành. |
| `docs/v7-unlock-credit-task2-result-2026-11-22.md` | tài liệu credit | B | Giữ thiết kế, evidence và release gates cùng fix sản phẩm; chưa phát hành. |
| `docs/v7-unlock-credit-task3-result-2026-11-23.md` | tài liệu credit | B | Giữ thiết kế, evidence và release gates cùng fix sản phẩm; chưa phát hành. |
| `docs/v7-unlock-credit-task4-result-2026-11-23.md` | tài liệu credit | B | Giữ thiết kế, evidence và release gates cùng fix sản phẩm; chưa phát hành. |
| `docs/v7-unlock-credit-task5-result-2026-11-23.md` | tài liệu credit | B | Giữ thiết kế, evidence và release gates cùng fix sản phẩm; chưa phát hành. |
| `docs/v7-unlock-credit-task6-result-2026-11-23.md` | tài liệu credit | B | Giữ thiết kế, evidence và release gates cùng fix sản phẩm; chưa phát hành. |
| `lib/ai/__fixtures__/constraint-reading-controls.json` | thử nghiệm offline | C | Đóng băng source/fixtures/holdout; không nối renderer vào đường unlock, không archive khi chưa có backup. |
| `lib/ai/__fixtures__/constraint-reading-development.json` | thử nghiệm offline | C | Đóng băng source/fixtures/holdout; không nối renderer vào đường unlock, không archive khi chưa có backup. |
| `lib/ai/__fixtures__/constraint-reading-reviewed.json` | thử nghiệm offline | C | Đóng băng source/fixtures/holdout; không nối renderer vào đường unlock, không archive khi chưa có backup. |
| `lib/ai/__fixtures__/controlled-reading-controls.json` | thử nghiệm offline | C | Đóng băng source/fixtures/holdout; không nối renderer vào đường unlock, không archive khi chưa có backup. |
| `lib/ai/__fixtures__/controlled-reading-development.json` | thử nghiệm offline | C | Đóng băng source/fixtures/holdout; không nối renderer vào đường unlock, không archive khi chưa có backup. |
| `lib/ai/__fixtures__/controlled-reading-holdout.json` | thử nghiệm offline | C | Đóng băng source/fixtures/holdout; không nối renderer vào đường unlock, không archive khi chưa có backup. |
| `lib/ai/__fixtures__/reading-anchors-holdout.json` | thử nghiệm offline | C | Đóng băng source/fixtures/holdout; không nối renderer vào đường unlock, không archive khi chưa có backup. |
| `lib/ai/benchmark-prompts.test.ts` | hạ tầng benchmark | C | Giữ công cụ đo/review tái dùng được; tách khỏi runtime credit, không chạy model mới. |
| `lib/ai/benchmark-review.test.ts` | hạ tầng benchmark | C | Giữ công cụ đo/review tái dùng được; tách khỏi runtime credit, không chạy model mới. |
| `lib/ai/benchmark-v9-cases.test.ts` | thử nghiệm offline | C | Đóng băng source/fixtures/holdout; không nối renderer vào đường unlock, không archive khi chưa có backup. |
| `lib/ai/benchmark-v9-cases.ts` | thử nghiệm offline | C | Đóng băng source/fixtures/holdout; không nối renderer vào đường unlock, không archive khi chưa có backup. |
| `lib/ai/constraint-reading-experiment.test.ts` | thử nghiệm offline | C | Đóng băng source/fixtures/holdout; không nối renderer vào đường unlock, không archive khi chưa có backup. |
| `lib/ai/constraint-reading.test.ts` | thử nghiệm offline | C | Đóng băng source/fixtures/holdout; không nối renderer vào đường unlock, không archive khi chưa có backup. |
| `lib/ai/constraint-reading.ts` | thử nghiệm offline | C | Đóng băng source/fixtures/holdout; không nối renderer vào đường unlock, không archive khi chưa có backup. |
| `lib/ai/controlled-reading-experiment.test.ts` | thử nghiệm offline | C | Đóng băng source/fixtures/holdout; không nối renderer vào đường unlock, không archive khi chưa có backup. |
| `lib/ai/controlled-reading-holdout.test.ts` | thử nghiệm offline | C | Đóng băng source/fixtures/holdout; không nối renderer vào đường unlock, không archive khi chưa có backup. |
| `lib/ai/controlled-reading.test.ts` | thử nghiệm offline | C | Đóng băng source/fixtures/holdout; không nối renderer vào đường unlock, không archive khi chưa có backup. |
| `lib/ai/controlled-reading.ts` | thử nghiệm offline | C | Đóng băng source/fixtures/holdout; không nối renderer vào đường unlock, không archive khi chưa có backup. |
| `lib/ai/deepseek.test.ts` | sửa sản phẩm | B | Giữ trong fix credit/deadline/recovery/UI/audit và kiểm thử tương ứng. |
| `lib/ai/deepseek.ts` | sửa sản phẩm | B | Giữ trong fix credit/deadline/recovery/UI/audit và kiểm thử tương ứng. |
| `lib/ai/evidence.test.ts` | registry/definition nghiên cứu | C | Giữ định nghĩa/compatibility v8/v9 và tests; v7 vẫn active, registry dùng tra cứu lịch sử. |
| `lib/ai/evidence.ts` | registry/definition nghiên cứu | C | Giữ định nghĩa/compatibility v8/v9 và tests; v7 vẫn active, registry dùng tra cứu lịch sử. |
| `lib/ai/gemini.test.ts` | metadata + credit | A+B | Tách metadata total/tool giữ nguyên thinking khỏi deadline; không bỏ hunks có ích. |
| `lib/ai/gemini.ts` | metadata + credit | A+B | Tách metadata total/tool giữ nguyên thinking khỏi deadline; không bỏ hunks có ích. |
| `lib/ai/generate.ts` | sửa sản phẩm | B | Giữ trong fix credit/deadline/recovery/UI/audit và kiểm thử tương ứng. |
| `lib/ai/interpretation.ts` | metadata + credit | A+B | Tách metadata total/tool giữ nguyên thinking khỏi deadline; không bỏ hunks có ích. |
| `lib/ai/metrics.test.ts` | sửa sản phẩm | B | Giữ trong fix credit/deadline/recovery/UI/audit và kiểm thử tương ứng. |
| `lib/ai/metrics.ts` | sửa sản phẩm | B | Giữ trong fix credit/deadline/recovery/UI/audit và kiểm thử tương ứng. |
| `lib/ai/prompts/__fixtures__/v8-input-hashes.json` | registry/definition nghiên cứu | C | Giữ định nghĩa/compatibility v8/v9 và tests; v7 vẫn active, registry dùng tra cứu lịch sử. |
| `lib/ai/prompts/index.test.ts` | registry/definition nghiên cứu | C | Giữ định nghĩa/compatibility v8/v9 và tests; v7 vẫn active, registry dùng tra cứu lịch sử. |
| `lib/ai/prompts/index.ts` | registry/definition nghiên cứu | C | Giữ định nghĩa/compatibility v8/v9 và tests; v7 vẫn active, registry dùng tra cứu lịch sử. |
| `lib/ai/prompts/v8.test.ts` | registry/definition nghiên cứu | C | Giữ định nghĩa/compatibility v8/v9 và tests; v7 vẫn active, registry dùng tra cứu lịch sử. |
| `lib/ai/prompts/v8.ts` | registry/definition nghiên cứu | C | Giữ định nghĩa/compatibility v8/v9 và tests; v7 vẫn active, registry dùng tra cứu lịch sử. |
| `lib/ai/prompts/v9.test.ts` | registry/definition nghiên cứu | C | Giữ định nghĩa/compatibility v8/v9 và tests; v7 vẫn active, registry dùng tra cứu lịch sử. |
| `lib/ai/prompts/v9.ts` | registry/definition nghiên cứu | C | Giữ định nghĩa/compatibility v8/v9 và tests; v7 vẫn active, registry dùng tra cứu lịch sử. |
| `lib/ai/reading-anchors-experiment.test.ts` | thử nghiệm offline | C | Đóng băng source/fixtures/holdout; không nối renderer vào đường unlock, không archive khi chưa có backup. |
| `lib/ai/reading-anchors-holdout.test.ts` | thử nghiệm offline | C | Đóng băng source/fixtures/holdout; không nối renderer vào đường unlock, không archive khi chưa có backup. |
| `lib/ai/reading-anchors.test.ts` | thử nghiệm offline | C | Đóng băng source/fixtures/holdout; không nối renderer vào đường unlock, không archive khi chưa có backup. |
| `lib/ai/reading-anchors.ts` | thử nghiệm offline | C | Đóng băng source/fixtures/holdout; không nối renderer vào đường unlock, không archive khi chưa có backup. |
| `lib/ai/unlock-audit.test.ts` | sửa sản phẩm | B | Giữ trong fix credit/deadline/recovery/UI/audit và kiểm thử tương ứng. |
| `lib/ai/unlock-audit.ts` | sửa sản phẩm | B | Giữ trong fix credit/deadline/recovery/UI/audit và kiểm thử tương ứng. |
| `lib/ai/unlock-credit.integration.test.ts` | sửa sản phẩm | B | Giữ trong fix credit/deadline/recovery/UI/audit và kiểm thử tương ứng. |
| `lib/ai/unlock-credit.test.ts` | sửa sản phẩm | B | Giữ trong fix credit/deadline/recovery/UI/audit và kiểm thử tương ứng. |
| `lib/ai/unlock-credit.ts` | sửa sản phẩm | B | Giữ trong fix credit/deadline/recovery/UI/audit và kiểm thử tương ứng. |
| `lib/ai/unlock-deadline.test.ts` | sửa sản phẩm | B | Giữ trong fix credit/deadline/recovery/UI/audit và kiểm thử tương ứng. |
| `lib/ai/unlock-deadline.ts` | sửa sản phẩm | B | Giữ trong fix credit/deadline/recovery/UI/audit và kiểm thử tương ứng. |
| `lib/ai/unlock-observability.test.ts` | sửa sản phẩm | B | Giữ trong fix credit/deadline/recovery/UI/audit và kiểm thử tương ứng. |
| `lib/ai/unlock-observability.ts` | sửa sản phẩm | B | Giữ trong fix credit/deadline/recovery/UI/audit và kiểm thử tương ứng. |
| `lib/ai/unlock-recovery-route.test.ts` | sửa sản phẩm | B | Giữ trong fix credit/deadline/recovery/UI/audit và kiểm thử tương ứng. |
| `lib/ai/unlock-recovery.test.ts` | sửa sản phẩm | B | Giữ trong fix credit/deadline/recovery/UI/audit và kiểm thử tương ứng. |
| `lib/ai/unlock-recovery.ts` | sửa sản phẩm | B | Giữ trong fix credit/deadline/recovery/UI/audit và kiểm thử tương ứng. |
| `lib/ai/unlock.test.ts` | sửa sản phẩm | B | Giữ trong fix credit/deadline/recovery/UI/audit và kiểm thử tương ứng. |
| `lib/readings/history.test.ts` | sửa sản phẩm | B | Giữ trong fix credit/deadline/recovery/UI/audit và kiểm thử tương ứng. |
| `lib/readings/save.test.ts` | sửa sản phẩm | B | Giữ trong fix credit/deadline/recovery/UI/audit và kiểm thử tương ứng. |
| `lib/tarot/relations.test.ts` | registry/definition nghiên cứu | C | Giữ định nghĩa/compatibility v8/v9 và tests; v7 vẫn active, registry dùng tra cứu lịch sử. |
| `lib/tarot/relations.ts` | registry/definition nghiên cứu | C | Giữ định nghĩa/compatibility v8/v9 và tests; v7 vẫn active, registry dùng tra cứu lịch sử. |
| `playwright.unlock-ui.config.ts` | sửa sản phẩm | B | Giữ trong fix credit/deadline/recovery/UI/audit và kiểm thử tương ứng. |
| `prisma/migrations/20261123000000_add_unlock_operations/migration.sql` | sửa sản phẩm | B | Giữ trong fix credit/deadline/recovery/UI/audit và kiểm thử tương ứng. |
| `prisma/schema.prisma` | sửa sản phẩm | B | Giữ trong fix credit/deadline/recovery/UI/audit và kiểm thử tương ứng. |
| `scripts/audit-unlocks.ts` | sửa sản phẩm | B | Giữ trong fix credit/deadline/recovery/UI/audit và kiểm thử tương ứng. |
| `scripts/benchmark-prompts.ts` | hạ tầng benchmark | C | Giữ công cụ đo/review tái dùng được; tách khỏi runtime credit, không chạy model mới. |
| `scripts/prepare-anchor-experiment.ts` | thử nghiệm offline | C | Đóng băng source/fixtures/holdout; không nối renderer vào đường unlock, không archive khi chưa có backup. |
| `scripts/prepare-benchmark-review.ts` | hạ tầng benchmark | C | Giữ công cụ đo/review tái dùng được; tách khỏi runtime credit, không chạy model mới. |
| `scripts/prepare-constraint-reading-experiment.ts` | thử nghiệm offline | C | Đóng băng source/fixtures/holdout; không nối renderer vào đường unlock, không archive khi chưa có backup. |
| `scripts/prepare-controlled-reading-experiment.ts` | thử nghiệm offline | C | Đóng băng source/fixtures/holdout; không nối renderer vào đường unlock, không archive khi chưa có backup. |
| `tasks/tasks-tarot-ai-v9-evidence-grounded.md` | tài liệu nghiên cứu đóng | C | Giữ thiết kế/NO-GO/quyết định dừng; checklist chưa chạy không tự trở thành công việc tiếp theo. |
| `tasks/tasks-v7-unlock-credit-reliability.md` | tài liệu credit | B | Giữ thiết kế, evidence và release gates cùng fix sản phẩm; chưa phát hành. |
| `test/unlock-ui/actions.ts` | sửa sản phẩm | B | Giữ trong fix credit/deadline/recovery/UI/audit và kiểm thử tương ứng. |
| `test/unlock-ui/deck.tsx` | sửa sản phẩm | B | Giữ trong fix credit/deadline/recovery/UI/audit và kiểm thử tương ứng. |
| `test/unlock-ui/image.tsx` | sửa sản phẩm | B | Giữ trong fix credit/deadline/recovery/UI/audit và kiểm thử tương ứng. |
| `test/unlock-ui/index.html` | sửa sản phẩm | B | Giữ trong fix credit/deadline/recovery/UI/audit và kiểm thử tương ứng. |
| `test/unlock-ui/link.tsx` | sửa sản phẩm | B | Giữ trong fix credit/deadline/recovery/UI/audit và kiểm thử tương ứng. |
| `test/unlock-ui/main.tsx` | sửa sản phẩm | B | Giữ trong fix credit/deadline/recovery/UI/audit và kiểm thử tương ứng. |
| `test/unlock-ui/reading-view.tsx` | sửa sản phẩm | B | Giữ trong fix credit/deadline/recovery/UI/audit và kiểm thử tương ứng. |
| `test/unlock-ui/readings.ts` | sửa sản phẩm | B | Giữ trong fix credit/deadline/recovery/UI/audit và kiểm thử tương ứng. |
| `test/unlock-ui/server.mjs` | sửa sản phẩm | B | Giữ trong fix credit/deadline/recovery/UI/audit và kiểm thử tương ứng. |
| `test/unlock-ui/stubs.tsx` | sửa sản phẩm | B | Giữ trong fix credit/deadline/recovery/UI/audit và kiểm thử tương ứng. |
| `test/unlock-ui/toast.ts` | sửa sản phẩm | B | Giữ trong fix credit/deadline/recovery/UI/audit và kiểm thử tương ứng. |
| `test/unlock-ui/unlock-state.spec.ts` | sửa sản phẩm | B | Giữ trong fix credit/deadline/recovery/UI/audit và kiểm thử tương ứng. |

## Artifacts cục bộ bị Git ignore

`before.json` liệt kê từng ignored artifact thuộc `.model-compare/` tại đầu task 7, gồm SHA-256/bytes. Không quét `.env`, dependencies hoặc generated build caches. Đây là evidence local, không phải backup off-machine; không archive/xóa khi chưa xác minh nơi lưu bền vững.

Các file thêm riêng trong task 7: tài liệu inventory này và `docs/v7-unlock-credit-task7-result-2026-11-23.md`; nhóm tài liệu review workspace, packet B bổ sung. Các scripts/graphs/patches/verification mới trong `.model-compare/v7-credit-task7/` là artifacts task 7, không phải thay đổi sản phẩm.
