"use client";

import dynamic from "next/dynamic";

function Splash() {
  return (
    <div className="mx-auto flex min-h-dvh max-w-lg flex-col items-center justify-center gap-3 bg-canvas p-8 text-center">
      <p className="font-display text-2xl font-bold text-ink">WohlDraußen</p>
      <p className="text-sm text-muted">
        Wir schauen kurz, wo es sich gerade lohnt …
      </p>
    </div>
  );
}

/**
 * Der Startbildschirm hängt komplett an Standort, Uhrzeit und gespeicherten
 * Filtern – alles Dinge, die es auf dem Server nicht gibt. Deshalb wird er
 * bewusst nur im Browser gerendert, statt eine Hydration-Diskrepanz zu
 * riskieren.
 */
const HomeView = dynamic(
  () => import("@/components/HomeView").then((m) => m.HomeView),
  { ssr: false, loading: () => <Splash /> },
);

export default function Page() {
  return <HomeView />;
}
