-- Lumio — haftalik lider tablosu tablosu ve guvenlik kurallari.
-- Supabase > SQL Editor'de bir kez calistirin. Ardindan proje URL'si ve
-- "anon public" anahtarini src/game/config.ts dosyasina yapistirin.

create table if not exists public.scores (
  player_id text not null,
  name      text not null,
  week_id   text not null,
  score     integer not null default 0,
  updated_at timestamptz not null default now(),
  primary key (player_id, week_id)
);

create index if not exists scores_week_idx on public.scores (week_id, score desc);

alter table public.scores enable row level security;

-- Herkes (anon) okuyabilir.
drop policy if exists "read_all" on public.scores;
create policy "read_all" on public.scores
  for select using (true);

-- Herkes (anon) kendi skorunu ekleyebilir/guncelleyebilir.
-- (player_id istemci tarafinda uretilir; kotuye kullanim riski dusuk, istenirse
--  edge function ile imzalama eklenebilir.)
drop policy if exists "insert_any" on public.scores;
create policy "insert_any" on public.scores
  for insert with check (true);

drop policy if exists "update_any" on public.scores;
create policy "update_any" on public.scores
  for update using (true) with check (true);
