-- Drops everything created by supabase_setup.sql. Run in Supabase SQL editor.

drop view   if exists public.vote_counts cascade;
drop function if exists public.cast_vote(text, char, uuid) cascade;
drop table  if exists public.votes cascade;
drop table  if exists public.poll_state cascade;
drop table  if exists public.polls cascade;
