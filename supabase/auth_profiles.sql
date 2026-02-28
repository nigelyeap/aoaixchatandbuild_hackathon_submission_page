-- Run this in Supabase SQL Editor.
-- Adds: profiles table (for email/password users) and links submissions to auth users.

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  created_at timestamptz not null default now()
);

-- If profiles already exists from a previous run, add missing columns safely.
alter table public.profiles
add column if not exists email text;

alter table public.profiles enable row level security;

drop policy if exists "profiles_read_own" on public.profiles;
create policy "profiles_read_own" on public.profiles
for select
using (auth.uid() = id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles
for insert
with check (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
for update
using (auth.uid() = id)
with check (auth.uid() = id);

-- Optional: link submissions to a user (nullable for existing data)
alter table public.submissions
add column if not exists user_id uuid references auth.users(id) on delete set null;

create index if not exists submissions_user_id_idx on public.submissions (user_id);

create index if not exists profiles_email_idx on public.profiles (email);

