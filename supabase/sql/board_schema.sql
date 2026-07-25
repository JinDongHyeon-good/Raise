-- Piclick community board — run once in Supabase SQL Editor
-- Dashboard → SQL → New query → paste → Run

create extension if not exists "pgcrypto";

-- Posts
create table if not exists public."BOARD_POSTS" (
  id uuid primary key default gen_random_uuid(),
  author_auth_id uuid not null references public."USER_MST" (auth_id) on delete cascade,
  title text not null,
  content_html text not null,
  post_type text not null default 'free',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint board_posts_post_type_check check (post_type in ('free', 'meetup', 'review', 'tip', 'question'))
);

-- Comments (with nested replies via parent_id)
create table if not exists public."BOARD_COMMENTS" (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public."BOARD_POSTS" (id) on delete cascade,
  author_auth_id uuid not null references public."USER_MST" (auth_id) on delete cascade,
  parent_id uuid references public."BOARD_COMMENTS" (id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

-- Likes
create table if not exists public."BOARD_POST_LIKES" (
  post_id uuid not null references public."BOARD_POSTS" (id) on delete cascade,
  user_auth_id uuid not null references public."USER_MST" (auth_id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_auth_id)
);

alter table public."BOARD_COMMENTS"
  add column if not exists parent_id uuid references public."BOARD_COMMENTS" (id) on delete cascade;

alter table public."BOARD_POSTS"
  add column if not exists post_type text not null default 'free';

alter table public."BOARD_POSTS"
  drop constraint if exists board_posts_post_type_check;

alter table public."BOARD_POSTS"
  add constraint board_posts_post_type_check
  check (post_type in ('free', 'meetup', 'review', 'tip', 'question'));

create index if not exists board_posts_created_at_idx
  on public."BOARD_POSTS" (created_at desc)
  where deleted_at is null;

create index if not exists board_posts_author_idx
  on public."BOARD_POSTS" (author_auth_id, created_at desc)
  where deleted_at is null;

create index if not exists board_posts_type_idx
  on public."BOARD_POSTS" (post_type, created_at desc)
  where deleted_at is null;

create index if not exists board_comments_post_idx
  on public."BOARD_COMMENTS" (post_id, created_at)
  where deleted_at is null;

create index if not exists board_comments_parent_idx
  on public."BOARD_COMMENTS" (parent_id)
  where deleted_at is null;

-- RLS
alter table public."BOARD_POSTS" enable row level security;
alter table public."BOARD_COMMENTS" enable row level security;
alter table public."BOARD_POST_LIKES" enable row level security;

-- BOARD_POSTS policies
drop policy if exists "board_posts_select_all" on public."BOARD_POSTS";
create policy "board_posts_select_all" on public."BOARD_POSTS"
  for select to anon, authenticated
  using (deleted_at is null);

drop policy if exists "board_posts_insert_own" on public."BOARD_POSTS";
create policy "board_posts_insert_own" on public."BOARD_POSTS"
  for insert to authenticated
  with check (auth.uid() = author_auth_id);

drop policy if exists "board_posts_update_own" on public."BOARD_POSTS";
create policy "board_posts_update_own" on public."BOARD_POSTS"
  for update to authenticated
  using (auth.uid() = author_auth_id)
  with check (auth.uid() = author_auth_id);

drop policy if exists "board_posts_delete_own" on public."BOARD_POSTS";
create policy "board_posts_delete_own" on public."BOARD_POSTS"
  for delete to authenticated
  using (auth.uid() = author_auth_id);

-- BOARD_COMMENTS policies
drop policy if exists "board_comments_select_all" on public."BOARD_COMMENTS";
create policy "board_comments_select_all" on public."BOARD_COMMENTS"
  for select to anon, authenticated
  using (deleted_at is null);

drop policy if exists "board_comments_insert_own" on public."BOARD_COMMENTS";
create policy "board_comments_insert_own" on public."BOARD_COMMENTS"
  for insert to authenticated
  with check (auth.uid() = author_auth_id);

drop policy if exists "board_comments_update_own" on public."BOARD_COMMENTS";
create policy "board_comments_update_own" on public."BOARD_COMMENTS"
  for update to authenticated
  using (auth.uid() = author_auth_id)
  with check (auth.uid() = author_auth_id);

drop policy if exists "board_comments_delete_own" on public."BOARD_COMMENTS";
create policy "board_comments_delete_own" on public."BOARD_COMMENTS"
  for delete to authenticated
  using (auth.uid() = author_auth_id);

-- BOARD_POST_LIKES policies
drop policy if exists "board_likes_select_all" on public."BOARD_POST_LIKES";
create policy "board_likes_select_all" on public."BOARD_POST_LIKES"
  for select to anon, authenticated
  using (true);

drop policy if exists "board_likes_insert_own" on public."BOARD_POST_LIKES";
create policy "board_likes_insert_own" on public."BOARD_POST_LIKES"
  for insert to authenticated
  with check (auth.uid() = user_auth_id);

drop policy if exists "board_likes_delete_own" on public."BOARD_POST_LIKES";
create policy "board_likes_delete_own" on public."BOARD_POST_LIKES"
  for delete to authenticated
  using (auth.uid() = user_auth_id);

-- Storage bucket for editor images
insert into storage.buckets (id, name, public)
values ('board-images', 'board-images', true)
on conflict (id) do nothing;

drop policy if exists "board_images_public_read" on storage.objects;
create policy "board_images_public_read" on storage.objects
  for select to anon, authenticated
  using (bucket_id = 'board-images');

drop policy if exists "board_images_auth_upload" on storage.objects;
create policy "board_images_auth_upload" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'board-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "board_images_auth_update" on storage.objects;
create policy "board_images_auth_update" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'board-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "board_images_auth_delete" on storage.objects;
create policy "board_images_auth_delete" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'board-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

notify pgrst, 'reload schema';
