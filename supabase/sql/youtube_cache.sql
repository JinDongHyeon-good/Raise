-- YouTube 검색 결과 캐시 (서버 재시작·여러 서버 인스턴스에서도 공유) — SQL Editor에서 한 번 실행
-- 서버가 service_role 키로만 읽고 쓴다. anon/authenticated는 접근 불가.

create table if not exists public."YOUTUBE_SEARCH_CACHE" (
  query_key text primary key,
  payload jsonb not null,
  fetched_at timestamptz not null default now()
);

alter table public."YOUTUBE_SEARCH_CACHE" enable row level security;
-- 정책 없음 = service_role만 접근

create index if not exists youtube_search_cache_fetched_idx on public."YOUTUBE_SEARCH_CACHE" (fetched_at);

-- 30일 지난 캐시 정리는 필요할 때 수동으로:
-- delete from public."YOUTUBE_SEARCH_CACHE" where fetched_at < now() - interval '30 days';
