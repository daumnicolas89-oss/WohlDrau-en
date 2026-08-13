"use client";

import { useState } from "react";
import dynamic from "next/dynamic";

const AerialThumb = dynamic(() => import("./AerialThumb"), {
  ssr: false,
  loading: () => <div className="size-full animate-pulse bg-[#eef1f2]" />,
});

/**
 * Zeigt ein echtes Foto aus OpenStreetMap, wenn es eines gibt, und sonst (oder
 * bei totem Link) das Luftbild von oben. So hat jeder Ort ein Bild.
 */
export function PlacePhoto({
  imageUrl,
  lat,
  lng,
  name,
}: {
  imageUrl?: string;
  lat: number;
  lng: number;
  name: string;
}) {
  const [failed, setFailed] = useState(false);
  const showPhoto = Boolean(imageUrl) && !failed;

  return (
    <div className="relative h-44 overflow-hidden rounded-card bg-[#eef1f2] shadow-card">
      {showPhoto ? (
        // Beliebige externe Hosts, hier ist ein einfaches img richtig.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={imageUrl}
          alt={`Foto: ${name}`}
          loading="lazy"
          className="size-full object-cover"
          onError={() => setFailed(true)}
        />
      ) : (
        <AerialThumb lat={lat} lng={lng} />
      )}
      <span className="pointer-events-none absolute right-2 bottom-1.5 rounded bg-dark/40 px-1.5 py-0.5 text-[10px] font-medium text-white/90">
        {showPhoto ? "Foto · OpenStreetMap" : "Luftbild · Esri"}
      </span>
    </div>
  );
}
