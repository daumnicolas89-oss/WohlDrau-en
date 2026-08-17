"use client";

import { placeHref } from "@/lib/appMode";

import { useEffect, useMemo } from "react";
import { CircleMarker, MapContainer, Marker, TileLayer, useMap } from "react-leaflet";
import { useRouter } from "next/navigation";
import { formatDistance } from "@/lib/utils";
import { scoreWording } from "@/lib/wording";
import type { MapStyle } from "@/store/useFilters";
import type { Place } from "@/types";
import { TONE_COLORS } from "@/components/ui/ScoreRing";
import { ORIGIN_MARKER_STYLE, placeMarkerIcon } from "./PlaceMarker";

/** Mehr Nadeln als das hilft niemandem, und kostet auf dem Handy Zeit. */
const MAX_MARKERS = 60;

/** Helle, ruhige Karte als Standard; Satellit hilft beim Wiedererkennen und
 *  zeigt sogar das Grün von oben, passend zum Schatten-Thema. */
const TILES: Record<MapStyle, { url: string; attribution: string; maxZoom: number }> = {
  map: {
    url: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png",
    attribution:
      '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> © <a href="https://carto.com/attributions">CARTO</a>',
    maxZoom: 19,
  },
  satellite: {
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attribution: "Luftbild © Esri, Maxar, Earthstar Geographics",
    maxZoom: 19,
  },
};

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
  style = "map",
}: {
  places: Place[];
  origin: { lat: number; lng: number };
  radius: number;
  style?: MapStyle;
}) {
  const router = useRouter();
  const originQuery = `lat=${origin.lat.toFixed(5)}&lng=${origin.lng.toFixed(5)}`;

  const markers = useMemo(
    () =>
      places.slice(0, MAX_MARKERS).map((place, index) => ({
        place,
        bewertung: scoreWording(place.pleasantScore),
        icon: placeMarkerIcon(
          TONE_COLORS[scoreWording(place.pleasantScore).tone],
          place.pleasantScore,
          index === 0,
        ),
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
      {/* key erzwingt einen sauberen Wechsel der Kachel-Quelle beim Umschalten. */}
      <TileLayer
        key={style}
        url={TILES[style].url}
        attribution={TILES[style].attribution}
        maxZoom={TILES[style].maxZoom}
      />
      <Recenter lat={origin.lat} lng={origin.lng} />

      <CircleMarker
        center={[origin.lat, origin.lng]}
        radius={7}
        pathOptions={ORIGIN_MARKER_STYLE}
      />

      {markers.map(({ place, bewertung, icon }) => (
        <Marker
          key={place.id}
          position={[place.lat, place.lng]}
          icon={icon}
          eventHandlers={{
            click: () =>
              router.push(
                placeHref(place.id, originQuery) +
                  `&plat=${place.lat.toFixed(5)}&plng=${place.lng.toFixed(5)}&r=${radius}`,
              ),
          }}
          title={`${place.name}: ${bewertung.label}, ${place.pleasantScore} von 100, ${formatDistance(place.distance ?? 0)}`}
        />
      ))}
    </MapContainer>
  );
}
