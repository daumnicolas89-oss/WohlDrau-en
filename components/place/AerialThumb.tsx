"use client";

import { MapContainer, TileLayer } from "react-leaflet";

/**
 * Ein Luftbild-Ausschnitt genau von diesem Ort, bewusst als „Bild", nicht als
 * Karte: alle Interaktionen sind aus, damit es sich wie ein Foto von oben
 * anfühlt. Funktioniert für jeden Ort, weil jeder Koordinaten hat.
 */
export default function AerialThumb({ lat, lng }: { lat: number; lng: number }) {
  return (
    <MapContainer
      center={[lat, lng]}
      zoom={17}
      zoomControl={false}
      dragging={false}
      scrollWheelZoom={false}
      doubleClickZoom={false}
      touchZoom={false}
      boxZoom={false}
      keyboard={false}
      attributionControl={false}
      className="pointer-events-none size-full"
    >
      <TileLayer
        url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
        maxZoom={19}
      />
    </MapContainer>
  );
}
