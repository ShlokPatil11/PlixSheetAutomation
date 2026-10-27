-- Shared Editing Manager Dispatch Desk
-- Adds manager/member responsibilities, assignment metadata, history, and realtime.

alter table public.workspace_members
  add column if not exists team_role text not null default 'member'
  check (team_role in ('manager', 'member'));

alter table public.tasks
  add column if not exists editor_assigned_by uuid references auth.users(id) on delete set null,
  add column if not exists editor_assigned_at timestamptz;

create table if not exists public.task_editor_assignments (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  task_id text not null references public.tasks(id) on delete cascade,
  editor_id uuid references auth.users(id) on delete set null,
  assigned_by uuid not null references auth.users(id),
  assigned_at timestamptz not null default now()
);

create index if not exists task_editor_assignments_task_idx
  on public.task_editor_assignments (task_id, assigned_at desc);

create or replace function private.can_manage_editing(p_workspace_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.workspace_members wm
    where wm.workspace_id = p_workspace_id
      and wm.user_id = (select auth.uid())
      and (
        wm.team = 'administrator'
        or (wm.team = 'video' and wm.team_role = 'manager')
      )
  );
$$;

create or replace function public.record_editor_assignment()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.editor_id is distinct from old.editor_id then
    new.editor_assigned_by := (select auth.uid());
    new.editor_assigned_at := case when new.editor_id is null then null else now() end;

    if new.editor_id is not null then
      insert into public.task_editor_assignments (
        workspace_id, task_id, editor_id, assigned_by, assigned_at
      ) values (
        new.workspace_id, new.id, new.editor_id, (select auth.uid()), now()
      );
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists tasks_record_editor_assignment on public.tasks;
create trigger tasks_record_editor_assignment
before update of editor_id on public.tasks
for each row execute function public.record_editor_assignment();

alter table public.task_editor_assignments enable row level security;

drop policy if exists "editing_managers_assign_tasks" on public.tasks;
create policy "editing_managers_assign_tasks" on public.tasks
for update to authenticated
using ((select private.can_manage_editing(workspace_id)))
with check ((select private.can_manage_editing(workspace_id)));

drop policy if exists "video_team_reads_assignment_history" on public.task_editor_assignments;
create policy "video_team_reads_assignment_history" on public.task_editor_assignments
for select to authenticated
using (
  exists (
    select 1 from public.workspace_members wm
    where wm.workspace_id = task_editor_assignments.workspace_id
      and wm.user_id = (select auth.uid())
      and wm.team in ('video', 'administrator')
  )
);

-- Editors see only their own editing tasks; managers retain the shared queue.
create or replace function private.can_access_task_state(p_workspace_id uuid, p_state text, p_editor_id uuid)
returns boolean
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_team text;
  v_team_role text;
begin
  select team, team_role into v_team, v_team_role
  from public.workspace_members
  where workspace_id = p_workspace_id
    and user_id = (select auth.uid())
  limit 1;

  if v_team is null then return false; end if;
  if v_team in ('administrator', 'brand') then return true; end if;
  if v_team = 'content' then
    return p_state in ('social_research', 'script_changes_requested', 'script_approval_pending');
  end if;
  if v_team = 'video' then
    return p_state in ('editing_queue', 'editing_in_progress', 'approval_pending', 'changes_requested')
      and (v_team_role = 'manager' or p_editor_id = (select auth.uid()));
  end if;
  if v_team = 'performance' then
    return p_state in ('ready_for_performance', 'publishing_in_progress', 'publishing_failed', 'published');
  end if;
  return false;
end;
$$;

drop policy if exists "tasks_team_scoped" on public.tasks;
create policy "tasks_team_scoped" on public.tasks
for select to authenticated
using ((select private.can_access_task_state(workspace_id, state, editor_id)));

-- Safe to run whether or not the tables have already been added to Realtime.
do $$
begin
  begin
    alter publication supabase_realtime add table public.tasks;
  exception when duplicate_object then null;
  end;
  begin
    alter publication supabase_realtime add table public.task_editor_assignments;
  exception when duplicate_object then null;
  end;
end $$;

