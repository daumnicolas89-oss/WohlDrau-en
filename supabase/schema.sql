-- WohlDraußen – Community-Meldungen
-- Anwenden per Supabase SQL Editor oder `supabase db push`.

create table if not exists public.place_status (
  id uuid primary key default gen_random_uuid(),
  -- OSM-Referenz, z. B. "way/12345"
  place_id text not null check (char_length(place_id) <= 64),
  status_type text not null check (
    status_type in ('great', 'too_sunny', 'too_crowded', 'toilet_closed', 'wet', 'dirty_broken', 'other')
  ),
  message text check (char_length(message) <= 140),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '3 hours',
  -- Grober Absender-Fingerprint für Rate-Limiting, kein Personenbezug.
  anonymous_id text check (char_length(anonymous_id) <= 64)
);

-- Gelesen wird immer „gültige Meldungen zu diesen Orten“.
create index if not exists place_status_place_expires_idx
  on public.place_status (place_id, expires_at desc);

-- Für das Rate-Limiting pro Absender.
create index if not exists place_status_anonymous_created_idx
  on public.place_status (anonymous_id, created_at desc);

alter table public.place_status enable row level security;

-- Meldungen sind öffentlich lesbar, aber nur solange sie gelten.
drop policy if exists "gueltige Meldungen sind oeffentlich" on public.place_status;
create policy "gueltige Meldungen sind oeffentlich"
  on public.place_status for select
  using (expires_at > now());

-- Schreiben ohne Anmeldung; der Service-Role-Key des Servers umgeht RLS ohnehin.
drop policy if exists "jeder darf melden" on public.place_status;
create policy "jeder darf melden"
  on public.place_status for insert
  with check (expires_at <= now() + interval '6 hours');

-- Abgelaufene Meldungen wirklich löschen, sobald sie ausgeblendet sind (nach
-- den 3 Stunden ihrer Gültigkeit). So stimmt die Datenschutz-Zusage „nach rund
-- drei Stunden gelöscht" mit der Realität überein, statt nur auszublenden.
create or replace function public.purge_expired_place_status()
returns void
language sql
security definer
set search_path = public
as $$
  delete from public.place_status where expires_at < now();
$$;

-- Damit die Funktion auch läuft, muss sie regelmäßig aufgerufen werden. Das
-- übernimmt pg_cron. Einmalig im Supabase-SQL-Editor ausführen (pg_cron muss
-- unter Database → Extensions aktiviert sein):
--
--   create extension if not exists pg_cron;
--   select cron.schedule(
--     'wohldraussen-cleanup',
--     '*/15 * * * *',
--     $$select public.purge_expired_place_status()$$
--   );

-- Missbrauchsschutz (Stufe 1): höchstens N Meldungen pro Ort und Stunde.
-- Direkt in der Datenbank erzwungen, also vom Client nicht umgehbar. Bremst
-- Massen-Fälschungen aus, ohne dass ein Server-Schlüssel nötig ist. Der volle
-- Riegel (nur der Server darf schreiben, Sperre pro IP) folgt beim Deployment.
create or replace function public.limit_reports_per_place()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  recent int;
begin
  select count(*) into recent
  from public.place_status
  where place_id = new.place_id
    and created_at > now() - interval '1 hour';

  if recent >= 8 then
    raise exception 'Zu viele Meldungen fuer diesen Ort in kurzer Zeit'
      using errcode = 'check_violation';
  end if;

  return new;
end;
$$;

drop trigger if exists place_status_rate_limit on public.place_status;
create trigger place_status_rate_limit
  before insert on public.place_status
  for each row
  execute function public.limit_reports_per_place();

-- ---------------------------------------------------------------------------
-- STUFE 2 – erst beim Deployment ausführen (nicht vorher!)
-- Voraussetzung: In der Hosting-Umgebung (z. B. Vercel) ist der geheime
-- SUPABASE_SERVICE_ROLE_KEY als Server-Variable gesetzt. Dann schreibt und
-- liest der Server mit erhöhten Rechten (umgeht RLS), und die Außenwelt darf
-- mit dem öffentlichen Schlüssel gar nichts mehr direkt an der Tabelle tun.
--
--   -- a) Öffentliches Schreiben schließen (nur noch der Server darf schreiben):
--   drop policy if exists "jeder darf melden" on public.place_status;
--
--   -- b) Öffentliches Lesen schließen (Reads laufen ohnehin über den Server;
--   --    das verbirgt zugleich die Geräte-Kennung „anonymous_id", Punkt 7):
--   drop policy if exists "gueltige Meldungen sind oeffentlich" on public.place_status;
--
-- Danach unbedingt testen: Melden und Anzeige der Meldungen müssen weiter
-- funktionieren (jetzt über den service_role-Server). Fehlt der Schlüssel,
-- fällt der Server auf den öffentlichen zurück und beide Schritte würden das
-- Melden lahmlegen – deshalb erst NACH gesetztem Schlüssel ausführen.
-- ---------------------------------------------------------------------------

-- ---------------------------------------------------------------------------
-- Melden anstößiger Beiträge (Apple-Richtlinie 1.2 für nutzergenerierte
-- Inhalte). Ab zwei unabhängigen Meldungen verschwindet ein Beitrag für alle,
-- bis er ohnehin nach drei Stunden gelöscht wird.
-- Einmalig im SQL-Editor ausführen.
-- ---------------------------------------------------------------------------

alter table public.place_status
  add column if not exists reports smallint not null default 0;

-- Gemeldete Beiträge sind sofort nicht mehr öffentlich lesbar.
drop policy if exists "gueltige Meldungen sind oeffentlich" on public.place_status;
create policy "gueltige Meldungen sind oeffentlich"
  on public.place_status for select
  using (expires_at > now() and reports < 2);

-- Zählt eine Meldung hoch. `security definer`, damit anonyme Clients melden
-- können, ohne Schreibrechte auf der Tabelle zu haben.
create or replace function public.report_place_status(target uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update public.place_status
     set reports = least(reports + 1, 32767)
   where id = target and expires_at > now();
$$;

grant execute on function public.report_place_status(uuid) to anon, authenticated;
