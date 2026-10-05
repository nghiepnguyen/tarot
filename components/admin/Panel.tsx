import Link from "next/link";
import type { ReactNode } from "react";
import type { Tone } from "@/lib/admin/labels";

/**
 * Bộ khung chung của trang quản trị. Mục tiêu là đọc số nhanh và biết chắc
 * con số đến từ đâu: mỗi trang nói rõ phạm vi dữ liệu, mỗi bảng nói đang hiện
 * bao nhiêu trên tổng bao nhiêu.
 */

export function PageHeader({
  title,
  description,
  meta,
  actions,
}: {
  title: string;
  description?: ReactNode;
  /** Phạm vi dữ liệu: kỳ, bộ lọc, số dòng. Hiện ngay dưới tiêu đề. */
  meta?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="flex min-w-0 flex-col gap-1">
        <h1 className="text-xl font-semibold text-foreground">{title}</h1>
        {description ? <p className="max-w-3xl text-sm text-muted">{description}</p> : null}
        {meta ? <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted">{meta}</div> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}

export function Panel({
  title,
  note,
  actions,
  flush = false,
  children,
}: {
  title: string;
  note?: ReactNode;
  actions?: ReactNode;
  /** Bỏ padding thân khối, để bảng chạm sát viền. */
  flush?: boolean;
  children: ReactNode;
}) {
  return (
    <section className="flex flex-col overflow-hidden rounded-lg border border-border bg-surface">
      <div className="flex flex-wrap items-start justify-between gap-2 border-b border-border px-4 py-3">
        <div className="flex min-w-0 flex-col gap-0.5">
          <h2 className="text-sm font-semibold text-foreground">{title}</h2>
          {note ? <p className="max-w-3xl text-xs leading-relaxed text-muted">{note}</p> : null}
        </div>
        {actions ? <div className="flex items-center gap-2 text-xs">{actions}</div> : null}
      </div>
      <div className={flush ? "" : "flex flex-col gap-4 p-4"}>{children}</div>
    </section>
  );
}

export function Stat({
  label,
  value,
  hint,
  formula,
  tone,
  href,
}: {
  label: string;
  value: string;
  hint?: ReactNode;
  /** Cách tính, để người đọc không phải đoán con số này lấy gì chia gì. */
  formula?: string;
  tone?: Tone;
  href?: string;
}) {
  const body = (
    <>
      <span className="text-xs font-medium text-muted">{label}</span>
      <span className={`text-xl font-semibold tabular-nums sm:text-2xl ${tone ? TONE_TEXT[tone] : "text-foreground"}`}>
        {value}
      </span>
      {hint ? <span className="text-xs text-muted">{hint}</span> : null}
      {formula ? <span className="break-words font-mono text-[11px] leading-snug text-muted/80">= {formula}</span> : null}
    </>
  );
  const className = "flex min-w-0 flex-col gap-1 rounded-lg border border-border bg-surface px-3 py-3 sm:px-4";
  return href ? (
    <Link href={href} className={`${className} transition-colors duration-150 hover:border-accent`}>
      {body}
    </Link>
  ) : (
    <div className={className}>{body}</div>
  );
}

export function EmptyRow({ children }: { children: string }) {
  return (
    <p className="rounded-lg border border-dashed border-border bg-surface px-4 py-8 text-center text-sm text-muted">
      {children}
    </p>
  );
}

const TONE_BADGE: Record<Tone, string> = {
  neutral: "bg-zinc-100 text-zinc-700 ring-zinc-300 dark:bg-zinc-800 dark:text-zinc-300 dark:ring-zinc-700",
  success: "bg-emerald-50 text-emerald-800 ring-emerald-300 dark:bg-emerald-950 dark:text-emerald-300 dark:ring-emerald-800",
  warning: "bg-amber-50 text-amber-800 ring-amber-300 dark:bg-amber-950 dark:text-amber-300 dark:ring-amber-800",
  danger: "bg-red-50 text-red-800 ring-red-300 dark:bg-red-950 dark:text-red-300 dark:ring-red-800",
  info: "bg-blue-50 text-blue-800 ring-blue-300 dark:bg-blue-950 dark:text-blue-300 dark:ring-blue-800",
  violet: "bg-violet-50 text-violet-800 ring-violet-300 dark:bg-violet-950 dark:text-violet-300 dark:ring-violet-800",
};

const TONE_TEXT: Record<Tone, string> = {
  neutral: "text-foreground",
  success: "text-emerald-700 dark:text-emerald-400",
  warning: "text-amber-700 dark:text-amber-400",
  danger: "text-red-700 dark:text-red-400",
  info: "text-blue-700 dark:text-blue-400",
  violet: "text-violet-700 dark:text-violet-400",
};

export function Badge({ tone = "neutral", title, children }: { tone?: Tone; title?: string; children: ReactNode }) {
  return (
    <span
      title={title}
      className={`inline-flex items-center whitespace-nowrap rounded px-1.5 py-0.5 text-xs font-medium ring-1 ring-inset ${TONE_BADGE[tone]}`}
    >
      {children}
    </span>
  );
}

/** Số credit có dấu: cộng màu xanh, trừ màu đỏ, để quét cột là thấy chiều. */
export function SignedNumber({ value }: { value: number }) {
  if (value === 0) return <span className="tabular-nums text-muted">0</span>;
  return (
    <span className={`tabular-nums font-medium ${value > 0 ? TONE_TEXT.success : TONE_TEXT.danger}`}>
      {value > 0 ? `+${value.toLocaleString("vi-VN")}` : value.toLocaleString("vi-VN")}
    </span>
  );
}

/* ---------- Bảng ---------- */

export function DataTable({ children, minWidth = "min-w-3xl" }: { children: ReactNode; minWidth?: string }) {
  return (
    <div className="overflow-x-auto">
      <table className={`w-full ${minWidth} border-collapse text-sm`}>{children}</table>
    </div>
  );
}

export function Th({ children, align = "left", className = "" }: { children?: ReactNode; align?: "left" | "right"; className?: string }) {
  return (
    <th
      scope="col"
      className={`whitespace-nowrap border-b border-border bg-background px-3 py-2 text-xs font-semibold text-muted ${
        align === "right" ? "text-right" : "text-left"
      } ${className}`}
    >
      {children}
    </th>
  );
}

export function Td({ children, align = "left", className = "" }: { children?: ReactNode; align?: "left" | "right"; className?: string }) {
  return (
    <td className={`border-b border-border px-3 py-2 align-top ${align === "right" ? "text-right tabular-nums" : ""} ${className}`}>
      {children}
    </td>
  );
}

export function Tr({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <tr className={`transition-colors duration-150 hover:bg-background ${className}`}>{children}</tr>;
}

export function Mono({ children, title }: { children: ReactNode; title?: string }) {
  return (
    <span title={title} className="break-all font-mono text-xs text-muted">
      {children}
    </span>
  );
}

export function TextLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} className="text-accent underline-offset-2 hover:underline focus-visible:underline">
      {children}
    </Link>
  );
}

/* ---------- Lọc và phân trang ---------- */

export type QueryParams = Record<string, string | number | undefined>;

export function buildHref(path: string, params: QueryParams): string {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === "" || (key === "page" && Number(value) <= 1)) continue;
    query.set(key, String(value));
  }
  const qs = query.toString();
  return qs ? `${path}?${qs}` : path;
}

export function FilterTabs({
  label,
  options,
}: {
  label: string;
  options: { href: string; label: string; count?: number; active: boolean; title?: string }[];
}) {
  return (
    <nav aria-label={label} className="flex flex-wrap gap-1">
      {options.map((option) => (
        <Link
          key={option.href}
          href={option.href}
          title={option.title}
          aria-current={option.active ? "page" : undefined}
          className={`inline-flex min-h-9 items-center gap-1.5 rounded-md border px-3 text-sm transition-colors duration-150 ${
            option.active
              ? "border-accent bg-accent text-accent-foreground"
              : "border-border bg-surface text-foreground hover:border-accent"
          }`}
        >
          {option.label}
          {option.count !== undefined ? (
            <span className={`tabular-nums text-xs ${option.active ? "opacity-90" : "text-muted"}`}>
              {option.count.toLocaleString("vi-VN")}
            </span>
          ) : null}
        </Link>
      ))}
    </nav>
  );
}

/** Ô tìm kiếm GET thuần: URL giữ được bộ lọc, gửi link cho người khác là thấy đúng màn đó. */
export function SearchForm({
  action,
  name = "q",
  defaultValue,
  placeholder,
  hidden = {},
}: {
  action: string;
  name?: string;
  defaultValue: string;
  placeholder: string;
  hidden?: QueryParams;
}) {
  return (
    <form action={action} className="flex w-full max-w-md gap-2" role="search">
      {Object.entries(hidden).map(([key, value]) =>
        value === undefined ? null : <input key={key} type="hidden" name={key} value={String(value)} />,
      )}
      <input
        type="search"
        name={name}
        defaultValue={defaultValue}
        placeholder={placeholder}
        aria-label={placeholder}
        className="min-h-9 w-full rounded-md border border-border bg-surface px-3 text-base text-foreground placeholder:text-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent sm:text-sm"
      />
      <button
        type="submit"
        className="min-h-9 cursor-pointer rounded-md border border-border bg-surface px-3 text-sm text-foreground transition-colors duration-150 hover:border-accent"
      >
        Tìm
      </button>
      {defaultValue ? (
        <Link
          href={buildHref(action, hidden)}
          className="inline-flex min-h-9 items-center rounded-md px-2 text-sm text-muted hover:text-foreground"
        >
          Xoá
        </Link>
      ) : null}
    </form>
  );
}

export function Pagination({
  path,
  params,
  page,
  pageSize,
  total,
}: {
  path: string;
  params: QueryParams;
  page: number;
  pageSize: number;
  total: number;
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(total, page * pageSize);
  const linkClass =
    "inline-flex min-h-9 items-center rounded-md border border-border bg-surface px-3 text-sm text-foreground transition-colors duration-150 hover:border-accent";
  const disabledClass = "inline-flex min-h-9 items-center rounded-md border border-border px-3 text-sm text-muted opacity-50";

  return (
    <nav aria-label="Phân trang" className="flex flex-wrap items-center justify-between gap-2 border-t border-border px-3 py-2">
      <p className="text-xs text-muted">
        Dòng <span className="tabular-nums text-foreground">{from.toLocaleString("vi-VN")}–{to.toLocaleString("vi-VN")}</span>{" "}
        / <span className="tabular-nums text-foreground">{total.toLocaleString("vi-VN")}</span> · trang {page}/{totalPages}
      </p>
      <div className="flex gap-1">
        {page > 1 ? (
          <Link href={buildHref(path, { ...params, page: page - 1 })} className={linkClass}>
            ← Trước
          </Link>
        ) : (
          <span className={disabledClass}>← Trước</span>
        )}
        {page < totalPages ? (
          <Link href={buildHref(path, { ...params, page: page + 1 })} className={linkClass}>
            Sau →
          </Link>
        ) : (
          <span className={disabledClass}>Sau →</span>
        )}
      </div>
    </nav>
  );
}

export function parsePage(value: string | undefined): number {
  return Math.max(1, Math.floor(Number(value)) || 1);
}
