import type { LucideIcon } from "lucide-react";

/**
 * Ein Leerzustand ist kein Fehler, sondern eine Antwort. Deshalb bekommt er
 * dieselbe Sorgfalt wie eine gefüllte Karte: ein ruhiges Symbol, eine klare
 * Aussage, ein Satz, der weiterhilft – und, wo möglich, den nächsten Schritt.
 */
export function EmptyState({
  Icon,
  titel,
  text,
  children,
  className = "",
}: {
  Icon: LucideIcon;
  titel: string;
  text: string;
  /** Optionaler nächster Schritt (Knopf). */
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`px-6 py-8 text-center ${className}`}>
      <span
        aria-hidden
        className="mx-auto flex size-14 items-center justify-center rounded-full bg-primary-soft text-primary-dark"
      >
        <Icon size={24} strokeWidth={1.8} />
      </span>
      <p className="mt-4 font-display text-lg font-semibold text-balance text-dark">
        {titel}
      </p>
      <p className="mx-auto mt-2 max-w-xs text-[15px] leading-relaxed text-muted">
        {text}
      </p>
      {children && <div className="mt-5 flex justify-center">{children}</div>}
    </div>
  );
}
