import type { Tone } from "@/lib/wording";

/**
 * Kontraststarke Ring-Farben. Die weichen Markentöne sind als Flächen schön,
 * auf Weiß aber zu blass, draußen bei Sonne muss der Ring sofort lesbar sein.
 */
export const TONE_COLORS: Record<Tone, string> = {
  good: "#1e766c",
  medium: "#866a1e",
  bad: "#b4452a",
  neutral: "#264653",
};

export const TONE_TEXT: Record<Tone, string> = {
  good: "text-primary-dark",
  medium: "text-accent-ink",
  bad: "text-warning-ink",
  neutral: "text-dark",
};

/**
 * Der „Angenehm jetzt“-Wert als Ring: Der Füllgrad ist auf einen Blick
 * erfassbar, die Zahl liefert die Feinheit für alle, die es genau wollen.
 */
export function ScoreRing({
  score,
  tone,
  size = 56,
  label,
}: {
  score: number;
  tone: Tone;
  size?: number;
  /** Für Screenreader: „Angenehm jetzt: 78 von 100, besonders angenehm“ */
  label: string;
}) {
  const stroke = size >= 88 ? 8 : 6;
  const radius = (size - stroke) / 2;
  const umfang = 2 * Math.PI * radius;
  const gefuellt = (Math.max(0, Math.min(100, score)) / 100) * umfang;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      role="img"
      aria-label={label}
      className="shrink-0"
    >
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="#e5e9eb"
        strokeWidth={stroke}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={TONE_COLORS[tone]}
        strokeWidth={stroke}
        strokeDasharray={umfang}
        strokeDashoffset={umfang - gefuellt}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        className="ring-animate"
        style={
          {
            "--ring-umfang": umfang,
            animation: "ring-grow 0.9s ease-out",
          } as React.CSSProperties
        }
      />
      <text
        x="50%"
        y="50%"
        textAnchor="middle"
        dominantBaseline="central"
        fill={TONE_COLORS[tone]}
        fontSize={size >= 88 ? 30 : size * 0.36}
        fontWeight={700}
        fontFamily="var(--font-display), sans-serif"
      >
        {Math.round(score)}
      </text>
    </svg>
  );
}
