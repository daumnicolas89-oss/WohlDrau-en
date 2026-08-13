import { NextResponse } from "next/server";
import { STATUS_OPTIONS } from "@/lib/status";
import {
  addStatus,
  isPersistent,
  listStatuses,
  recentReportCount,
} from "@/lib/supabase";
import type { PlaceStatusType } from "@/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const VALID_TYPES = new Set<string>(STATUS_OPTIONS.map((option) => option.type));
/** Zwei Ebenen: kurzer Abstand pro IP, Tagesdeckel pro anonymer ID. */
const MIN_INTERVAL_MS = 20_000;
const REPORT_WINDOW_MS = 60 * 60 * 1000;
const MAX_REPORTS_PER_WINDOW = 10;
const MAX_MESSAGE_LENGTH = 140;

const lastPostByIp = new Map<string, number>();

/**
 * Technische Ursachen gehören ins Log, nicht ins Formular: „TypeError: fetch
 * failed“ hilft niemandem, der gerade am Spielplatz steht.
 */
function fail(error: unknown, message: string, status = 502) {
  console.error("[wohldraussen] status:", error);
  return NextResponse.json({ error: message }, { status });
}

function clientIp(request: Request) {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown"
  );
}

export async function GET(request: Request) {
  const ids = new URL(request.url).searchParams.get("placeIds");
  try {
    const statuses = await listStatuses(
      ids ? ids.split(",").filter(Boolean).slice(0, 300) : undefined,
    );
    return NextResponse.json({ statuses, persistent: isPersistent() });
  } catch (error) {
    return fail(error, "Meldungen sind gerade nicht abrufbar.");
  }
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Ungültiger Body" }, { status: 400 });
  }

  const { placeId, type, message, anonymousId } = (body ?? {}) as {
    placeId?: string;
    type?: string;
    message?: string;
    anonymousId?: string;
  };

  if (!placeId || typeof placeId !== "string" || placeId.length > 64) {
    return NextResponse.json({ error: "placeId fehlt" }, { status: 400 });
  }
  if (!type || !VALID_TYPES.has(type)) {
    return NextResponse.json({ error: "Unbekannte Meldung" }, { status: 400 });
  }

  const ip = clientIp(request);
  const previous = lastPostByIp.get(ip);
  if (previous && Date.now() - previous < MIN_INTERVAL_MS) {
    return NextResponse.json(
      { error: "Kurz durchatmen, gleich geht es weiter." },
      { status: 429 },
    );
  }

  const sender =
    typeof anonymousId === "string" && anonymousId.length <= 64
      ? anonymousId
      : null;

  try {
    if (sender) {
      const recent = await recentReportCount(sender, REPORT_WINDOW_MS);
      if (recent >= MAX_REPORTS_PER_WINDOW) {
        return NextResponse.json(
          { error: "Für diese Stunde sind genug Meldungen eingegangen." },
          { status: 429 },
        );
      }
    }

    const status = await addStatus({
      placeId,
      type: type as PlaceStatusType,
      message:
        typeof message === "string" && message.trim()
          ? message.trim().slice(0, MAX_MESSAGE_LENGTH)
          : null,
      anonymousId: sender,
    });
    lastPostByIp.set(ip, Date.now());
    return NextResponse.json({ status }, { status: 201 });
  } catch (error) {
    return fail(
      error,
      "Die Meldung ließ sich gerade nicht speichern. Gleich nochmal versuchen?",
    );
  }
}
