"use client";

import { CloudSun, MapPin, TreePine } from "lucide-react";
import { Logo } from "./Logo";
import { Button } from "./ui/Button";

/**
 * Nur beim allerersten Öffnen: erklärt in einem Atemzug, was die App tut,
 * und überbrückt damit unbemerkt die erste Datenladung, die im Hintergrund
 * bereits läuft. Wiederkehrer sehen diesen Bildschirm nie.
 */
export function Welcome({ onStart }: { onStart: () => void }) {
  return (
    <div className="mx-auto flex min-h-dvh max-w-lg flex-col justify-center bg-background px-6 py-10">
      <Logo />

      <h1 className="mt-6 font-display text-[28px] leading-snug font-bold text-dark">
        Wo ist es mit Kind gerade am schönsten draußen?
      </h1>

      <p className="mt-3 text-[15px] leading-relaxed text-muted">
        PlatzDa kennt die Spielplätze, Parks und Wäldchen in deiner Nähe – und
        rechnet live aus Schatten, Wetter und Ausstattung, wo es sich jetzt
        lohnt.
      </p>

      <ul className="mt-6 space-y-3 text-[15px] text-dark">
        <li className="flex items-start gap-3">
          <TreePine size={18} aria-hidden className="mt-0.5 shrink-0 text-primary-dark" />
          Schatten aus echten Bäumen und Gebäuden berechnet, Stunde für Stunde
        </li>
        <li className="flex items-start gap-3">
          <CloudSun size={18} aria-hidden className="mt-0.5 shrink-0 text-primary-dark" />
          Wetter, UV und Anzieh-Tipp für dein Kind gleich mit dabei
        </li>
        <li className="flex items-start gap-3">
          <MapPin size={18} aria-hidden className="mt-0.5 shrink-0 text-primary-dark" />
          Toiletten, Zäune und Meldungen anderer Eltern auf einen Blick
        </li>
      </ul>

      <Button onClick={onStart} className="mt-8 w-full">
        Plätze in meiner Nähe zeigen
      </Button>

      <p className="mt-3 text-center text-xs leading-relaxed text-muted">
        Dein Standort bleibt auf deinem Gerät und wird nirgendwo gespeichert.
      </p>
    </div>
  );
}
