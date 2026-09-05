import { type HTMLAttributes } from "react";

export function Section({ className = "", ...props }: HTMLAttributes<HTMLElement>) {
  return (
    <section
      className={`mx-auto w-full max-w-5xl px-6 py-20 sm:px-8 ${className}`}
      {...props}
    />
  );
}
