-- AI 기능 악용 방지 — ai_usage.sql 다음에 실행 (여러 번 실행해도 안전)
--
-- 하루(KST) 기준으로 다음을 한 번에 확인하고 기록한다:
--   1) 차단 목록(사용자 또는 IP)에 있으면 거절
--   2) 같은 날 같은 대상(예: 같은 영상)을 다시 여는 건 다시 세지 않음
--   3) 사용자당 한도 (기본 5)
--   4) IP당 한도 (기본 10) — 계정을 여러 개 만들어 한도를 우회하는 것 방지
--   5) 서비스 전체 한도 (기본 2000) — 비용 상한
-- IP는 원문이 아니라 서버에서 비밀값을 섞은 해시로만 저장한다.

begin;

alter table public."AI_USAGE" add column if not exists ip_hash text;
create index if not exists ai_usage_ip_day_idx on public."AI_USAGE" (ip_hash, used_on) where ip_hash is not null;
create index if not exists ai_usage_day_idx on public."AI_USAGE" (used_on);

-- 차단 목록: kind = 'user' (auth id) 또는 'ip' (ip 해시)
create table if not exists public."AI_BLOCKLIST" (
  kind text not null check (kind in ('user', 'ip')),
  value text not null,
  reason text not null default '',
  created_at timestamptz not null default now(),
  primary key (kind, value)
);
alter table public."AI_BLOCKLIST" enable row level security;
-- 정책 없음 = 서버(service role)만 접근

drop function if exists public.ai_consume(uuid, text, text, integer);

create or replace function public.ai_consume(
  p_user uuid,
  p_feature text,
  p_item text,
  p_limit integer,
  p_ip_hash text default null,
  p_ip_limit integer default 10,
  p_global_limit integer default 2000
)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  today date := (now() at time zone 'Asia/Seoul')::date;
  used integer;
  ip_used integer := 0;
  global_used integer;
begin
  if p_user is null or p_feature is null or p_item is null or p_limit is null or p_limit < 0 then
    raise exception 'invalid arguments';
  end if;

  -- 같은 사용자·같은 IP 동시 요청은 순서대로 (한도 우회 방지)
  perform pg_advisory_xact_lock(hashtextextended('ai_consume:user:' || p_user::text, 0));
  if p_ip_hash is not null then
    perform pg_advisory_xact_lock(hashtextextended('ai_consume:ip:' || p_ip_hash, 0));
  end if;

  if exists (
    select 1 from public."AI_BLOCKLIST"
    where (kind = 'user' and value = p_user::text) or (p_ip_hash is not null and kind = 'ip' and value = p_ip_hash)
  ) then
    return jsonb_build_object('allowed', false, 'reason', 'blocked', 'used', 0, 'limit', p_limit, 'repeat', false);
  end if;

  select count(*) into used from public."AI_USAGE" where user_auth_id = p_user and used_on = today;

  if exists (
    select 1 from public."AI_USAGE"
    where user_auth_id = p_user and used_on = today and feature = p_feature and item_key = p_item
  ) then
    return jsonb_build_object('allowed', true, 'reason', 'repeat', 'used', used, 'limit', p_limit, 'repeat', true);
  end if;

  if used >= p_limit then
    return jsonb_build_object('allowed', false, 'reason', 'user_limit', 'used', used, 'limit', p_limit, 'repeat', false);
  end if;

  if p_ip_hash is not null and p_ip_limit is not null then
    select count(*) into ip_used from public."AI_USAGE" where ip_hash = p_ip_hash and used_on = today;
    if ip_used >= p_ip_limit then
      return jsonb_build_object('allowed', false, 'reason', 'ip_limit', 'used', used, 'limit', p_limit, 'repeat', false);
    end if;
  end if;

  if p_global_limit is not null then
    select count(*) into global_used from public."AI_USAGE" where used_on = today;
    if global_used >= p_global_limit then
      return jsonb_build_object('allowed', false, 'reason', 'global_limit', 'used', used, 'limit', p_limit, 'repeat', false);
    end if;
  end if;

  insert into public."AI_USAGE" (user_auth_id, used_on, feature, item_key, ip_hash)
  values (p_user, today, p_feature, p_item, p_ip_hash);
  return jsonb_build_object('allowed', true, 'reason', 'ok', 'used', used + 1, 'limit', p_limit, 'repeat', false);
end $$;

revoke all on function public.ai_consume(uuid, text, text, integer, text, integer, integer) from public, anon, authenticated;
grant execute on function public.ai_consume(uuid, text, text, integer, text, integer, integer) to service_role;

commit;

notify pgrst, 'reload schema';

-- 차단 예시 (SQL Editor):
--   insert into public."AI_BLOCKLIST" (kind, value, reason) values ('user', '<auth user id>', '반복 악용');
-- 해제:
--   delete from public."AI_BLOCKLIST" where kind = 'user' and value = '<auth user id>';
