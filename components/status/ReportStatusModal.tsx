"use client";

import { erfolg } from "@/lib/native";

import { useState } from "react";
import { Check } from "lucide-react";
import { STATUS_OPTIONS } from "@/lib/status";
import type { PlaceStatusType } from "@/types";
import { Button } from "@/components/ui/Button";
import { Sheet } from "@/components/ui/Sheet";

const TONE_STYLES = {
  good: "border-primary bg-primary-soft text-primary-dark",
  bad: "border-warning bg-warning-soft text-warning-ink",
  neutral: "border-dark bg-[#e8edef] text-dark",
} as const;

const MAX_MESSAGE_LENGTH = 140;

/**
 * Wird von den Aufrufern nur gerendert, solange sie offen sein soll, so
 * startet jede Meldung mit leerem Formular, ohne Zurücksetz-Effekt.
 */
export function ReportStatusModal({
  placeName,
  onClose,
  onSubmit,
}: {
  placeName: string;
  onClose: () => void;
  onSubmit: (type: PlaceStatusType, message: string) => Promise<void>;
}) {
  const [type, setType] = useState<PlaceStatusType | null>(null);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function submit() {
    if (!type) return;
    setBusy(true);
    setError(null);
    try {
      await onSubmit(type, message);
      erfolg();
      // Kurz „Danke“ zeigen, statt das Sheet wortlos verschwinden zu lassen.
      setDone(true);
      window.setTimeout(onClose, 1600);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Meldung fehlgeschlagen");
      setBusy(false);
    }
  }

  if (done) {
    return (
      <Sheet
        open
        title="Danke, deine Rückmeldung ist da"
        description="Sie ist jetzt etwa drei Stunden für andere sichtbar."
        onOpenChange={(next) => {
          if (!next) onClose();
        }}
      >
        <div
          role="status"
          className="flex flex-col items-center gap-3 py-6 text-center"
        >
          <span className="flex size-14 items-center justify-center rounded-full bg-primary-soft text-primary-dark">
            <Check size={28} aria-hidden />
          </span>
          <p className="text-base text-muted">
            Anonym gespeichert, ganz ohne Anmeldung.
          </p>
        </div>
      </Sheet>
    );
  }

  return (
    <Sheet
      open
      title="Wie ist es dort gerade?"
      description={`Für ${placeName}. Anonym, ohne Anmeldung – deine Rückmeldung hilft den nächsten Eltern.`}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
      footer={
        <div className="pb-1">
          {error && (
            <p role="alert" className="mb-2 text-sm text-warning-ink">
              {error}
            </p>
          )}
          <Button disabled={!type || busy} onClick={submit} className="w-full">
            {busy ? "Wird gesendet …" : "Absenden"}
          </Button>
        </div>
      }
    >
      <div className="grid grid-cols-2 gap-2">
        {STATUS_OPTIONS.map((option) => {
          const active = type === option.type;
          return (
            <button
              key={option.type}
              type="button"
              aria-pressed={active}
              onClick={() => setType(option.type)}
              className={`min-h-14 rounded-2xl border-2 px-3 text-sm font-semibold transition ${
                active
                  ? TONE_STYLES[option.tone]
                  : "border-line bg-card text-dark hover:bg-background active:bg-background"
              }`}
            >
              {option.label}
            </button>
          );
        })}
      </div>

      <label className="mt-4 block">
        <span className="mb-1 block text-sm font-semibold text-dark">
          Noch etwas dazu? <span className="font-normal text-muted">(freiwillig)</span>
        </span>
        <textarea
          value={message}
          onChange={(event) => setMessage(event.target.value.slice(0, MAX_MESSAGE_LENGTH))}
          rows={2}
          placeholder="z. B. Sandkasten liegt komplett im Schatten"
          className="w-full resize-none rounded-2xl border border-line bg-background p-3 text-[15px] outline-none focus:border-primary"
        />
      </label>
    </Sheet>
  );
}
