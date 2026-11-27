# Báo cáo đánh giá Tarot Skill và đề xuất tích hợp cho tarot.thanhnghiep.top

**Ngày:** 20/11/2026  
**Upstream:** https://github.com/daman-ovo-0404/tarot-skill  
**Dự án:** https://github.com/nghiepnguyen/tarot  
**Trạng thái:** Đánh giá và đề xuất, chưa triển khai

## 1. Executive summary

**Khuyến nghị: tích hợp có chọn lọc, không sao chép nguyên repo vào production.** `tarot-skill` hữu ích ở cách tổ chức tri thức và phân tích quan hệ giữa các lá, nhưng không phải backend Tarot hoàn chỉnh. Dự án Tarot đã có phần lớn nền tảng cần thiết: bộ 78 lá, cơ chế chọn ba lá, các phiên bản prompt, quality checks, benchmark, Dynamic Reflection và credit workflow. Điểm nghẽn chính hiện nay là AI gán tình tiết ngoài dữ kiện và ép liên kết biểu tượng thành kết luận về đời thực.

Đề xuất tập trung vào **Tarot AI v9 — Evidence-Grounded Interpretation**, với ranh giới rõ giữa dữ kiện người dùng, dữ kiện lá bài, quan hệ biểu tượng và giả thuyết phản tư. Trước tiên chỉ audit offline, thiết kế giải pháp và benchmark; không đổi production.

**Điểm đánh giá định tính (không phải benchmark):** giá trị ý tưởng 8.5/10; độ sẵn sàng tích hợp trực tiếp 4/10; tiềm năng cải thiện diễn giải 9/10; rủi ro sao chép nguyên trạng 7/10.

## 2. Phạm vi và nguồn

Đã đối chiếu nội dung upstream gồm `README.md`, `SKILL.md`, `references/cards.md`, `references/card-relations.md`, `references/combinations.md`, `references/spreads.md`, `scripts/draw.py`, `tests/test_draw.py` và giấy phép. Đã đọc mã và tài liệu liên quan trong `nghiepnguyen/tarot`, bao gồm `docs/tarot-skill-integration-review.md`, `lib/tarot/draw.ts`, `lib/ai/prompts/v8.ts`, `v8-1.ts`, `index.ts`, `lib/ai/quality.ts`, `lib/ai/interpretation.ts`, `lib/ai/reading-support.ts`, `docs/benchmarks/v8-1-round-1-2026-11-12.md`, `TECH_STACK.md` và `FEATURES.md`.

Đây là **review tĩnh**, không phải kết quả chạy test hoặc kiểm chứng deployment production ở thời điểm viết.

## 3. Upstream cung cấp gì?

Repo là **Agent Skill** hướng dẫn AI đọc Tarot, không phải một thư viện ứng dụng với API ổn định. Các thành phần chính:

| Thành phần | Vai trò | Nhận định |
|---|---|---|
| `SKILL.md` | Quy tắc và workflow đọc Tarot | Tham khảo nguyên tắc diễn giải |
| `references/cards.md` | Quy tắc chất, số, court, Major, chiều ngược | Không có 78 bản nghĩa chi tiết như README quảng bá |
| `references/card-relations.md` | Các kiểu quan hệ giữa lá | Khung khái niệm, chưa là graph đầy đủ |
| `references/combinations.md` | Các cặp bài minh họa | Mới có 10 cặp ví dụ |
| `references/spreads.md` | Sáu kiểu trải | Không cần đưa tất cả vào MVP |
| `scripts/draw.py` | Rút bài Python có seed và trọng số | Không nên thay cơ chế rút hiện tại |
| `tests/test_draw.py` | Test hợp đồng rút cơ bản | Coverage hành vi còn hẹp |

README mô tả bộ nghĩa 78 lá, nhưng file `cards.md` đọc được chỉ chứa quy tắc tổng quát. Không nên nhập trực tiếp làm kho kiến thức canonical. Repo hiện có `LICENSE` MIT; khi sao chép mã cần giữ thông báo giấy phép phù hợp.

## 4. Ma trận tích hợp

| Hạng mục | Giá trị | Trạng thái dự án | Khuyến nghị | Ưu tiên |
|---|---|---|---|---|
| Quan hệ cùng chất/cùng số | Cải thiện `connections` | Đã thử ở v8/v8.1 | Tối ưu cách chọn quan hệ, không xây lại | P0 |
| Anti-Barnum | Giảm lời sáo rỗng | Đã có `quality.ts` | Bổ sung kiểm định ngữ nghĩa | P0 |
| Fact/claim grounding | Giảm gán tình tiết ngoài câu hỏi | v8.1 chưa đạt | Thiết kế evidence engine | P0 |
| Bốn góc nhìn Mirror/Window/Door/Anchor | Gợi mở phản tư | Đã có Reflection | Dùng có chọn lọc, tránh thêm phần dài | P1 |
| Narrative Arc | Kết nối ba lá | Đã có `connections` | Tối ưu văn phong và phân cấp UI | P1 |
| Reproducible draw | Debug và audit | Đã có Fisher–Yates, fixtures | Lưu metadata nếu có yêu cầu xác minh | P2 |
| 78 card meanings upstream | Kho nghĩa bài | Dự án đã có bộ bài | Không nhập | Loại |
| Weighted Python draw | Thiên lệch theo vị trí/giờ | Khác UX hiện tại | Không dùng | Loại |
| 5/7/10-card spreads | Mở rộng tính năng | Hệ thống đang cố định ba lá | Hoãn | P3 |

## 5. Phân tích tính năng đáng học hỏi

### 5.1. Card Relationship Engine

Upstream gợi ý Fool’s Journey, Numerical Journey, Elemental Dignities, Mirror Cards, Court Cards và Numerical Resonance. Những hệ này hữu ích như **ngôn ngữ biểu tượng**, không phải chứng cứ về các sự kiện trong đời thực. Thay vì để AI tự tìm mọi liên kết, backend nên xác định những quan hệ khách quan về bộ bài (chất, cấp số, vị trí, chiều), chọn tối đa một hoặc hai quan sát có liên quan rồi đưa vào prompt.

Ví dụ The Tower → The Star → The Magician có thể gợi cách nhìn từ biến động sang phục hồi và chủ động, nhưng không được khẳng định người hỏi thực sự vừa gặp biến cố nếu họ chưa nói.

### 5.2. Anti-Barnum Quality Gate

Một lời khuyên như “hãy tin vào trực giác” quá chung. Tốt hơn là đề xuất một bước nhỏ có thể kiểm chứng, nhưng không tự bịa bối cảnh. Quality Gate cần phân biệt: (a) đúng lá/vị trí, (b) bám chi tiết đã cung cấp, (c) không đoán ý người khác, (d) hành động cụ thể và có điều kiện, (e) tôn trọng quyền quyết định của người hỏi.

### 5.3. Four-Lens Reading

Bốn góc nhìn gồm **Mirror** (điều đang phản chiếu), **Window** (góc nhìn chưa chú ý), **Door** (khả năng hành động), **Anchor** (niềm tin/khuôn mẫu đang giữ lại). Không ép đủ bốn góc nhìn cho từng lá. Có thể dùng tối đa hai góc phù hợp trong Dynamic Reflection và diễn đạt bằng nhãn tiếng Việt thân thiện.

### 5.4. Narrative Arc

Khung khởi đầu → căng thẳng → chuyển biến → lối ra → dư âm hữu ích để tổ chức nội dung nội bộ. Trên mobile, nên ưu tiên thông điệp chính, một điều đáng suy ngẫm và một bước nhỏ thay vì thêm năm section cố định.

## 6. Vấn đề kỹ thuật của upstream

### 6.1. Rút bài có trọng số

`draw.py` sử dụng `random.Random(seed)` và `rng.choices()` với trọng số phụ thuộc vị trí và khung giờ. Ở vị trí ưu tiên Major, trọng số tương đối của mỗi Major là `60/28`, còn mỗi Minor là 1. Với 22 Major và 56 Minor, xác suất Major ở lượt đầu tăng từ khoảng **28.21%** khi rút đều lên khoảng **45.72%** ở vị trí ưu tiên (trước hiệu chỉnh theo thời gian). Vì vậy không thể coi đây là rút đều 78 lá.

`question` có thể tham gia tạo seed mặc định nhưng không được phân tích ngữ nghĩa để chọn bài phù hợp. Seed từ `os.urandom` không biến toàn bộ thuật toán `random.Random` thành CSPRNG. Tái lập kết quả bằng seed cũng không đồng nghĩa với khả năng chứng minh tính công bằng.

**Khuyến nghị:** giữ Fisher–Yates và tương tác vòng bài hiện có. Nếu cần RNG mạnh hơn, cân nhắc Web Crypto với rejection sampling; kiểm thử phân phối và giới hạn đầu vào. Nếu cần xác minh từ server, chỉ nâng cấp RNG ở client là chưa đủ.

### 6.2. Dữ liệu và quan hệ chưa đủ sâu

`cards.md` chưa có nghĩa chi tiết cho 78 lá; `combinations.md` chỉ có mười ví dụ. Các quy tắc như Mirror Cards mang tính diễn giải theo trường phái, không phải sự thật phổ quát. Không biến chúng thành deterministic claims về người dùng.

### 6.3. Kiểm thử hạn chế

Test upstream chủ yếu kiểm tra seed, số lá, không trùng và tên vị trí. Chưa đủ để kết luận phân phối xác suất, ranh giới giờ, orientation, dữ liệu sai hoặc độ an toàn production. Báo cáo tích hợp cũ của dự án từng thử 1.800 tổ hợp, nhưng đó là kiểm tra hợp đồng rút, không phải kiểm định phân phối hoặc chất lượng AI.

## 7. Đối chiếu dự án hiện tại

Dự án `nghiepnguyen/tarot` đã có bộ bài, xáo Fisher–Yates (`Math.random`), chiều lá 50/50, ba vị trí **Bối cảnh / Hiện tại / Hướng đi**, schema diễn giải ba lá, credit unlock, Gemini/DeepSeek, bộ kiểm tra chất lượng và benchmark. `ACTIVE_PROMPT_VERSION` trong `lib/ai/prompts/index.ts` đang trỏ `PROMPT_V7` ở mã đã đọc; điều này không tự chứng minh deployment production hiện hành.

Dự án đã có báo cáo đánh giá chính upstream từ ngày **11/11/2026** và PRD cải thiện liên kết lá. `v8.ts` tính ba loại quan hệ: cả ba lá cùng chất, cặp cùng chất khác cấp số, cặp cùng cấp số khác chất; giới hạn tối đa hai quan sát. `v8-1.ts` thêm chỉ dẫn không suy diễn khi thiếu dữ kiện.

### 7.1. Kết quả benchmark v8.1

Theo `docs/benchmarks/v8-1-round-1-2026-11-12.md`, v8.1 so với v8 trên tám ca yếu/vắng quan hệ:

| Chỉ số | v8 | v8.1 |
|---|---:|---:|
| Phản hồi hợp lệ | 8/8 | 8/8 |
| Khẳng định ngoài dữ kiện | 8/8 | 8/8 |
| Ép liên kết yếu | 3/4 | 3/4 |
| Token đầu vào | 21.863 | 24.463 |
| Token đầu ra | 8.692 | 8.385 |
| Chi phí ước tính trung vị | 160đ | 159đ |
| p50 | 12,87s | 12,78s |
| p95 | 13,44s | 13,57s |

V8.1 thắng hai cặp, hòa sáu, thua không; nhưng vẫn **NO-GO** vì vi phạm điều kiện bám dữ kiện. Đây là mẫu nhỏ (một model, một lượt mỗi ca, một người chấm) và không nên ngoại suy thành chất lượng production.

**Root-cause hypothesis:** chỉ dẫn “diễn đạt có điều kiện” trong prompt chưa đủ; AI vẫn có thể gán nguyên nhân, động cơ, cảm xúc hoặc quy trình của bên thứ ba vào lời mở đầu và thông điệp từng lá. Cần kiểm tra các giả thuyết này bằng benchmark, không mặc định đây là nguyên nhân duy nhất.

## 8. Đề xuất Tarot AI v9 — Evidence-Grounded Interpretation

### 8.1. Phân loại bằng chứng

- **F (Fact):** sự kiện hoặc hoàn cảnh người dùng thực sự nêu.
- **C (Card):** card ID, vị trí, chiều, chất, số, ý nghĩa đã kiểm duyệt.
- **R (Relation):** quan sát xác định bằng code hoặc quy tắc biểu tượng có nguồn.
- **H (Hypothesis):** diễn giải phản tư, bắt buộc thể hiện như giả thuyết/câu hỏi khi chưa có bằng chứng đời thực.

Ví dụ cấu trúc trung gian:

```json
{
  "facts": [{"id": "F1", "text": "Người dùng cân nhắc chuyển nhóm"}],
  "cards": [{"id": "C1", "cardId": "three-of-pentacles", "position": "Bối cảnh", "orientation": "upright"}],
  "hypotheses": [{"id": "H1", "text": "Có thể cần xem lại cách phối hợp", "supportRefs": ["F1", "C1"], "certainty": "reflective"}]
}
```

### 8.2. Pipeline đề xuất

`Reading Input → Evidence Builder → Relation Selector → Claim Planner → Narrative Writer → Quality Gate → Existing Reading UI`

Không nhất thiết tạo nhiều API calls. Ưu tiên tính evidence ở server, đưa vào một lần gọi AI và giữ schema kết quả hiện tại. Chỉ thử nhiều bước khi benchmark chứng minh lợi ích lớn hơn chi phí/độ trễ.

### 8.3. Relationship Engine v2

Tách logic tính quan hệ khỏi `v8.ts` sang module thuần (ví dụ `lib/tarot/relations.ts`). Phân loại R1: quan hệ cấu trúc xác định bằng code; R2: quan hệ biểu tượng có định nghĩa; R3: liên hệ với câu hỏi; R4: lời diễn giải và hành động. Bắt đầu với các quan hệ đang có, **cho phép không dùng quan hệ nào** khi không liên quan. Không bổ sung ngay hệ thống phong phú hơn như Tree of Life.

### 8.4. Quality Gate v2

Giữ `assessInterpretationQuality()` cho cảnh báo văn phong/độ dài. Bổ sung tiêu chí kiểm tra ngữ nghĩa: `unsupported_claim`, `forced_relation`, `third_party_mindreading`. Không xem regex đơn thuần là bộ phát hiện hallucination đầy đủ. Cần bộ ca gán nhãn, chấm mù và đánh giá các trường hợp false positive/negative. Tránh tự động gọi model lại khi có warning vì giới hạn 45 giây và rủi ro credit.

## 9. So sánh ba phương án

| Phương án | Chi phí/độ phức tạp | Ưu điểm | Rủi ro | Đề xuất |
|---|---|---|---|---|
| A. Prompt-only | Thấp | Nhanh, ít đổi code | v8.1 cho thấy chưa đủ | Chỉ làm đối chứng |
| B. Deterministic evidence + 1 AI call | Vừa | Có cấu trúc, kiểm thử được, giữ latency | Vẫn cần kiểm tra claim | **Ưu tiên thử** |
| C. Multi-step claim planning + writing | Cao | Có thể kiểm soát dàn ý tốt hơn | Token, timeout, billing, phức tạp | Chỉ thử sau B |

## 10. File-level change plan (đề xuất, chưa sửa)

| File/module | Thay đổi dự kiến |
|---|---|
| `lib/tarot/relations.ts` | Tách deterministic relationship builder |
| `lib/tarot/relations.test.ts` | Test quan hệ, đảo vị trí/chiều, trường hợp vắng |
| `lib/ai/evidence.ts` | Chuẩn hóa facts/cards/relations/hypotheses nếu phương án B được duyệt |
| `lib/ai/prompts/v9.ts` | Prompt ứng viên với dữ liệu evidence, không thay v7 |
| `lib/ai/prompts/index.ts` | Đăng ký candidate, giữ active v7 |
| `lib/ai/quality.ts` | Bổ sung metadata cảnh báo nếu có cơ chế đánh giá đáng tin |
| `lib/ai/benchmark-cases.ts` | Thêm ca weak/absent, orientation/position, third-party claims |
| `scripts/benchmark-prompts.ts` | Tái dùng benchmark, đảm bảo so cùng model/fixtures |
| `docs/benchmarks/` | Báo cáo kết quả và GO/NO-GO |

Không đổi database, payment, credit, PayOS, UI, schema hiển thị hoặc trải bài ba lá trong vòng thử đầu.

## 11. Benchmark và Release Gate

Cần kiểm thử quan hệ mạnh, yếu, vắng; đổi vị trí/chiều; câu hỏi thiếu dữ kiện; ý định người khác; sức khỏe, pháp lý, tài chính và tín hiệu tự hại. Chấm mù độ bám dữ kiện, tính cụ thể, đóng góp của `connections`, tiếng Việt tự nhiên và hành động khả thi. Đo JSON/schema, lỗi vị trí, token, chi phí, p50/p95, lỗi credit. Tránh dùng câu hỏi thật của người dùng trong fixture/log.

**Ngưỡng đề xuất (chưa phải kết quả):** 0 lỗi sai lá/vị trí/chiều; 0 unsupported claims và forced relations trong bộ ca chặn phát hành; schema hợp lệ 100% trên mẫu; v9 thắng ≥60% cặp quan hệ mạnh so với v7; chi phí trung vị không tăng quá 10%; không phát sinh trừ credit ở các nhánh lỗi kiểm thử; rollback đã được xác minh. Cần quy định rõ số lượt chạy và đánh giá độc lập trước khi áp dụng.

## 12. Roadmap

1. **Phase 0 — Audit & baseline (1–2 ngày công):** xác nhận code, prompt registry, benchmark, known debt, môi trường.
2. **Phase 1 — Evidence Engine v9 (3–5 ngày công):** module quan hệ, cấu trúc evidence, prompt candidate, unit tests.
3. **Phase 2 — Benchmark & Quality Gate (2–4 ngày công):** so v7/v8.1/v9, chấm mù, an toàn, token/latency.
4. **Phase 3 — UX & controlled release (2–3 ngày công):** chỉ sau khi đạt gate; tối ưu đọc mobile, phê duyệt rollout/rollback.

Tổng ước tính 8–14 ngày công kỹ thuật; không bao gồm thời gian chờ review hoặc chi phí model. Không cam kết lịch triển khai.

## 13. Risk register

| Rủi ro | Mức | Biện pháp |
|---|---|---|
| AI khẳng định tình tiết không có | Cao | Evidence labeling + benchmark có nhãn |
| Quan hệ biểu tượng bị coi là nhân quả | Cao | Cho phép bỏ quan hệ, dùng diễn đạt có điều kiện |
| Tăng độ trễ gây timeout và mất credit | Cao | Ưu tiên 1 call, giữ timeout và rollback |
| Safety branch xử lý sai | Cao | Test trước API/trừ credit, kiểm tra phủ định/trích dẫn |
| Dữ liệu riêng tư vào logs/analytics | Cao | Fixtures tổng hợp, không log câu hỏi thô |
| Nhiều prompt version không rõ active | Vừa | Registry và xác minh deployment riêng |
| Scope creep sang nhiều kiểu trải | Vừa | Khóa phạm vi ba lá |
| Upstream thay đổi hoặc giấy phép | Vừa | Pin commit SHA, giữ license notice khi copy |

## 14. Quyết định

**READY FOR OFFLINE PREFLIGHT; NOT READY FOR PRODUCTION INTEGRATION.** Bước kế tiếp nên là audit read-only và thiết kế phương án B. Không cần nhập bộ 78 nghĩa bài, thay script rút bài, thêm nhiều kiểu trải hoặc mở rộng UI ngay. Chỉ chuyển sang implementation sau khi preflight xác nhận rủi ro, benchmark và acceptance criteria.

## 15. Prompt Codex — Bước tiếp theo

```text
Bạn đang làm việc trên repository nghiepnguyen/tarot.

Thực hiện Tarot AI v9 — Evidence-Grounded Interpretation Preflight ở chế độ OFFLINE, READ-ONLY.

Mục tiêu: kiểm tra khả năng tận dụng ý tưởng từ daman-ovo-0404/tarot-skill để giảm unsupported claims, forced relations và tăng chất lượng connections. Không tích hợp nguyên repo.

Đọc code thực tế và tài liệu: docs/tarot-skill-integration-review.md; lib/tarot/cards.ts; lib/tarot/draw.ts; lib/ai/prompts/v7.ts, v8.ts, v8-1.ts, index.ts; lib/ai/quality.ts; lib/ai/interpretation.ts; lib/ai/dynamic-reflection.ts; lib/ai/reading-support.ts; lib/ai/benchmark-cases.ts; docs/benchmarks/; app/actions/ai.ts; các test liên quan.

1. Audit feature gap: VERIFIED / INFERRED / PROPOSED, không đề xuất xây lại tính năng đã có.
2. Root-cause analysis cho v8/v8.1 NO-GO dựa trên từng benchmark và đầu ra cụ thể.
3. Thiết kế F=user facts, C=card evidence, R=relationships, H=reflective hypotheses.
4. So sánh A prompt-only, B deterministic evidence + 1 AI call, C multi-step claim planning + writing.
5. Đề xuất file-level plan, tests, fixtures, benchmark mù, acceptance criteria và rollback.
6. Kiểm tra tác động đến timeout 45s, credit, schema, history, Dynamic Reflection và safety branch.

Ràng buộc: không sửa code/database/production, không gọi Gemini/DeepSeek, không push/merge/deploy, không migration, không thay active prompt, credit/billing/PayOS, không thêm dependency.

Deliverable: Executive summary; architecture assessment; upstream gap matrix; root-cause analysis; A/B/C tradeoff; v9 design; file-level change plan; benchmark plan; risk register; GO/NO-GO và task tiếp theo. Kết luận READY FOR IMPLEMENTATION hoặc NOT READY — NEEDS MORE EVIDENCE. Không tự triển khai sau audit.
```

## 16. Tài liệu tham chiếu

- [Tarot Skill upstream](https://github.com/daman-ovo-0404/tarot-skill)
- [Dự án Tarot](https://github.com/nghiepnguyen/tarot)
- [Review tích hợp ngày 11/11](https://github.com/nghiepnguyen/tarot/blob/main/docs/tarot-skill-integration-review.md)
- [Benchmark v8.1](https://github.com/nghiepnguyen/tarot/blob/main/docs/benchmarks/v8-1-round-1-2026-11-12.md)
- [Prompt registry](https://github.com/nghiepnguyen/tarot/blob/main/lib/ai/prompts/index.ts)
- [Prompt v8](https://github.com/nghiepnguyen/tarot/blob/main/lib/ai/prompts/v8.ts)
- [Quality checks](https://github.com/nghiepnguyen/tarot/blob/main/lib/ai/quality.ts)
