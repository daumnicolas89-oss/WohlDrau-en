import Link from "next/link";
import { AlertTriangle, ChevronRight, Sun } from "lucide-react";
import { formatDistance, haversine } from "@/lib/utils";
import { factChips, mainDriver, scoreWording, shadeWording, statusSentence } from "@/lib/wording";
import type { Place } from "@/types";
import { ScoreRing, TONE_TEXT } from "@/components/ui/ScoreRing";
import { ShadeMeter } from "./ShadeMeter";

/**
 * Die Reihenfolge folgt der Frage im Kopf: Wo ist das? Wie gut ist es dort
 * gerade? Warum? Und was muss ich sonst noch wissen? Alles darunter ist
 * bewusst leiser gesetzt – eine Karte, die überall gleich laut ruft, hilft
 * beim Überfliegen nicht.
 */
export function PlaceCard({
  place,
  origin,
  radius,
  rank,
  now,
}: {
  place: Place;
  origin: { lat: number; lng: number };
  /** Suchradius dieser Liste – die Detailseite nutzt dieselbe Abfrage. */
  radius: number;
  /** Platz in der Liste; der erste bekommt eine Auszeichnung. */
  rank: number;
  now: number;
}) {
  // Der Link trägt beides: den Standort des Nutzers (für die Entfernung) und
  // den des Ortes (damit die Detailseite gezielt dort nachladen kann).
  const href =
    `/ort/${place.id}?lat=${origin.lat.toFixed(5)}&lng=${origin.lng.toFixed(5)}` +
    `&plat=${place.lat.toFixed(5)}&plng=${place.lng.toFixed(5)}&r=${radius}`;

  const bewertung = scoreWording(place.pleasantScore);
  const grund = mainDriver(place);
  const meldung = statusSentence(place.lastStatuses, now);
  const chips = factChips(place);
  const beste = rank === 0;

  // Ab Platz 2 eine schlanke Zeile: ein klarer Favorit oben, darunter eine
  // ruhige, scanbare Liste – das bricht den „Einheitsbrei" ohne mehr Farbe.
  if (!beste) {
    const distance = haversine(origin.lat, origin.lng, place.lat, place.lng);
    return (
      <Link
        href={href}
        className="flex items-center gap-3.5 rounded-card bg-card p-4 shadow-card transition active:scale-[0.99]"
      >
        <ScoreRing
          score={place.pleasantScore}
          tone={bewertung.tone}
          size={46}
          label={`Angenehm jetzt: ${place.pleasantScore} von 100 – ${bewertung.label}`}
        />
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-display text-[16px] leading-tight font-semibold text-dark">
            {place.name}
          </h3>
          <p className="mt-1 truncate text-sm text-muted">
            {shadeWording(place.shade.state).label} · {formatDistance(distance)}
          </p>
        </div>
        <ChevronRight size={18} aria-hidden className="shrink-0 text-muted" />
      </Link>
    );
  }

  return (
    <Link
      href={href}
      className="group block overflow-hidden rounded-card bg-gradient-to-b from-[#fff6e4] to-card shadow-card ring-1 ring-[#eec97a]/60 transition active:scale-[0.99]"
    >
      {beste && (
        <p className="flex items-center gap-1.5 bg-accent-soft px-5 py-2 text-[11px] font-semibold tracking-[0.14em] text-accent-ink uppercase">
          <Sun size={13} aria-hidden />
          Beste Wahl gerade
        </p>
      )}

      <div className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <h3 className="font-display text-[19px] leading-snug font-semibold text-dark [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2] overflow-hidden">
              {place.name}
            </h3>
            <p
              className={`mt-1 text-[15px] leading-tight font-semibold ${TONE_TEXT[bewertung.tone]}`}
            >
              {bewertung.label}
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
          <ShadeMeter
            state={place.shade.state}
            shadeIndex={place.shade.index}
            estimateHint
          />
        </div>

        <p className="mt-3.5 text-[15px] leading-relaxed text-dark">{grund.text}</p>

        <ul className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
          {chips.map((chip, index) => (
            <li key={chip.text} className="flex items-center gap-2">
              {index > 0 && (
                <span aria-hidden className="text-line">
                  ·
                </span>
              )}
              <span className={chip.unknown ? "text-muted italic" : "text-muted"}>
                {chip.text}
              </span>
            </li>
          ))}
        </ul>

        {meldung && (
          <p
            className={`mt-4 flex items-start gap-1.5 border-t border-line pt-3.5 text-sm font-medium ${
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
          <p className="mt-4 flex items-start gap-1.5 border-t border-line pt-3.5 text-sm font-medium text-warning-ink">
            <AlertTriangle size={15} aria-hidden className="mt-0.5 shrink-0" />
            {place.warnings[0]}
          </p>
        )}

        <span
          aria-hidden
          className="mt-4 flex items-center justify-center gap-1 rounded-xl bg-primary-soft py-2.5 text-sm font-semibold text-primary-dark"
        >
          Details ansehen
          <ChevronRight
            size={16}
            className="transition-transform group-active:translate-x-0.5"
          />
        </span>
      </div>
    </Link>
  );
}
