import {
  Accessibility,
  Baby,
  Check,
  Droplet,
  Fence,
  Minus,
  Toilet,
  Umbrella,
  Waves,
  X,
} from "lucide-react";
import { formatDistance } from "@/lib/utils";
import type { Place, PlaceTags } from "@/types";

interface Eintrag {
  key: keyof PlaceTags;
  label: string;
  Icon: typeof Toilet;
}

const EINTRAEGE: Eintrag[] = [
  { key: "toilet", label: "Toilette", Icon: Toilet },
  { key: "water_play", label: "Wasser zum Planschen", Icon: Waves },
  { key: "changing_table", label: "Wickeltisch", Icon: Baby },
  { key: "fenced", label: "Eingezäunt", Icon: Fence },
  { key: "wheelchair", label: "Barrierefrei / Kinderwagen", Icon: Accessibility },
  { key: "drinking_water", label: "Trinkwasser", Icon: Droplet },
  { key: "shelter", label: "Überdachter Bereich", Icon: Umbrella },
];

/**
 * Auf der Detailseite zählt Ehrlichkeit mehr als Aufgeräumtheit: Was
 * OpenStreetMap nicht weiß, steht als „Keine Information“ da, nicht als
 * stillschweigendes Nein und nicht als Lücke, die man für ein Ja hält.
 */
export function AttributeList({ place }: { place: Place }) {
  return (
    <ul className="divide-y divide-line">
      {EINTRAEGE.map(({ key, label, Icon }) => {
        const wert = place.tags[key];
        const detail =
          key === "toilet" && wert === true && place.toiletDistance !== null
            ? place.toiletDistance > 25
              ? `${formatDistance(place.toiletDistance)} entfernt`
              : "direkt am Ort"
            : wert === true
              ? "Vorhanden"
              : wert === false
                ? "Nicht vorhanden"
                : "Keine Angabe";

        const Marke = wert === true ? Check : wert === false ? X : Minus;
        const farbe =
          wert === true
            ? "text-primary-dark"
            : wert === false
              ? "text-warning-ink"
              : "text-muted";

        return (
          <li key={key} className="flex min-h-14 items-center gap-3 py-3">
            <Icon
              size={20}
              strokeWidth={2}
              aria-hidden
              className={wert === true ? "text-dark" : "text-muted"}
            />
            <span className="min-w-0 flex-1 text-[15px] font-medium text-dark">
              {label}
            </span>
            <span
              className={`flex shrink-0 items-center gap-1.5 text-sm whitespace-nowrap ${farbe}`}
            >
              {detail}
              <Marke size={16} aria-hidden strokeWidth={2.5} />
            </span>
          </li>
        );
      })}
    </ul>
  );
}
