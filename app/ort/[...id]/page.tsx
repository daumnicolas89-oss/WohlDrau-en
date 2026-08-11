import { PlaceDetail } from "@/components/place/PlaceDetail";

function coords(lat?: string, lng?: string) {
  const parsedLat = Number(lat);
  const parsedLng = Number(lng);
  return Number.isFinite(parsedLat) && Number.isFinite(parsedLng)
    ? { lat: parsedLat, lng: parsedLng }
    : null;
}

/**
 * OSM-IDs enthalten einen Schrägstrich ("way/12345"). Ein Catch-all-Segment
 * hält die URL dadurch lesbar: /ort/way/12345
 *
 * lat/lng = Standort des Nutzers (Entfernung), plat/plng = Standort des Ortes,
 * r = Suchradius der Liste. Mit lat/lng/r trifft die Detailseite denselben
 * Cache-Eintrag wie die Liste und ist sofort da. Fehlen die Parameter – etwa
 * bei einem geteilten Link – lädt sie selbst nach.
 */
export default async function PlacePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string[] }>;
  searchParams: Promise<{
    lat?: string;
    lng?: string;
    plat?: string;
    plng?: string;
    r?: string;
  }>;
}) {
  const { id } = await params;
  const { lat, lng, plat, plng, r } = await searchParams;
  const radius = Number(r);

  return (
    <PlaceDetail
      placeId={id.join("/")}
      origin={coords(lat, lng)}
      placeHint={coords(plat, plng)}
      radius={Number.isFinite(radius) && radius > 0 ? radius : null}
    />
  );
}
