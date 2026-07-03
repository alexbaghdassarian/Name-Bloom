-- NameBloom — Supabase schema
-- Paste this whole file into the Supabase SQL Editor and run it once.
-- (Dashboard → SQL Editor → New query → paste → Run.)
-- Names themselves live in the frontend (public/names.json); the database only
-- stores people, projects, and their swipes/decisions.

-- ─────────────────────────────────────────────────────────────
-- Profiles (one row per auth user)
-- ─────────────────────────────────────────────────────────────
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  name        text not null default 'Someone',
  email       text not null,
  partner_id  uuid references public.profiles(id),
  created_at  timestamptz not null default now()
);

-- Auto-create a profile when a new auth user signs up.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, name, email)
  values (new.id, coalesce(new.raw_user_meta_data->>'name', 'Someone'), new.email)
  on conflict (id) do nothing;
  return new;
end; $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ─────────────────────────────────────────────────────────────
-- Projects + membership
-- ─────────────────────────────────────────────────────────────
create table if not exists public.projects (
  id                 uuid primary key default gen_random_uuid(),
  seed_id            uuid not null default gen_random_uuid(),
  name               text not null,
  surname            text default '',
  gender_filter      text default 'all',
  included_cultures  text[] not null default '{}',
  favorite_cultures  text[] not null default '{}',
  target_matches     int  not null default 100,
  owner_id           uuid not null references public.profiles(id),
  created_at         timestamptz not null default now()
);

create table if not exists public.project_members (
  project_id  uuid references public.projects(id) on delete cascade,
  user_id     uuid references public.profiles(id) on delete cascade,
  primary key (project_id, user_id)
);

-- ─────────────────────────────────────────────────────────────
-- Swipes, finalists, vetoes
-- ─────────────────────────────────────────────────────────────
create table if not exists public.swipes (
  project_id  uuid references public.projects(id) on delete cascade,
  user_id     uuid references public.profiles(id) on delete cascade,
  name_id     text not null,
  liked       boolean not null,
  superliked  boolean not null default false,
  at          timestamptz not null default now(),
  primary key (project_id, user_id, name_id)
);

create table if not exists public.finalists (
  project_id  uuid references public.projects(id) on delete cascade,
  user_id     uuid references public.profiles(id) on delete cascade,
  name_id     text not null,
  primary key (project_id, user_id, name_id)
);

create table if not exists public.vetoes (
  project_id  uuid references public.projects(id) on delete cascade,
  user_id     uuid references public.profiles(id) on delete cascade,
  name_id     text not null,
  primary key (project_id, user_id, name_id)
);

-- ─────────────────────────────────────────────────────────────
-- Membership helper (SECURITY DEFINER avoids RLS recursion)
-- ─────────────────────────────────────────────────────────────
create or replace function public.is_member(pid uuid)
returns boolean language sql security definer stable set search_path = public as $$
  select exists (
    select 1 from public.project_members
    where project_id = pid and user_id = auth.uid()
  );
$$;

-- ─────────────────────────────────────────────────────────────
-- Row Level Security
-- ─────────────────────────────────────────────────────────────
alter table public.profiles        enable row level security;
alter table public.projects        enable row level security;
alter table public.project_members enable row level security;
alter table public.swipes          enable row level security;
alter table public.finalists       enable row level security;
alter table public.vetoes          enable row level security;

-- profiles: any signed-in user may read (needed to find a partner by email);
-- you may only edit your own row.
drop policy if exists profiles_read on public.profiles;
create policy profiles_read on public.profiles for select to authenticated using (true);
drop policy if exists profiles_update on public.profiles;
create policy profiles_update on public.profiles for update to authenticated using (id = auth.uid());

-- projects: visible to and editable by members.
drop policy if exists projects_read on public.projects;
create policy projects_read on public.projects for select to authenticated using (public.is_member(id));
drop policy if exists projects_write on public.projects;
create policy projects_write on public.projects for update to authenticated using (public.is_member(id));
drop policy if exists projects_insert on public.projects;
create policy projects_insert on public.projects for insert to authenticated with check (owner_id = auth.uid());
-- only the person who created a project may delete it (cascades to members/swipes/finalists/vetoes)
drop policy if exists projects_delete on public.projects;
create policy projects_delete on public.projects for delete to authenticated using (owner_id = auth.uid());

-- membership: you can see your own memberships and those of your projects.
drop policy if exists members_read on public.project_members;
create policy members_read on public.project_members for select to authenticated
  using (user_id = auth.uid() or public.is_member(project_id));

-- swipes / finalists / vetoes: members can read all rows in the project;
-- you may only write your own rows.
drop policy if exists swipes_read on public.swipes;
create policy swipes_read on public.swipes for select to authenticated using (public.is_member(project_id));
drop policy if exists swipes_write on public.swipes;
create policy swipes_write on public.swipes for all to authenticated
  using (user_id = auth.uid() and public.is_member(project_id))
  with check (user_id = auth.uid() and public.is_member(project_id));

drop policy if exists finalists_read on public.finalists;
create policy finalists_read on public.finalists for select to authenticated using (public.is_member(project_id));
drop policy if exists finalists_write on public.finalists;
create policy finalists_write on public.finalists for all to authenticated
  using (user_id = auth.uid() and public.is_member(project_id))
  with check (user_id = auth.uid() and public.is_member(project_id));

drop policy if exists vetoes_read on public.vetoes;
create policy vetoes_read on public.vetoes for select to authenticated using (public.is_member(project_id));
drop policy if exists vetoes_write on public.vetoes;
create policy vetoes_write on public.vetoes for all to authenticated
  using (user_id = auth.uid() and public.is_member(project_id))
  with check (user_id = auth.uid() and public.is_member(project_id));

-- ─────────────────────────────────────────────────────────────
-- link_partner(partner_email): mutually link two profiles
-- ─────────────────────────────────────────────────────────────
create or replace function public.link_partner(partner_email text)
returns void language plpgsql security definer set search_path = public as $$
declare
  me      uuid := auth.uid();
  partner uuid;
begin
  select id into partner from public.profiles where lower(email) = lower(partner_email) limit 1;
  if partner is null then raise exception 'No account with that email'; end if;
  if partner = me   then raise exception 'That is your own account'; end if;
  update public.profiles set partner_id = partner where id = me;
  update public.profiles set partner_id = me      where id = partner;
end; $$;

-- ─────────────────────────────────────────────────────────────
-- create_project(...): create a project and add both partners as members
-- ─────────────────────────────────────────────────────────────
create or replace function public.create_project(
  p_name text, p_surname text, p_gender text,
  p_included text[], p_favorite text[], p_target int
) returns uuid language plpgsql security definer set search_path = public as $$
declare
  me       uuid := auth.uid();
  partner  uuid;
  proj_id  uuid;
begin
  select partner_id into partner from public.profiles where id = me;

  insert into public.projects (name, surname, gender_filter, included_cultures, favorite_cultures, target_matches, owner_id)
  values (p_name, p_surname, p_gender, p_included, p_favorite, p_target, me)
  returning id into proj_id;

  insert into public.project_members (project_id, user_id) values (proj_id, me);
  if partner is not null then
    insert into public.project_members (project_id, user_id)
    values (proj_id, partner) on conflict do nothing;
  end if;

  return proj_id;
end; $$;

grant execute on function public.link_partner(text) to authenticated;
grant execute on function public.create_project(text, text, text, text[], text[], int) to authenticated;

-- ─────────────────────────────────────────────────────────────
-- Realtime — push swipe/finalist/veto changes to the other partner live
-- ─────────────────────────────────────────────────────────────
alter publication supabase_realtime add table public.swipes;
alter publication supabase_realtime add table public.finalists;
alter publication supabase_realtime add table public.vetoes;
