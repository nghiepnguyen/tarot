# Task 0 — Nhánh và baseline credit fix

Ngày 22/11/2026. **Task 0 hoàn tất; task 1 chưa bắt đầu.** Chưa sửa logic credit, schema, prompt hoặc runtime.

## Workspace và nhánh

- Nhánh trước: `codex/tarot-ai-v9-evidence-grounded`.
- Nhánh mới: `codex/v7-unlock-credit-reliability`.
- Cả hai tại HEAD `81998706a409e2c1278217b8c87c552eef8bb622`; không tạo commit.
- Chọn nhánh mới tại workspace hiện có để giữ nguyên dependencies và artifacts ignored chỉ có cục bộ; không tạo bản checkout thiếu các files chưa commit. Đây là phân tách tên nhánh, chưa phải snapshot commit độc lập của nghiên cứu cũ.
- Lần tạo nhánh đầu bị sandbox chặn ghi `.git`; chạy lại đúng lệnh tạo/chuyển nhánh với quyền bổ sung đã được chấp thuận thành công. Không reset/stash/delete/clean hoặc checkout nội dung.

## Inventory và bảo toàn dữ liệu

Trước đổi nhánh đã ghi status, HEAD, path/size/SHA256 của **85 files modified/untracked** và **427 local artifacts** dưới `.model-compare/`. Sau đổi nhánh, tất cả còn nguyên byte và HEAD không đổi. Inventory là dấu vân tay kiểm tra, **không phải backup**; chưa commit/archive/xóa dữ liệu.

Manifest local: `.model-compare/v7-credit-task0/before.json`. Không đưa secrets hoặc nội dung file vào report; manifest lưu paths/hashes, không sao chép raw file contents. Các phiếu/lựa chọn review v9.x và raw benchmark artifacts được giữ nguyên.

Thay đổi task 0 chỉ gồm report này và cập nhật hai task lists. Không coi các sửa đổi source có sẵn là credit fix mới. Khi bắt đầu task 1/2 phải so với baseline manifest để nhận diện diff mới; việc tách commit nghiên cứu/telemetry nằm ở task 7.

## Pin nguồn

| File | SHA256 |
|---|---|
| `lib/ai/prompts/v7.ts` | `47de9dde60f582820e431170be358fa5718a98ba90ec8b9e35d92f25a6398365` |
| `lib/ai/prompts/v7-system.ts` | `13742471312a8baaea06d2799e9ecc35e28a3c964700376247150e952c24668b` |
| `lib/ai/prompts/index.ts` | `4eadf72e4e8506d10fb0dae73ef32c8b19d2b43c56caf5c981dd93fdc53fa667` |
| `app/actions/ai.ts` | `ca3cdd706e8be6d894398f18609d7dc979c8263d47eed206c0ed2b502511de8d` |
| `prisma/schema.prisma` | `156a85b58ce2fd194eae69fcae045e834671521f33d71ab549439ded05a702d3` |

Registry source vẫn `ACTIVE_PROMPT_VERSION = PROMPT_V7`, ID `v7-2026-10-06`; test registry kiểm chứng. Không xác minh deployment thực tế trong task 0.

## Baseline kiểm chứng

Lệnh focused:

```sh
pnpm exec vitest run lib/ai/unlock.test.ts lib/ai/gemini.test.ts lib/ai/deepseek.test.ts lib/ai/metrics.test.ts lib/ai/prompts/index.test.ts lib/validation/reading.test.ts lib/ai/reading-support.test.ts
```

**7 files, 94 tests passed**, exit 0. `pnpm lint`, `pnpm exec tsc --noEmit` và `git diff --check` exit 0. Không failure có sẵn được phát hiện trong tập checks này.

Các tests characterization balance/ledger sau debit vẫn pass theo hành vi lỗi hiện tại. Baseline xanh không chứng minh credit đã an toàn; task 2 phải sửa hành vi và đổi assertions tương ứng.

Chưa chạy lại full suite, build/E2E, DB integration hoặc API thật vì task 0 chỉ chuẩn bị workspace/tài liệu. Không cài dependencies, migration, gọi provider, ghi DB, push/deploy hoặc sửa tiền.

## Bàn giao

Hướng v9.x dừng theo yêu cầu người dùng; giữ nguyên reports/choices/frozen source và không xóa historical registry entries. Tiếp theo là task 1: chốt invariants, commit point, transaction boundary và durable retry/recovery trước sửa luồng tiền. Các rủi ro credit nêu trong preflight vẫn chưa được sửa.
