import { Baby, Droplet, Fence, HelpCircle, Toilet, Umbrella } from "lucide-react";
import type { PlaceTags } from "@/types";

interface AttributeDef {
  key: keyof PlaceTags;
  label: string;
  Icon: typeof Toilet;
}

const ATTRIBUTES: AttributeDef[] = [
  { key: "toilet", label: "Toilette", Icon: Toilet },
  { key: "changing_table", label: "Wickeltisch", Icon: Baby },
  { key: "fenced", label: "Eingezäunt", Icon: Fence },
  { key: "drinking_water", label: "Wasser", Icon: Droplet },
  { key: "shelter", label: "Überdacht", Icon: Umbrella },
];

/**
 * OpenStreetMap weiß vieles schlicht nicht. Unbekannt wird deshalb sichtbar
 * als unbekannt dargestellt und nicht als „nicht vorhanden“ verkauft.
 */
export function AttributeChips({
  tags,
  showUnknown = false,
}: {
  tags: PlaceTags;
  showUnknown?: boolean;
}) {
  const items = ATTRIBUTES.filter((def) => {
    const value = tags[def.key];
    return value === true || (showUnknown && value !== false);
  });

  if (items.length === 0) {
    return <span className="text-xs text-muted">Keine Angaben zur Ausstattung</span>;
  }

  return (
    <ul className="flex flex-wrap gap-1.5">
      {items.map(({ key, label, Icon }) => {
        const known = tags[key] === true;
        return (
          <li
            key={key}
            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${
              known
                ? "bg-[#eef2f3] text-dark"
                : "border border-dashed border-line text-muted"
            }`}
          >
            <Icon size={14} strokeWidth={2} aria-hidden />
            {label}
            {!known && <HelpCircle size={12} aria-label="unbekannt" />}
          </li>
        );
      })}
    </ul>
  );
}
