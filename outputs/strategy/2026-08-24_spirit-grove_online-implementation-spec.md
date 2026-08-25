# Spirit Grove 온라인 구현 명세 (Phase 0–1 구체화)

작성 2026-08-24 · 상위 문서: [`2026-08-24_spirit-grove_online-architecture.md`](2026-08-24_spirit-grove_online-architecture.md) · 목적: 그 문서 **§6 로드맵의 Phase 0(클라우드 세이브+리더보드)·Phase 1(비동기 교환)** 을 **바로 착수 가능한 수준**으로 구체화

> 상위 문서는 "무엇을/왜"의 의사결정 자료다. 이 문서는 "어떻게"의 구현 명세다 — 스키마 DDL·클라 훅 지점·원자적 교환 절차·안티치트 임계값·오프라인 불변식 보존 방법까지.
> **아직 코드가 아니다.** 착수 승인 전 마지막 검토용. 비용·요금·무료 티어 수치는 시점에 따라 바뀌므로 착수 직전 재확인(⚠️).

---

## 0. 전제 결정 (상위 문서 §7에 대한 기본값 채택)

상위 문서가 사용자 입력을 요구한 4개 결정을, **되돌릴 수 있는 최소 선택**으로 잠정 확정한다. 다르게 원하면 이 절만 바꾸면 아래가 따라온다.

| # | 결정 항목 | 채택값 (가정) | 근거 |
|---|---|---|---|
| 1 | 계정 방식 | **(a) 익명 기기키** — Supabase Anonymous Auth. 소셜 로그인은 나중에 "익명→연동 upgrade"로 부가 | 개인정보 최소·마찰 제로. 익명 계정에 안정적 `user_id(uuid)` 확보 |
| 2 | 비용 상한 | **무료 티어 내 유지**가 목표. 초과 조짐 시 기능 차단(fail-closed), 유료 전환은 별도 승인 | 1인 취미 규모 |
| 3 | 경쟁성 수준 | **(a) 친선·명예제 + 이상치 컷**. 서버 권위 전투(Phase 3)는 수요 확인 후로 유보 | 안티치트 과투자 금지 |
| 4 | 우선 트랙 | **Phase 0(클라우드 세이브+리더보드) → Phase 1(교환)** | 상위 문서 권장. 치팅 내성 낮아도 되는 것부터 |

**백엔드 확정:** Phase 0–1은 **Supabase**(상위 문서 옵션 A) 단독. Postgres + Auth + RLS + RPC만 쓰고 Realtime은 아직 안 씀(교환은 비동기). 실시간 대전(Phase 2)에서 옵션 B(Cloudflare Workers+DO) 재검토 — 이 문서 범위 밖.

---

## 1. 불변식 (이 명세가 절대 어기지 않는 것)

1. **오프라인 우선** — 네트워크가 없거나 Supabase가 죽어도 게임 전체가 지금처럼 100% 동작한다. 온라인은 **부가 레이어**다.
2. **정적 호스팅 유지** — 게임은 계속 GitHub Pages의 단일 HTML. 서버 로직 0. Supabase는 클라가 직접 호출.
3. **자립성** — 신규 의존성은 **Supabase JS SDK 1개**(CDN 인라인 or 번들). 그 외 빌드 파이프라인 불변(`build.py` 그대로).
4. **저장 포맷 재사용** — 새 직렬화 포맷을 만들지 않는다. 클라우드 세이브 = `serialize()`(v:4) 그대로, 교환 오브젝트 = `serMon()` 그대로.
5. **fail-closed 비용** — 무료 티어를 넘기느니 기능을 끈다. 남용은 처음부터 막는다(RLS·레이트리밋·행 상한·TTL).
6. **롤백 가능** — 각 Phase는 독립 출시. 온라인 기능 전체를 **런타임 플래그 하나**(`NET.enabled`)로 끌 수 있다.

---

## 2. 클라이언트 통합 설계 — `NET` 옵셔널 모듈

### 2-1. 원칙: 게임 코어는 온라인을 모른다

기존 코드(`serialize`/`serMon`/`towerBest` 등)는 **손대지 않는다**. 온라인은 얇은 `NET` 모듈이 **밖에서 감싼다**. 코어는 `NET`의 존재를 몰라도 되고, `NET`은 코어의 순수 산출물만 읽는다.

```
[게임 코어 (불변)]  --serialize()/serMon()/towerBest-->  [NET 모듈 (신규, 옵셔널)]  --SDK-->  [Supabase]
        ^                                                        |
        +--- reviveMon()/deserialize() <---(수신 페이로드)--------+
```

### 2-2. 로드 & 초기화 (graceful degradation)

- SDK는 **지연 로드**한다. 타이틀/설정에서 "온라인" 진입 시에만 `import`. 실패하면 조용히 오프라인 유지.
- `NET.enabled` = (SDK 로드 성공) ∧ (설정에서 온라인 ON) ∧ (헬스체크 OK). 어느 하나라도 실패면 `false`.
- **모든** `NET.*` 호출은 `if(!NET.enabled) return {ok:false, offline:true}` 로 시작 → 코어 흐름은 절대 막히지 않는다.

```js
// 개념 코드 (실제 구현 시 IIFE/모듈로)
const NET = {
  enabled:false, sb:null, uid:null,
  async init(){ try{
      const {createClient}=await import(SUPABASE_ESM_URL);  // 지연 로드
      this.sb=createClient(SB_URL, SB_ANON_KEY);
      const {data}=await this.sb.auth.signInAnonymously();   // 익명 계정
      this.uid=data?.user?.id||null;
      this.enabled=!!this.uid;
    }catch(_){ this.enabled=false; }  // 실패=오프라인
    return this.enabled; },
  guard(){ return this.enabled ? null : {ok:false, offline:true}; },
};
```

> ⚠️ `import(URL)`은 CSP·정적 호스팅에서 외부 origin을 허용해야 한다. 단일 HTML 자립성을 최우선하면 **SDK를 빌드시 인라인**(=`build.py`에 vendored)하는 편이 안전하다. 교환 코드의 `qrcode-generator`를 vendored한 선례가 있다. → **SDK vendoring을 기본으로 하고, ESM CDN은 대안**으로 둔다.

### 2-3. 설정 UI 훅

기존 설정 오버레이(`setOverlay`)에 "☁️ 온라인" 섹션 추가:
- 토글: 온라인 켜기/끄기 (`CONFIG.online`, `cfg.on`으로 세이브 — H5-D에서 확립한 seg+cfg 패턴 그대로).
- 상태 표시: 연결됨/오프라인, 익명 ID 앞 6자.
- 버튼: "지금 클라우드에 저장", "클라우드에서 불러오기", "친구코드 보기".

---

## 3. Phase 0 — 클라우드 세이브 + 리더보드

### 3-1. 데이터 모델 (Postgres DDL)

```sql
-- 계정: Supabase auth.users(익명)를 그대로 사용. 별도 프로필 최소.
create table profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  handle      text,                      -- 표시명(선택, 미설정 시 익명 N)
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

-- 클라우드 세이브: serialize()(v:4) JSON을 그대로. 슬롯당 1행(H5-D에서 6슬롯 도입 → slot 1..6).
create table cloud_saves (
  user_id     uuid references auth.users(id) on delete cascade,
  slot        int  not null check (slot between 1 and 6),
  save        jsonb not null,            -- serialize() 산출물(v:4)
  save_ver    int  not null default 4,   -- 스키마 버전 협상용
  play_sec    int,                       -- 빠른 요약(목록 표시용, save.playSec 미러)
  updated_at  timestamptz default now(),
  primary key (user_id, slot)
);

-- 리더보드: 지표별 최고값 1행/유저. 명예제 + 이상치 컷(§3-4).
create table leaderboard (
  user_id     uuid references auth.users(id) on delete cascade,
  metric      text not null,             -- 'tower_best' | 'ach_count' | 'dex_time'
  value       int  not null,
  handle      text,                      -- 비정규화(랭킹 read 조인 회피)
  app_ver     text,                      -- 클라 배포 버전(부정합 필터)
  updated_at  timestamptz default now(),
  primary key (user_id, metric)
);
create index leaderboard_rank on leaderboard(metric, value desc);
```

### 3-2. RLS (Row Level Security) — 데이터 격리·남용 방지

```sql
alter table cloud_saves enable row level security;
create policy "own saves"  on cloud_saves
  using (auth.uid() = user_id) with check (auth.uid() = user_id);  -- 내 것만 read/write

alter table leaderboard enable row level security;
create policy "read all"   on leaderboard for select using (true);            -- 랭킹은 공개 read
create policy "write own"  on leaderboard for insert with check (auth.uid()=user_id);
create policy "update own" on leaderboard for update using (auth.uid()=user_id) with check (auth.uid()=user_id);
```

**핵심:** 클라는 **남의 세이브를 못 읽고**, 리더보드는 **자기 행만 쓴다**. 서버 코드 없이 RLS만으로 기본 격리 완성.

### 3-3. 클라 훅 지점 (기존 함수에 곁붙임 — 코어 불변)

| 시점 | 기존 코어 | NET 곁붙임(옵셔널) |
|---|---|---|
| 저장 시 | `saveGame()`(localStorage) | 성공 후 `NET.pushSave(CUR_SLOT, serialize())` **fire-and-forget**(실패 무시) |
| 불러오기 | `loadGame(n)` | 설정에서 "클라우드 불러오기" → `NET.pullSave(slot)` → `deserialize()` |
| 챔피언/도장 갱신 | `towerBest` 갱신 지점 | `NET.submitScore('tower_best', G.towerBest)` (디바운스) |

- **충돌 규칙(세이브):** 같은 슬롯이 로컬·클라우드에 둘 다 있으면 `save.ts`(serialize의 타임스탬프) **최신 우선** + 사용자 확인 다이얼로그("클라우드가 더 최신입니다. 불러올까요?"). 자동 덮어쓰기 금지.
- 저장 푸시는 **디바운스**(예: 저장 후 10초 병합)해서 무료 티어 쓰기 폭주 방지.

### 3-4. 리더보드 안티치트 — 명예제 + 이상치 컷 (Phase 0 수준)

클라 신뢰 구조이므로 **완벽 방어 불가**. 목표는 "무심한 정직 유저 순위 + 명백한 위조 배제"뿐. 서버 권위(재현/리플레이)는 유보.

컷 규칙 (Postgres **트리거 or RPC**에서 강제 — 클라 우회 불가):
1. **상한 클램프** — `tower_best`는 이론상 상한을 코드에서 도출한다(예: 도장 레벨 스케일 상 현실적 최대 연승 = *N*). *N* 초과 제출은 **거부**. `ach_count ≤ ACHIEVEMENTS.length`, `dex_time ≥ 물리적 최소 플레이초`.
2. **증가 단조성** — `tower_best`는 **감소 제출 무시**(내 기록 갱신만). 큰 점프(예: 직전+30 초과)는 **보류 플래그**.
3. **app_ver 필터** — 랭킹 read 시 현재 배포 버전과 크게 어긋난 제출은 숨김(구버전 악용 차단).
4. **표시 정책** — 상위 N만 노출, 명백 이상치는 리스트에서 제외(삭제 아님, 숨김). "친선 순위" 임을 UI에 명시.

> 임계값(*N* 등)은 착수 시 실제 도장 스케일 코드에서 **도출**해 상수화하고, 회귀로 못박는다(테이블이 아니라 코드에서 파생 — H5 원칙과 동일).

### 3-5. Phase 0 수용 기준 (Acceptance)

- [ ] 온라인 OFF에서 게임 전 기능 정상(회귀 `offline_invariant_test`).
- [ ] 익명 로그인 → `serialize()` 업로드 → 다른 브라우저에서 같은 계정으로 복원(수동 계정 이관은 Phase 0.5).
- [ ] 세이브 충돌 시 자동 덮어쓰기 없이 사용자 확인.
- [ ] `tower_best` 랭킹 read 정상, 상한 초과 제출 서버측 거부.
- [ ] Supabase 도달 불가 시 저장/게임 무중단.

---

## 4. Phase 1 — 비동기 온라인 교환

### 4-1. 요구와 난제

- 지금: `tradeCodeFor(m)` → `SGT1.<b64(serMon)>.<chk>` 코드를 **사람이 직접 전달**. 이건 사실상 **복제/선물**(원본이 안 사라짐).
- 온라인 "진짜 교환" = **원본 소각을 원자적으로 보장**. 서버 권위 없이는 "출고했는데 원본도 남는" 이중화가 생긴다.

### 4-2. 데이터 모델

```sql
-- 교환 보관함: 올린 정령 1건. 6자리 코드 or 친구ID로 수취.
create table trade_offers (
  id          uuid primary key default gen_random_uuid(),
  code        text unique not null,          -- 6자리 대문자+숫자(사람이 부르기 쉬운)
  from_user   uuid references auth.users(id) on delete cascade,
  mon         jsonb not null,                -- serMon() 산출물 (SGT1 body와 동일 구조)
  mon_ver     text not null default 'SGT1',  -- 스키마 협상
  app_ver     text,
  status      text not null default 'open',  -- 'open' | 'claimed'
  claimed_by  uuid,
  created_at  timestamptz default now(),
  expires_at  timestamptz default now() + interval '7 days'  -- TTL: 미수취 자동 만료
);
create index trade_open on trade_offers(status) where status='open';

alter table trade_offers enable row level security;
create policy "insert own"  on trade_offers for insert with check (auth.uid()=from_user);
create policy "read by code" on trade_offers for select using (true);   -- 코드로 조회(값은 RPC로만 수취)
create policy "cancel own"  on trade_offers for delete using (auth.uid()=from_user and status='open');
```

### 4-3. 원자적 소각·수취 — Postgres RPC (SECURITY DEFINER)

복제 방지의 핵심. **claim은 반드시 이 함수로만**. 클라가 직접 update 못 하게 RLS로 막고, 함수가 원자적으로 (1)상태 검사 (2)claimed 표시 (3)mon 반환을 한 트랜잭션에 처리.

```sql
create or replace function claim_trade(p_code text)
returns jsonb
language plpgsql security definer as $$
declare r trade_offers;
begin
  -- 행 잠금(동시 수취 레이스 차단)
  select * into r from trade_offers
    where code = p_code and status='open' and expires_at > now()
    for update skip locked;
  if not found then
    return jsonb_build_object('ok', false, 'reason', 'gone');  -- 이미 수취/만료/없음
  end if;
  if r.from_user = auth.uid() then
    return jsonb_build_object('ok', false, 'reason', 'self');   -- 자기 것 수취 금지
  end if;
  update trade_offers
    set status='claimed', claimed_by=auth.uid()
    where id = r.id;
  return jsonb_build_object('ok', true, 'mon', r.mon);          -- 정령 인도
end $$;
revoke all on function claim_trade(text) from public;
grant execute on function claim_trade(text) to authenticated;
```

**보장:** `for update skip locked` + 상태검사가 한 트랜잭션 → 두 사람이 같은 코드를 동시에 claim해도 **정확히 한 명만** 성공. 원본 소각은 클라가 **출고 시 로컬에서 해당 정령 제거**로 완성한다(§4-4).

### 4-4. 교환 플로우 (양측 클라 + 서버)

**출고자(A):**
1. 박스/파티에서 정령 선택 → "온라인 교환에 올리기".
2. `NET.putOffer(serMon(mon))` → 서버가 `code`(6자리) 발급.
3. **성공 응답을 받은 뒤에만** 로컬에서 그 정령을 **보류(lock) 상태**로 표시(즉시 삭제 아님 — 취소 가능).
4. 코드/친구에게 공유.

**수취자(B):**
5. 코드 입력 → `NET.claimTrade(code)` → RPC가 `{ok:true, mon}` 반환.
6. `reviveMon(mon)` → 박스에 추가 → `markShinyDex` 등 기존 훅 재사용.

**소각 확정(A):**
7. A의 클라가 주기적/재접속 시 `NET.offerStatus(code)` 폴링. `claimed`면 → 보류 정령을 **로컬에서 영구 제거**(진짜 교환 완성).
8. `open`인 채 만료(TTL 7일)면 → 보류 해제(정령 반환). "취소"도 같은 경로(`delete own`).

> **왜 이 순서인가:** "서버 claim이 원자적 진실의 원천"이고, 클라의 로컬 삭제는 그 진실을 **뒤따른다**. A가 오프라인이어도 서버 상태가 남아 재접속 시 정합. 최악의 경우(폴링 전 A가 그 정령을 또 교환?)는 §4-5로 막는다.

### 4-5. 이중 출고 방지 (로컬)

- 보류 중인 정령은 **다른 교환/방생/사용 불가**(UI 잠금 + 코어 가드). 핫싯/코드교환/일괄조작 경로 전부에서 `mon._pendingTrade` 체크.
- 세이브에 보류 상태(`_pendingTrade: code`)를 포함(직렬화) → 재접속 후에도 잠금 유지·정합.

### 4-6. Phase 1 수용 기준

- [ ] 정령 출고 → 코드 발급 → 타 계정 수취 → **양측 인벤토리 합이 보존**(복제·증발 없음).
- [ ] 동시 수취 레이스에서 정확히 1명 성공(RPC 락 테스트).
- [ ] 미수취 7일 → 자동 만료 → 출고자에게 반환.
- [ ] 보류 중 정령은 방생·재교환 불가(로컬 가드 + 세이브 영속).
- [ ] 온라인 OFF에서 기존 코드/QR 교환은 그대로 동작(회귀).

---

## 5. 공통 — 스키마 버전 협상·비용 가드·개인정보

### 5-1. 버전 협상

- 세이브: `save_ver`(=`v:4`). 서버가 미래 버전을 만나면 read-only 보관, 구버전 클라는 자기 버전만 pull.
- 교환: `mon_ver`(=`SGT1`). 수취 클라가 모르는 버전이면 거부 메시지("업데이트가 필요해요").
- 배포: `app_ver`(빌드 해시/날짜) 동봉 → 리더보드 필터·디버깅.

### 5-2. 비용·남용 가드 (fail-closed)

| 벡터 | 가드 |
|---|---|
| 세이브 쓰기 폭주 | 클라 디바운스(≥10s) + 슬롯당 1행(upsert, 무한 증식 없음) |
| 리더보드 스팸 | 유저당 지표 1행(upsert) + 제출 레이트리밋(RPC 카운터) |
| 교환 테이블 증식 | TTL 7일 자동 만료(예약 삭제 job) + 유저당 동시 open offer 상한(예: 5) |
| 익명 계정 남발 | Supabase 익명 가입 자체 제한 + 행 상한 도달 시 신규 기능 차단(게임은 계속) |
| 무료 티어 초과 조짐 | `NET.enabled`를 원격 kill-switch로 끌 수 있게(설정 fetch 실패=OFF) |

### 5-3. 개인정보·약관 (⚠️ 법률 확인은 범위 밖)

- 익명 계정은 **PII 최소**(uuid + 선택 handle). 이메일/실명 수집 안 함(Phase 0–1).
- 그래도 계정·랭킹 출시 전 **최소 처리방침/약관** 링크 필요. 아동 대상성 고려(handle 필터·욕설 차단 최소).

---

## 6. 착수 순서 & 테스트 계획

### 6-1. 구현 슬라이스 (각 독립 커밋·PR)

1. **NET 스캐폴드 + 오프라인 불변식** — `NET` 모듈(전부 no-op 가능), 설정 토글, `CONFIG.online`/`cfg.on`. 회귀 `offline_invariant_test`(온라인 미초기화 상태에서 전 기능 정상).
2. **Supabase 프로젝트 + 스키마** — DDL·RLS·RPC 배포(코드 저장소엔 `supabase/` 마이그레이션 SQL만; 시크릿은 환경변수).
3. **Phase 0a 클라우드 세이브** — push/pull + 충돌 다이얼로그. 테스트: 왕복·충돌·오프라인.
4. **Phase 0b 리더보드** — submit/read + 이상치 컷(임계값 코드 도출). 테스트: 상한 거부·단조성.
5. **Phase 1 교환** — putOffer/claim(RPC)/status + 로컬 보류·소각. 테스트: 합 보존·레이스·TTL·보류 가드.

### 6-2. 테스트 전략 (오프라인 우선 보존이 최우선)

- **오프라인 회귀:** 모든 기존 Playwright 회귀는 **네트워크 차단(SDK 미로드)** 상태로 계속 통과해야 한다. `NET.enabled=false` 경로가 기본.
- **온라인 통합:** Supabase **로컬 에뮬레이터**(supabase CLI) 대상 별도 스위트. CI 기본에는 넣지 않고 온라인 라벨로 분리(정적 배포 CI를 무겁게 하지 않음).
- **원자성:** `claim_trade` 동시성 테스트(두 세션 동시 claim → 1 성공).
- **스키마 협상:** 미래 `save_ver`/미지 `mon_ver` 거부 경로.

### 6-3. 되돌리기

- 온라인 전체 kill-switch(`NET.enabled`) — 사고 시 클라 재배포 없이 원격 OFF.
- 스키마는 additive-only 마이그레이션(drop 금지) — 구클라 호환 유지.

---

## 7. 미결·다음 결정 (Phase 2 전에)

1. **SDK vendoring vs ESM CDN** — 자립성(§1-3) 우선이면 vendoring. 착수 시 확정.
2. **익명→소셜 upgrade UX** — 기기 분실 시 계정 이관. Phase 0.5로 뺄지.
3. **실시간 대전(Phase 2)** — Supabase Realtime로 갈지, 옵션 B(Cloudflare Workers+DO)로 분리할지. 대전 수요 확인 후.
4. **경쟁전 서버 권위(Phase 3)** — `dbExec` 등 순수 전투 함수를 서버(Deno/Workers)로 이식해 재계산. **수요 검증 전 착수 금지**(상위 문서 §8).

---

## 부록 A — 재사용 자산 → 온라인 매핑 (실측 함수명)

| 코어 함수(현행) | 온라인 용도 | 무변경? |
|---|---|---|
| `serialize()` → `{v:4,ts,...}` (src/index.html) | `cloud_saves.save` 페이로드 | ✅ 그대로 |
| `deserialize(o)` (`o.v!==4` 거부) | 클라우드 pull 복원 | ✅ 그대로 |
| `serMon(m)` | `trade_offers.mon` 페이로드 | ✅ 그대로 |
| `reviveMon(p)` | 교환 수취 복원 | ✅ 그대로 |
| `tradeCodeFor`/`parseTradeCode`/`_tradeChk` (`SGT1`) | 오프라인 교환 유지 + 서버 페이로드 검증 재사용 | ✅ 병존 |
| `towerBest`/`achClaimed`/`playSec` | 리더보드 지표 | ✅ 읽기만 |
| `markShinyDex` 등 수취 훅 | 교환 수취 시 도감 반영 | ✅ 그대로 |

## 부록 B — 최소 API 표면 (`NET` 공개 메서드)

```
NET.init()                         → bool(enabled)
NET.pushSave(slot, saveObj)        → {ok}            // fire-and-forget, 디바운스
NET.pullSave(slot)                 → {ok, save?, ts?}
NET.submitScore(metric, value)     → {ok, rejected?} // 서버 컷 반영
NET.readBoard(metric, limit)       → {ok, rows[]}
NET.putOffer(serMonObj)            → {ok, code?}
NET.claimTrade(code)               → {ok, mon?, reason?}  // RPC claim_trade
NET.offerStatus(code)              → {ok, status}    // open|claimed|expired
NET.cancelOffer(code)              → {ok}
```
모든 메서드는 `if(!NET.enabled) return {ok:false, offline:true}` 로 시작 → **오프라인 불변식 자동 보존**.
