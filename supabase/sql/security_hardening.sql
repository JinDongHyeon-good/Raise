-- 보안 강화 (2026-11-11 점검 결과)
-- 1) RLS가 꺼져 있던 테이블 켜기 — 공개 키(브라우저에 들어 있음)로 글·댓글·회원을 지우거나 고칠 수 있던 문제
-- 2) 비로그인(anon) 쓰기 권한 전부 회수
-- 3) 글·댓글 추가 시 조회수·추천수 등 카운터를 직접 넣지 못하게 컬럼 단위 권한
-- 4) 댓글: 삭제된 글·다른 글의 댓글에 답글 금지, 길이 제한
-- 5) 사용자당 개수 제한 트리거를 동시 요청에도 안전하게
-- 6) 영상 필터 기본값을 계정에 저장하는 USER_PREFERENCES
begin;

-- ── 1. RLS 켜기 ────────────────────────────────────────────
alter table public."BOARD_POSTS" enable row level security;
alter table public."BOARD_COMMENTS" enable row level security;
alter table public."BOARD_POST_LIKES" enable row level security;
alter table public."USER_MST" enable row level security;
alter table public."TAROT_READING_LOG" enable row level security;

-- 예전 서비스 로그 (방문자 IP 포함). 앱에서 안 쓰므로 서버 키 외에는 아무도 못 보게
revoke all on public."TAROT_READING_LOG" from anon, authenticated;
drop policy if exists "tarot_reading_log_insert_own" on public."TAROT_READING_LOG";
drop policy if exists "tarot_reading_log_select_own" on public."TAROT_READING_LOG";

-- ── 2. anon 쓰기 회수 (읽기는 정책이 정함) ──────────────────
revoke insert, update, delete, truncate, references, trigger on all tables in schema public from anon;
alter default privileges in schema public revoke insert, update, delete, truncate, references, trigger on tables from anon;
revoke truncate, references, trigger on all tables in schema public from authenticated;

-- ── 3. USER_MST: 닉네임은 공개(글쓴이 표시·중복 확인), 나머지는 비공개 ──
drop policy if exists "USER_MST_select_own" on public."USER_MST";
drop policy if exists "USER_MST_select_public" on public."USER_MST";
create policy "USER_MST_select_public" on public."USER_MST" for select to anon, authenticated using (true);
revoke select on public."USER_MST" from anon, authenticated;
grant select (auth_id, nickname) on public."USER_MST" to anon, authenticated;
-- 본인 행 추가·닉네임 수정만 (사용 횟수 등은 서버 전용)
revoke insert, update, delete on public."USER_MST" from authenticated;
grant insert (auth_id, nickname, use_count) on public."USER_MST" to authenticated;
grant update (nickname, updated_at) on public."USER_MST" to authenticated;
alter table public."USER_MST" drop constraint if exists user_mst_nickname_len;
alter table public."USER_MST" add constraint user_mst_nickname_len check (char_length(nickname) between 1 and 30) not valid;
alter table public."USER_MST" drop constraint if exists user_mst_use_count_zero_on_insert;

-- ── 4. 글·댓글: 카운터·작성 시각은 사용자가 못 넣게 ──────────
revoke insert on public."BOARD_POSTS" from authenticated;
grant insert (author_auth_id, title, content_html, post_type) on public."BOARD_POSTS" to authenticated;
revoke insert on public."BOARD_COMMENTS" from authenticated;
grant insert (post_id, author_auth_id, parent_id, content) on public."BOARD_COMMENTS" to authenticated;

alter table public."BOARD_POSTS" drop constraint if exists board_posts_size;
alter table public."BOARD_POSTS" add constraint board_posts_size
  check (char_length(title) <= 120 and char_length(content_html) <= 100000) not valid;
alter table public."BOARD_COMMENTS" drop constraint if exists board_comments_size;
alter table public."BOARD_COMMENTS" add constraint board_comments_size check (char_length(content) <= 1000) not valid;

-- 댓글: 본인 + 삭제되지 않은 글 + 답글이면 같은 글의 댓글
drop policy if exists "board_comments_insert_own" on public."BOARD_COMMENTS";
create policy "board_comments_insert_own" on public."BOARD_COMMENTS" for insert to authenticated
  with check (
    (select auth.uid()) = author_auth_id
    and exists (select 1 from public."BOARD_POSTS" p where p.id = post_id and p.deleted_at is null)
    and (parent_id is null or exists (
      select 1 from public."BOARD_COMMENTS" c where c.id = parent_id and c.post_id = "BOARD_COMMENTS".post_id
    ))
  );

-- ── 5. 개수 제한 트리거: 같은 사용자의 동시 추가를 줄 세운다 ──
create or replace function public.favorite_channels_limit()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  perform pg_advisory_xact_lock(hashtextextended('fav:' || new.user_auth_id::text, 0));
  if (select count(*) from public."FAVORITE_CHANNELS" where user_auth_id = new.user_auth_id) >= 50 then
    raise exception 'favorite channel limit reached' using errcode = 'P0001';
  end if;
  return new;
end $$;

create or replace function public.search_keywords_limit()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  perform pg_advisory_xact_lock(hashtextextended('kw:' || new.user_auth_id::text, 0));
  if (select count(*) from public."SEARCH_KEYWORDS" where user_auth_id = new.user_auth_id) >= 20 then
    raise exception 'search keyword limit reached' using errcode = 'P0001';
  end if;
  return new;
end $$;

-- ── 6. 사용자 설정 (영상 필터 기본값) ─────────────────────────
create table if not exists public."USER_PREFERENCES" (
  user_auth_id uuid primary key references auth.users (id) on delete cascade,
  video_filters jsonb,
  updated_at timestamptz not null default now(),
  constraint user_preferences_filters_shape check (
    video_filters is null or (
      jsonb_typeof(video_filters) = 'object'
      and video_filters ->> 'order' in ('relevance', 'date', 'viewCount')
      and video_filters ->> 'uploaded' in ('any', 'day', 'week', 'month', 'year')
      and video_filters ->> 'length' in ('any', 'short', 'medium', 'long')
    )
  )
);
alter table public."USER_PREFERENCES" enable row level security;
revoke all on public."USER_PREFERENCES" from anon;
drop policy if exists "user_preferences_select_own" on public."USER_PREFERENCES";
create policy "user_preferences_select_own" on public."USER_PREFERENCES" for select to authenticated
  using ((select auth.uid()) = user_auth_id);
drop policy if exists "user_preferences_insert_own" on public."USER_PREFERENCES";
create policy "user_preferences_insert_own" on public."USER_PREFERENCES" for insert to authenticated
  with check ((select auth.uid()) = user_auth_id);
drop policy if exists "user_preferences_update_own" on public."USER_PREFERENCES";
create policy "user_preferences_update_own" on public."USER_PREFERENCES" for update to authenticated
  using ((select auth.uid()) = user_auth_id) with check ((select auth.uid()) = user_auth_id);

commit;

notify pgrst, 'reload schema';
