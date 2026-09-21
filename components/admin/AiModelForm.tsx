"use client";

import { useState, useTransition } from "react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { setAiModelAction } from "@/app/actions/admin";

export interface AiModelOption {
  id: string;
  label: string;
  note: string;
  /** Model có giá trong `lib/ai/pricing.ts` hay không. */
  priced: boolean;
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
