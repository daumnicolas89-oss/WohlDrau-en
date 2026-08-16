import { NextResponse } from "next/server";
import { reportStatus } from "@/lib/supabase";

export const runtime = "nodejs";

/**
 * Einen Beitrag als anstößig melden. Bewusst schlank: keine Begründung, keine
 * Anmeldung – wer etwas Unpassendes sieht, soll es mit einem Tipp loswerden.
 * Ab zwei unabhängigen Meldungen ist der Beitrag für alle weg.
 */
export async function POST(request: Request) {
  let statusId: unknown;
  try {
    ({ statusId } = (await request.json()) as { statusId?: unknown });
  } catch {
    return NextResponse.json({ error: "Ungültige Anfrage" }, { status: 400 });
  }

  // Beitrags-Kennungen sind UUIDs. Alles andere gar nicht erst zur Datenbank
  // durchreichen – das spart einen Fehlerpfad und hält das Log sauber.
  const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (typeof statusId !== "string" || !UUID.test(statusId)) {
    return NextResponse.json({ error: "Ungültige Meldung" }, { status: 400 });
  }

  try {
    await reportStatus(statusId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[platzda] report:", error);
    return NextResponse.json(
      { error: "Melden hat gerade nicht geklappt. Bitte später erneut." },
      { status: 502 },
    );
  }
}
