-- 사용자별 검색 키워드 (영상 검색창 아래 "# 키워드" 버튼)
-- 로그인 사용자만, 본인 것만 읽기·추가·삭제. 사용자당 최대 20개, 키워드 1~40자.
begin;

create table if not exists public."SEARCH_KEYWORDS" (
  id bigint generated always as identity primary key,
  user_auth_id uuid not null references auth.users (id) on delete cascade,
  keyword text not null check (char_length(btrim(keyword)) between 1 and 40),
  created_at timestamptz not null default now()
);

-- 같은 사용자 안에서 대소문자만 다른 중복 금지
create unique index if not exists search_keywords_user_keyword_uniq
  on public."SEARCH_KEYWORDS" (user_auth_id, lower(keyword));
create index if not exists search_keywords_user_idx
  on public."SEARCH_KEYWORDS" (user_auth_id, created_at);

alter table public."SEARCH_KEYWORDS" enable row level security;

drop policy if exists "search_keywords_select_own" on public."SEARCH_KEYWORDS";
create policy "search_keywords_select_own" on public."SEARCH_KEYWORDS"
  for select to authenticated using ((select auth.uid()) = user_auth_id);

drop policy if exists "search_keywords_insert_own" on public."SEARCH_KEYWORDS";
create policy "search_keywords_insert_own" on public."SEARCH_KEYWORDS"
  for insert to authenticated with check ((select auth.uid()) = user_auth_id);

drop policy if exists "search_keywords_delete_own" on public."SEARCH_KEYWORDS";
create policy "search_keywords_delete_own" on public."SEARCH_KEYWORDS"
  for delete to authenticated using ((select auth.uid()) = user_auth_id);

-- 수정은 없음 (삭제 후 다시 추가). anon 은 아무 권한 없음
revoke all on public."SEARCH_KEYWORDS" from anon;
revoke update on public."SEARCH_KEYWORDS" from authenticated;

-- 사용자당 최대 20개
create or replace function public.search_keywords_limit()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if (select count(*) from public."SEARCH_KEYWORDS" where user_auth_id = new.user_auth_id) >= 20 then
    raise exception 'search keyword limit reached' using errcode = 'P0001';
  end if;
  return new;
end $$;

drop trigger if exists search_keywords_limit on public."SEARCH_KEYWORDS";
create trigger search_keywords_limit before insert on public."SEARCH_KEYWORDS"
  for each row execute function public.search_keywords_limit();

revoke all on function public.search_keywords_limit() from public, anon, authenticated;

commit;

notify pgrst, 'reload schema';
