/**
 * PlatzDa-Schriftzug in den Marken-Farben, „Platz" grün, „Da" terrakotta.
 * Das Bild-Logo (Baum mit Sonne) kommt als echte Grafik dazu, sobald die
 * Datei im Projekt liegt, dann wird dieser Schriftzug dadurch ersetzt.
 */
export function Logo({ className = "" }: { className?: string }) {
  return (
    <span
      className={`font-display text-[22px] leading-none font-extrabold tracking-tight ${className}`}
    >
      <span className="text-primary-dark">Platz</span>
      <span className="text-warning">Da</span>
    </span>
  );
}
