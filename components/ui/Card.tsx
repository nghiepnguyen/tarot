import { type HTMLAttributes } from "react";

export function Card({ className = "", ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`rounded-2xl border border-border bg-surface p-8 shadow-[0_8px_24px_-16px_rgba(51,41,31,0.25)] ${className}`}
      {...props}
    />
  );
}
