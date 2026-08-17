import Link from "next/link";
import { placeHref } from "@/lib/appMode";
import { AlertTriangle, ChevronRight, Star, Sun } from "lucide-react";
import { formatDistance, haversine } from "@/lib/utils";
import { factChips, mainDriver, scoreWording, shadeWording, statusSentence, bedeckt } from "@/lib/wording";
import type { Place } from "@/types";
import { ScoreRing, TONE_TEXT } from "@/components/ui/ScoreRing";
import { ShadeMeter } from "./ShadeMeter";
import { PlaceKindTag } from "./PlaceKindTag";

/** „Im Grünen, aber kaum Bäume getaggt": der echte Schatten kann höher sein als
 *  gezeigt. Dieser Ehrlichkeits-Hinweis gehört an jede betroffene Karte. */
const WENIG_BAEUME_HINT =
  "Wir kennen hier kaum Bäume – es kann schattiger sein, als wir zeigen.";
const ZUGANG_HINT = "Zugang evtl. eingeschränkt, z. B. Schulhof.";

/**
 * Die Reihenfolge folgt der Frage im Kopf: Wo ist das? Wie gut ist es dort
 * gerade? Warum? Und was muss ich sonst noch wissen? Alles darunter ist
 * bewusst leiser gesetzt, eine Karte, die überall gleich laut ruft, hilft
 * beim Überfliegen nicht.
 */
export function PlaceCard({
  place,
  origin,
  radius,
  rank,
  now,
  favorite = false,
  areaTreeHint = false,
  zeitLabel,
}: {
  place: Place;
  origin: { lat: number; lng: number };
  /** Suchradius dieser Liste, die Detailseite nutzt dieselbe Abfrage. */
  radius: number;
  /** Platz in der Liste; der erste bekommt eine Auszeichnung. */
  rank: number;
  now: number;
  /** Gemerkter Platz („Meine Plätze"): kleiner Stern am Namen. */
  favorite?: boolean;
  /**
   * Zeitvorschau der Liste („in 30 Min"/„in 1 Std"): Banner und
   * Schatten-Beschriftung wechseln die Zeitform, sonst behauptet die Karte
   * „gerade", während die Werte für später gerechnet sind.
   */
  zeitLabel?: string;
  /**
   * Für die ganze Gegend steht der Baum-Hinweis schon einmal über der Liste.
   * Dann wäre er auf jeder einzelnen Zeile nur Rauschen – zehnmal derselbe
   * Satz liest am Ende niemand mehr.
   */
  areaTreeHint?: boolean;
}) {
  // Der Link trägt beides: den Standort des Nutzers (für die Entfernung) und
  // den des Ortes (damit die Detailseite gezielt dort nachladen kann).
  const href = placeHref(
    place.id,
    `lat=${origin.lat.toFixed(5)}&lng=${origin.lng.toFixed(5)}` +
      `&plat=${place.lat.toFixed(5)}&plng=${place.lng.toFixed(5)}&r=${radius}` +
      // Der Wert, den die Liste gerade zeigt: Lädt die Detailseite frischeres
      // Wetter und rechnet spürbar anders, kann sie den Sprung ERKLÄREN,
      // statt wie ein Fehler auszusehen (56 in der Liste, 40 im Kopf).
      `&ls=${place.pleasantScore}`,
  );

  const bewertung = scoreWording(place.pleasantScore);
  const grund = mainDriver(place);
  const meldung = statusSentence(place.lastStatuses, now);
  const chips = factChips(place);
  const beste = rank === 0;
  const spaeter = zeitLabel !== undefined && zeitLabel !== "gerade";
  // Schnellstart: Der Ort ist echt, seine Bewertung noch nicht. Dann zeigt
  // die Zeile Name, Art und Entfernung – und sagt ehrlich, was noch rechnet.
  const vorlaeufig = place.preliminary === true;
  const wenigBaumdaten =
    place.shadeInputs.confidence === "low" && place.shadeInputs.inGreen;
  const eingeschraenkt = place.tags.restrictedAccess === true;

  // Ab Platz 2 eine schlanke Zeile: ein klarer Favorit oben, darunter eine
  // ruhige, scanbare Liste, das bricht den „Einheitsbrei" ohne mehr Farbe.
  if (!beste) {
    const distance = haversine(origin.lat, origin.lng, place.lat, place.lng);
    if (vorlaeufig) {
      return (
        <Link
          href={href}
          className="flex items-center gap-3.5 rounded-card bg-card p-4 shadow-card transition duration-200 active:scale-[0.98]"
        >
          <span
            aria-hidden
            className="flex size-[46px] shrink-0 items-center justify-center rounded-full border-2 border-line font-display text-lg text-muted"
          >
            …
          </span>
          <div className="min-w-0 flex-1">
            <h3 className="font-display text-[15px] leading-tight font-semibold text-dark">
              <span className="[display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2] overflow-hidden">
                {place.name}
              </span>
            </h3>
            <p className="mt-0.5 flex items-center gap-1.5 truncate text-sm text-muted">
              <PlaceKindTag kind={place.kind} iconSize={14} className="font-medium" />
              <span aria-hidden className="text-dark/30">·</span>
              {formatDistance(distance)}
            </p>
            <p className="mt-0.5 truncate text-xs text-muted italic">
              Schatten und Bewertung werden berechnet …
            </p>
          </div>
          <ChevronRight size={20} aria-hidden className="shrink-0 text-muted" />
        </Link>
      );
    }
    return (
      <Link
        href={href}
        className="flex items-center gap-3.5 rounded-card bg-card p-4 shadow-card transition duration-200 active:scale-[0.98]"
      >
        <ScoreRing
          score={place.pleasantScore}
          tone={bewertung.tone}
          size={46}
          label={`Angenehm jetzt: ${place.pleasantScore} von 100, ${bewertung.label}`}
        />
        <div className="min-w-0 flex-1">
          <h3 className="flex items-center gap-1.5 font-display text-[15px] leading-tight font-semibold text-dark">
            {favorite && (
              <Star
                size={14}
                aria-label="Gemerkter Platz"
                className="shrink-0 fill-accent text-accent"
              />
            )}
            <span className="[display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2] overflow-hidden">
              {place.name}
            </span>
          </h3>
          {/* Die Zahl im Ring allein sagt niemandem etwas. Das Wort davor
              beantwortet „ist 54 gut?" ohne Nachdenken. */}
          <p className="mt-0.5 truncate text-sm">
            <span className={`font-semibold ${TONE_TEXT[bewertung.tone]}`}>
              {bewertung.label}
            </span>
            <span className="text-muted"> · {formatDistance(distance)}</span>
          </p>
          <p className="mt-0.5 flex items-center gap-1.5 truncate text-xs text-muted">
            <PlaceKindTag kind={place.kind} iconSize={14} className="font-medium" />
            <span aria-hidden className="text-dark/25">·</span>
            {bedeckt(place.shade)
              ? spaeter
                ? "Dann bedeckt, kaum Sonne"
                : "Bedeckt, kaum direkte Sonne"
              : shadeWording(place.shade.state, place.shade.index, spaeter).label}
          </p>
          {wenigBaumdaten && !areaTreeHint && (
            <p className="mt-0.5 text-xs leading-snug text-muted">
              {WENIG_BAEUME_HINT}
            </p>
          )}
          {eingeschraenkt && (
            <p className="mt-0.5 text-xs leading-snug font-medium text-accent-ink">
              {ZUGANG_HINT}
            </p>
          )}
        </div>
        <ChevronRight size={20} aria-hidden className="shrink-0 text-muted" />
      </Link>
    );
  }

  return (
    <Link
      href={href}
      className="group block overflow-hidden rounded-card bg-gradient-to-b from-[#fff6e4] to-card shadow-card ring-1 ring-[#eec97a]/60 transition duration-200 active:scale-[0.98]"
    >
      {beste && (
        <p className="flex items-center gap-1.5 bg-accent-soft px-4 py-2 text-[11px] font-semibold tracking-[0.14em] text-accent-ink uppercase">
          <Sun size={14} aria-hidden />
          Beste Wahl {zeitLabel ?? "gerade"}
        </p>
      )}

      <div className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <h3 className="font-display text-lg leading-snug font-semibold text-dark [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2] overflow-hidden">
              {place.name}
            </h3>
            <PlaceKindTag
              kind={place.kind}
              className="mt-1 text-sm font-medium text-muted"
            />
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
            label={`Angenehm jetzt: ${place.pleasantScore} von 100, ${bewertung.label}`}
          />
        </div>

        <div className="mt-4">
          <ShadeMeter
            state={place.shade.state}
            shadeIndex={place.shade.index}
            estimateHint
            spaeter={spaeter}
            bedeckt={bedeckt(place.shade)}
          />
          {wenigBaumdaten && (
            <p className="mt-1.5 text-xs leading-relaxed text-muted">
              {WENIG_BAEUME_HINT}
            </p>
          )}
          {eingeschraenkt && (
            <p className="mt-1.5 text-xs leading-relaxed font-medium text-accent-ink">
              {ZUGANG_HINT}
            </p>
          )}
        </div>

        <p className="mt-3.5 text-[15px] leading-relaxed text-dark">{grund.text}</p>

        <ul className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
          {chips.map((chip, index) => (
            <li key={chip.text} className="flex items-center gap-2">
              {index > 0 && (
                <span aria-hidden className="text-dark/30">
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
              <AlertTriangle size={16} aria-hidden className="mt-0.5 shrink-0" />
            )}
            Andere Eltern haben {meldung.text}
          </p>
        )}

        {!meldung && place.warnings.length > 0 && (
          <p className="mt-4 flex items-start gap-1.5 border-t border-line pt-3.5 text-sm font-medium text-warning-ink">
            <AlertTriangle size={16} aria-hidden className="mt-0.5 shrink-0" />
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
