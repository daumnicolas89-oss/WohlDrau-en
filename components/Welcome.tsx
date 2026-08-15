"use client";

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
      {/* self-start: Als Flex-Kind würde das Bild sonst auf volle Breite
          gestreckt und verzerrt. */}
      <Logo className="self-start" />

      <h1 className="mt-8 font-display text-[26px] leading-snug font-bold text-dark">
        Wo ist es jetzt schön draußen?
      </h1>

      <p className="mt-4 text-[16px] leading-relaxed text-dark">
        PlatzDa zeigt dir Spielplätze, Parks und Wäldchen in deiner Nähe. Die
        App rechnet aus, wo gerade Schatten ist, wie das Wetter wird und was es
        vor Ort gibt. So findest du schnell einen Platz, an dem es sich gut
        aushalten lässt.
      </p>

      <Button onClick={onStart} className="mt-8 w-full">
        Los geht&apos;s
      </Button>

      <p className="mt-3 text-center text-xs leading-relaxed text-muted">
        Dein Standort bleibt auf deinem Gerät.
      </p>
    </div>
  );
}
