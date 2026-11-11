-- AI 기능 사용량 제한 (로그인 사용자 1인당 하루 N회, KST 기준) — SQL Editor에서 한 번 실행 (여러 번 실행해도 안전)
-- 영상 요약·차트 분석 등 모든 AI 기능이 같은 한도를 나눠 쓴다.
-- 같은 날 같은 대상(예: 같은 영상)을 다시 열면 다시 세지 않는다.

create table if not exists public."AI_USAGE" (
  user_auth_id uuid not null references auth.users (id) on delete cascade,
  used_on date not null,
  feature text not null,
  item_key text not null,
  created_at timestamptz not null default now(),
  primary key (user_auth_id, used_on, feature, item_key)
);

alter table public."AI_USAGE" enable row level security;

-- 본인 사용 내역만 읽기 가능 (쓰기는 아래 함수로만)
drop policy if exists "ai_usage_select_own" on public."AI_USAGE";
create policy "ai_usage_select_own" on public."AI_USAGE"
  for select to authenticated using ((select auth.uid()) = user_auth_id);

create index if not exists ai_usage_user_day_idx on public."AI_USAGE" (user_auth_id, used_on);

/**
 * 한도 확인 + 기록을 한 번에 (동시 요청에도 한도를 넘지 않도록 사용자별 잠금)
 * 반환: { allowed, used, limit, repeat }
 */
create or replace function public.ai_consume(p_user uuid, p_feature text, p_item text, p_limit integer)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  today date := (now() at time zone 'Asia/Seoul')::date;
  used integer;
begin
  if p_user is null or p_feature is null or p_item is null or p_limit is null or p_limit < 0 then
    raise exception 'invalid arguments';
  end if;

  perform pg_advisory_xact_lock(hashtextextended('ai_consume:' || p_user::text, 0));

  select count(*) into used from public."AI_USAGE" where user_auth_id = p_user and used_on = today;

  if exists (
    select 1 from public."AI_USAGE"
    where user_auth_id = p_user and used_on = today and feature = p_feature and item_key = p_item
  ) then
    return jsonb_build_object('allowed', true, 'used', used, 'limit', p_limit, 'repeat', true);
  end if;

  if used >= p_limit then
    return jsonb_build_object('allowed', false, 'used', used, 'limit', p_limit, 'repeat', false);
  end if;

  insert into public."AI_USAGE" (user_auth_id, used_on, feature, item_key) values (p_user, today, p_feature, p_item);
  return jsonb_build_object('allowed', true, 'used', used + 1, 'limit', p_limit, 'repeat', false);
end $$;

revoke all on function public.ai_consume(uuid, text, text, integer) from public, anon, authenticated;
grant execute on function public.ai_consume(uuid, text, text, integer) to service_role;

notify pgrst, 'reload schema';
