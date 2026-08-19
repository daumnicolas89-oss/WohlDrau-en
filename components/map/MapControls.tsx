"use client";

import { List, MapPin } from "lucide-react";
import { TIME_CHOICES, useFilters } from "@/store/useFilters";
import { tick } from "@/lib/native";

/**
 * Die zwei Entscheidungen, die im Alltag ständig fallen: „wann?“ und
 * „Liste oder Karte?“, deshalb dauerhaft sichtbar statt im Filter versteckt.
 * Neu laden wohnt jetzt in der Ortszeile des Kopfes – vorher standen hier
 * drei gleich laute weiße Kacheln nebeneinander und der Zeit-Umschalter
 * ging zwischen seinen Werkzeugen unter.
 */
export function MapControls({
  kontext = null,
}: {
  /** „Orte in deiner Nähe · 26°" – erscheint, sobald der Wetterkopf aus dem
   *  Bild gescrollt ist (Apple-Muster: großer Kopf → kompakte Leiste).
   *  Als hängende Pille UNTER der Leiste, damit die Leistenhöhe konstant
   *  bleibt und beim Ein-/Ausblenden nichts springt. */
  kontext?: string | null;
}) {
  const filters = useFilters();

  return (
    <div className="sticky top-[env(safe-area-inset-top)] z-[900] flex items-center gap-2 bg-background/80 px-4 py-2.5 backdrop-blur-md">
      {/* Gleiche Bauart wie die Umschalter in Filter- und Anzieh-Fenster:
          heller Einleger, aktive Wahl als weiße Karte mit Schatten. */}
      <div className="flex flex-1 gap-1 rounded-2xl border border-line bg-background p-1">
        {TIME_CHOICES.map((choice) => {
          const active = filters.timeOffsetMin === choice.value;
          return (
            <button
              key={choice.value}
              type="button"
              aria-pressed={active}
              onClick={() => {
                tick();
                filters.set("timeOffsetMin", choice.value);
              }}
              className={`min-h-11 flex-1 rounded-xl text-sm font-semibold whitespace-nowrap transition max-[359px]:text-[13px] ${
                active
                  ? "bg-card text-dark shadow-card ring-1 ring-primary-dark/45"
                  : "text-muted active:bg-card/60"
              }`}
            >
              {choice.label}
            </button>
          );
        })}
      </div>
      {/* Still statt Kachel: Der Umschalter ist das eine Steuerelement der
          Zeile, das Werkzeug daneben ordnet sich unter. */}
      <button
        type="button"
        onClick={() => filters.setViewMode(filters.viewMode === "list" ? "map" : "list")}
        aria-label={filters.viewMode === "list" ? "Karte anzeigen" : "Liste anzeigen"}
        className="flex size-11 items-center justify-center rounded-2xl text-dark/70 transition duration-200 active:scale-95 active:bg-card/70"
      >
        {filters.viewMode === "list" ? <MapPin size={20} /> : <List size={20} />}
      </button>

      <div
        aria-hidden={kontext === null}
        className={`pointer-events-none absolute inset-x-0 top-full flex justify-center transition-opacity duration-200 ${
          kontext ? "opacity-100" : "opacity-0"
        }`}
      >
        <span className="max-w-[85%] truncate rounded-b-xl bg-background/85 px-3.5 py-1 text-xs font-medium text-muted shadow-card backdrop-blur">
          {kontext ?? " "}
        </span>
      </div>
    </div>
  );
}
