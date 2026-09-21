import { z } from "zod";
import { MAX_ADJUST } from "@/lib/admin/credits";
import { getAiModel } from "@/lib/ai/models";

// Lý do bắt buộc ở mọi thao tác ghi vào nhật ký quản trị: một nhật ký toàn lý
// do rỗng là nhật ký để trưng.
const ReasonField = z
  .string()
  .trim()
  .min(3, "Phải ghi lý do.")
  .max(500, "Lý do dài quá 500 ký tự.");

export const AdjustCreditsSchema = z.object({
  userId: z.string().min(1),
  delta: z
    .number()
    .int("Số credit phải là số nguyên.")
    .refine((value) => value !== 0, "Số credit phải khác 0.")
    .refine(
      (value) => Math.abs(value) <= MAX_ADJUST,
      `Mỗi lần chỉnh tối đa ${MAX_ADJUST} credit.`,
    ),
  reason: ReasonField,
});

export const RefundOrderSchema = z.object({
  orderId: z.string().min(1),
  reason: ReasonField,
});

export const ReconcileOrderSchema = z.object({
  orderId: z.string().min(1),
});

// Model tới từ một thẻ <select>, nhưng server action là một POST ai cũng gọi
// được (xem `app/actions/admin.ts`), nên chuỗi này vẫn phải đi qua danh sách
// cho phép trong code — không nhận bừa tên model rồi gửi thẳng ra API.
export const SetAiModelSchema = z.object({
  modelId: z
    .string()
    .min(1)
    .refine((id) => getAiModel(id) !== null, "Model không nằm trong danh sách cho phép."),
  reason: ReasonField,
});
