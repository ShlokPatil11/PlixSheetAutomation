-- Central state document used by the current PlixOps application runtime.
-- Access is server-side only through SUPABASE_SERVICE_ROLE_KEY.

create table if not exists public.plix_app_state (
  id text primary key,
  payload jsonb not null,
  revision bigint not null default 1,
  updated_at timestamptz not null default now(),
  updated_by text not null default 'System'
);

alter table public.plix_app_state enable row level security;

revoke all on table public.plix_app_state from anon, authenticated;

create table if not exists public.plix_state_events (
  id bigint generated always as identity primary key,
  state_id text not null,
  revision bigint not null,
  updated_by text not null,
  created_at timestamptz not null default now()
);

alter table public.plix_state_events enable row level security;
revoke all on table public.plix_state_events from anon, authenticated;

create or replace function public.emit_plix_state_event()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.plix_state_events (state_id, revision, updated_by)
  values (new.id, new.revision, new.updated_by);
  return new;
end;
$$;

drop trigger if exists plix_app_state_emit_event on public.plix_app_state;
create trigger plix_app_state_emit_event
after update on public.plix_app_state
for each row execute function public.emit_plix_state_event();

do $$
begin
  begin
    alter publication supabase_realtime add table public.plix_state_events;
  exception when duplicate_object then null;
  end;
end $$;
