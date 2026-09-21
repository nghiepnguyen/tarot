import "server-only";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { AI_MODELS, getAiModel, type AiModel } from "@/lib/ai/models";
import { ACTIVE_PROMPT_VERSION } from "@/lib/ai/prompts";
import { reportHandledIssue } from "@/lib/monitoring/report";

export const AI_MODEL_SETTING_KEY = "ai.model";

/** Model dùng khi chưa ai chọn gì: đúng model bản prompt đang chạy được viết cho. */
export function getFallbackAiModel(): AiModel {
  return getAiModel(ACTIVE_PROMPT_VERSION.model) ?? AI_MODELS[0];
}

/**
 * Model sẽ sinh lượt luận giải tiếp theo.
 *
 * Đọc thẳng database mỗi lần gọi, không cache: đổi model là thao tác người ta
 * làm lúc một nhà cung cấp đang hỏng, và lúc đó "có hiệu lực sau vài phút" là
 * không đủ nhanh. Mỗi request cũng chỉ hỏi đúng một lần, nên không có gì để
 * tiết kiệm — mà một bản cache trong request lại đọc ra giá trị cũ ngay sau
 * lần đổi, ở chính trang vừa đổi.
 *
 * Giá trị lưu trong database luôn phải qua `getAiModel`: model bị gỡ khỏi danh
 * sách cho phép (hết hỗ trợ, hoặc mất giá trong bảng giá) thì rơi về mặc định
 * kèm một dòng Sentry, chứ không lặng lẽ gọi tiếp một model không ai kiểm.
 */
export async function getActiveAiModel(): Promise<AiModel> {
  const row = await prisma.appSetting.findUnique({
    where: { key: AI_MODEL_SETTING_KEY },
    select: { value: true },
  });
  if (!row) return getFallbackAiModel();

  const model = getAiModel(row.value);
  if (model) return model;

  reportHandledIssue("Model AI đã chọn không còn trong danh sách cho phép", {
    area: "ai-model-setting",
    extra: { stored: row.value },
  });
  return getFallbackAiModel();
}

/**
 * Ghi lựa chọn model. Bên gọi phải tự kiểm quyền và tự ghi `AdminAuditLog`.
 *
 * Nhận client từ bên gọi, cùng lý do với `writeAuditLog`: lựa chọn và dòng
 * nhật ký ký tên cho nó phải commit cùng lúc.
 */
export async function setActiveAiModel(
  db: Prisma.TransactionClient,
  modelId: string,
  adminUserId: string,
): Promise<void> {
  await db.appSetting.upsert({
    where: { key: AI_MODEL_SETTING_KEY },
    create: { key: AI_MODEL_SETTING_KEY, value: modelId, updatedBy: adminUserId },
    update: { value: modelId, updatedBy: adminUserId },
  });
}
