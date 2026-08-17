import type { LucideIcon } from "lucide-react";

/**
 * Ein Kasten für alles, was die App dem Nutzer nebenbei sagen will.
 *
 * Vorher gab es ihn zehnmal in eigener Bauart: zwei Rundungen, zwei
 * Schriftgrößen, drei Polsterungen, mit und ohne Rahmen, mit und ohne Icon –
 * für dieselbe Aussage.
 *
 * Schlimmer war die Farbe: Amber trug drei unvereinbare Bedeutungen. Es hieß
 * „mittelmäßig" (Bewertungsstufe), „Achtung" (Hitze, Glätte, Regen) und
 * „übrigens" (offline, keine frischen Daten, Standort nicht freigegeben).
 * Zehn von siebzehn Amber-Flächen waren reine Information. „Du bist offline"
 * sprach damit dieselbe Sprache wie „Bei dieser Hitze bitte Schatten suchen".
 *
 * Deshalb zwei Töne, und nur zwei:
 * - `info`: ruhiges Grau. Etwas ist anders, aber niemand muss handeln.
 * - `warnung`: Amber. Es betrifft das Kind draußen.
 */
export function Hinweis({
  ton = "info",
  Icon,
  children,
  aufHimmel = false,
  className = "",
}: {
  ton?: "info" | "warnung";
  Icon?: LucideIcon;
  children: React.ReactNode;
  /**
   * Im Wetterkopf liegt der Kasten auf einem Farbverlauf. Eine graue Fläche
   * sähe dort wie ein Fremdkörper aus, deshalb dort durchscheinendes Weiß –
   * das trägt den Text in allen fünf Wetterlagen über 4,5:1.
   */
  aufHimmel?: boolean;
  className?: string;
}) {
  const flaeche =
    ton === "warnung"
      ? "border-accent/50 bg-accent-soft text-accent-ink"
      : aufHimmel
        ? "border-white/70 bg-white/85 text-dark backdrop-blur"
        : "border-transparent bg-info-soft text-dark";

  return (
    <p
      className={`flex items-start gap-2 rounded-2xl border p-3 text-xs leading-relaxed ${flaeche} ${className}`}
    >
      {Icon && <Icon size={16} aria-hidden className="mt-0.5 shrink-0" />}
      <span>{children}</span>
    </p>
  );
}
