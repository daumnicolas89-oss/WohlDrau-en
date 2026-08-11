import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { expiresAtFor } from "./status";
import type { PlaceStatus, PlaceStatusType } from "@/types";

const TABLE = "place_status";

let cachedClient: SupabaseClient | null | undefined;

export function supabase(): SupabaseClient | null {
  if (cachedClient !== undefined) return cachedClient;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  cachedClient = url && key ? createClient(url, key) : null;
  return cachedClient;
}

export function isPersistent(): boolean {
  return supabase() !== null;
}

/**
 * Fallback ohne Datenbank: hält Meldungen im Prozess. Für lokale Entwicklung
 * und Demos ausreichend – auf serverless Instanzen überlebt das keinen
 * Kaltstart, deshalb für die Produktion Supabase konfigurieren.
 */
interface MemoryRow extends PlaceStatus {
  anonymousId: string | null;
}

const memory: MemoryRow[] = [];

/** Die Absender-ID bleibt im Server – nach außen geht nur die Meldung. */
function toPublic(row: MemoryRow): PlaceStatus {
  return {
    id: row.id,
    placeId: row.placeId,
    type: row.type,
    message: row.message,
    createdAt: row.createdAt,
    expiresAt: row.expiresAt,
  };
}

function pruneMemory(now = Date.now()) {
  for (let i = memory.length - 1; i >= 0; i--) {
    if (new Date(memory[i].expiresAt).getTime() <= now) memory.splice(i, 1);
  }
}

interface Row {
  id: string;
  place_id: string;
  status_type: PlaceStatusType;
  message: string | null;
  created_at: string;
  expires_at: string;
}

function fromRow(row: Row): PlaceStatus {
  return {
    id: row.id,
    placeId: row.place_id,
    type: row.status_type,
    message: row.message ?? undefined,
    createdAt: row.created_at,
    expiresAt: row.expires_at,
  };
}

export async function listStatuses(placeIds?: string[]): Promise<PlaceStatus[]> {
  const client = supabase();
  const nowIso = new Date().toISOString();

  if (!client) {
    pruneMemory();
    return memory
      .filter((r) => !placeIds || placeIds.includes(r.placeId))
      .map(toPublic);
  }

  let query = client
    .from(TABLE)
    .select("id, place_id, status_type, message, created_at, expires_at")
    .gt("expires_at", nowIso)
    .order("created_at", { ascending: false })
    .limit(1000);
  if (placeIds?.length) query = query.in("place_id", placeIds);

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data as Row[]).map(fromRow);
}

export interface NewStatus {
  placeId: string;
  type: PlaceStatusType;
  message: string | null;
  anonymousId: string | null;
}

export async function addStatus(input: NewStatus): Promise<PlaceStatus> {
  const client = supabase();
  const createdAt = new Date().toISOString();
  const expiresAt = expiresAtFor(createdAt);

  if (!client) {
    const row: MemoryRow = {
      id: `local-${createdAt}-${memory.length}`,
      placeId: input.placeId,
      type: input.type,
      message: input.message ?? undefined,
      createdAt,
      expiresAt,
      anonymousId: input.anonymousId,
    };
    memory.unshift(row);
    pruneMemory();
    return toPublic(row);
  }

  const { data, error } = await client
    .from(TABLE)
    .insert({
      place_id: input.placeId,
      status_type: input.type,
      message: input.message,
      expires_at: expiresAt,
      anonymous_id: input.anonymousId,
    })
    .select("id, place_id, status_type, message, created_at, expires_at")
    .single();
  if (error) throw new Error(error.message);
  return fromRow(data as Row);
}

/** Wie viele Meldungen kamen zuletzt von diesem Absender? Für Rate-Limiting. */
export async function recentReportCount(
  anonymousId: string,
  windowMs: number,
): Promise<number> {
  const since = new Date(Date.now() - windowMs).toISOString();
  const client = supabase();

  if (!client) {
    return memory.filter(
      (r) => r.anonymousId === anonymousId && r.createdAt >= since,
    ).length;
  }

  const { count, error } = await client
    .from(TABLE)
    .select("id", { count: "exact", head: true })
    .eq("anonymous_id", anonymousId)
    .gte("created_at", since);
  if (error) throw new Error(error.message);
  return count ?? 0;
}
