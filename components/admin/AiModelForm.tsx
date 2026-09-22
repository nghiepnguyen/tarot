"use client";

import { useState, useTransition } from "react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { setAiModelAction } from "@/app/actions/admin";
import { RANDOM_AI_MODEL_VALUE } from "@/lib/ai/models";

export interface AiModelOption {
  id: string;
  label: string;
  note: string;
  /** Model có giá trong `lib/ai/pricing.ts` hay không. */
  priced: boolean;
  /**
   * Tên những biến API key mà máy chủ đang thiếu để chạy được lựa chọn này.
   * Chỉ tên biến, không bao giờ có giá trị — trang này vẫn là HTML gửi xuống
   * trình duyệt.
   */
  missingKeys: string[];
}

interface AiModelFormProps {
  currentId: string;
  options: readonly AiModelOption[];
}

export function AiModelForm({ currentId, options }: AiModelFormProps) {
  const [isPending, startTransition] = useTransition();
  const [modelId, setModelId] = useState(currentId);
  const { showToast } = useToast();

  const selected = options.find((option) => option.id === modelId);
  const changed = modelId !== currentId;

  // Đếm trên chính danh sách model, bỏ mục "Ngẫu nhiên" ra: câu người chọn cần
  // nghe là *bao nhiêu phần* số lượt sẽ hỏng, không phải một danh sách tên biến.
  const realModels = options.filter((option) => option.id !== RANDOM_AI_MODEL_VALUE);
  const modelCount = realModels.length;
  const withoutKey = realModels.filter((option) => option.missingKeys.length > 0).length;

  return (
    <form
      action={(formData) => {
        startTransition(async () => {
          const result = await setAiModelAction(formData);
          showToast(result.ok ? result.message : result.error);
        });
      }}
      className="flex flex-col gap-4"
    >
      <div className="flex flex-col gap-1.5">
        <label className="text-sm text-muted" htmlFor="modelId">
          Model mặc định
        </label>
        <select
          id="modelId"
          name="modelId"
          value={modelId}
          onChange={(event) => setModelId(event.target.value)}
          className="w-full rounded-full border border-border bg-surface px-5 py-3 text-base text-foreground focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent sm:text-sm"
        >
          {options.map((option) => (
            <option key={option.id} value={option.id}>
              {option.label}
              {option.id === currentId ? " — đang dùng" : ""}
            </option>
          ))}
        </select>
        {selected ? <p className="text-xs text-muted">{selected.note}</p> : null}
        {selected && selected.missingKeys.length > 0 ? (
          <p className="text-xs text-red-600">
            Máy chủ này chưa có {selected.missingKeys.join(", ")}.{" "}
            {selected.id === RANDOM_AI_MODEL_VALUE
              ? `Thiếu key nào thì lượt bốc trúng model đó báo lỗi và hoàn credit — hiện ${withoutKey}/${modelCount} model trong danh sách chưa gọi được.`
              : "Chọn model này nghĩa là mọi lượt mở khóa báo lỗi và hoàn credit cho tới khi key được đặt."}{" "}
            Đặt biến trên Vercel (Production) rồi deploy lại mới có hiệu lực.
          </p>
        ) : null}
        {selected && !selected.priced ? (
          <p className="text-xs text-accent">
            Model này chưa có giá trong lib/ai/pricing.ts. Chọn nó nghĩa là mọi con số tiền trên
            trang quản trị thành ước lượng.
          </p>
        ) : null}
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm text-muted" htmlFor="ai-model-reason">
          Lý do
        </label>
        <Input
          id="ai-model-reason"
          name="reason"
          maxLength={500}
          placeholder="Ghi cho người đọc nhật ký sáu tháng sau"
          required
        />
      </div>

      <Button type="submit" disabled={isPending || !changed} className="self-start">
        {isPending ? "Đang đổi..." : "Đổi model"}
      </Button>
    </form>
  );
}
