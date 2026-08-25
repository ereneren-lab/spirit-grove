-- Spirit Grove 온라인 Phase 0–1 스키마 (구현 명세 §3-1·§3-2·§4-2·§4-3)
-- 근거: outputs/strategy/2026-08-24_spirit-grove_online-implementation-spec.md
-- 적용: Supabase 프로젝트에서 이 파일을 SQL로 실행(또는 supabase db push).
-- 원칙: 클라는 익명(Anonymous Auth)으로 로그인 → RLS가 데이터 격리, RPC가 원자적 교환을 강제한다.
-- ⚠️ additive-only. 기존 컬럼/테이블 drop 금지(구클라 호환).

-- ============================================================
-- profiles — 익명 auth.users에 붙는 최소 프로필(선택 표시명)
-- ============================================================
create table if not exists profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  handle      text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
alter table profiles enable row level security;
drop policy if exists "read own profile"  on profiles;
drop policy if exists "write own profile" on profiles;
create policy "read own profile"  on profiles for select using (auth.uid() = id);
create policy "write own profile" on profiles for all    using (auth.uid() = id) with check (auth.uid() = id);

-- ============================================================
-- cloud_saves — serialize()(v:4) JSON 그대로. 슬롯당 1행(1..6, H5-D 확장 반영)
-- ============================================================
create table if not exists cloud_saves (
  user_id     uuid not null references auth.users(id) on delete cascade,
  slot        int  not null check (slot between 1 and 6),
  save        jsonb not null,
  save_ver    int  not null default 4,
  play_sec    int,
  updated_at  timestamptz not null default now(),
  primary key (user_id, slot)
);
alter table cloud_saves enable row level security;
drop policy if exists "own saves" on cloud_saves;
create policy "own saves" on cloud_saves
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ============================================================
-- leaderboard — 지표별 최고값 1행/유저. 명예제 + 이상치 컷(트리거로 서버측 강제)
-- ============================================================
create table if not exists leaderboard (
  user_id     uuid not null references auth.users(id) on delete cascade,
  metric      text not null,                 -- 'tower_best' | 'ach_count' | 'dex_time'
  value       int  not null,
  handle      text,
  app_ver     text,
  updated_at  timestamptz not null default now(),
  primary key (user_id, metric)
);
create index if not exists leaderboard_rank on leaderboard(metric, value desc);
alter table leaderboard enable row level security;
drop policy if exists "read all board"  on leaderboard;
drop policy if exists "write own board" on leaderboard;
drop policy if exists "update own board" on leaderboard;
create policy "read all board"   on leaderboard for select using (true);           -- 랭킹은 공개 read
create policy "write own board"  on leaderboard for insert with check (auth.uid()=user_id);
create policy "update own board" on leaderboard for update using (auth.uid()=user_id) with check (auth.uid()=user_id);

-- 이상치 컷: 지표별 상한/단조성. 클라 우회 불가(트리거는 RLS 뒤에서도 강제된다).
-- ⚠️ 상한값은 게임 스케일에서 도출한 잠정치 — 실제 최대 연승/업적 수/최소 도감시간에 맞춰 조정한다.
create or replace function leaderboard_guard()
returns trigger language plpgsql as $$
declare cap int;
begin
  if new.metric = 'tower_best' then cap := 200;      -- 현실적 최대 연승 상한(도장 스케일에서 도출)
  elsif new.metric = 'ach_count' then cap := 100;    -- 업적 총수 이하
  elsif new.metric = 'dex_time' then
    if new.value < 600 then raise exception 'dex_time too small'; end if;  -- 물리적 최소 플레이초
    return new;
  else raise exception 'unknown metric %', new.metric;
  end if;
  if new.value < 0 or new.value > cap then raise exception 'value out of range for %', new.metric; end if;
  -- 증가 단조성(내 기록 갱신만): update 시 기존값보다 작으면 무시(기존값 유지)
  if tg_op = 'UPDATE' and new.value < old.value then new.value := old.value; end if;
  return new;
end $$;
drop trigger if exists leaderboard_guard_trg on leaderboard;
create trigger leaderboard_guard_trg before insert or update on leaderboard
  for each row execute function leaderboard_guard();

-- ============================================================
-- trade_offers — 온라인 교환 보관함. 6자리 코드/친구ID로 수취. TTL 7일.
-- ============================================================
create table if not exists trade_offers (
  id          uuid primary key default gen_random_uuid(),
  code        text unique not null,
  from_user   uuid not null references auth.users(id) on delete cascade,
  mon         jsonb not null,                -- serMon() 산출물(SGT1 body 구조)
  mon_ver     text not null default 'SGT1',
  app_ver     text,
  status      text not null default 'open',  -- 'open' | 'claimed'
  claimed_by  uuid,
  created_at  timestamptz not null default now(),
  expires_at  timestamptz not null default (now() + interval '7 days')
);
create index if not exists trade_open on trade_offers(status) where status = 'open';
alter table trade_offers enable row level security;
drop policy if exists "insert own offer"  on trade_offers;
drop policy if exists "read offer by code" on trade_offers;
drop policy if exists "cancel own offer"  on trade_offers;
create policy "insert own offer"  on trade_offers for insert with check (auth.uid()=from_user);
create policy "read offer by code" on trade_offers for select using (true);      -- 코드로 상태 조회(값 인도는 RPC로만)
create policy "cancel own offer"  on trade_offers for delete using (auth.uid()=from_user and status='open');
-- ⚠️ update 정책 없음 → 클라는 직접 claimed로 못 바꾼다. 오직 claim_trade RPC만.

-- 유저당 동시 open offer 상한(남용/증식 방지)
create or replace function trade_offer_cap()
returns trigger language plpgsql as $$
declare n int;
begin
  select count(*) into n from trade_offers where from_user = new.from_user and status='open' and expires_at > now();
  if n >= 5 then raise exception 'too many open offers (max 5)'; end if;
  return new;
end $$;
drop trigger if exists trade_offer_cap_trg on trade_offers;
create trigger trade_offer_cap_trg before insert on trade_offers
  for each row execute function trade_offer_cap();

-- 원자적 수취·소각(복제 방지의 핵심). claim은 반드시 이 함수로만.
create or replace function claim_trade(p_code text)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare r trade_offers;
begin
  select * into r from trade_offers
    where code = p_code and status='open' and expires_at > now()
    for update skip locked;                       -- 동시 수취 레이스 차단
  if not found then
    return jsonb_build_object('ok', false, 'reason', 'gone');
  end if;
  if r.from_user = auth.uid() then
    return jsonb_build_object('ok', false, 'reason', 'self');
  end if;
  update trade_offers set status='claimed', claimed_by=auth.uid() where id = r.id;
  return jsonb_build_object('ok', true, 'mon', r.mon, 'mon_ver', r.mon_ver);
end $$;
revoke all on function claim_trade(text) from public;
grant execute on function claim_trade(text) to authenticated;

-- 만료 정리(예약 실행 권장: pg_cron 있으면 매시간). 없으면 read 시 expires_at 필터로 이미 걸러진다.
create or replace function purge_expired_trades()
returns void language sql security definer set search_path = public as $$
  delete from trade_offers where status='open' and expires_at < now();
$$;
