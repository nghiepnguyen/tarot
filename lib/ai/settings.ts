import "server-only";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import {
  AI_MODELS,
  getAiModel,
  PROVIDER_API_KEY_ENV,
  RANDOM_AI_MODEL_VALUE,
  type AiModel,
} from "@/lib/ai/models";
import { ACTIVE_PROMPT_VERSION } from "@/lib/ai/prompts";
import { reportHandledIssue } from "@/lib/monitoring/report";

export const AI_MODEL_SETTING_KEY = "ai.model";

/** Lựa chọn đang lưu trong database: một model cố định, hay bốc ngẫu nhiên. */
export type AiModelSelection = { kind: "random" } | { kind: "fixed"; model: AiModel };

/** Model dùng khi chưa ai chọn gì: đúng model bản prompt đang chạy được viết cho. */
export function getFallbackAiModel(): AiModel {
  return getAiModel(ACTIVE_PROMPT_VERSION.model) ?? AI_MODELS[0];
}

/**
 * Bốc một model trong danh sách cho phép, xác suất đều.
 *
 * Đều là có chủ đích: cái cần đo là chất lượng từng model, mà một model bốc
 * được ít lượt hơn thì điểm của nó nhiễu hơn — so sánh hai con số dựng trên
 * hai cỡ mẫu lệch nhau là so sánh hỏng.
 */
export function pickRandomAiModel(): AiModel {
  return AI_MODELS[Math.floor(Math.random() * AI_MODELS.length)];
}

/**
 * Lựa chọn đang lưu, đọc nguyên trạng — `random` vẫn là `random`.
 *
 * Trang quản trị và đường ghi lựa chọn dùng hàm này: chúng nói về *cấu hình*.
 * Đường sinh luận giải thì cần một model thật, nên gọi `resolveAiModelForUnlock`.
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
export async function getActiveAiSelection(): Promise<AiModelSelection> {
  const row = await prisma.appSetting.findUnique({
    where: { key: AI_MODEL_SETTING_KEY },
    select: { value: true },
  });
  if (!row) return { kind: "fixed", model: getFallbackAiModel() };
  if (row.value === RANDOM_AI_MODEL_VALUE) return { kind: "random" };

  const model = getAiModel(row.value);
  if (model) return { kind: "fixed", model };

  reportHandledIssue("Model AI đã chọn không còn trong danh sách cho phép", {
    area: "ai-model-setting",
    extra: { stored: row.value },
  });
  return { kind: "fixed", model: getFallbackAiModel() };
}

/**
 * Model sẽ sinh đúng lượt mở khóa này.
 *
 * Bốc *mỗi lượt một lần*, không phải mỗi phiên hay mỗi người: cái đang đo là
 * model nào viết hay hơn, nên hai lượt liền nhau của cùng một người được phép
 * rơi vào hai model khác nhau. Bên gọi ghi `model.id` xuống `AiInterpretation`
 * như thường — nhìn vào row thì không còn dấu vết nào của chuyện nó được bốc.
 */
export async function resolveAiModelForUnlock(): Promise<AiModel> {
  const selection = await getActiveAiSelection();
  return selection.kind === "random" ? pickRandomAiModel() : selection.model;
}

/**
 * Những biến API key mà *máy chủ này* đang thiếu, trong số model được hỏi.
 *
 * Thiếu key không làm gì lúc chọn model — nó chỉ nổ ở lượt mở khóa đầu tiên
 * sau đó, dưới dạng một lỗi người dùng đọc được và một credit hoàn lại. Chế độ
 * ngẫu nhiên làm chuyện đó khó thấy hơn hẳn: thiếu đúng một key thì *một nửa*
 * số lượt hỏng, nửa còn lại chạy ngon, và nhìn từ `/admin` thì trông như model
 * kia thỉnh thoảng chập chờn.
 *
 * Nên trang quản trị hỏi câu này trước, ngay lúc chọn. Chỉ trả về *tên biến*,
 * không bao giờ trả về giá trị.
 */
export function getMissingApiKeyEnvs(models: readonly AiModel[]): string[] {
  const missing = new Set<string>();
  for (const model of models) {
    const envVar = PROVIDER_API_KEY_ENV[model.provider];
    if (!process.env[envVar]) missing.add(envVar);
  }
  return [...missing];
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
