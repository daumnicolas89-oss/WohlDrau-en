"use client";

import { useEffect, useState } from "react";
import { MapPin, MousePointerClick, Sparkles, X } from "lucide-react";

const KEY = "wd-welcome-seen";

/**
 * Der erste Moment entscheidet: Ein neuer Nutzer soll in zwei Sätzen wissen,
 * was die App tut und was er tun kann – bevor ihn Wetterwerte und Zahlen
 * erschlagen. Einmalig, dann weggetippt und im Browser gemerkt.
 */
export function WelcomeCard() {
  // Erst nach dem Mount entscheiden – localStorage gibt es serverseitig nicht,
  // und ein Blitzen der Karte bei Rückkehrern wäre unschön.
  const [show, setShow] = useState(false);

  useEffect(() => {
    try {
      setShow(localStorage.getItem(KEY) !== "1");
    } catch {
      setShow(false);
    }
  }, []);

  if (!show) return null;

  function dismiss() {
    try {
      localStorage.setItem(KEY, "1");
    } catch {
      // Privater Modus o. Ä.: dann eben diese Sitzung lang ausblenden.
    }
    setShow(false);
  }

  return (
    <section className="animate-fade-in mx-4 mt-[max(1rem,env(safe-area-inset-top))] mb-1 rounded-card border border-primary-dark/10 bg-card p-5 shadow-card">
      <div className="flex items-start justify-between gap-3">
        <h2 className="font-display text-lg leading-tight font-semibold text-dark">
          Schön, dass du da bist 👋
        </h2>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Hinweis schließen"
          className="-m-1.5 shrink-0 p-1.5 text-muted transition active:scale-90"
        >
          <X size={18} />
        </button>
      </div>

      <p className="mt-2 text-[15px] leading-relaxed text-dark">
        WohlDraußen zeigt dir, wo es <strong className="font-semibold">gerade
        jetzt</strong> draußen am angenehmsten ist – mit genug Schatten und
        allem, was zählt.
      </p>

      <ul className="mt-4 space-y-3 text-[15px] leading-snug text-dark">
        <li className="flex items-start gap-2.5">
          <Sparkles size={18} aria-hidden className="mt-0.5 shrink-0 text-primary-dark" />
          <span>
            Orte sind nach „angenehm jetzt" sortiert –{" "}
            <strong className="font-semibold">oben steht das Beste</strong>.
          </span>
        </li>
        <li className="flex items-start gap-2.5">
          <MousePointerClick size={18} aria-hidden className="mt-0.5 shrink-0 text-primary-dark" />
          <span>Tippe auf einen Ort für alle Details.</span>
        </li>
        <li className="flex items-start gap-2.5">
          <MapPin size={18} aria-hidden className="mt-0.5 shrink-0 text-primary-dark" />
          <span>Gib deinen Standort frei für Orte in deiner Nähe.</span>
        </li>
      </ul>

      <button
        type="button"
        onClick={dismiss}
        className="mt-5 flex min-h-11 w-full items-center justify-center rounded-2xl bg-primary-dark font-semibold text-white transition active:bg-[#175c54]"
      >
        Los geht's
      </button>
    </section>
  );
}
