import type { ReactNode } from "react";

/** Khối nội dung chuẩn của trang quản trị: viền, nền surface, tiêu đề nhỏ. */
export function Panel({
  title,
  note,
  children,
}: {
  title: string;
  note?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="flex flex-col gap-4 rounded-2xl border border-border bg-surface p-5">
      <div className="flex flex-col gap-1">
        <h2 className="text-base font-semibold tracking-tight text-foreground">{title}</h2>
        {note ? <p className="text-xs text-muted">{note}</p> : null}
      </div>
      {children}
    </section>
  );
}

export function Stat({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="flex flex-col gap-1 rounded-xl border border-border px-4 py-3">
      <span className="text-xs text-muted">{label}</span>
      <span className="text-xl font-semibold tabular-nums text-foreground">{value}</span>
      {hint ? <span className="text-xs text-muted">{hint}</span> : null}
    </div>
  );
}

export function EmptyRow({ children }: { children: string }) {
  return <p className="rounded-xl border border-border px-4 py-6 text-sm text-muted">{children}</p>;
}
