"use client";

import { Hinweis } from "./ui/Hinweis";
import { AGES, useKind } from "@/store/useKind";
import {
  clothingAdvice,
  outfitFor,
  type OutfitItem,
  type WarmthSensitivity,
} from "@/lib/outdoorTips";
import { Sheet } from "@/components/ui/Sheet";

interface OutfitParams {
  apparentTemperature: number;
  uvIndex: number;
  precipitationProbability: number;
  windSpeed: number;
}

const SENSITIVITIES: { key: WarmthSensitivity; label: string }[] = [
  { key: "chilly", label: "Friert leicht" },
  { key: "neutral", label: "Normal" },
  { key: "warm", label: "Schwitzt leicht" },
];


function ItemGrid({ items }: { items: OutfitItem[] }) {
  return (
    // Flex statt festem 3er-Raster: 1–2 Teile werden zentriert, nicht links
    // gedrängt mit leerer Spalte; ab 3 füllt es die Reihe, danach umbrechen.
    <div className="flex flex-wrap justify-center gap-2.5">
      {items.map((it) => (
        <div
          key={it.label}
          className="flex w-[calc((100%-1.25rem)/3)] flex-col items-center gap-1.5 rounded-2xl border border-line bg-background p-3 text-center"
        >
          <span className="text-[26px] leading-none" aria-hidden>
            {it.icon}
          </span>
          <span className="text-xs leading-tight font-medium text-dark">
            {it.label}
          </span>
        </div>
      ))}
    </div>
  );
}

/** Ein Segment-Umschalter (Pillen), einheitlich für Alter und Wärmeempfinden. */
function Segmented<T extends string>({
  options,
  value,
  onChange,
  columns,
  render,
}: {
  options: { key: T; label: string; sub?: string }[];
  value: T;
  onChange: (v: T) => void;
  columns: string;
  render?: (o: { key: T; label: string; sub?: string }, active: boolean) => React.ReactNode;
}) {
  return (
    <div className={`grid ${columns} gap-1 rounded-2xl bg-background p-1`}>
      {options.map((o) => {
        const active = o.key === value;
        return (
          <button
            key={o.key}
            type="button"
            onClick={() => onChange(o.key)}
            aria-pressed={active}
            className={`flex min-h-[44px] flex-col items-center justify-center rounded-xl px-1 py-2 transition ${
              active
                ? "bg-card shadow-card ring-1 ring-primary-dark/45"
                : "hover:bg-card/50"
            }`}
          >
            {render ? (
              render(o, active)
            ) : (
              <span
                className={`text-[13px] font-semibold ${active ? "text-dark" : "text-muted"}`}
              >
                {o.label}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export function OutfitSheet({
  open,
  onClose,
  params,
}: {
  open: boolean;
  onClose: () => void;
  params: OutfitParams;
}) {
  // Ein Kind, ein Profil: Alter und Empfinden kommen aus dem geteilten
  // Kind-Profil – dieselben Werte steuern auch die Wünsche im Filter.
  const age = useKind((k) => k.age);
  const sensitivity = useKind((k) => k.sensitivity);
  const setAge = useKind((k) => k.setAge);
  const setSensitivity = useKind((k) => k.setSensitivity);

  const outfit = outfitFor(params, age, sensitivity);
  const summary = clothingAdvice(params, age, sensitivity);

  return (
    <Sheet
      open={open}
      title="Was anziehen?"
      description={summary}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
    >
      <div className="space-y-5">
        {/* Alter – ein Baby braucht andere Sachen als ein Schulkind. */}
        <div>
          <h3 className="mb-2 text-xs font-semibold tracking-wide text-muted uppercase">
            Für wen?
          </h3>
          <Segmented
            options={AGES}
            value={age}
            onChange={setAge}
            columns="grid-cols-4"
            render={(o, active) => (
              <>
                <span
                  className={`text-[13px] font-semibold ${active ? "text-dark" : "text-muted"}`}
                >
                  {o.label}
                </span>
                <span className="text-[10px] text-muted">{o.sub}</span>
              </>
            )}
          />
        </div>

        {/* Feinjustierung nach dem eigenen Kind. */}
        <div>
          <h3 className="mb-2 text-xs font-semibold tracking-wide text-muted uppercase">
            Mein Kind
          </h3>
          <Segmented
            options={SENSITIVITIES}
            value={sensitivity}
            onChange={setSensitivity}
            columns="grid-cols-3"
          />
        </div>

        <div>
          <h3 className="mb-2 text-xs font-semibold tracking-wide text-muted uppercase">
            Anziehen
          </h3>
          <ItemGrid items={outfit.wear} />
        </div>

        {outfit.bring.length > 0 && (
          <div>
            <h3 className="mb-2 text-xs font-semibold tracking-wide text-muted uppercase">
              Mitnehmen
            </h3>
            <ItemGrid items={outfit.bring} />
          </div>
        )}

        {outfit.note && (
          <Hinweis>{outfit.note}</Hinweis>
        )}

        {/* Der ehrlichste Check kommt von den Eltern selbst. */}
        <div className="rounded-2xl border border-line bg-background p-3">
          <p className="text-sm leading-relaxed text-dark">
            <span className="font-semibold">Nackencheck:</span> Fühlt sich der
            Nacken deines Kindes warm und trocken an, passt die Kleidung.
            Kühl-feucht heißt zu wenig, verschwitzt zu viel.
          </p>
        </div>

        <p className="text-xs leading-relaxed text-muted">
          Ein Vorschlag auf Basis des aktuellen Wetters. Was dein Kind wirklich
          braucht, weißt du am besten.
        </p>
      </div>
    </Sheet>
  );
}
