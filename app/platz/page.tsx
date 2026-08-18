"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { PlaceDetail } from "@/components/place/PlaceDetail";

function coords(lat: string | null, lng: string | null) {
  const parsedLat = Number(lat);
  const parsedLng = Number(lng);
  return Number.isFinite(parsedLat) && Number.isFinite(parsedLng) && lat && lng
    ? { lat: parsedLat, lng: parsedLng }
    : null;
}

/**
 * Detailseite als Query-Variante (/platz/?id=way/123) für die App-Hülle:
 * Ein statischer Export kennt keine dynamischen Pfad-Segmente wie /ort/way/123.
 * Im Web bleibt /ort/… die schöne Adresse; diese Seite tut dasselbe.
 */
function PlatzInhalt() {
  const params = useSearchParams();
  const id = params.get("id");
  const r = Number(params.get("r"));

  if (!id) {
    return (
      <main className="mx-auto flex min-h-dvh max-w-lg flex-col items-center justify-center gap-4 bg-background p-8 text-center">
        <p className="font-display text-lg font-semibold text-dark">
          Diesen Platz finden wir nicht.
        </p>
        <Link
          href="/"
          className="rounded-2xl bg-primary-dark px-5 py-3 text-sm font-semibold text-white"
        >
          Zur Übersicht
        </Link>
      </main>
    );
  }

  return (
    <PlaceDetail
      placeId={id}
      origin={coords(params.get("lat"), params.get("lng"))}
      placeHint={coords(params.get("plat"), params.get("plng"))}
      radius={Number.isFinite(r) && r > 0 ? r : null}
      listScore={(() => {
        const ls = Number(params.get("ls"));
        return params.get("ls") && Number.isFinite(ls) ? ls : null;
      })()}
      previewLabel={params.get("tv")}
    />
  );
}

export default function PlatzPage() {
  return (
    <Suspense fallback={null}>
      <PlatzInhalt />
    </Suspense>
  );
}
