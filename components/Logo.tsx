/**
 * Das PlatzDa-Logo als echte Grafik (Baum mit Sonne plus Schriftzug). Liegt
 * unter public/ und wird oben im Wetter-Kopf gezeigt. Höhe über className
 * steuerbar, Breite passt sich automatisch an.
 */
export function Logo({ className = "" }: { className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/platzda-logo.png"
      width={720}
      height={209}
      alt="PlatzDa"
      className={`h-11 w-auto ${className}`}
    />
  );
}
