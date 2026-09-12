import { type InputHTMLAttributes, type TextareaHTMLAttributes, forwardRef } from "react";

// 16px on phones is not a style choice: iOS Safari zooms the page in when a
// focused field is smaller, leaving the user scrolled sideways on a form they
// have to pinch back out of. Both controls stay at 16px below the sm break.

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className = "", ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={`w-full rounded-full border border-border bg-surface px-5 py-3 text-base text-foreground placeholder:text-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent sm:text-sm ${className}`}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className = "", ...props }, ref) => {
  return (
    <textarea
      ref={ref}
      className={`w-full resize-none rounded-2xl border border-border bg-surface px-5 py-4 text-base leading-relaxed text-foreground placeholder:text-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent ${className}`}
      {...props}
    />
  );
});
Textarea.displayName = "Textarea";
