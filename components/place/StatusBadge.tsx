import { CloudSun, Moon, Sun, TreePine } from "lucide-react";
import { statusOption } from "@/lib/status";
import type { PlaceStatusType, ShadeState } from "@/types";

export type Tone = "good" | "medium" | "bad" | "neutral";

const TONE_STYLES: Record<Tone, string> = {
  good: "bg-primary-soft text-primary-dark",
  medium: "bg-accent-soft text-accent-ink",
  bad: "bg-warning-soft text-warning-ink",
  neutral: "bg-[#e8edef] text-dark",
};

export function StatusBadge({
  tone,
  children,
  size = "sm",
  icon,
}: {
  tone: Tone;
  children: React.ReactNode;
  size?: "sm" | "lg";
  icon?: React.ReactNode;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-semibold ${TONE_STYLES[tone]} ${
        size === "lg" ? "px-4 py-2 text-base" : "px-2.5 py-1 text-xs"
      }`}
    >
      {icon}
      {children}
    </span>
  );
}

interface ShadeVisual {
  label: string;
  tone: Tone;
  Icon: typeof Sun;
}

export const SHADE_VISUALS: Record<ShadeState, ShadeVisual> = {
  shady: { label: "Schattig", tone: "good", Icon: TreePine },
  partial: { label: "Teils Schatten", tone: "medium", Icon: CloudSun },
  sunny: { label: "Volle Sonne", tone: "bad", Icon: Sun },
  "no-sun": { label: "Keine direkte Sonne", tone: "neutral", Icon: Moon },
};

export function ShadeBadge({
  state,
  size = "sm",
}: {
  state: ShadeState;
  size?: "sm" | "lg";
}) {
  const visual = SHADE_VISUALS[state];
  const Icon = visual.Icon;
  return (
    <StatusBadge
      tone={visual.tone}
      size={size}
      icon={<Icon size={size === "lg" ? 20 : 14} strokeWidth={2.2} aria-hidden />}
    >
      {visual.label}
    </StatusBadge>
  );
}

/** Badge für eine Community-Meldung. */
export function ReportBadge({ type }: { type: PlaceStatusType }) {
  const option = statusOption(type);
  return (
    <StatusBadge tone={option.tone === "good" ? "good" : option.tone === "bad" ? "bad" : "neutral"}>
      {option.label}
    </StatusBadge>
  );
}
