import { PROMPT_V1 } from "./v1";
import { PROMPT_V2 } from "./v2";
import type { PromptVersion } from "./types";

export type { PromptVersion } from "./types";

/**
 * Mọi bản prompt còn chạy được, mới nhất trước.
 *
 * Thêm một version nghĩa là thêm một file `vN.ts` rồi thêm vào danh sách này —
 * không sửa file cũ (xem `types.ts`). Id đã từng chạy mà bị gỡ khỏi đây thì
 * không biến mất khỏi database: `/admin/prompts` vẫn thống kê được nó, chỉ
 * đánh dấu là không còn trong registry.
 */
export const PROMPT_VERSIONS: readonly PromptVersion[] = [PROMPT_V2, PROMPT_V1];

/**
 * Bản đang chạy.
 *
 * Nằm trong code chứ không trong database: đổi prompt vẫn phải qua code review
 * và deploy, giống bộ bài. Chỗ này là nơi duy nhất cần sửa khi phát hành bản
 * mới hoặc khi phải lùi lại bản cũ gấp.
 */
export const ACTIVE_PROMPT_VERSION: PromptVersion = PROMPT_V2;

/** Id của version cho một row không ghi `promptVersion` — xem migration `add_prompt_version`. */
export const LEGACY_PROMPT_VERSION_ID = "v0-legacy";

export function getPromptVersion(id: string): PromptVersion | null {
  return PROMPT_VERSIONS.find((version) => version.id === id) ?? null;
}
