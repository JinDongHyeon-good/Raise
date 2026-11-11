-- Raise 커뮤니티 v2 — Supabase SQL Editor에서 한 번 실행 (여러 번 실행해도 안전)
-- 선행: board_schema.sql (BOARD_POSTS / BOARD_COMMENTS / BOARD_POST_LIKES / USER_MST)
--
-- 1) 게시판 탭: free(자유) analysis(코인분석) news(뉴스·정보) question(질문) profit(손익인증)
-- 2) 조회수: 같은 사람(로그인 사용자 또는 방문자 쿠키)은 하루(KST) 1회만 집계, 원자적 증가
-- 3) 좋아요·댓글 수를 글/댓글 행에 카운터로 유지 (트리거) → 목록 정렬·표시가 정확하고 빠름
-- 4) 댓글 좋아요
-- 5) 사용자가 카운터 컬럼을 직접 수정하지 못하도록 컬럼 단위 UPDATE 권한 제한

begin;

-- ── 1. 게시판 탭 ──────────────────────────────────────────────
alter table public."BOARD_POSTS" drop constraint if exists board_posts_post_type_check;
update public."BOARD_POSTS" set post_type = 'free'
  where post_type not in ('free', 'analysis', 'news', 'question', 'profit');
alter table public."BOARD_POSTS"
  add constraint board_posts_post_type_check
  check (post_type in ('free', 'analysis', 'news', 'question', 'profit'));

-- ── 2~3. 카운터 컬럼 ──────────────────────────────────────────
alter table public."BOARD_POSTS"
  add column if not exists view_count bigint not null default 0,
  add column if not exists like_count integer not null default 0,
  add column if not exists comment_count integer not null default 0;

alter table public."BOARD_COMMENTS"
  add column if not exists like_count integer not null default 0;

-- ── 4. 댓글 좋아요 ────────────────────────────────────────────
create table if not exists public."BOARD_COMMENT_LIKES" (
  comment_id uuid not null references public."BOARD_COMMENTS" (id) on delete cascade,
  user_auth_id uuid not null references public."USER_MST" (auth_id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (comment_id, user_auth_id)
);

alter table public."BOARD_COMMENT_LIKES" enable row level security;

drop policy if exists "board_comment_likes_select_all" on public."BOARD_COMMENT_LIKES";
create policy "board_comment_likes_select_all" on public."BOARD_COMMENT_LIKES"
  for select to anon, authenticated using (true);

drop policy if exists "board_comment_likes_insert_own" on public."BOARD_COMMENT_LIKES";
create policy "board_comment_likes_insert_own" on public."BOARD_COMMENT_LIKES"
  for insert to authenticated with check ((select auth.uid()) = user_auth_id);

drop policy if exists "board_comment_likes_delete_own" on public."BOARD_COMMENT_LIKES";
create policy "board_comment_likes_delete_own" on public."BOARD_COMMENT_LIKES"
  for delete to authenticated using ((select auth.uid()) = user_auth_id);

-- ── 조회 기록 (직접 접근 불가, 함수로만) ──────────────────────
create table if not exists public."BOARD_POST_VIEWS" (
  post_id uuid not null references public."BOARD_POSTS" (id) on delete cascade,
  viewer_key text not null,
  viewed_on date not null default ((now() at time zone 'Asia/Seoul')::date),
  created_at timestamptz not null default now(),
  primary key (post_id, viewer_key, viewed_on)
);
alter table public."BOARD_POST_VIEWS" enable row level security;
-- 정책 없음 = anon/authenticated 접근 불가

-- ── 카운터 트리거 ─────────────────────────────────────────────
create or replace function public.board_sync_post_like_count()
returns trigger language plpgsql security definer set search_path = public as $$
declare target uuid := coalesce(new.post_id, old.post_id);
begin
  update public."BOARD_POSTS"
    set like_count = (select count(*) from public."BOARD_POST_LIKES" where post_id = target)
    where id = target;
  return null;
end $$;

drop trigger if exists board_post_likes_count on public."BOARD_POST_LIKES";
create trigger board_post_likes_count
  after insert or delete on public."BOARD_POST_LIKES"
  for each row execute function public.board_sync_post_like_count();

create or replace function public.board_sync_comment_like_count()
returns trigger language plpgsql security definer set search_path = public as $$
declare target uuid := coalesce(new.comment_id, old.comment_id);
begin
  update public."BOARD_COMMENTS"
    set like_count = (select count(*) from public."BOARD_COMMENT_LIKES" where comment_id = target)
    where id = target;
  return null;
end $$;

drop trigger if exists board_comment_likes_count on public."BOARD_COMMENT_LIKES";
create trigger board_comment_likes_count
  after insert or delete on public."BOARD_COMMENT_LIKES"
  for each row execute function public.board_sync_comment_like_count();

create or replace function public.board_sync_post_comment_count()
returns trigger language plpgsql security definer set search_path = public as $$
declare target uuid := coalesce(new.post_id, old.post_id);
begin
  update public."BOARD_POSTS"
    set comment_count = (
      select count(*) from public."BOARD_COMMENTS" where post_id = target and deleted_at is null
    )
    where id = target;
  return null;
end $$;

drop trigger if exists board_comments_count on public."BOARD_COMMENTS";
create trigger board_comments_count
  after insert or delete or update of deleted_at on public."BOARD_COMMENTS"
  for each row execute function public.board_sync_post_comment_count();

revoke all on function public.board_sync_post_like_count() from public, anon, authenticated;
revoke all on function public.board_sync_comment_like_count() from public, anon, authenticated;
revoke all on function public.board_sync_post_comment_count() from public, anon, authenticated;

-- ── 조회수 등록 함수 (서버의 service_role 키로만 호출) ────────
create or replace function public.board_register_view(p_post_id uuid, p_viewer_key text)
returns bigint language plpgsql security definer set search_path = public as $$
declare
  inserted integer;
  result bigint;
begin
  if p_viewer_key is null or length(p_viewer_key) = 0 or length(p_viewer_key) > 128 then
    raise exception 'invalid viewer key';
  end if;

  insert into public."BOARD_POST_VIEWS" (post_id, viewer_key)
    select p_post_id, p_viewer_key
    where exists (select 1 from public."BOARD_POSTS" where id = p_post_id and deleted_at is null)
    on conflict do nothing;
  get diagnostics inserted = row_count;

  if inserted > 0 then
    update public."BOARD_POSTS" set view_count = view_count + 1
      where id = p_post_id
      returning view_count into result;
  else
    select view_count into result from public."BOARD_POSTS" where id = p_post_id;
  end if;

  return coalesce(result, 0);
end $$;

revoke all on function public.board_register_view(uuid, text) from public, anon, authenticated;
grant execute on function public.board_register_view(uuid, text) to service_role;

-- ── 5. 카운터 컬럼은 사용자가 직접 못 바꾸게 ─────────────────
revoke update on public."BOARD_POSTS" from anon, authenticated;
grant update (title, content_html, post_type, updated_at, deleted_at) on public."BOARD_POSTS" to authenticated;

revoke update on public."BOARD_COMMENTS" from anon, authenticated;
grant update (content, updated_at, deleted_at) on public."BOARD_COMMENTS" to authenticated;

-- ── 인덱스 ────────────────────────────────────────────────────
create index if not exists board_posts_like_idx
  on public."BOARD_POSTS" (like_count desc, created_at desc) where deleted_at is null;
create index if not exists board_posts_view_idx
  on public."BOARD_POSTS" (view_count desc, created_at desc) where deleted_at is null;
create index if not exists board_comment_likes_user_idx
  on public."BOARD_COMMENT_LIKES" (user_auth_id);

-- ── 기존 데이터 카운터 백필 ───────────────────────────────────
update public."BOARD_POSTS" p set
  like_count = (select count(*) from public."BOARD_POST_LIKES" l where l.post_id = p.id),
  comment_count = (select count(*) from public."BOARD_COMMENTS" c where c.post_id = p.id and c.deleted_at is null);

update public."BOARD_COMMENTS" c set
  like_count = (select count(*) from public."BOARD_COMMENT_LIKES" l where l.comment_id = c.id);

commit;

notify pgrst, 'reload schema';
