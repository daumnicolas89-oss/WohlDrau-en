"use client";

import { formatDistance } from "@/lib/utils";
import {
  useFilters,
  type ShadeRequirement,
  type TimeOffset,
} from "@/store/useFilters";
import { Button } from "@/components/ui/Button";
import { Sheet } from "@/components/ui/Sheet";

const SHADE_CHOICES: { value: ShadeRequirement; label: string }[] = [
  { value: "any", label: "Egal" },
  { value: "partial", label: "Mind. teils" },
  { value: "shady", label: "Nur schattig" },
];

const TIME_CHOICES: { value: TimeOffset; label: string }[] = [
  { value: 0, label: "Jetzt" },
  { value: 30, label: "In 30 Min" },
  { value: 60, label: "In 1 Std" },
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
              className={`min-h-11 flex-1 rounded-xl px-2 text-sm font-semibold transition ${
                active ? "bg-card text-dark shadow-card" : "text-muted active:bg-card/60"
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
  onChange,
}: {
  label: string;
  hint?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex min-h-14 cursor-pointer items-center justify-between gap-4 border-b border-line py-3 last:border-b-0">
      <span>
        <span className="block text-[15px] font-medium text-dark">{label}</span>
        {hint && <span className="block text-xs text-muted">{hint}</span>}
      </span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="peer sr-only"
      />
      <span
        aria-hidden
        className={`relative h-7 w-12 shrink-0 rounded-full transition peer-focus-visible:ring-2 peer-focus-visible:ring-primary peer-focus-visible:ring-offset-2 ${
          checked ? "bg-primary" : "bg-[#d4dade]"
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

export function FilterSheet({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const filters = useFilters();

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
            Orte anzeigen
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        <SegmentedControl
          label="Wann?"
          value={filters.timeOffsetMin}
          choices={TIME_CHOICES}
          onChange={(value) => filters.set("timeOffsetMin", value)}
        />

        <SegmentedControl
          label="Schatten"
          value={filters.shade}
          choices={SHADE_CHOICES}
          onChange={(value) => filters.set("shade", value)}
        />

        <SegmentedControl
          label="Höchstens entfernt"
          value={filters.maxDistanceM}
          choices={DISTANCES.map((d) => ({ value: d, label: formatDistance(d) }))}
          onChange={(value) => filters.set("maxDistanceM", value)}
        />

        <fieldset>
          <legend className="mb-2 text-sm font-semibold text-dark">Art</legend>
          <div className="flex gap-2">
            {(
              [
                { type: "playground", label: "Spielplätze" },
                { type: "park", label: "Grünflächen" },
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

        <div>
          <h3 className="mb-1 text-sm font-semibold text-dark">Muss vorhanden sein</h3>
          <ToggleRow
            label="Toilette"
            hint="Am Ort oder bis 150 m entfernt"
            checked={filters.requireToilet}
            onChange={(value) => filters.set("requireToilet", value)}
          />
          <ToggleRow
            label="Wickeltisch"
            hint="Selten in OpenStreetMap erfasst"
            checked={filters.requireChangingTable}
            onChange={(value) => filters.set("requireChangingTable", value)}
          />
          <ToggleRow
            label="Eingezäunt"
            checked={filters.requireFenced}
            onChange={(value) => filters.set("requireFenced", value)}
          />
          <ToggleRow
            label="Ohne Problemmeldungen"
            hint="Blendet Orte mit frischen Warnungen aus"
            checked={filters.hideReportedProblems}
            onChange={(value) => filters.set("hideReportedProblems", value)}
          />
        </div>

        {(filters.requireChangingTable || filters.requireToilet) && (
          <p className="rounded-2xl bg-background p-3 text-xs leading-relaxed text-muted">
            Die Ausstattung stammt aus OpenStreetMap und ist oft unvollständig.
            Strenge Filter blenden auch Orte aus, die schlicht nicht erfasst sind.
          </p>
        )}
      </div>
    </Sheet>
  );
}
