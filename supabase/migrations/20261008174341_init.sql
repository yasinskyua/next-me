-- Щоденник Next Me: один «План перемоги» на користувача + датовані записи.
-- Кожен бачить і змінює лише власні рядки; anon не має доступу взагалі.

create table public.plans (
  user_id uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  -- відповіді бланка: { "<id поля>": значення }, схема полів живе у фронтенді
  answers jsonb not null default '{}'::jsonb
    check (jsonb_typeof(answers) = 'object' and pg_column_size(answers) <= 262144),
  updated_at timestamptz not null default now()
);

create table public.entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  entry_date date not null default current_date,
  body text not null check (char_length(body) between 1 and 20000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index entries_user_date_idx on public.entries (user_id, entry_date desc, created_at desc);

-- updated_at ставить база, а не клієнт
create schema if not exists private;

create function private.touch_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger plans_touch before update on public.plans
  for each row execute function private.touch_updated_at();
create trigger entries_touch before update on public.entries
  for each row execute function private.touch_updated_at();

-- Data API: таблиці відкриті лише залогіненим, рядки фільтрує RLS
alter table public.plans enable row level security;
alter table public.entries enable row level security;

revoke all on table public.plans, public.entries from anon;
grant select, insert, update, delete on table public.plans, public.entries to authenticated;

create policy "plans: read own" on public.plans for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "plans: insert own" on public.plans for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy "plans: update own" on public.plans for update to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "plans: delete own" on public.plans for delete to authenticated
  using ((select auth.uid()) = user_id);

create policy "entries: read own" on public.entries for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "entries: insert own" on public.entries for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy "entries: update own" on public.entries for update to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "entries: delete own" on public.entries for delete to authenticated
  using ((select auth.uid()) = user_id);
