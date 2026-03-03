-- Run this in Supabase SQL Editor after your submissions table exists.
-- Enforces one vote per user per submission, while allowing users to vote on multiple submissions.

alter table if exists public.hackathons
add column if not exists logo_url text;

create table if not exists public.submission_votes (
  submission_id text not null references public.submissions(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (submission_id, user_id)
);

create index if not exists submission_votes_user_id_idx on public.submission_votes (user_id);

alter table public.submission_votes enable row level security;

drop policy if exists "submission_votes_read_own" on public.submission_votes;
create policy "submission_votes_read_own" on public.submission_votes
for select
using (auth.uid() = user_id);

drop policy if exists "submission_votes_insert_own" on public.submission_votes;
create policy "submission_votes_insert_own" on public.submission_votes
for insert
with check (auth.uid() = user_id);

grant select, insert on public.submission_votes to authenticated;

drop function if exists public.increment_submission_votes(text);
create function public.increment_submission_votes(p_submission_id text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  current_uid uuid;
  next_votes integer;
  inserted_count integer;
  vote_applied boolean;
begin
  current_uid := auth.uid();
  if current_uid is null then
    raise exception 'Authentication required to vote.';
  end if;

  insert into public.submission_votes (submission_id, user_id)
  values (p_submission_id, current_uid)
  on conflict do nothing;

  get diagnostics inserted_count = row_count;
  vote_applied := inserted_count > 0;

  if vote_applied then
    update public.submissions
    set votes = coalesce(votes, 0) + 1
    where id = p_submission_id
    returning votes into next_votes;
  else
    select votes
    into next_votes
    from public.submissions
    where id = p_submission_id;
  end if;

  if next_votes is null then
    raise exception 'Submission not found: %', p_submission_id;
  end if;

  return jsonb_build_object(
    'votes', next_votes,
    'applied', vote_applied
  );
end;
$$;

grant execute on function public.increment_submission_votes(text) to authenticated;
