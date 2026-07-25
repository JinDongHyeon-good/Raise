-- Add post_type to existing BOARD_POSTS (run in Supabase SQL Editor)

alter table public."BOARD_POSTS"
  add column if not exists post_type text not null default 'free';

alter table public."BOARD_POSTS"
  drop constraint if exists board_posts_post_type_check;

alter table public."BOARD_POSTS"
  add constraint board_posts_post_type_check
  check (post_type in ('free', 'meetup', 'review', 'tip', 'question'));

create index if not exists board_posts_type_idx
  on public."BOARD_POSTS" (post_type, created_at desc)
  where deleted_at is null;

notify pgrst, 'reload schema';
