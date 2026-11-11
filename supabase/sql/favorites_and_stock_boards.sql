-- 찐투: 유튜브 채널 즐겨찾기 + 주식 게시판 — SQL Editor 또는 supabase db query 로 실행 (여러 번 실행해도 안전)

begin;

-- ── 1. 유저별 유튜브 채널 즐겨찾기 ───────────────────────────
create table if not exists public."FAVORITE_CHANNELS" (
  user_auth_id uuid not null references auth.users (id) on delete cascade,
  channel_id text not null check (channel_id ~ '^UC[A-Za-z0-9_-]{22}$'),
  channel_title text not null default '',
  thumbnail text not null default '',
  created_at timestamptz not null default now(),
  primary key (user_auth_id, channel_id)
);

alter table public."FAVORITE_CHANNELS" enable row level security;

drop policy if exists "favorite_channels_select_own" on public."FAVORITE_CHANNELS";
create policy "favorite_channels_select_own" on public."FAVORITE_CHANNELS"
  for select to authenticated using ((select auth.uid()) = user_auth_id);

drop policy if exists "favorite_channels_insert_own" on public."FAVORITE_CHANNELS";
create policy "favorite_channels_insert_own" on public."FAVORITE_CHANNELS"
  for insert to authenticated with check ((select auth.uid()) = user_auth_id);

drop policy if exists "favorite_channels_delete_own" on public."FAVORITE_CHANNELS";
create policy "favorite_channels_delete_own" on public."FAVORITE_CHANNELS"
  for delete to authenticated using ((select auth.uid()) = user_auth_id);

create index if not exists favorite_channels_user_idx on public."FAVORITE_CHANNELS" (user_auth_id, created_at desc);

-- 사용자당 최대 50개
create or replace function public.favorite_channels_limit()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if (select count(*) from public."FAVORITE_CHANNELS" where user_auth_id = new.user_auth_id) >= 50 then
    raise exception 'favorite channel limit reached' using errcode = 'P0001';
  end if;
  return new;
end $$;

drop trigger if exists favorite_channels_limit on public."FAVORITE_CHANNELS";
create trigger favorite_channels_limit before insert on public."FAVORITE_CHANNELS"
  for each row execute function public.favorite_channels_limit();

revoke all on function public.favorite_channels_limit() from public, anon, authenticated;

-- ── 2. 주식 게시판 추가 ──────────────────────────────────────
alter table public."BOARD_POSTS" drop constraint if exists board_posts_post_type_check;
alter table public."BOARD_POSTS"
  add constraint board_posts_post_type_check
  check (post_type in ('free', 'analysis', 'stock_analysis', 'us_stock', 'kr_stock', 'news', 'question', 'profit'));

commit;

notify pgrst, 'reload schema';
