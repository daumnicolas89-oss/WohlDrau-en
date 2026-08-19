"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

/**
 * Lässt eine Sektion beim Hereinscrollen sanft aufblenden (leichtes
 * Anheben plus Einblenden, einmalig). Drei Sicherheitsnetze:
 * - Ohne JavaScript bleibt alles sichtbar, weil der versteckte Zustand
 *   erst NACH dem ersten Rendern gesetzt wird.
 * - Was beim Laden schon im Bild steht, wird nie versteckt (kein
 *   Aufblitzen beim Start).
 * - Wer im System „Bewegung reduzieren" eingestellt hat, sieht die
 *   Seite komplett ohne Animation.
 */
export function Erscheint({ children }: { children: ReactNode }) {
  const huelle = useRef<HTMLDivElement>(null);
  const [versteckt, setVersteckt] = useState(false);

  useEffect(() => {
    const el = huelle.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (el.getBoundingClientRect().top < window.innerHeight * 0.85) return;

    setVersteckt(true);
    const beobachter = new IntersectionObserver(
      (eintraege) => {
        if (eintraege[0]?.isIntersecting) {
          setVersteckt(false);
          beobachter.disconnect();
        }
      },
      { rootMargin: "0px 0px -12% 0px" },
    );
    beobachter.observe(el);
    return () => beobachter.disconnect();
  }, []);

  return (
    <div
      ref={huelle}
      className={`transition-[opacity,transform] duration-700 ease-out ${
        versteckt ? "translate-y-5 opacity-0" : "translate-y-0 opacity-100"
      }`}
    >
      {children}
    </div>
  );
}
