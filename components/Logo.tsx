/**
 * PlatzDa-Logo: ein schattenspendender Baum mit Sonne dahinter (das Versprechen
 * der App als Bild) und der Schriftzug in den Marken-Farben, „Platz" grün,
 * „Da" terrakotta. `LogoSymbol` ist separat nutzbar, etwa als App-Icon.
 */
export function LogoSymbol({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 40 40"
      className={className}
      role="img"
      aria-hidden="true"
      focusable="false"
    >
      {/* Sonne hinter der Krone: Strahlen, dann Scheibe. */}
      <g fill="none" stroke="#e9c46a" strokeWidth="1.9" strokeLinecap="round">
        <line x1="12" y1="4" x2="12" y2="1.5" />
        <line x1="6.3" y1="6.3" x2="4.6" y2="4.6" />
        <line x1="17.7" y1="6.3" x2="19.4" y2="4.6" />
        <line x1="4" y1="12" x2="1.5" y2="12" />
        <line x1="6.3" y1="17.7" x2="4.6" y2="19.4" />
      </g>
      <circle cx="12" cy="12" r="6" fill="#e9c46a" />

      {/* Baum: erst Stamm und Boden, dann die Krone darüber (deckt Sonne
          und Stammansatz natürlich ab). */}
      <g fill="#1e766c">
        <path d="M20.5 34 C21.5 33 22 29 22.6 24.5 L23.4 24.5 C24 29 24.5 33 25.5 34 C24 34.4 22 34.4 20.5 34 Z" />
        <ellipse cx="23" cy="34.6" rx="8.5" ry="1.5" />
        <circle cx="23" cy="17" r="9" />
        <circle cx="15.5" cy="19" r="6" />
        <circle cx="30.5" cy="19" r="6" />
        <circle cx="18.5" cy="12.5" r="5.5" />
        <circle cx="27.5" cy="12.5" r="5.5" />
        <circle cx="23" cy="10.5" r="5" />
      </g>
    </svg>
  );
}

export function Logo({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <LogoSymbol className="h-8 w-8 shrink-0" />
      <span className="font-display text-[22px] leading-none font-extrabold tracking-tight">
        <span className="text-primary-dark">Platz</span>
        <span className="text-warning">Da</span>
      </span>
    </span>
  );
}
