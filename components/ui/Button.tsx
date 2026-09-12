import { type ButtonHTMLAttributes, forwardRef } from "react";

type Variant = "primary" | "secondary" | "ghost";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-accent text-accent-foreground border border-accent shadow-sm hover:opacity-95 hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 active:shadow-sm disabled:opacity-40 disabled:shadow-none disabled:hover:translate-y-0",
  secondary:
    "bg-transparent text-foreground border border-border hover:border-accent hover:text-accent disabled:opacity-40",
  ghost:
    "bg-transparent text-foreground border border-transparent hover:bg-sage-tint disabled:opacity-40",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", className = "", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={`inline-flex cursor-pointer items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-medium tracking-wide transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed ${variantClasses[variant]} ${className}`}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";
