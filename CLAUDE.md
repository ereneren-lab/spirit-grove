# 정령의 숲 (Spirit Grove 3D) — 프로젝트 가이드

이 파일은 Claude Code가 매 세션 자동으로 읽는 프로젝트 지침이야. (예전 `작업_인수인계.md`를 대체)

## 개요
- 크리처 수집형 RPG. 렌더러는 **Map2D**(canvas 2D) 단일. 전투는 DOM UI.
  - Map3D/three.js는 제거됨(모든 진입 경로가 Map2D로 덮어써서 도달 불가한 죽은 코드였음). 되살리려면 git 이력 참조.
- 아트는 **외부에서 생성**(ChatGPT 등) → PNG를 `art_inbox/`에 넣으면 파이프라인이 배경제거·정렬·저장.

## 아키텍처 (에셋 분리됨)
편집은 `src/` + `assets/`에서, 배포는 인라인 번들 한 파일(`dist/`)로.

| 경로 | 역할 |
|------|------|
| `src/index.html` | **편집용 소스 (~440KB)**. DEX·MOVES·전투·맵·UI 전부. 아트 자리에는 주입 마커(`//@@PAINT_ART@@` 등)만. |
| `assets/art/creatures/<id>.webp` | 크리처 아트 86종 (진짜 이미지 파일, 바로 열어볼 수 있음) |
| `assets/art/hero/<0-3>.webp`, `hero_back/<0-3>.webp` | 주인공 4명 앞/뒤 |
| `assets/manifest.json` | 번들에 넣을 크리처 id 순서. **새 종 추가 시 여기에도 추가해야 함** |
| `dist/spirit_grove_3d.html` | 빌드 결과물 (~3.5MB). 브라우저로 여는 건 이 파일. 직접 편집 금지 — 다음 빌드에 덮인다. |

`scripts/build.py`가 마커 자리에 base64를 채워 dist를 만든다. `scripts/extract_assets.py`는 최초 분리에 쓴 1회성 스크립트(보관용).

## 파일 구조 (게임 내부)
- `const DEX=[...]` — 86종 정의. 각 항목: `{id,name,em,type,tier,base:{...},moves,learn,evolveTo?,evolveLv?/evolveItem?}`
- `const PAINT_ART={ id:"data:image/webp;base64,...", ... }` — 86종 전원 아트 (한 줄 1종). `creatureVisual`에서 **최우선** 체크.
- `const HERO_ART={"0":..,"1":..,"2":..,"3":..}` — 주인공 4명 정면 빌보드.
- `const HERO_ART_BACK={...}` — 주인공 4명 뒷모습(위로 걸을 때).
- `const CHARS=[...]` — 선택 캐릭터 4명(리오/미나/토리/엘). styleIdx로 저장.
- `creatureVisual(id,type)`: PAINT_ART → LEGEND_ART → ART||BUNDLED_ART → creatureSVG 순. (data:면 `<img class="cart">`)
- 주인공 그리기: Map2D 렌더에서 `heroImg`/`heroImgBack` 빌보드(그림자+좌우반전+바운스), 이미지 없으면 `_walker` 벡터 폴백.
- 팔로워: `followerImg` 빌보드 + 타입색 오라 글로우. `Map2D.follower`, `followerVisible()`, `leadFollowMon()`.

## 아트 파이프라인 (핵심)
`scripts/process_art.py` 사용. 업로드 PNG는 보통 개별 이미지(크리처/캐릭터 1, 텍스트 없음, 배경 있음).
1. **배경제거**: `cv2.grabCut`(오프라인). 400~420px 축소 후 rect ~5% 인셋, grabCut 6회, morphology close/open, 가장 큰 연결요소만.
2. **정렬**:
   - 크리처 → 360×360 중앙 정렬 → `assets/art/creatures/<id>.webp`
   - 주인공/캐릭터 → **알파 bbox로 잘라 발끝 하단정렬**(y≈356/360). 접지 일정 → `assets/art/hero[_back]/<0-3>.webp`
3. **인코딩**: WebP quality 86. base64 변환은 빌드가 알아서 한다 (파이프라인은 이제 HTML을 건드리지 않음).
- 한 이미지에 캐릭터 2명이 같이 오면 좌/우로 크롭 후 각각 처리.
- 아트만 교체하는 경우엔 `assets/art/**.webp`를 덮어쓰고 빌드만 해도 된다.

## 빌드/검증 (반드시)
```bash
python3 scripts/build.py     # src + assets -> dist
bash scripts/verify.sh       # dist 검증
```
verify 내용:
- **죽은 의존성 재유입 차단**: `THREE.` / `Map3D` / `BUNDLED_ART` 참조가 0이어야 함.
- **JS 문법**: 게임 `<script>` 블록 추출 → `node --check`.
- **PAINT_ART/DEX 대조**: DEX 종수 == PAINT_ART 종수, 누락/중복 0.
- **스모크 테스트**(`scripts/smoke.js`): jsdom으로 dist를 실제 로드 → 런타임 에러 0건 확인 + 전투 계산·적 AI·저장/불러오기 왕복 검사. `npm install jsdom canvas` 하면 자동 실행, 없으면 건너뜀.
- ⚠️ **dist**는 거대한 base64 줄이 있으니 **흔한 단어로 grep 금지**. 정확한 앵커로만. (src/index.html은 413KB라 자유롭게 grep 가능)

## 아트/설계 규칙
- 화풍: soft anime, cel-shading, 귀엽고 따뜻하게. 실제 포켓몬 애셋 금지, 오리지널만.
- 진화라인은 같은 색·모티프(한 정령이 성장하는 느낌). 종이 통째로 바뀌면 어색.
- 크리처 배경은 심플(어차피 제거). 주인공은 정면 ¾뷰(좌우반전용) + 뒷모습 별도.

## 버그 수정 이력 (재발 주의)
- **HP바 갈라짐**: HP fill이 저체력 시 `crit`/`warn` 클래스를 붙이는데, `crit`이 **크리처 아트 컨테이너 클래스와 이름 충돌**(`.crit{position:relative;margin:0 auto}`)해서 fill이 중앙정렬 → 왼쪽 ghost와 갭 발생. → HP fill 클래스를 `hpcrit`/`hpwarn`으로 개명 + `.hpfill`을 `position:absolute;left:0`로 명시 고정. (`scripts/gym_test.js` 아님, probe로 확인)
- **체육관 관장 전투 안 걸림**: 관장 타일 1~4가 `walkable` 가드 분기와 move()-into 트리거 목록에서 빠져 있어(5,6,가드만), 실내에서 관장에게 걸어가도 전투가 안 걸렸음. `onArrived`도 실내 블록에서 조기 return. → walkable·트리거 두 곳에 1~4 추가(가드처럼 취급: 벽으로 걸어들면 전투, 이기면 통과). 회귀 테스트 `scripts/gym_test.js`.

## 완료된 개선 (되돌리지 말 것)
- 86종 전원 v2 아트 통일 (DEX 86 = PAINT_ART 86).
- 불여우 라인 파라꼬→파라울→파라온을 구미호 계보로 재설계, 이모지 🦊 통일.
- 넝쿠리(vinesnake) 독립화 — 새록정 진입경로는 leafwyrm 하나.
- HP바 빨간점 버그 수정: `.hpfill`/`.hpghost`의 border-radius 제거(컨테이너 overflow:hidden이 양끝 처리).
- 주인공 4명 회화체 빌보드(앞/뒤) + 캐릭터 선택 미리보기도 회화.
- 팔로워 타입색 오라 글로우 + 크기/접지 조정.

## 로드맵 (권장 순서)
1. ~~아키텍처 분리~~ ✅ 완료 (src 413KB + assets + dist 빌드).
2. 온보딩/튜토리얼 — **첫 전투 코치 ✅ · 목표 트래커 ✅ · 난이도 커브 ✅**. 게임필 폴리시 진행 중(타이틀 종수 표기 ✅ · 맵 카메라 클램프 ✅ · 전투 진입 연출 ✅). 남은 것: 오디오, 추가 폴리시.

### 전투 진입 연출 (포켓몬식)
- **화면 전환 와이프** (`playBattleWipe`, `#battleWipe` + `.bwbar`): 보라 블라인드 11줄이 대각선 스태거로 스윕. 완전히 덮이는 시점(~340ms)에 필드→전투 스왑이 커버 아래 숨는다. `transitionToBattle`가 이 타이밍을 받아 쓴다. reduceMotion이면 기존 플래시만.
- **정령구 던지기 등장** (`sendOutAnim` 업그레이드): 내 정령은 항상, 상대는 트레이너전일 때 볼을 포물선으로 던져 터뜨리며 등장(throw sfx + 캡처플래시 + 반짝임). 야생 상대는 기존 poof. 내 정령엔 "가랏! {이름}!" 라벨. 교체 등장에도 적용된다.
- 검증: Playwright로 전환 타이밍별(170/360/600/1100ms) 캡처해 커버·볼·라벨·클린 종료 확인.

### 순차 전투 인트로 (`battleIntroMe`)
야생·보스 전투에서 포켓몬식 2비트 인트로: 상대 등장("야생 X 나타났다") → 한 박자(720ms) → "가랏! 내정령!" 볼 던지며 등장 + 울음 → 메뉴.
- `transitionToBattle`가 `seq=!G.trainer`로 판정 → seq면 `setupBattleUI(true)`(foeOnly, 내 정령 나중)로 상대만 먼저 등장시키고 `battleIntroMe()`로 순차 진행. 트레이너전(별도 등장 대사 있음)은 기존 즉시 방식 유지.
- 인트로 동안 메뉴 숨김·`G.busy`로 입력 차단, 내 스프라이트 opacity 0으로 깜빡임 방지. 자동 진행이라 탭 불필요.
- 모든 야생 조우(일반/동굴/해안/섬/설원/파도/낚시)와 보스에 자동 적용(`!G.trainer` 판정).

### HP 틱음 (포켓몬식 전투 손맛)
- `Audio.hpTick(fromPct,toPct)`: HP바가 줄 때 감소량에 비례한 짧은 square 비프 연쇄. 위험권(≤20%)으로 떨어지면 더 높고 급하게 + 경고음 2노트.
- 훅: `setHpBar`의 드레인 분기(`pct < g.w`)에서 새 타깃일 때만(`pct < g.t`) 1회 발동 — 재렌더 중복 방지. me/foe 양쪽, 상태이상 잔뎀 포함 모든 HP 감소에 적용.
- 검증: `scripts/audio_test.js`(Playwright, Chromium Web Audio 계측) — 감소량 비례 비프 수 + 위험권 경고음 + 무감소 무음. verify.sh에 playwright 게이트로 연결(jsdom엔 Web Audio 없음).

### 저체력 지속 경고음 (`Audio.lowHp`)
내 정령 HP가 위험권(≤20%)이면 회복·교체·기절·전투종료까지 "빠-빠" 경고음 반복(setInterval 620ms).
- 훅: `renderCombatants` 끝 — HP바 갱신 단일 지점이라 회복/교체/기절이 전부 여기를 거쳐 자동으로 켜지고 꺼진다. `endBattle`에도 안전 정지.
- 중복 타이머 가드(`_lowTimer`), muted면 비프 스킵.
- 검증: `scripts/lowhp_flow_test.js` — 위험→회복→재위험→기절 흐름별 루프 on/off 확인.
3. 신규 지역/콘텐츠는 마지막.

### 첫 전투 코치 (`const Coach`)
첫 **야생** 전투 딱 한 번, 핵심 루프(싸운다 → 약하게 만든다 → 잡는다)를 손에 쥐여준다.
- 3단계: `⚔️ 공격` 하이라이트 → 상성 유리한 기술 짚어줌(‘효과 굉장’ 태그 활용) → 상대 HP 50% 이하면 `🔮 포획` 유도.
- 훅: `setupBattleUI`(시작) · `showMoves`(기술) · `doMove` 끝(턴) · `endBattle`(종료).
- 1회성 보장: `G.questFlags.coach1`에 저장. **기존 세이브 보호** — `caught.size>1`이거나 뱃지가 있으면 이미 아는 플레이어로 보고 조용히 플래그만 찍는다.
- 회귀 테스트: `scripts/coach_test.js` (verify.sh가 자동 실행).

### 목표 트래커 (`currentGoal` / `updateGoal`)
맵 좌상단에 "다음 목표 + 방향 화살표 + 거리"를 붙박아 둔다. **탭하면 그 지점까지 자동 이동.**
- 진행 사슬: 체육관 4곳(`GYM_AT`) → 정령 리그(`U` 타일 18,9 · 인장 4조각 필요) → 챔피언 → 도감 완성.
- 좌표를 상수로 박지 않고 실제 게이트 타일에서 가져오므로 맵을 바꿔도 안 어긋난다.
- 갱신 훅: `onArrived`(매 걸음) · `enterMap` · `endBattle` · `warpTo` · `enterInterior`/`exitInterior`. 전투 중엔 숨는다.
- 회귀 테스트: `scripts/goal_test.js`.

### 난이도 커브 (그라인딩 독립적)
문제였던 것: 야생 레벨이 내 평균 레벨을 따라오는(`al+depth*4`) 고무줄인데 체육관은 고정 레벨이라, 체감 난이도가 "얼마나 그라인딩했나"에 좌우됐다. 실측 결과 100전투 시 군주 도착 레벨이 59(에이스38, 완전 시시), 24전투면 전 구간 벽.
해결 — 두 지렛대:
- **`WILD_FLOOR=[5,9,15,20,23,28,34]`** (index=region): 야생 레벨의 하한이자 XP 끌개의 앵커. 덜 싸운 플레이어를 끌어올린다.
- **`xpMult(level)`**: 오버월드에서만, 정령 레벨이 지역 앵커를 넘을수록 XP 급감(1.4→1.0→0.45→0.15). 레벨이 지역에 수렴 → 그라인딩해도 폭주 없음. 실내(체육관·특수지역)는 관여 안 함.
- **게이트 리램프**: 체육관3 23~25, 체육관4 28~31, 제단수호 30~34, 숲의 군주 34~38, 챔피언 42~45. 게이트 간 점프 ≤8(챔피언 +15 절벽 제거).
측정 도구 `scripts/difficulty.js`(표 출력) · 회귀 테스트 `scripts/curve_test.js`(램프 단조·폭주 방지·보통 플레이 ±4.5).
⚠️ 밸런스는 플레이테스트가 최종 검증이다. 시뮬레이션은 XP 경제(킬당 ~1.45레벨)만 모델링하며 상성·교체·아이템은 빼고 본다.

### 맵 게이트 참고 (트래커/기획 수정 시)
- 체육관 입구 = `G` 타일, `GYM_AT`에 정의된 4곳. 뱃지 키는 TRAINERS `"1"~"4"`.
- 정령 리그 입구 = `U` 타일 (18,9). `forestBadges()>=4`로 잠김.
- 군주의 제단 = `X` 타일 (8,8) → 제단 실내. 내부 `A` 타일의 진행은 `altarStage()`가 결정: **숲의 군주(`lord`) → 흑요마(`shadow`) → 오로르(`dawn`) → `quiet`**.
  - `lord`(메인 클라이맥스): `startTrainer("X")` → 승리 시 `G.badge`=숲의 인장 → `EPILOGUE` 엔딩 → **재대결 시스템 해금**(`maybeRematch`가 `G.badge`로 게이트됨).
  - `shadow`/`dawn`은 엔딩 후 제단에 다시 와서 잡는 포스트게임 보스. `showEnding` 텍스트가 이 구조를 전제로 쓰여 있다.
  - 복구 이력: 예전엔 `A` 타일이 숲의 군주를 건너뛰고 곧장 흑요마로 가서, 숲의 군주·EPILOGUE·인장·재대결이 통째로 죽어 있었다. `altarStage()`에 `lord` 단계를 앞에 끼워 복구. 회귀 테스트 `scripts/altar_test.js`.

### 다이어트 결과 (완료)
three.js(589KB) + BUNDLED_ART(616KB) + Map3D 코드 216줄 제거 → dist 4.7MB → **3.5MB**.
남은 용량은 사실상 전부 크리처 아트 86종(PAINT_ART)이라 더 줄이려면 아트 화질/해상도 트레이드오프가 필요하다.

## 시각 검증 (스크린샷)
`scripts/screenshot.js` — Playwright + Chromium으로 dist를 실제로 띄워 타이틀→캐릭터→스타터→맵→전투까지 자동으로 몰고 가며 PNG 캡처 + 런타임 에러 수집. UI/아트/게임필 변경은 이걸로 눈으로 확인한다.
```bash
npm install playwright && npx playwright install chromium   # 최초 1회
node scripts/screenshot.js dist/spirit_grove_3d.html <출력폴더>
```
canvas 기반이라 jsdom으로는 렌더가 안 잡히므로, 시각 확인은 반드시 Playwright로.

## 세션 워크플로
"새 아트 왔어 → 파이프라인 → 빌드 → 검증 → 커밋" 순으로. 큰 변경 전 `git commit`. 코드 회귀는 `verify.sh`(jsdom 5종), 시각 확인은 `screenshot.js`(Playwright).
