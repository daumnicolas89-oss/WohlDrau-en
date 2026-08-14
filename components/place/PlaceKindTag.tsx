import { Flower2, ToyBrick, TreePine, Trees, type LucideIcon } from "lucide-react";
import type { PlaceKind } from "@/types";

const META: Record<PlaceKind, { label: string; Icon: LucideIcon }> = {
  playground: { label: "Spielplatz", Icon: ToyBrick },
  park: { label: "Grünfläche", Icon: Trees },
  wood: { label: "Wäldchen", Icon: TreePine },
  garden: { label: "Garten", Icon: Flower2 },
};

export const kindLabel = (kind: PlaceKind) => META[kind]?.label ?? "";

/** Kleines Icon-plus-Wort, damit auf einen Blick klar ist, was für ein Ort das
 *  ist – gerade bei benannten Orten wie „Hofgarten", wo der Name es nicht sagt. */
export function PlaceKindTag({
  kind,
  className,
  iconSize = 13,
}: {
  kind: PlaceKind;
  className?: string;
  iconSize?: number;
}) {
  // Robust gegen Daten ohne (oder mit unbekannter) Kategorie, etwa aus einem
  // älteren Client-Cache: dann lieber kein Label als ein Absturz.
  const meta = META[kind];
  if (!meta) return null;
  const { label, Icon } = meta;
  return (
    <span className={`inline-flex items-center gap-1 ${className ?? ""}`}>
      <Icon size={iconSize} aria-hidden className="shrink-0" />
      {label}
    </span>
  );
}
