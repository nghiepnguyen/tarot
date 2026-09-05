import { type SVGProps } from "react";

/**
 * Hand-drawn line-art botanical marks for the Mystical Minimalism / Modern
 * Botanical visual language. Decorative only (aria-hidden) - functional
 * icons stay on lucide-react elsewhere in the app.
 */

export function LeafSprig(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 48 64"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <path d="M24 60C23 45 23 30 24 6" />
      <path d="M24 40C16 36 11 28 10 18C19 19 25 25 26 34" />
      <path d="M24 26C31 22 35 15 36 6C28 8 23 13 22 21" />
      <path d="M24 50C18 47 14 41 13 33C20 34 25 39 26 46" />
    </svg>
  );
}

export function GemOutline(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <path d="M12 16L24 6L36 16L42 22L24 42L6 22Z" />
      <path d="M6 22H42" />
      <path d="M17 16H31" />
      <path d="M24 6V16" />
      <path d="M12 16L24 42" />
      <path d="M36 16L24 42" />
    </svg>
  );
}
