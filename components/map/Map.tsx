"use client";

import { useEffect, useMemo } from "react";
import { CircleMarker, MapContainer, Marker, TileLayer, useMap } from "react-leaflet";
import { useRouter } from "next/navigation";
import { formatDistance } from "@/lib/utils";
import type { Place } from "@/types";
import { ORIGIN_MARKER_STYLE, placeMarkerIcon } from "./PlaceMarker";

/** Mehr Nadeln als das hilft niemandem – und kostet auf dem Handy Zeit. */
const MAX_MARKERS = 60;

function Recenter({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng], map.getZoom(), { animate: true });
  }, [lat, lng, map]);
  return null;
}

export default function Map({
  places,
  origin,
  radius,
}: {
  places: Place[];
  origin: { lat: number; lng: number };
  radius: number;
}) {
  const router = useRouter();
  const originQuery = `lat=${origin.lat.toFixed(5)}&lng=${origin.lng.toFixed(5)}`;

  const markers = useMemo(
    () =>
      places.slice(0, MAX_MARKERS).map((place, index) => ({
        place,
        icon: placeMarkerIcon(place.shade.state, index + 1),
      })),
    [places],
  );

  return (
    <MapContainer
      center={[origin.lat, origin.lng]}
      zoom={14}
      zoomControl={false}
      className="size-full"
      attributionControl
    >
      {/* Helle, zurückhaltende Kacheln (CARTO Positron) statt der bunten
          Standard-OSM-Karte: ruhiger Hintergrund, auf dem die farbigen
          Orts-Nadeln klar hervorstechen – passend zum edlen Look. */}
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png"
        attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> © <a href="https://carto.com/attributions">CARTO</a>'
        maxZoom={19}
      />
      <Recenter lat={origin.lat} lng={origin.lng} />

      <CircleMarker
        center={[origin.lat, origin.lng]}
        radius={7}
        pathOptions={ORIGIN_MARKER_STYLE}
      />

      {markers.map(({ place, icon }) => (
        <Marker
          key={place.id}
          position={[place.lat, place.lng]}
          icon={icon}
          eventHandlers={{
            click: () =>
              router.push(
                `/ort/${place.id}?${originQuery}` +
                  `&plat=${place.lat.toFixed(5)}&plng=${place.lng.toFixed(5)}&r=${radius}`,
              ),
          }}
          title={`${place.name} – ${formatDistance(place.distance ?? 0)}`}
        />
      ))}
    </MapContainer>
  );
}
