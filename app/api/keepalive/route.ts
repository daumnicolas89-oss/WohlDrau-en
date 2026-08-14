import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export const runtime = "nodejs";
// Nie cachen – der Sinn ist ja gerade der echte Datenbank-Kontakt.
export const dynamic = "force-dynamic";

/**
 * Täglicher Lebenszeichen-Ping an Supabase (via Vercel Cron, siehe
 * vercel.json). Hintergrund: Free-Tier-Projekte werden nach etwa einer Woche
 * ohne Datenbank-Zugriff pausiert und müssen dann VON HAND im Dashboard
 * reaktiviert werden – eine besucherarme Woche würde die Community-Meldungen
 * still abschalten. Ein winziger Select pro Tag verhindert das.
 */
export async function GET() {
  const client = supabase();
  if (!client) {
    // Ohne konfigurierte Datenbank gibt es nichts wachzuhalten.
    return NextResponse.json({ ok: true, db: "not-configured" });
  }
  const { error } = await client
    .from("place_status")
    .select("id", { head: true, count: "exact" })
    .limit(1);
  if (error) {
    console.error("[platzda] keepalive:", error.message);
    return NextResponse.json({ ok: false, db: "error" }, { status: 502 });
  }
  return NextResponse.json({ ok: true, db: "alive" });
}
