import { LeafSprig } from "@/components/ui/Botanical";

export function Header() {
  return (
    <header className="border-b border-border">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-6 sm:px-8">
        <span className="flex items-center gap-2 text-base font-medium tracking-[0.08em] text-foreground">
          <LeafSprig className="h-5 w-5 text-accent" />
          Tarot
        </span>
        <span className="text-xs text-muted">
          Chiêm nghiệm &amp; tự phản tỉnh
        </span>
      </div>
    </header>
  );
}
