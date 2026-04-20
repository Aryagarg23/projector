-- ============================================================
-- CROWD POLLS — one-shot Supabase setup
-- Run this once in the Supabase SQL editor. Idempotent.
-- ============================================================

-- Clean slate (safe to re-run)
drop table if exists public.votes cascade;
drop table if exists public.polls cascade;
drop table if exists public.poll_state cascade;

-- ── polls: one row per question ─────────────────────────────
create table public.polls (
  id           bigint generated always as identity primary key,
  slide_id     text not null unique,           -- matches slideConfig id: 'q1', 'q2'...
  question     text not null,
  option_a     text not null,
  option_b     text not null,
  option_c     text not null,
  option_d     text not null,
  position     int  not null default 0,        -- display order
  created_at   timestamptz not null default now()
);

-- ── votes: one row per vote submitted ───────────────────────
create table public.votes (
  id           bigint generated always as identity primary key,
  poll_id      bigint not null references public.polls(id) on delete cascade,
  choice       char(1) not null check (choice in ('A','B','C','D')),
  created_at   timestamptz not null default now()
);

create index on public.votes (poll_id);
create index on public.votes (poll_id, choice);

-- ── poll_state: singleton pointer to the currently-active poll ─
create table public.poll_state (
  id            int primary key default 1,
  active_poll_id bigint references public.polls(id) on delete set null,
  updated_at    timestamptz not null default now(),
  constraint singleton check (id = 1)
);
insert into public.poll_state (id, active_poll_id) values (1, null)
  on conflict (id) do nothing;

-- ── view: live tallies per poll/choice ──────────────────────
create or replace view public.vote_counts as
select
  p.id        as poll_id,
  p.slide_id,
  c.choice,
  coalesce(count(v.id), 0) as votes
from public.polls p
cross join (values ('A'),('B'),('C'),('D')) as c(choice)
left join public.votes v on v.poll_id = p.id and v.choice = c.choice
group by p.id, p.slide_id, c.choice;

-- ── Row Level Security ──────────────────────────────────────
alter table public.polls       enable row level security;
alter table public.votes       enable row level security;
alter table public.poll_state  enable row level security;

-- anyone (anon) can read polls + state + votes
create policy polls_read   on public.polls       for select using (true);
create policy state_read   on public.poll_state  for select using (true);
create policy votes_read   on public.votes       for select using (true);

-- anyone can insert a vote (the RPC runs as definer anyway, but this
-- also lets the client do direct inserts if desired)
create policy votes_insert on public.votes       for insert with check (true);

-- Admin actions from /admin (no auth — this is a LAN/event tool).
-- If you deploy publicly, lock these down and move the admin behind auth.
create policy state_update on public.poll_state  for update using (true) with check (true);
create policy votes_delete on public.votes       for delete using (true);

grant select  on public.vote_counts to anon, authenticated;

-- ── Realtime: broadcast votes + state changes ───────────────
alter publication supabase_realtime add table public.votes;
alter publication supabase_realtime add table public.poll_state;

-- ============================================================
-- SEED: the 4 questions from slideConfig.ts
-- ============================================================
insert into public.polls (slide_id, question, option_a, option_b, option_c, option_d, position) values
  ('q1', 'Question about New American Dream',
         'Option A', 'Option B', 'Option C', 'Option D', 1),
  ('q2', 'Question about Lifemaxxing',
         'Option A', 'Option B', 'Option C', 'Option D', 2),
  ('q3', 'Question about Techno Social Tug of War',
         'Option A', 'Option B', 'Option C', 'Option D', 3),
  ('q4', 'Question about Non Invasive Age',
         'Option A', 'Option B', 'Option C', 'Option D', 4)
on conflict (slide_id) do update set
  question = excluded.question,
  option_a = excluded.option_a,
  option_b = excluded.option_b,
  option_c = excluded.option_c,
  option_d = excluded.option_d,
  position = excluded.position;

-- Start with q1 active
update public.poll_state
set active_poll_id = (select id from public.polls where slide_id = 'q1'),
    updated_at = now()
where id = 1;
