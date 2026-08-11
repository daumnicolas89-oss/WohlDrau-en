import Link from "next/link";
import { AlertTriangle, Baby, ChevronRight, Droplet, Fence, Toilet } from "lucide-react";
import { distanceSentence, scoreWording, statusSentence } from "@/lib/wording";
import type { Place } from "@/types";
import { ScoreRing, TONE_TEXT } from "@/components/ui/ScoreRing";
import { ShadeMeter } from "./ShadeMeter";

const AUSSTATTUNG = [
  { key: "toilet", label: "Toilette", Icon: Toilet },
  { key: "changing_table", label: "Wickeltisch", Icon: Baby },
  { key: "fenced", label: "Eingezäunt", Icon: Fence },
  { key: "drinking_water", label: "Wasser", Icon: Droplet },
] as const;

/**
 * Die Reihenfolge folgt der Frage im Kopf: Wo ist das? Ist es dort gerade
 * gut? Warum? Was muss ich noch wissen?
 */
export function PlaceCard({
  place,
  origin,
  radius,
  highlight = false,
  now,
}: {
  place: Place;
  origin: { lat: number; lng: number };
  /** Suchradius dieser Liste – die Detailseite nutzt dieselbe Abfrage. */
  radius: number;
  highlight?: boolean;
  now: number;
}) {
  // Der Link trägt beides: den Standort des Nutzers (für die Entfernung) und
  // den des Ortes (damit die Detailseite gezielt dort nachladen kann).
  const href =
    `/ort/${place.id}?lat=${origin.lat.toFixed(5)}&lng=${origin.lng.toFixed(5)}` +
    `&plat=${place.lat.toFixed(5)}&plng=${place.lng.toFixed(5)}&r=${radius}`;

  const bewertung = scoreWording(place.pleasantScore);
  const meldung = statusSentence(place.lastStatuses, now);
  const vorhanden = AUSSTATTUNG.filter((eintrag) => place.tags[eintrag.key] === true);

  return (
    <Link
      href={href}
      className={`block rounded-card bg-card p-4 shadow-card transition active:scale-[0.99] ${
        highlight ? "ring-2 ring-primary/40" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-display text-[18px] leading-tight font-semibold text-dark">
            {place.name}
          </h3>
          <p className={`mt-1 text-[15px] font-semibold ${TONE_TEXT[bewertung.tone]}`}>
            {bewertung.label}
          </p>
          <p className="mt-0.5 text-sm text-muted">
            {distanceSentence(place.distance ?? 0)}
          </p>
        </div>

        <ScoreRing
          score={place.pleasantScore}
          tone={bewertung.tone}
          size={60}
          label={`Angenehm jetzt: ${place.pleasantScore} von 100 – ${bewertung.label}`}
        />
      </div>

      <div className="mt-4">
        <ShadeMeter state={place.shade.state} shadeIndex={place.shade.index} />
      </div>

      {vorhanden.length > 0 && (
        <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
          {vorhanden.map(({ key, label, Icon }) => (
            <li key={key} className="flex items-center gap-1.5 text-sm text-dark">
              <Icon size={15} strokeWidth={2} aria-hidden className="text-muted" />
              {label}
            </li>
          ))}
        </ul>
      )}

      {meldung && (
        <p
          className={`mt-3 flex items-start gap-1.5 text-sm font-medium ${
            meldung.tone === "bad" ? "text-warning-ink" : "text-primary-dark"
          }`}
        >
          {meldung.tone === "bad" && (
            <AlertTriangle size={15} aria-hidden className="mt-0.5 shrink-0" />
          )}
          Andere Eltern haben {meldung.text}
        </p>
      )}

      {!meldung && place.warnings.length > 0 && (
        <p className="mt-3 flex items-start gap-1.5 text-sm font-medium text-warning-ink">
          <AlertTriangle size={15} aria-hidden className="mt-0.5 shrink-0" />
          {place.warnings[0]}
        </p>
      )}

      <span className="mt-3 flex items-center justify-end gap-0.5 text-sm font-semibold text-primary-dark">
        Mehr dazu
        <ChevronRight size={16} aria-hidden />
      </span>
    </Link>
  );
}
