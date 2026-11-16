-- 커뮤니티 글 언어 구분 — 한국어 화면엔 ko 글, 영어 화면엔 en 글만 보인다 (여러 번 실행해도 안전)

alter table public."BOARD_POSTS"
  add column if not exists locale text not null default 'ko';

alter table public."BOARD_POSTS" drop constraint if exists board_posts_locale_check;
alter table public."BOARD_POSTS"
  add constraint board_posts_locale_check check (locale in ('ko', 'en'));

create index if not exists board_posts_locale_created_idx
  on public."BOARD_POSTS" (locale, created_at desc) where deleted_at is null;

create index if not exists board_posts_locale_type_idx
  on public."BOARD_POSTS" (locale, post_type, created_at desc) where deleted_at is null;

notify pgrst, 'reload schema';
