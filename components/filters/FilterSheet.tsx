"use client";

import { formatDistance } from "@/lib/utils";
import { TIME_CHOICES, useFilters, type ShadeRequirement } from "@/store/useFilters";
import { AGES, ALTERS_WUENSCHE, useKind } from "@/store/useKind";
import { Button } from "@/components/ui/Button";
import { Sheet } from "@/components/ui/Sheet";

const SHADE_CHOICES: { value: ShadeRequirement; label: string }[] = [
  // Die Frage steht in der Überschrift, die Antworten dürfen kurz sein und
  // passen so ohne Umbruch in eine Zeile.
  { value: "any", label: "Egal" },
  { value: "partial", label: "Etwas" },
  { value: "shady", label: "Viel" },
];

const DISTANCES = [1000, 1500, 2000, 2500];

function SegmentedControl<T extends string | number>({
  label,
  value,
  choices,
  onChange,
}: {
  label: string;
  value: T;
  choices: { value: T; label: string }[];
  onChange: (value: T) => void;
}) {
  return (
    <fieldset>
      <legend className="mb-2 text-sm font-semibold text-dark">{label}</legend>
      <div className="flex gap-1 rounded-2xl bg-background p-1">
        {choices.map((choice) => {
          const active = choice.value === value;
          return (
            <button
              key={String(choice.value)}
              type="button"
              aria-pressed={active}
              onClick={() => onChange(choice.value)}
              className={`min-h-11 flex-1 rounded-xl px-2 text-sm font-semibold whitespace-nowrap transition max-[359px]:text-[13px] ${
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
    </fieldset>
  );
}

function ToggleRow({
  label,
  hint,
  checked,
  match,
  onChange,
}: {
  label: string;
  hint?: string;
  checked: boolean;
  /** Wie viele Orte im Umkreis erfüllen das Kriterium, und wie viele gibt es. */
  match?: { hits: number; total: number };
  onChange: (checked: boolean) => void;
}) {
  const scarce = match && match.total > 0 && match.hits / match.total < 0.1;
  // Bei null Treffern würde der Schalter exakt nichts bewirken – dann soll
  // er es auch nicht versprechen. Die Zeile bleibt sichtbar (ehrlich: „nur
  // 0 von 95 erfasst"), nur der Schalter ist aus dem Spiel.
  const wirkungslos = match !== undefined && match.total > 0 && match.hits === 0;
  return (
    <label
      className={`flex min-h-14 items-center justify-between gap-4 border-b border-line py-3 last:border-b-0 ${
        wirkungslos ? "cursor-default opacity-50" : "cursor-pointer"
      }`}
    >
      <span>
        <span className="block text-[15px] font-medium text-dark">
          {label}
          {match && (
            <span
              className={`ml-2 text-xs font-normal ${scarce ? "text-warning-ink" : "text-muted"}`}
            >
              {scarce ? "nur " : ""}
              {match.hits} von {match.total} erfasst
            </span>
          )}
        </span>
        {hint && <span className="block text-xs text-muted">{hint}</span>}
      </span>
      <input
        type="checkbox"
        checked={checked}
        // Nur das EINSCHALTEN ist bei 0 Treffern gesperrt – ein bereits
        // aktiver Schalter muss immer abschaltbar bleiben, sonst hängt er
        // eingeschaltet-ausgegraut fest.
        disabled={wirkungslos && !checked}
        onChange={(event) => onChange(event.target.checked)}
        className="peer sr-only"
      />
      <span
        aria-hidden
        className={`relative h-7 w-12 shrink-0 rounded-full transition peer-focus-visible:ring-2 peer-focus-visible:ring-primary peer-focus-visible:ring-offset-2 ${
          checked ? "bg-primary" : "bg-switch-off"
        }`}
      >
        <span
          className={`absolute top-0.5 size-6 rounded-full bg-card shadow transition-all ${
            checked ? "left-[1.375rem]" : "left-0.5"
          }`}
        />
      </span>
    </label>
  );
}

export interface MatchCounts {
  total: number;
  toilet: number;
  changingTable: number;
  fenced: number;
  water: number;
  wheelchair: number;
}

export function FilterSheet({
  open,
  counts,
  onClose,
}: {
  open: boolean;
  counts: MatchCounts;
  onClose: () => void;
}) {
  const filters = useFilters();
  const kindAlter = useKind((k) => k.age);
  const setKindAlter = useKind((k) => k.setAge);

  // Vorschlag nur zeigen, solange er etwas ändern würde – und nur für
  // Wünsche, die in DIESER Gegend überhaupt Treffer haben. Sonst schaltet
  // er einen wirkungslosen (und deshalb gesperrten) Schalter ein, der
  // eingeschaltet-ausgegraut festhängt.
  const trefferFuer: Record<(typeof ALTERS_WUENSCHE)["baby"]["keys"][number], number> = {
    preferToilet: counts.toilet,
    preferChangingTable: counts.changingTable,
    preferFenced: counts.fenced,
    preferWater: counts.water,
  };
  const empfehlung = ALTERS_WUENSCHE[kindAlter];
  const fehlende = empfehlung.keys.filter(
    (k) => !filters[k] && trefferFuer[k] > 0,
  );
  const vorschlag = fehlende.length > 0 ? empfehlung : null;
  const vorschlagAnnehmen = () => {
    for (const key of fehlende) filters.set(key, true);
  };

  return (
    <Sheet
      open={open}
      title="Filter"
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
      footer={
        <div className="flex gap-3 pb-1">
          <Button variant="secondary" onClick={filters.reset} className="flex-1">
            Zurücksetzen
          </Button>
          <Button onClick={onClose} className="flex-[2]">
            Plätze anzeigen
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        <SegmentedControl
          label="Wann willst du los?"
          value={filters.timeOffsetMin}
          choices={TIME_CHOICES}
          onChange={(value) => filters.set("timeOffsetMin", value)}
        />

        <SegmentedControl
          label="Wie viel Schatten soll es geben?"
          value={filters.shade}
          choices={SHADE_CHOICES}
          onChange={(value) => filters.set("shade", value)}
        />

        <SegmentedControl
          label="Wie weit darf es sein?"
          value={filters.maxDistanceM}
          choices={DISTANCES.map((d) => ({ value: d, label: formatDistance(d) }))}
          onChange={(value) => filters.set("maxDistanceM", value)}
        />

        <fieldset>
          <legend className="mb-2 text-sm font-semibold text-dark">Was suchst du?</legend>
          <div className="flex gap-2">
            {(
              [
                { type: "playground", label: "Spielplätze" },
                { type: "park", label: "Parks & Grün" },
              ] as const
            ).map(({ type, label }) => {
              const active = filters.types.includes(type);
              return (
                <button
                  key={type}
                  type="button"
                  aria-pressed={active}
                  onClick={() => filters.toggleType(type)}
                  className={`min-h-11 flex-1 rounded-2xl border px-3 text-sm font-semibold transition ${
                    active
                      ? "border-primary bg-primary-soft text-primary-dark"
                      : "border-line text-muted"
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </fieldset>

        <fieldset>
          <legend className="mb-1 text-sm font-semibold text-dark">Für wen suchst du?</legend>
          <p className="mb-2 text-xs leading-relaxed text-muted">
            Einmal einstellen, gilt überall – auch beim Anziehen. Bleibt auf
            deinem Gerät.
          </p>
          <div className="flex gap-1 rounded-2xl bg-background p-1">
            {AGES.map(({ key, label, sub }) => {
              const active = kindAlter === key;
              return (
                <button
                  key={key}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setKindAlter(key)}
                  className={`min-h-11 flex-1 rounded-xl px-1 text-center transition ${
                    active
                      ? "bg-card shadow-card ring-1 ring-primary-dark/45"
                      : "active:bg-card/60"
                  }`}
                >
                  <span className={`block text-sm font-semibold ${active ? "text-dark" : "text-muted"}`}>
                    {label}
                  </span>
                  <span className="block text-[11px] text-muted">{sub}</span>
                </button>
              );
            })}
          </div>
          {vorschlag && (
            <div className="mt-2 rounded-2xl bg-primary-soft px-3.5 py-3 text-sm leading-relaxed text-primary-dark">
              {vorschlag.label}{" "}
              <button
                type="button"
                onClick={vorschlagAnnehmen}
                className="font-semibold underline underline-offset-2"
              >
                Nach oben sortieren
              </button>
            </div>
          )}
        </fieldset>

        <div>
          <h3 className="text-sm font-semibold text-dark">Wichtig für mich</h3>
          <p className="mb-1 text-xs leading-relaxed text-muted">
            Solche Plätze rutschen in der Liste nach oben. Diese Wünsche blenden nichts aus.
          </p>
          <ToggleRow
            label="Toilette"
            hint="Am Ort oder bis 150 Meter entfernt"
            checked={filters.preferToilet}
            match={{ hits: counts.toilet, total: counts.total }}
            onChange={(value) => filters.set("preferToilet", value)}
          />
          <ToggleRow
            label="Planschwasser"
            hint="Matschanlage oder Wasserspielplatz"
            checked={filters.preferWater}
            match={{ hits: counts.water, total: counts.total }}
            onChange={(value) => filters.set("preferWater", value)}
          />
          <ToggleRow
            label="Wickeltisch"
            checked={filters.preferChangingTable}
            match={{ hits: counts.changingTable, total: counts.total }}
            onChange={(value) => filters.set("preferChangingTable", value)}
          />
          <ToggleRow
            label="Eingezäunt"
            checked={filters.preferFenced}
            match={{ hits: counts.fenced, total: counts.total }}
            onChange={(value) => filters.set("preferFenced", value)}
          />
          <ToggleRow
            label="Barrierefrei / Kinderwagen"
            checked={filters.preferWheelchair}
            match={{ hits: counts.wheelchair, total: counts.total }}
            onChange={(value) => filters.set("preferWheelchair", value)}
          />
        </div>

        {/* Eigene Gruppe: dieser Schalter blendet wirklich aus und stand
            vorher direkt unter dem Satz „Ausgeblendet wird nichts". */}
        <div>
          <h3 className="text-sm font-semibold text-dark">Ausblenden</h3>
          <p className="mb-1 text-xs leading-relaxed text-muted">
            Diese Plätze tauchen in der Liste dann gar nicht mehr auf.
          </p>
          <ToggleRow
            label="Plätze mit Warnungen"
            hint="Zum Beispiel „zu sonnig“ oder „sehr voll“, von Eltern gemeldet"
            checked={filters.hideReportedProblems}
            onChange={(value) => filters.set("hideReportedProblems", value)}
          />
        </div>

        <p className="rounded-2xl bg-background p-3 text-xs leading-relaxed text-muted">
          Die Angaben stammen aus OpenStreetMap, das Freiwillige pflegen. Vieles
          ist dort nicht eingetragen, Zäune besonders selten. Deshalb sortieren
          die Wünsche unter „Wichtig für mich“ die Plätze nur nach oben, statt welche
          auszublenden.
        </p>
      </div>
    </Sheet>
  );
}
