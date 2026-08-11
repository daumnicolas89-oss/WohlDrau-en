-- WohlDraußen – Community-Meldungen
-- Anwenden per Supabase SQL Editor oder `supabase db push`.

create table if not exists public.place_status (
  id uuid primary key default gen_random_uuid(),
  -- OSM-Referenz, z. B. "way/12345"
  place_id text not null check (char_length(place_id) <= 64),
  status_type text not null check (
    status_type in ('great', 'too_sunny', 'too_crowded', 'toilet_closed', 'wet', 'other')
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

-- Abgelaufene Meldungen aufräumen. Als Cron einplanen, z. B.:
--   select cron.schedule('wohldraussen-cleanup', '0 * * * *',
--     $$select public.purge_expired_place_status()$$);
create or replace function public.purge_expired_place_status()
returns void
language sql
security definer
set search_path = public
as $$
  delete from public.place_status where expires_at < now() - interval '24 hours';
$$;
