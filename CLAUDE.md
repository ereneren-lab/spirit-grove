# 정령의 숲 (Spirit Grove 3D) — 프로젝트 가이드

이 파일은 Claude Code가 매 세션 자동으로 읽는 프로젝트 지침이야. (예전 `작업_인수인계.md`를 대체)

> 📋 **이 파일 다음으로 [`WORKLOG.md`](WORKLOG.md)를 읽을 것.**
> 여기(CLAUDE.md)는 **영구 지식** — 아키텍처·규칙·함정, 잘 안 변하는 것.
> WORKLOG.md는 **휘발성 상태** — 지금 어디까지 했나, 진행 중인 작업, 다음에 뭘 할까.
> 대화 컨텍스트가 날아가도 작업이 안 끊기게 **커밋할 때마다 WORKLOG.md를 갱신한다.**

## 개요
- 크리처 수집형 RPG. 렌더러는 **Map2D**(canvas 2D) 단일. 전투는 DOM UI.
  - Map3D/three.js는 제거됨(모든 진입 경로가 Map2D로 덮어써서 도달 불가한 죽은 코드였음). 되살리려면 git 이력 참조.
- 아트는 **외부에서 생성**(ChatGPT 등) → PNG를 `art_inbox/`에 넣으면 파이프라인이 배경제거·정렬·저장.

## 아키텍처 (에셋 분리됨)
편집은 `src/` + `assets/`에서, 배포는 인라인 번들 한 파일(`dist/`)로.

| 경로 | 역할 |
|------|------|
| `src/index.html` | **편집용 소스**. DEX·MOVES·전투 흐름·맵·UI. 아트/규칙 자리에는 주입 마커(`//@@PAINT_ART@@`, `//@@RULES_*@@`)만. |
| `src/rules/*.js` | **순수 규칙 계층** — DOM을 안 쓴다. `util`(rand·ri·clamp) · `tables`(TYPES·STATUSES·파생·EFF·특성/성격) · `battle`(damage·랭크·급소·다단히트 등). |
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

### 배포 (GitHub Pages + Actions 자동배포)
라이브 URL: **https://ereneren-lab.github.io/spirit-grove/** (계정 `ereneren-lab`, 저장소 `spirit-grove`).
- **재배포는 한 줄: `bash scripts/deploy.sh`** — 빌드 검증 → orphan 스냅샷 → SSH push. push되면 **GitHub Actions(`.github/workflows/deploy.yml`)가 서버에서 `build.py`를 돌려 자동 배포**(1~2분). yacht-dice의 Render 자동배포와 같은 흐름.
- 진행 확인: `gh run watch` · https://github.com/ereneren-lab/spirit-grove/actions
- ⚠️ **git-over-HTTPS push가 이 환경에서 막혀 있다** — 1KB조차 무한 행. API·ls-remote(GET)는 됨. **반드시 SSH 원격**(`git@github.com:...`, `~/.ssh/id_ed25519`로 인증). HTTPS로 바꾸면 또 멈춘다. deploy.sh가 SSH 원격을 전제.
- ⚠️ **로컬 `.git`이 479MB**(dist를 매 빌드 커밋한 이력) → 전체 이력 push는 비현실적이라 deploy.sh가 **orphan 단일 스냅샷**을 remote `main`에 force-push한다. remote `main`=스냅샷 1커밋, **로컬 `main`은 전체 이력 보존**(CLAUDE.md가 커밋 이력을 중요시하므로 로컬은 안 건드린다).
- **소스가 진실의 출처**: Actions가 서버에서 빌드하므로 `index.html`(빌드 산출물)은 `.gitignore`. Pages `build_type=workflow`.
- ⚠️ 워크플로 파일(`.github/workflows/deploy.yml`)이 orphan 스냅샷에 포함돼야 트리거된다 — `git add -A`라 자동 포함. 지우지 말 것.
- ⚠️ **커밋할 때 `dist`도 포함**(`git add -A`). 안 하면 deploy.sh의 `git checkout main`이 로컬 dist를 옛 커밋으로 되돌려 **로컬 테스트가 옛 dist로 헛돈다**(실제로 겪음 — 가로모드 수정이 로컬에서 안 보였다). deploy.sh가 끝에 재빌드해 보정하지만, 커밋에 dist를 넣는 게 근본.

### 정령 요약 크리처 아트가 능력치 바를 덮음 (`img.cart` 크기 제약)
직접 화면 검수로 발견: 정령 요약(showMonSummary)에서 크리처 아트가 **원본 360px로 터져** 능력치 바를 덮었다. 원인은 CLAUDE.md가 반복 경고한 그것 — `creatureVisual`이 뱉는 `<img class="cart">`가 크기 제약이 없다. 요약은 70px 컨테이너에 넣었지만 `.cart`에 매칭되는 크기 규칙이 없어 오버플로. → **`img.cart`에 기본 제약**(`max-width/height:100%;object-fit:contain`) 추가 — `.crit`(전투 100%)·`.em`(1.15em)은 더 구체적이라 그대로. 이 재발 버그를 구조적으로 차단.

### 상점·가방 볼 아이콘 통일 (미니 정령구)
볼 아이콘이 🔮🟣🥅🌑⚡💚🟡 제각각 이모지였다 → `itemIcon(it)` 헬퍼로 볼은 **클래식 정령구 미니**(`.catchball.mini`, 던지는 볼과 같은 룩), 나머지는 이모지. 상점·가방·구매창 공용. `BALLS[key].cls`로 색 매핑.

### 정령이 흑백으로 보임 — 진화 실루엣 필터 잔존
유저 제보: 정령이 가끔 흑백으로 보인다. 원인: 진화 모프(`evolveAnimate`)가 스프라이트에 `filter:brightness(0) invert(1)`(실루엣)을 씌우는데, 연출이 **중간에 끊기면**(전투 종료·리사이즈 등) 그 필터가 남는다. 스프라이트 요소(`#meSprite`/`#foeSprite`)는 재사용이라, 다음 정령이 흑백으로 뜬다. → **`setCrit`(스프라이트 내용 세터, `renderCombatants`가 매 렌더 호출하는 단일 funnel)에서 `sp.style.filter=""` 리셋**. 진화 연출은 setCrit 호출 '뒤'에 실루엣을 다시 씌우므로 안전. (⚠️ `.faint` 제거는 넣지 말 것 — 기절 애니를 끊는다.)

### 가로 오버레이 최적화 (가방·정령·도감)
유저: 가로에서 오버레이가 이상하고 닫기 버튼이 안 보인다. 세로용 카드가 화면을 다 먹어 1~2개만 보였고, 스크롤하면 ✕가 밀려 사라진 것처럼 보였다(실은 `.ov-head` 고정·`.ov-body` 스크롤이라 남지만, 안전영역·좁은 세로가 문제). → 가로에서 `.overlay`에 **안전영역 패딩**(노치 회피) + `#pcBody`/`#bagBody`를 **2열 그리드**(가방은 `.bag-tabs`가 `grid-column:1/-1`로 전체폭). 헤더(✕)는 고정. 카드 3개+ 보이고 넓은 공간 활용.

### 가로 전투 비율 (아레나 우선)
유저: 가로 전투가 너무 반반이라 아쉽다. → 아레나/메뉴 58/42 → **68/32**(`#battle .field flex 68%` · `.battle-ui 32% min-width 238px`). 아레나가 화면을 크게 차지하고 메뉴는 우측 슬림 패널. 5버튼 다 뷰 안(회귀 확인).

### (대형) 전투 후 검정 화면 — 전투 중 resize가 캔버스를 0으로
유저 제보: 포획/전투 후 화면이 갑자기 까매졌다. 원인: `Field.resize()`가 `canvasWrap.clientWidth*2`로 캔버스 픽셀크기를 잡는데, **전투 중엔 맵 뷰가 `display:none`이라 clientWidth=0 → 캔버스가 0×0**이 된다. 그 상태로 맵 복귀 시 아무것도 안 그려져 **검정 화면**. **모바일 Safari는 전투 중에도 resize를 자주 쏜다**(주소창 표시/숨김·앱 전환·회전) → 내 회전 훅(`resize`/`orientationchange`→`Field.resize()`)이 거기 반응.
- 수정: `Field.resize()`가 **wrap 크기가 0이면 스킵**(캔버스를 0으로 안 만든다). + `endBattle`이 `show("map")` 후 `Field.resize()`를 불러 스테일 크기 보정.
- ⚠️ **숨겨진 요소의 clientWidth로 캔버스 크기를 잡지 말 것.** 회귀 `mobile_controls_test`(전투 중 resize 후 캔버스≠0). 재현: 전투 진입(map 숨김) → resize → 캔버스 0×0 확인 → 수정 후 유지.

### 정령구 디자인 (클래식 포켓몬볼)
유저: "정령구 너무 구려". 던지는 볼(`.catchball`)이 단색 구슬+흰 점이었다 → **위 컬러/중앙 다크 밴드/아래 밝은 반구/센터 버튼/광택**의 클래식 포켓몬볼 룩으로. 볼마다 `--top`(위 색)만 다르고 프리미엄 볼은 버튼 링이 발광(고급=금·다크=녹·퀵=금). 바닥 정령구(`_itemBall` 캔버스)도 예전 빨강→**민트**(게임 정령구 색)로 통일 + 세로 그라디언트·광택.

### 모바일 롱프레스 콜아웃 차단
방향키·A/B를 **꾹 누르면 iOS 콜아웃(복사/선택 메뉴)이 뜨고 글자가 선택**됐다(유저 제보). `-webkit-tap-highlight-color`만 있고 콜아웃/선택 방지가 없었다. → `*`에 `-webkit-touch-callout:none` + `-webkit-user-select:none`(전역), `input,textarea,[contenteditable]`은 예외로 `text`(저장 내보내기/불러오기 복사·붙여넣기 유지). 회귀 `mobile_controls_test`가 버튼=none·savebox=text 확인.

### 모바일 컨트롤 (게임보이식) + 가로모드
유저 피드백: "방향키 왼쪽, AB 오른쪽이면 진짜 포켓몬 같잖아" + "가로로 돌렸을 때 화면 꽉차지도 않고".
- **세로**: 메뉴 6개(도감·가방·정령·지도·카드·귀환)를 **상단 한 줄**(아이콘+라벨, 6열)로. 하단은 **방향키(왼쪽, 십자·A/B 분리)** + **A/B 대각 원형(오른쪽)** — A 위-오른쪽(분홍), B 아래-왼쪽(파랑). 예전엔 A/B가 방향키 십자 안에 박혀 있었다.
- **가로**(`@media (orientation:landscape) and (max-height:600px)`): **핸드헬드식 거터 배치**. 맵은 가운데 밴드(양옆 164/160px 안쪽), 왼쪽 거터=메뉴 2×3+방향키, 오른쪽 거터=A/B. **컨트롤이 맵을 안 가린다**(처음엔 맵 위 오버레이로 했다가 '어수선하다' 피드백 → 거터로 재설계). `env(safe-area-inset-*)`로 노치 회피, 힌트 숨김.
  - ⚠️ 거터 폭이 방향키(148@left8=우156)·A/B(138)를 **완전히 담아야** 맵을 안 가린다. 회귀가 맵 좌/우변이 컨트롤 거터를 침범하는지 실좌표로 본다.
  - ⚠️ **가로 전투**도 재배치 필수: 세로 스택(아레나 340 + 메뉴 184 = 524)이 가로 높이(~357)에 안 맞아 **메뉴가 화면 밖으로 밀려 '까만 화면'**이 됐다(유저 제보) → `#battle{flex-direction:row}`로 아레나 왼쪽 58%·메뉴 오른쪽 42%. 회귀가 가로 전투에서 메뉴 5개가 뷰 안에 있고 공격 탭→기술 메뉴가 열리는지 확인.
- ⚠️ **캔버스 리사이즈 훅**: 회전 시 캔버스 픽셀 크기를 다시 잡아야 한다(예전엔 리스너가 없어 회전해도 안 바뀜) → `resize`/`orientationchange`에 `Field.resize()`(160ms 디바운스, 1회 등록).
- ⚠️ A/B를 방향키 DOM에서 분리(`.pads`>`.dpad`+`.abpad`)했으니, **방향키는 `data-dir`, A/B는 `#actBtn`/`#backBtn` id**로 배선됨(이건 유지). 회귀 `mobile_controls_test.js`(배치 좌표 + 실제 탭 이동/상호작용).

### 홈 화면 앱 (iOS PWA)
아이폰에서 "홈 화면에 추가"하면 **앱처럼 전체화면 실행**된다. `<head>`의 메타태그로 구현:
- `apple-mobile-web-app-capable=yes`(브라우저 크롬 없이 standalone) · `apple-mobile-web-app-title`(홈 화면 이름) · `apple-mobile-web-app-status-bar-style=black-translucent` · `theme-color` · `apple-touch-icon`(180×180 PNG **data URI 인라인** — 단일 파일 유지) · `viewport-fit=cover`(노치까지).
- 아이콘은 `scripts/`가 아니라 PIL로 생성한 것을 base64로 head에 박았다(브랜드 = 민트 그라디언트 + ✦). 재생성하려면 그 파이썬 스니펫 참조.
- `@media (display-mode:standalone)`: 스테이지를 전체화면으로 펴고 `env(safe-area-inset-*)`로 **다이나믹아일랜드·홈 인디케이터**를 피한다. 일반 브라우저 탭에선 기존 폰-창 레이아웃 유지.
- ⚠️ build.py는 head를 안 건드리지만, 회귀 방지로 `verify.sh`가 5개 태그 존재를 grep으로 강제한다(누락 시 홈 화면 앱이 깨진다).
- ⚠️ **실제 설치는 HTTPS 호스팅 필요** — `file://`은 iOS에서 "홈 화면에 추가"가 안 뜬다. GitHub Pages 등에 올려 Safari로 열고 공유→홈 화면에 추가.

## 아트/설계 규칙
- 화풍: soft anime, cel-shading, 귀엽고 따뜻하게. 실제 포켓몬 애셋 금지, 오리지널만.
- 진화라인은 같은 색·모티프(한 정령이 성장하는 느낌). 종이 통째로 바뀌면 어색.
- 크리처 배경은 심플(어차피 제거). 주인공은 정면 ¾뷰(좌우반전용) + 뒷모습 별도.

## 버그 수정 이력 (재발 주의)
- **HP바 갈라짐**: HP fill이 저체력 시 `crit`/`warn` 클래스를 붙이는데, `crit`이 **크리처 아트 컨테이너 클래스와 이름 충돌**(`.crit{position:relative;margin:0 auto}`)해서 fill이 중앙정렬 → 왼쪽 ghost와 갭 발생. → HP fill 클래스를 `hpcrit`/`hpwarn`으로 개명 + `.hpfill`을 `position:absolute;left:0`로 명시 고정. (`scripts/gym_test.js` 아님, probe로 확인)
- **체육관 관장 전투 안 걸림**: 관장 타일 1~4가 `walkable` 가드 분기와 move()-into 트리거 목록에서 빠져 있어(5,6,가드만), 실내에서 관장에게 걸어가도 전투가 안 걸렸음. `onArrived`도 실내 블록에서 조기 return. → walkable·트리거 두 곳에 1~4 추가(가드처럼 취급: 벽으로 걸어들면 전투, 이기면 통과). 회귀 테스트 `scripts/gym_test.js`.
- **포획 시 정령 정체성 소실**: `tryCatch`가 `makeMon(foe.id,foe.level)`로 **새 정령을 랜덤 생성**하고 hp/status만 복사 → 샤이니(이로치)·IV·성격·성별·기술이 전부 사라졌다. → 잡은 정령 = 그 야생 `foe` 객체 그대로(`const cap=foe`), 전투 잔여상태(stages/_confuse 등)만 리셋.
- **세이브 시 기술셋 소실**: `serMon`이 `moves`/`pp`를 저장 안 하고 `reviveMon`이 `makeMon` 기본 학습셋으로 재생성 → TM으로 배운 기술·커스텀 기술셋이 세이브/로드로 초기화됐다. → `serMon`에 `mv`/`pp` 추가, `reviveMon`이 있으면 복원(구세이브는 기본값 폴백). (샤이니·IV·성격·성별은 원래 저장됨.)
- 회귀 `scripts/catch_identity_test.js`(포획·세이브 후 샤이니/IV/성격/성별/기술/PP 보존).
- **주인공 좌우 플립이 또 반대(아트 방향 재확인)**: 예전 주석은 주인공 아트가 '좌향'이라 적어 `dir==="right"`에 반전했는데, **실제 아트는 우향**(돋보기가 우측)이다 → 오른쪽 이동 시 반전돼 왼쪽을 봤다(유저 제보). **스크린샷으로 실제 방향을 확인**하고 `dir==="left"`에만 반전으로 수정. 팔로워(크리처 아트=좌향)는 원래대로 `facing>0`(오른쪽) 반전이 맞다 — 주인공과 아트 기본방향이 반대라 조건도 반대. 회귀 `hero_facing_test.js`(반전 조건이 주인공=left·팔로워=right인지). ⚠️ **아트 방향은 주석 믿지 말고 렌더 스크린샷으로 확인할 것.**
- **키큰 풀이 나무처럼 보여 '통과한다'는 오해**: `T`(키큰 풀=조우 구역, 걸을 수 있음)를 키 큰 뾰족한 풀날로 그려 작은 나무/덤불처럼 보였다 → 유저가 "나무를 통과한다"고 느낌(실제 충돌은 정상 — 둥근 나무 `#`·집·물은 다 막힘). **포켓몬식 키큰 풀 패치**(진한 초록 둥근 사각 + 짧고 촘촘한 풀 텍스처)로 재렌더해 '걸어 들어가는 잔디밭'임을 명확히. 충돌 로직은 안 바꿈(조우 구역 유지). 오버레이 스크린샷으로 충돌↔렌더 대조해 확인.
- **주인공/팔로워 좌우 플립 반대**: 크리처·주인공 아트는 기본이 **좌향**(foxfire 코가 왼쪽. 배틀 me가 `.sprite.me` scaleX(-1)로 항상 뒤집혀 적을 향하는 것도 이 규칙). 그런데 오버월드 주인공은 `dir==="left"`일 때, 팔로워는 `facing<0`(왼쪽 이동)일 때 뒤집어서 **진행방향과 반대로** 봤다. → 주인공은 `dir==="right"`, 팔로워는 `facing>0`(오른쪽 이동)일 때 뒤집도록 반전. 이제 좌향 이동=기본 아트, 우향 이동=미러 → 진행방향을 본다.
- **경험치 바 애니 없음**: `gainXpFor`가 XP를 즉시 반영하고 레벨업 시 잔여치로 뚝 떨어져 포켓몬 느낌이 없었다. → 선두 정령은 `animExp(pct)`로 **100%까지 차오름 → 레벨업 0 리셋(`setExpBar0`) → 잔여치까지 계속** + `sfx("exp")` 상승음. 비선두는 기존처럼 즉시. 회귀 `scripts/exp_test.js`(바 폭 100→0→잔여치 확인).
- **정령 등장 애니 이중 재생**: `setupBattleUI`의 `.enter` CSS 애니 ✕ `sendOutAnim` JS 충돌 → `.enter` 제거(`scripts/sendout_test.js`).
- **문 진입 즉시 튕김**: 상점/체육관 등 인테리어는 입장 위치(startY)가 출구(exitY) 바로 위라, 위에서 아래키로 들어가면 `heldDir="down"`이 입장 후에도 남아 `onArrived`→`continueMovement`가 다시 아래로 이동→출구 타일→즉시 퇴장(튕김). → `_enterInterior`/`_exitInterior`에서 `heldDir=null; stopPath()` + `_warpLock`(입력잠금, `move()` 첫 줄에서 `performance.now()<_warpLock`이면 return). 회귀 `scripts/door_bounce_test.js`(아래키 홀드 입장 후 indoor 유지 확인, 구코드는 indoor=null로 튕김).

- **오버월드 NPC가 인테리어 안에 그려짐**: NPC 렌더 패스(그리고 미니맵 NPC 마크)에 `G.indoor` 가드가 없어, **모든 실내**(센터·체육관·동굴·신규 지역…)에 오버월드 NPC가 자기 오버월드 좌표 자리에 유령처럼 서 있었다. `walkable`은 이미 `!G.indoor`로 스코프돼 있어 **말도 안 걸리고 통과되는 허깨비**라 오래 안 들켰다. → 두 패스 모두 `!G.indoor` 가드. ⚠️ 회귀(`npc_roam_test`)는 `fillText`와 `Map2D._char`를 **둘 다** 가로채 센다 — 대부분의 NPC는 이모지가 아니라 `spr` 스프라이트라 `fillText`만 세면 대조군이 0이 되어 테스트가 헛돈다. 그리고 `enterInterior`는 warpFade 150ms 지연 스왑이라 **스왑 후에 카운터를 리셋**해야 한다.
- **특수 지역 야생 조우가 한 번도 안 걸렸다(대형)**: `onArrived`의 실내 블록이 특수 타일 처리 후 `continueMovement(); return;`으로 끝나는데, **야생 조우 굴림은 그 뒤 실외 구간에 있었다** → 동굴·용암굴·늪지·설원·해안·섬·신전·봉우리·유적·분화구·화원 **11곳의 조우가 전부 죽은 코드**였다(늪지에서 20칸을 걸어도 0회). 조우 함수·풀·레벨식은 멀쩡했고 **회귀 테스트가 그 함수를 직접 호출**해 통과시켜서 오래 안 들켰다 — "함수가 있다"와 "플레이에서 걸린다"는 다르다.
  → 굴림을 `wildRoll(t,depth)`로 **실내/실외 공용 단일 출처**로 뽑고 실내 블록에서도 부른다.
  - ⚠️ **오버월드 조우(`startEncounter`)는 `!G.indoor`로 막을 것.** 체육관2엔 `T`, 정령 리그엔 `g` 타일이 있어서, 안 막으면 실내에서 오버월드 조우가 돌고 `wildFloor()`가 **인테리어 좌표를 지역으로 읽어**(체육관 y=3 → region 6) Lv33짜리 야생이 튀어나온다. 실제로 스크린샷에 Lv5 스타터 앞에 Lv33 야생이 찍혀서 발견했다.
  - 회귀 `scripts/indoor_encounter_test.js`는 **함수를 부르지 않고 키 입력으로 걸어서** 조우를 센다. 수정 전 빌드에서 실패하는 것까지 확인했다.
- **`learn` 배열이 중첩으로 깨져 8종이 기술을 안 배웠다**: `learn:[[16,"bite",[28,"nastyplot",[36,"roar"]],[32,"focusenergy"]],...]` — 형제 항목이어야 할 것이 **세 번째 원소로 중첩**돼 있었다. `makeMon`이 `([lv,mv])`로 구조분해하므로 **첫 기술만 배우고 나머지는 영영 안 배워졌다**(8종·13기술 소실, 라꾸리는 Lv30에 기술이 2개뿐이었다). 눈에 안 띄는 데이터 손상이라 아무 테스트도 못 잡았다.
  → 평탄화 + `rules_unit_test`에 **학습셋 위생 4종**(항목이 [레벨,기술] 2원소 · 기술이 MOVES에 실존 · 레벨 오름차순 · 레벨업으로 기술이 실제로 늘어남) 추가.
  - ⚠️ 이 버그를 처음 드러낸 건 **"아무도 못 배우는 기술 목록"** 이었다(`screech`·`roar` 등 10종). 그래서 **모든 기술에 획득 경로가 있다**(학습셋 ∪ TM)도 단정으로 박았다 — 죽은 콘텐츠 감지기로 계속 값어치를 한다. 남아 있던 6종은 범용 TM으로 열었다(플레이어 전용 = 밸런스 불변 원칙).
  - ⚠️ 학습셋을 고치면 **트레이너·야생의 기술도 늘어난다** → 밸런스 재측정 필수. 이번엔 게이트 승률·리그 완주율 모두 노이즈 범위였다(재측정 확인).
- **아이템 이름표가 키를 그대로 노출**: `ITEM_KO`엔 TM·기력·엘릭서·볼·지닌물건이 없어서, 바닥에서 기력을 주우면 "**ether**을(를) 주웠다!"가 떴다(트레이너 보상 표기·전투 아이템 사용도 동일). 이름표를 병렬 테이블로 또 늘리는 대신 **`itemName(k)` 단일 조회**(ITEM_KO → BALLS.ko → HELD_ITEMS.ko → BAG_ITEMS.nm → SHOP.nm → PREMIUM.nm → 키)로 통일하고 호출부 7곳을 교체했다.
- **`tm_confuse`가 어떤 상점·바닥·보상에도 없었다** — 정의만 있고 영영 못 얻는 아이템. 상점에 추가.

### 죽은 콘텐츠 감사 (`scripts/dead_content_test.js`)
이 프로젝트에서 반복해 나온 버그 종류가 **"정의는 있는데 플레이에서 닿지 않는다"** 이다(특수 지역 조우 11곳 · 깨진 learn 배열 8종 · 못 얻는 TM · 키가 노출되는 이름표). 개별 수정만으로는 재발하므로 **데이터에서 직접 단정**한다:
- 지급되는 아이템 키가 전부 한글 이름을 낸다(키 노출 0)
- 가방 아이템이 전부 획득 가능(상점·바닥·숨김·보상·퀘스트·교환소)
- 이름표만 있고 아무도 안 주는 아이템 0
- 배치 안 된 트레이너 0
- ⚠️ **이벤트로 직접 지급되는 것**(vsseeker)은 데이터가 아니라 코드 경로라 스캔이 안 된다 → 테스트 안에 이유를 적은 짧은 허용목록으로 둔다. 허용목록이 길어지면 그건 "데이터로 못 옮긴 콘텐츠가 많다"는 신호다.

- **잠듦 상태 undefined**: `STATUS_KO`/`STATUS_CLS`에 `slp` 누락(psn/brn/par만) → 잠들면 상태 칩이 `undefined`. `_MV_STATUS_KO`엔 있었음. → `STATUS_KO.slp="잠듦"`, `STATUS_CLS.slp="b-slp"`(+`.b-slp` CSS) 추가.
- **소수점 레벨**: 특수 조우(파도/낚시/설원/섬/해안/용암/동굴)가 `clamp(avgLevel()+...)`만 하고 floor 안 해 소수점 레벨. → `makeMon`에서 `level=Math.max(1,Math.floor(level))`로 정수화(모든 조우/스탯 커버).
- 회귀: 위 세 가지 + 파티 재정렬 + 돌 진화는 `scripts/bugfix_batch_test.js`.
- **(몽키 퍼즈가 발견) 클립보드 미처리 거부**: `navigator.clipboard.writeText`는 **Promise**라 동기 `try/catch`로는 거부를 못 잡는다 → 권한 거부 시 "Write permission denied"가 미처리 에러로 새어나갔다. `.then/.catch`로 감싸고 `execCommand` 폴백.
- **(몽키 퍼즈가 발견) 전투 종료 후 `G.foe` 참조**: `winBattle`이 `await` 사이사이에 `G.foe`를 다시 읽는데, 그 동안 전투가 끝나면(도망·울부짖기·전멸) null이 되어 `reading 'level'`로 터졌다 → 시작 시점에 `const _foe=G.foe` 스냅샷을 잡고 그것만 쓴다.
- **(몽키 퍼즈가 발견) 지연 콜백의 `G.foe`**: 조우 연출은 `transitionToBattle(()=>{...})`로 **와이프가 화면을 덮은 뒤(≈340ms)** 실행된다. 그 사이 전투가 끝나면 모든 조우 대사(`G.foe.shiny/name`)가 `reading 'shiny'`로 터졌다 → `transitionToBattle` 한 곳에서 `if(!G.foe||!G.inBattle)return` 가드. `renderCombatants`도 전투 밖에서 불릴 수 있어 같은 가드를 넣었다.
- **특수기가 랭크를 무시**: `damage()`가 `const aMul=isSpec?1:...` / `dMul=isSpec?1:...`로 **특수기일 때 능력변화 배율을 통째로 1** 처리 → 불·물·풀·전기·얼음 기술은 칼춤·철벽류가 전혀 안 걸렸다(랭크 게임이 물리 타입 전용이었음). 동시에 `stages`가 `{atk,def,spd}` 3종뿐이라 특공/특방/명중/회피 랭크 자체가 부재. → `stages` 7종(`newStages()`), 특수기는 `spa`/`spDef` 랭크 적용, 화상 반감은 물리에만, 명중 판정에 `accMul`(본가 3/3 표) 곱, 급소는 공격자 마이너스·방어자 플러스 랭크 무시. **`stages` 초기화 지점이 14곳이라 반드시 `newStages()`/`resetStages()`만 쓸 것** (리터럴 `{atk:0,def:0,spd:0}` 부활 금지).
- **교체로 랭크 유지 익스플로잇**: `chooseSwitch`가 물러나는 정령의 랭크를 안 지워, 뒤로 뺐다 다시 내보내면 +6 부스트가 그대로 남았다. → 교체 시 `resetStages` + `_confuse`/`_seeded`/`_flinch` 해제(본가 규칙).
- ⚠️ 화상·상태이상 데미지 테스트를 짤 땐 **기본 특성 폴백이 `guts`(근성)** 라는 걸 기억할 것 — 상태이상이 오히려 공격 1.5배라 화상 반감 검증이 뒤집힌다. 중립 특성(`sturdy` 등)으로 고정하고 재라.
- 회귀 `scripts/stage_rank_test.js`(특수기 랭크·화상·명중표·급소 랭크무시·교체 리셋).

### 듀오 배틀(2v2) UI
`dbCard`가 예전엔 `m.em`(작은 이모지)로 정령을 그려 허접했다. → `creatureVisual(m.id,m.type)` 크리처 아트로 렌더(`.dbsp` 52px 박스 + 지면 그림자 + drop-shadow), foe/ally 카드 배경 틴트 구분, shiny 필터. 상태칩(`.dbst`)은 하드코딩 빨강 대신 `STATUS_CLS` 색 클래스 사용(`.dbst.b-*`가 `.dbst`를 specificity로 이김). 별도 오버레이 시스템(`#dbOverlay`, `dbRender`/`dbCard`/`dbLog`)이라 메인 배틀과 무관. 회귀 `scripts/duo_battle_test.js`. `startDouble`/`dbRender`를 `SG.flow`에 노출(테스트용).
- 상태이상 표기 전수 점검 결과: `slp` 누락(수정됨)이 유일한 갭. 독/화상/마비 잔뎀·혼란·풀죽음·씨앗 메시지는 모두 완비. 듀오 배틀 상태칩 색도 이참에 정상화.

### 진화 장면 (배틀 밖 · 진화의 돌)
배틀 밖 진화(진화의 돌 `evostone`)는 예전엔 `flashHint` 텍스트만 뜨고 애니가 없었고 `type2`도 안 넣었다. → `evolveScene(m,to,itemKey)`: 전용 오버레이(`#evoOverlay`, `.evo-art`/`.evo-msg`)에서 포켓몬식 실루엣 모프(`brightness(0) invert(1)` 글로우 + 펄스, 중간에 새 종으로 스왑)를 보여주고 "어라…? → 축하해!" 메시지. B/✕로 취소 가능(취소 시 **돌 소모 안 함** — 소모는 성공 시점). `type2`·친밀도·울음소리·도감 반영.
- **진화 연출 통일**: `applyEvolution(m,to,false)`(비선두/배틀 밖)는 이제 `toast` 대신 `evolveScene`을 쓴다(예전엔 파티 뒤쪽 정령이 전투 후 진화하면 toast만 떴음). `evolveScene`은 `_oob=!G.inBattle` 가드로 **전투 중이면 음악을 안 건드리고**(startMusic/stopMusic 스킵) 끝에 `renderCombatants()`로 배틀 뷰만 갱신 — 배틀 음악 유지. 배틀 선두 진화는 여전히 `evolveAnimate`(배틀 스프라이트 모프).
- **이상한사탕 진화**: candy 사용 후 `evolveCheck(m,false)` 호출 → 레벨 진화 조건 충족 시 진화 장면(포켓몬 레어캔디처럼).
- 회귀 `scripts/evo_unify_test.js`(비선두 진화 장면 + 전투 중 음악 스파이). ⚠️ 테스트에서 `enterMap`은 필드 렌더 루프·음악을 켜므로 배틀 시나리오 검증 전엔 새 페이지 로드로 격리할 것.

### 정령 순서 조절 (포켓몬식)
정령관리(PC) 파티 탭 카드에 ▲▼ 재정렬 버튼. `pcAction("up"/"down",i)`가 `G.party[i]`↔이웃을 스왑하고 `G.active`가 옮긴 정령을 따라간다. 회귀 `bugfix_batch_test.js`.

### 조작·UI 포켓몬화
- **대화창 타이핑**: `_renderDlgPage`가 태그 제거한 평문을 한 글자씩 타이핑(setInterval, `sfx("type")`) → 완료 시 `innerHTML`로 서식 적용 + ▼커서. `_dlgComplete`로 탭/A 즉시완성→진행. `.dialogbox`는 원래부터 포켓몬풍 크림 박스. A 버튼(`#actBtn`)이 대화 중 `advanceDialog` 호출(예전엔 interact 조기 return으로 무반응). 회귀 `scripts/dialog_type_test.js`.
- **전투 메뉴 방향키 조작**: 전투는 별도 `#battle` 뷰라 오버월드 D패드/키가 안 닿았다. 전용 keydown 추가 — 방향키=커서(`battleNav`, 2열 그리드), Enter/Z=선택(A, `battleSelect`→button.click), Esc/X=뒤로(B, `battleBack`→기술→메인). 커서 하이라이트 `.mbtn.kbfocus`. `battleFocus`가 전환 시 전역 kbfocus를 지워 숨은 메뉴 잔여 커서 제거. `showMain`/`showMoves`가 커서를 0번에 리셋. 모바일 탭은 그대로. `battleNavActive()`가 `#battle` active·`!G.busy`·메뉴 표시일 때만 동작(메시지 탭게이트와 충돌 방지). 회귀 `scripts/battle_nav_test.js`.
- **고급정령구**: 납작한 🟣 → CSS 3D 구체(`.catchball.great` 보라+금 버튼/글로우). 정령구는 `.catchball.ball`(민트). 포획 애니에서 프리미엄.

### 문 페이드 전환 (포켓몬식)
`warpFade(swap)`: 검정 오버레이(`#warpFade`, canvasWrap 내부 `.warp-fade`)를 페이드아웃(→검정, 150ms)→**완전히 덮인 시점에 맵 스왑**→페이드인(→새 장면, 220ms). `enterInterior`/`exitInterior`가 실제 로직(`_enterInterior`/`_exitInterior`)을 `warpFade`로 감싼다. reduceMotion이면 즉시(swap 바로 호출). `_warpLock`(now+470)이 페이드 동안 입력 잠금.
- ⚠️ `blackout`은 `exitInterior` 후 **동기적으로 G.pos를 STARTPOS로 덮어쓰므로** 지연 페이드판(`exitInterior`)이 아니라 즉시판 `_exitInterior()`를 호출해야 한다(안 그러면 지연 스왑이 STARTPOS를 덮어씀).
- 배 이동(`sailToIsle`/`sailToCoast`/`sailToShrine`/`sailFromShrine`)도 본문을 `warpFade`로 감싸 암전 전환 적용. 호출부의 스토리 힌트 setTimeout(420ms)은 지연 스왑(150ms)보다 늦어 안전. 회귀 `scripts/sail_fade_test.js`.
- 지연 스왑(150ms)이라 입장 직후 G.indoor/G.pos가 잠깐 그대로임 — 스토리 힌트 setTimeout들은 모두 400ms+라 안전.
- 회귀: `door_bounce_test.js`가 문 페이드 opacity 피크(>0.5)도 확인.

### 기술 설명 (`moveDesc` / `moveSummary`)
기술이 뭘 하는지 한 줄로: 타입·위력·효과·PP. 변화기도 정체가 드러남(위협="상대 공격↓", 가속="자신 속도↑↑", 맹독="상대를 독으로", 리플렉터="물리 피해 5턴 감소" 등). MOVES의 `eff`/`heal`/`drain`/`multi`/`pri`에서 파생. 쓰이는 곳: 배우기 오버레이(`buildLearnOverlay`), 기술전문가 잊기/재습득(`mxPickMove`), 전투 기술 메뉴(`showMoves`). 회귀 테스트 `scripts/movedesc_test.js`.

### 설정 토글 (포켓몬화, 둘 다 opt-in)
- **전투 텍스트** `CONFIG.battleText`: `auto`(기본, 자동진행+누르는동안 빨리감기) / `tap`(수동, 메시지마다 탭 진행 + ▼큐, 8초 폴백). 메시지 대기는 `mw()`, 애니메이션 대기는 `wait(fxT())`로 구분. `scripts/movedesc_test.js` 아님 — 동작은 btext 측정으로 확인.
- **이동 방식** `CONFIG.gridMove`: `false`(기본, 탭/키로 바로 이동) / `true`(그리드: 새 방향 첫 입력은 제자리 회전, 홀드하면 걷기 — 포켓몬식). move()에서 `!auto && Field.dir!==dir`일 때 회전 후 130ms 뒤 heldDir이면 이동. 회귀 `scripts/grid_move_test.js`.
- 저장: `cfg.bt`/`cfg.gm`. 설정 UI 세그먼트.

### 신규 지역 — 달빛 화원(garden) · 유일한 낮/밤 지역
나방·꽃 계열(반딧불이·뇌광나방·루나비·꽃날개)과 서식지 없던 풀 타입(새싹냥·꽃표범·푸르사·거목령)을 묶은 지역. 진입 `!`(4,36, region 2 숲) · 가드 `?`(달빛 정원지기 여울) · 조우 10종 · 남보라 야광 틴트 · fieldMusic="forest" · 바닥도구 3(리프의돌·엘릭서·고급물약) · 저장 `gardenSeen`.
- **낮/밤으로 조우 풀이 갈리는 유일한 지역**: `gardenPool()`이 밤이면 10종 전부, 낮이면 `NIGHT_MONS`를 뺀 6종. 조우율도 밤 0.17 / 낮 0.11. 목적은 "밤에만 활동한다"는 **도감 설명문(FLAVOR)과 어긋나지 않게** 하는 것 — 낮에도 다 나오면 도감이 거짓말이 된다.
- ⚠️ 낮 풀이 마르면 안 된다(`pickWild`처럼 필터가 겹치면 빈 배열 → 크래시). 회귀가 낮 풀 ≥4종을 강제한다.
- ⚠️ `dayPhase()`는 실시간 기반이라 테스트는 `Date.now`를 고정해 한 주기를 훑어 낮/밤 위상을 각각 잡는다(몬테카를로 금지). `dayPhase`/`dayCycle`/`gardenPool`을 `SG.flow`에 노출.

### 신규 지역 — 불꽃 분화구(crater)
불 타입 14종 중 **8종이 전용 서식지 없이** 흩어져 있었다(파라꼬 라인 3·냥불·불씨늑대·화염랑·불티나방·화염나방). 용암 동굴이 있지만 그 풀은 바위/땅 중심(조약돌·바위정·굴다람)이라 실질적으로 불 서식지가 아니었다 → **불꽃 분화구** 신설(봉우리·유적과 같은 19-포인트 템플릿, 4번째 재사용).
- 진입 `^`(22,12, region 5 고원) · 가드 `*`(화산 감시자 염호) · 조우 10종(**전원 불 타입** — 회귀가 강제) · 렌더 화산암 레드브라운 틴트 · fieldMusic="cave" · 로어 `N` · 바닥도구 3(불꽃돌·고급물약·부활) · ESCAPABLE · 저장 `craterSeen`.
- ⚠️ **타일 문자가 고갈됐다** — a~z/A~Z 중 남은 건 `t` 하나뿐이었다. 그래서 이번부터 **미사용 기호 문자**를 쓴다(`^` 진입 · `*` 가드). walkable 제외목록은 명시적 나열이라 새 문자는 기본 통행이고, 가드는 `GUARD_TILES`에 넣으면 렌더(1903줄 범용 분기)·미니맵·`isTrainerTile`이 자동으로 따라온다.
- ⚠️ **가드 문자는 오버월드에 절대 나타나면 안 된다** — 미니맵이 `isTrainerTile(t)`이면 `TRAINERS[t].em`을 찍으므로, 오버월드에 그 글자가 있으면 필드·미니맵에 가드 이모지가 뜬다. 진입 문자(오버월드 전용)와 가드 문자(인테리어 전용)를 절대 섞지 말 것.
- 진입 좌표는 **실제 `walkable()`로 BFS**해서 "막아도 도달 범위가 자기 자신만 줄어드는 칸"(=통로가 아닌 잎사귀)을 골랐다. 이 판정을 안 하면 통로를 막아 뒤쪽 콘텐츠가 통째로 미도달이 된다.
- 회귀는 `skyridge_test.js`가 3개 지역을 병렬 커버. reachability(오버월드 95 · 인테리어 20)·dex_flavor·region_content 자동 반영.

### 신규 지역 — 고대 유적(ruins)
normal·rock·ground의 "고대/석 계열"(lumbeast·wyverna·thumplord·terrapin 등)이 흩어져 있어 → **고대 유적** 신설(봉우리와 같은 템플릿). 진입 `z`(14,27, region 3 깊은 숲) · 가드 `h`(유적 수호자, GUARD_TILES 추가) · 조우 10종 · 렌더 더스티 스톤 틴트 · fieldMusic="cave" · 로어 `N` · 바닥도구 3 · 저장 `ruinsSeen`. 봉우리에서 정립한 19-포인트 배선을 재사용 — **템플릿이 검증됐다**(늪지→봉우리→유적). 회귀는 `skyridge_test.js`가 두 지역을 병렬로 커버. dex_flavor는 HABITAT_KO를 읽게 고쳐놔서 새 지역 자동 반영.

### 바다 미니보스 (여명의 섬 · 해일군주)
`NO_WILD` 3종 중 천공룡·거암왕만 보스로 열려 있고 **해일군주(tidalore)만 대체 획득 경로가 없었다** → 여명의 섬 북쪽 곶에 **조수 제단 `@`**(12,1)을 놓아 대칭을 맞췄다. 봉우리·유적 미니보스와 **같은 배선**(`startSeaBoss` · move() 스코프 타일 핸들러 · done-flag `seaBossDone`을 winBattle·tryCatch + freshState/serialize/deserialize 양쪽).
- 섬은 **낚싯대 + 배**가 있어야 오므로 중후반 게이트가 자연히 걸린다(해안 `W`는 시작 마을 옆이라 거기 두면 초반에 Lv45 보스를 만난다 — 일부러 섬에 뒀다).
- `@` 렌더는 shrine/skyridge/ruins와 공용(특수 틴트 분기 안) — **4번째 인테리어가 같은 글자를 쓰고 핸들러만 `G.indoor`로 갈린다.**
- 회귀 `skyridge_test.js`에 조우·done-flag 왕복 + **NO_WILD 3종이 야생 풀에 없음**(보스가 유일 경로라는 전제) 단정.

### 신규 지역 미니보스 (봉우리·유적)
두 신규 지역에 클라이맥스 겸 **진화전용(NO_WILD) 종의 대체 획득 경로**를 깔았다. 봉우리 정상(`@` 7,1)=천공룡(skydrake), 유적 중앙(`@` 7,6)=거암왕(megalith). 둘 다 원래 야생 미출현(wyverna→Lv42 / boulderin→Lv36 진화로만) → 보스전으로 **잡을 수 있는** 유일한 길.
- **아트 0장** — 이미 있는 종을 재활용. **비전설**이라 전설 -0.38 포획 페널티 없이 정상 포획률(대체 경로답게).
- 렌더는 **황금 제단 `@` 재활용**(shrine의 여명룡 타일과 같은 글자, `G.indoor`로 스코프 분기). ⚠️ 얼음 제단 `&`는 유적에 안 어울려서 안 씀 — 둘 다 `@`. 3개 인테리어(shrine/skyridge/ruins)가 같은 `@`를 쓰되 핸들러가 `G.indoor`로 갈린다.
- 배선: `startSkyBoss`/`startRuinsBoss`(startSnowLegendary 템플릿, boss 음악) · move() 스코프 타일 핸들러 2건 · done-flag `skyBossDone`/`ruinsBossDone`을 **winBattle(격파)·tryCatch(포획) 양쪽 + freshState/serialize/deserialize**에 배선(빙하제 `snowDone` 패턴 그대로). 재방문 시 "이미 떠났다" 대사.
- reachability는 인테리어 특수타일 목록(`"NpnsBKHLZY@&AQ"`)에 `@`가 이미 있어 새 `@` 두 개가 자동 커버(19곳 내부 도달 확인). 회귀 `skyridge_test.js`에 보스 조우·done-flag 왕복·NO_WILD 단정 추가.

### 신규 지역 — 뇌명 봉우리(skyridge)
전기/비행이 전용 서식지가 없어(모든 flyer가 2차타입으로 흩어짐, 전기-새/뱀 라인 8종이 어느 특수풀에도 없음) → **폭풍 봉우리** 신설. 늪지 템플릿을 그대로 따랐다:
- 진입 오버월드 타일 **`O`**(17,1, region 6 — 세계의 지붕). ⚠️ 배치는 반드시 **게임 실제 `walkable`로 BFS 도달 가능한 칸**이어야 한다 — 처음 (9,4)/(13,1)은 벽에 갇힌 고립 포켓이라 미도달이었다(수동 python BFS 근사로는 못 잡음, 실제 walkable로 확인).
- `INTERIORS.skyridge`(15×13) · `ENC_POOLS.skyridge`(zapfinch·voltfalcon·thundwyrm·voltsnake·voltrat·sandwhirl·stormhawk·blossomhawk) · `startSkyEncounter`(레벨 28~58) · onArrived 0.14 · 가드 트레이너 **`y`**(폭풍지기, GUARD_TILES에 추가 — i/j/k/l/q는 리그가 씀) · 로어 `N`(SKYRIDGE_LORE) · 바닥 도구 3(천둥돌·고급물약·기력) · `HABITAT_KO.skyridge` · 렌더 폭풍 블루그레이 틴트 · fieldMusic="highland" · ESCAPABLE · 저장 `skySeen`.
- ⚠️ **배선 누락 함정 2건**(이번에 밟음): (1) `reachability_test`가 진입 문자를 두 곳에 하드코딩 — `all` 목록과 `note` 도달 루프 **둘 다** 추가해야 한다(하나만 하면 분모엔 있고 도달로는 절대 안 잡혀 영구 미도달). (2) `dex_flavor_test`가 `HABITAT_KO` 사본을 하드코딩했었다 → 실제 `HABITAT_KO`를 읽도록 고쳐 병렬 테이블 제거(새 풀 추가 시 안 깨짐).
- 회귀 `scripts/skyridge_test.js` + reachability(인테리어 18곳)·dex_flavor·region_content 커버.

### 기술 제어 (앵콜·도발·방해)
상대 행동을 제약하는 층. `performMove`가 `att._lastMove=mvKey`로 마지막 기술을 기록.
- **앵콜**(`eff.encore`): 상대를 `_lastMove`로 3턴 고정(`_encore={move,turns}`). **도발**(`eff.taunt`): 3턴간 변화기(power0) 봉쇄(`_taunt`). **방해**(`eff.disable`): 상대 `_lastMove`를 4턴 봉인(`_disable={move,turns}`).
- **제어 반영 2곳**: `showMoves`(앵콜=그 기술만·PP무관, 도발=변화기 disabled, 방해=그 기술 disabled) + `foeChooseMove`(앵콜 강제 return, 도발·방해로 못 쓰는 기술 usable에서 제외). 잠금 우선순위 **충전 > 앵콜 > 구애**.
- 카운터는 `doMove` 턴 끝에 감소(0이면 해제) — ⚠️ **적용 턴에도 1 감소**하니 3턴기는 적용 직후 2로 보인다(테스트 기대치 주의).
- `_encore`/`_taunt`/`_disable`은 휘발성 → 리셋 지점 6곳. **획득은 범용 TM(플레이어 전용)이라 트레이너·야생이 안 쓴다 → 밸런스·`battle_sim` 무관**(sim 모델링 생략, foeChooseMove 분기는 no-op으로 안전). 회귀 `scripts/movecontrol_test.js`.

### 2턴기 (날기·솔라빔)
충전 개념이 없던 것을 추가. `eff.charge`(+선택 `eff.invuln`) 2턴 기술.
- **날기**(`charge+invuln`): 1턴째 하늘로(반무적 — 상대 공격 안 닿음), 2턴째 재부상 강타. **솔라빔**(`charge`만): 1턴 충전 후 강력한 풀 기술(무적 아님).
- `performMove`: `att._charging`이 있으면 그 기술을 실행(2턴째 재부상, `_resurf`로 PP 재차감·구애잠금 스킵). 없고 `eff.charge`면 1턴째 충전(PP 차감·`_charging`/`_invuln` 세팅·피해 없이 return). 무적 가드는 방어 가드 옆(`def._invuln && power>0` → 빗나감).
- `showMoves`: 충전 중이면 그 기술만(PP 무관 — 이미 냈다). `foeChooseMove`: `foe._charging`이면 그 기술을 계속.
- ⚠️ `_charging`/`_invuln`은 휘발성 → 리셋 지점 6곳 + `battle_sim`(재부상·충전·무적 미스) 파리티. 획득은 범용 TM(밸런스 불변). 회귀 `scripts/twoturn_test.js`.

### 낚싯대 등급 (구·좋은·초)
예전엔 `G.hasRod` 하나로 대물(fishRare) 확률이 25% 고정이었다 → `G.rodTier`(1/2/3)로 등급제.
- 대물 확률 `[0,0.10,0.30,0.55][tier]`, 상위 등급일수록 낚이는 레벨도 +2씩. `startFishEncounter`에서 파생.
- 좋은/초 낚싯대(`use:"rodup"`, tier)로 업그레이드(상점 need:2/3). q_water가 첫 낚싯대와 함께 `rodTier=1` 부여.
- ⚠️ **구세이브 마이그레이션**: `deserialize`에서 `rodTier`가 없으면 `hasRod?1:0`. 세이브 키 `rodTier`.
- ⚠️ 인라인 `//` 주석을 **한 줄짜리 함수 중간에 넣지 말 것** — `startFishEncounter`가 원래 한 줄이라 줄 끝 주석이 나머지(`G.foe=...}`)를 통째로 주석처리해 함수 `}`가 사라졌다(빌드 문법오류). 회귀 `scripts/fishing_test.js`(등급·대물확률·마이그레이션).

### 배틀 기술 확장 (자폭·헤롱헤롱·묶기)
- **자폭**(`eff.selfKO`): 큰 피해 후 사용자도 기절. `performMove` 데미지기 후처리에서 `att.hp=0`(상대 생사 무관). doMove의 사후 판정이 faint 처리.
- **헤롱헤롱**(`eff.attract`): 이성(M↔F)에게만 `_attract` 볼라타일. `canAct`에서 50% 못 움직임. 동성·무성(N)은 무효. `_confuse`처럼 STATUSES가 아닌 볼라타일.
- **묶기**(`eff.trap`): 데미지 + `_trapped=ri(4,5)`. `endTurnStatus` 잔뎀(maxHp/8, 매턴 감소) + **도주(`tryRun`)·자발적 교체(`openSwitch`) 봉쇄**(강제 교체는 통과).
- ⚠️ `_attract`/`_trapped`는 휘발성 → `_confuse`와 같은 **리셋 지점 6곳** + `battle_sim.js`(canAct·applyMove·residual·onSwitchOut) 파리티. `battle_sim`에 selfKO·attract(성별)·trap 잔뎀 모델링.
- **획득은 범용 TM**(tm_selfdestruct/attract/bind) — 학습셋에 안 넣어 트레이너·야생이 안 배운다 → **밸런스 불변**. 회귀 `scripts/battlemoves_test.js`(흐름+시뮬 파리티). ⚠️ 묶기 acc 90이라 테스트는 `MOVES.bind.acc=100` 고정(빗나가면 속박 안 걸림).

### 스탯 아이템 (영양제·민트·병뚜껑) — 백엔드 이미 있음
EV/성격/IV 시스템(`m.evs`·`m.nature`·`m.ivs`)은 다 있고 적용·저장·요약 표시까지 되는데 **손댈 아이템만 없었다** → 추가.
- **영양제**(`use:"ev"`, stat/amt): 단백질(공)·철분(방)·칼슘(특공)·아연(특방)·카르본(속)·맥스업(체). +10 EV, 한 스탯 252·총합 510 상한. 상점(need:2).
- **민트**(`use:"mint"`, nature): 성격 변경 5종(고집/대담/겁쟁이/용감/무사). 교환소(코인 소비처).
- **황금 병뚜껑**(`use:"bottlecap"`): IV 전부 31. 교환소. 이미 최고면 거절.
- ⚠️ 다른 대상 아이템(캔디·진화의돌)과 같이 **선두 정령(`activeMon`) 대상**. `where:"map"`. `STAT_KO`/`NATURE_BY_K`(rules)로 표기. 회귀 `scripts/stat_items_test.js`(EV 상한·성격·IV·거절·세이브).

### 포획 루프 강화 (재우고 잡는다)
포획이 밋밋했다(상태 보너스 뭉툭·볼 2종) → 본가식으로.
- **상태이상 배율**(`statusCatchBonus`): 잠듦·냉동 +0.25, 마비·독·화상 +0.14(예전 상태 무관 +0.12). "재운 뒤 던진다"가 실제로 유효해짐.
- **볼 종류 7종**(`BALLS`/`ballBonus`): 정령구·고급 + **울트라볼**(+0.35) · **네트볼**(물/얼음 +0.30) · **다크볼**(밤/황혼 +0.30, 낮 +0.03) · **퀵볼**(전투 첫 턴 +0.42) · **힐볼**(포획과 동시 완전 회복). 상황에 맞는 볼이 강하다.
- **크리티컬 캡처**: 잡히는 경우 16% 확률로 흔들림 1번에 즉시 포획("✨ 크리티컬 캡처!").
- ⚠️ `tryCatch(ballKey)`로 **파라미터화**. 🔮 포획 버튼은 기본 정령구, **특정 볼은 가방 볼 주머니→battleUseItem→tryCatch(it.key)**로 던진다(볼은 tryCatch가 소모·턴 처리 → battleUseItem에서 조기 라우팅). 퀵볼 판정용 `G.battleTurn`(transitionToBattle에서 0, doMove에서 +1).
- CSS `.catchball.<cls>` 볼마다 색. 회귀 `scripts/catch_test.js`(배율·볼별 보너스·라우팅 소모).

### 콘텐츠 팩 (감사 후속 4종 + 재생 자원)
- **HM 힌트 NPC**(`woodsman` 나무꾼, 첫 자르기 덤불 9,24): 자르기·괴력·파도타기가 뱃지로 조용히 주어지던 걸 설명.
- **코스트/신전 도구**: 통로였던 해안·텅 빈 신전에 `GROUND_ITEMS`(in:coast/shrine) + `HIDDEN`(in:coast) 추가. ⚠️ 인테리어 바닥볼은 예전 렌더 가드(`!G.indoor`)로 **안 보였다** → `groundItemAt`이 이미 G.indoor로 스코프하므로 가드 제거해 **실내 볼도 보이게**(눌러-받기와 일관, 동굴/늪지 아이템도 이제 보인다).
- **건틀릿 퀘스트**(`q_gauntlet`, giver=scholar): 네 체육관 견습 트레이너 10명(`7,8,9,0,a,b,c,d,e,f` — 리더 1~4 제외) 전원 격파. `G.defeated`로 check.
- **열매나무**(`BERRY_TREES`, 재생 자원 — 유일한 파밍 루프): 좌표 오버레이(GROUND_ITEMS식, 오버월드 전용). `berryAt`/`berryRipe`/`harvestBerry`. 수확 시 `G.berries[k]=G.playSec` 기록 → `sec`초 뒤 다시 익음. 열매(오랭/정화/먹다남은음식)는 **heldStock**으로. `_berryTree` 렌더(익으면 빨간 열매). 세이브 키 `berries`. `interact()`가 볼 다음에 열매나무 확인.
- ⚠️ 회귀 `content_pack_test.js`. **테스트 위생**: `harvestBerry`/`pickupGroundItem`이 `showDialog`를 띄우는데 `_dlgQueue`는 모듈 전역이라 evaluate 간 지속 → 다음 블록 `interact()`가 `dialogActive()` 가드로 막힌다. 블록 시작에 `advanceDialog`로 정리할 것.

### 이벤트 배선 감사 (2026-07) — talkNPC 분기 순서
전수 감사 결과 배선은 대체로 매우 견고(모든 NPC battleKey·trade키·타일 트리거·가드·전설·보스·엔딩 연결됨, 죽은 트리거/고아 트레이너 0). **유일한 실버그**: `q_bond` 퀘스트(제공자 `trade1`=교환하는 소녀)가 도달 불가였다 — `talkNPC`에서 `npc.trade` 분기가 퀘스트 분기보다 먼저 `return`해서 q_bond가 영영 안 떴다.
- ⚠️ **퀘스트 분기를 서비스(trade/exchange/…) 분기보다 앞에 둔다** — trade1처럼 서비스+퀘스트를 겸하는 NPC는 퀘스트가 먼저 떠야 한다. `questForGiver`는 `done`이면 null이라 완료 후엔 자연히 서비스로 넘어간다(퀘스트 먼저 → 완료 → 교환). 회귀 `indoor_quest_test`에 q_bond 제공 검증 추가(트레이드에 가려지면 실패).
- 감사가 짚은 콘텐츠 갭 중 **신전(shrine)** 이 가장 비어 `GROUND_ITEMS`에 `in:"shrine"` 2개(사탕·엘릭서) 추가. 남은 옵션(코스트 콘텐츠·체육관 견습생 건틀릿 퀘스트·HM 힌트 NPC·열매나무 재생 루프)은 유저 선택 대기.

### 도구 줍기 — 포켓몬식 눌러-받기
예전엔 볼 위로 걸어가면 `onArrived`가 **자동 흡입**하고 `flashHint` 토스트만 떠 밋밋했다 → **A로 줍는다**(손맛).
- `onArrived`는 이제 볼 칸에 서면 안내(`Ⓐ 눌러서 도구를 줍는다`)만. `interact()`가 **서 있는 칸 또는 마주 본 칸**의 볼을 확인해 `pickupGroundItem`으로 줍는다.
- `pickupGroundItem`: `G.found` 기록 + 지급 + `Audio.sfx("win")` 팡파르 + **발견 대사**(`showDialog` — 타이핑 + ▼커서, A로 진행) + `updateGoal`(도구 회수 퀘스트) + `saveGame`.
- **HIDDEN(숨겨진 도구)은 자동 유지** — 눈에 안 보이는 서프라이즈라 걸으면 발견(`onArrived`). 눌러-받기는 눈에 보이는 `GROUND_ITEMS`만.
- ⚠️ 봇(longrun/playthrough/monkey)은 도구 줍기에 의존하지 않아 영향 없음. `region_content_test`만 자동 흡입 검증이라 **A(interact) 누르기로 갱신**(볼 위 서기만으론 안 줍고, A로 지급·중복방지 확인). `pickupGroundItem`/`interact`를 `SG.flow`에 노출.

### 탈출로프 (던전 빠른 탈출)
동굴·늪지·용암굴이 막다른 길이라 걸어 나와야 했다 → `escaperope`(`use:"escape"`)로 입구 밖 오버월드로 즉시 탈출.
- `ESCAPABLE={cave,lavacave,marsh,snowfield}`만 허용 — 배로 가는 isle/shrine이나 짧은 센터/상점은 제외(`exitInterior`의 `_owBackup`이 안전한 막다른 던전만).
- ⚠️ `exitInterior`는 **warpFade 지연 스왑(150ms)**이고 `_exitInterior`는 저장을 안 한다 → 스왑 완료 후 `setTimeout(()=>{ if(!G.indoor)saveGame(); },520)`로 저장(indoor=null 확인). `applyItemEffect`는 `false`를 반환해 `useItem`의 조기 저장/중복 렌더를 막는다(evostone과 같은 패턴).
- 전투 중·오버월드·비던전 인테리어에선 거절(소모 안 됨). 상점 need:1. 회귀 `scripts/escape_test.js`.

### 교환소 (후반 돈 소비처)
도감 완성 보상 3만 코인 등 후반 경제가 밸 데가 없었다 → **교환상인 로엔**(리그 앞 20,9, `exchange:true` NPC)이 코인으로 희귀 물건을 내준다.
- `PREMIUM` 재고: **타입 부적 10종**(`TYPES` 파생, #1에서 정의만 하고 상점엔 안 넣었던 것 → 여기서만 획득) + 진화의 돌 3종 + **반짝임의 부적**(이로치, unique 1회).
- UI는 상점 오버레이(`shopOverlay`)를 재사용하되 `openExchange`→`renderExchange`가 **탭 없는 플랫 리스트**를 직접 그린다(renderShop 안 건드림). 타이틀은 `shopHeadTitle`로 상점/교환소 전환.
- **반짝임의 부적** `G.shinyCharm`: 샤이니 확률 배율 = `SHINY_RATE × (dexMaster?3:1) × (shinyCharm?2:1)`. 완성 전 플레이어용 프리미엄(완성자는 ×6). 세이브 키 추가(serialize/deserialize/freshState).
- talkNPC가 `npc.exchange`→`openExchange`로 분기(daycare/moveExpert/trade와 같은 패턴). 도달성 회귀가 NPC를 확인(40→41, 비차단).
- ⚠️ 회귀 `scripts/exchange_test.js`: 샤이니 확률은 `Math.random`을 두 임계값(1/64·1/32) 사이로 고정해 **결정적**으로 부적 유무에 따라 뒤집히는지 검증(몬테카를로 회피).

### 오버월드 날씨 — 필드 날씨 = 전투 날씨(통합)
전투 날씨(`setWeather`/`applyWeather`/`WEATHERS`)는 원래 있었지만 **전투마다 RNG로 굴려** 오버월드엔 안 보이고 필드와 무관했다 → **오버월드에 보이는 날씨와 전투 날씨를 하나로 통합**.
- **`owWeather()`가 단일 출처**: `REGION_WEATHER`(지역별 특징 날씨) + 느린 실시간 시계(`dayCycle`과 같은 방식 — **저장 상태 없음·결정적**, 지역별 위상차로 어긋나 지역마다 따로 논다). 실내면 `clear`.
- `setWeather()`가 이제 `OW_BATTLE_WEATHER[owWeather()]`로 전투 날씨를 정한다(눈→hail, 안개→없음) → **필드에서 본 날씨가 그대로 전투로**. 예전 RNG 제거. 실내(체육관 등)는 clear라 날씨 없음(부수 개선).
- 필드 렌더: `drawWeatherFx`(절차적·결정적 파티클 — 비 빗줄기·눈송이·안개 밴드·햇살 글로우, reduceMotion이면 틴트만). 날씨 이모지는 **우상단 낮/밤 페이즈 이모지 아래**(좌상단은 목표 트래커가 덮는다).
- `pickWild` 조우 편향: 비→물/얼음, 눈→얼음, 쨍쨍→불/풀, 안개→독(같은 출처 `owWeather`). "가볼 이유·지역 재방문" 동기.
- `endBattle`에서 `G.weather` 정리(필드/다음 전투 누수 방지).
- **밸런스 불변**: `battle_sim.js`엔 `G`가 없어 날씨를 안 본다(문서화된 생략) → balance/league 측정 그대로.
- ⚠️ 날씨는 실시간 기반이라 테스트는 `setOwWeather(w)` 강제 훅으로 결정적 검증. 회귀 `scripts/weather_test.js`(지역 정확성·전투 이관·조우 편향 통계·연출 렌더).

### 지닌 물건 확장 (전투 깊이) — 데이터 필드 단일 출처
지닌 물건이 방어형 5종뿐이라 이 게임의 강점(전투 깊이)을 못 살렸다 → 공격/전략형 추가. **전투 효과는 `HELD_ITEMS`(rules/tables.js)의 데이터 필드로 표현**하고 `damage()`/`effSpd()`가 그 한 곳에서 읽는다(하드코딩 금지 — 예전 powerband `abil*=1.1`도 `dmg:1.1` 필드로 이전).
- 데이터 필드: `dmg`(위력 배율) · `boost`(이 타입 기술 +20%) · `spdx`(속도 배율) · `recoil`(공격 시 최대HP 반동) · `lock`(구애=첫 기술 고정) · `sash`(풀피 치명타 1HP 생존 1회).
- 신규: **생명의구슬**(dmg1.3+recoil0.1) · **기합의띠**(sash) · **구애머리띠**(dmg1.3+lock) · **구애스카프**(spdx1.5+lock).
- **타입 부적 10종은 `TYPES`에서 파생**(`charm_<type>`, boost=type) — 손으로 나열하면 타입 추가 시 또 병렬 테이블을 빠뜨린다. 상점엔 안 넣고 **#3 교환소 재고**로 예약(코인 소비처).
- ⚠️ **네 곳에 배선**(방어와 같은 원칙): `damage()`/`effSpd()`(rules, 배율) · `performMove`(생명구슬 반동·기합의띠 생존·구애 잠금 set) · `showMoves`(구애 시 다른 기술 비활성) · `foeChooseMove`(적도 구애 준수) · `battle_sim.js`(반동·sash·잠금 파리티). `_choiceLock`은 휘발성 → `_protect`와 같은 리셋 지점 6곳에서 해제.
- **밸런스 불변**: 강한 아이템을 `WILD_HELD`/학습셋에 안 넣어 트레이너·야생이 안 든다 → balance/league 측정 그대로. 플레이어만 강해진다.
- ⚠️ `HELD_ITEMS`를 `window.SG`에 노출(테스트용). 회귀 `scripts/rules_unit_test.js`(배율·파생) + `scripts/helditems_test.js`(생존·잠금 메뉴·반동 흐름 + 시뮬 파리티).

### 전투 페이스 (`BATTLE_PACE`) — "너무 빠르고 정신없다" 대응
전투 기본 속도가 빨라 메시지가 뭐가 일어났는지 못 읽고 넘어간다는 피드백 → **메시지 대기(`mw`)만** 전투 중일 때 `BATTLE_PACE`(현재 1.35)배 늘렸다. **히트 애니(`fxT`/`wait`)는 안 건드린다** — "쫀득한 타격 → 텍스트가 잠깐 머묾 → 다음" 리듬이 목표(애니까지 늘리면 쫀득함이 죽고 늘어진다).
- ⚠️ **전투 중일 때만** 적용(`mw`가 `G.inBattle`로 분기) — 오버월드 `mw`(트레이너 발견·낚시·NPC 걸음)는 원래 타이밍 유지.
- `CONFIG.textSpeed`(설정 "전투 속도" 빠름0.6/보통1/느긋1.6)와 곱해진다 → 유저가 상대적으로 더 빠르게/느리게 조절 가능. 급하면 자동 모드에서 화면 홀드로 빨리감기(`SKIP` → `delay(28)`).
- **페이스 조정은 `BATTLE_PACE` 한 값만 만지면 된다**(단일 노브). 저장 호환 영향 없음(textSpeed 안 건드림).
- 전투 타이밍 테스트(protect·coach·exp·stage_rank·switchmoves·battle_nav·victory_music·lowhp·playthrough)는 busy 폴링/실측 예산이라 mw 35% 증가에도 통과 확인.

## 순수 규칙 계층 (`src/rules/`) — 브라우저 없는 단위 테스트
테스트 64개 중 56개가 Chromium을 띄우고 있었는데, 상당수는 **브라우저가 필요해서가 아니라 코드가 HTML 안에 갇혀 있어서**였다. 순수 로직을 떼어내 node에서 바로 돌린다.

- `src/rules/util.js` · `tables.js` · `moves.js` · `dex.js` · `battle.js` — **DOM을 쓰지 않는다.**
  - `moves.js` = `MOVES` + `moveDesc`/`moveSummary`, `dex.js` = `DEX` + `byId`/`STARTERS`/`WILD_HELD`/`wildHeld`/`makeMon`/`addMove`/`recalc`.
  - ⚠️ `makeMon`은 `newStages`(battle.js)를 부른다 — **함수 선언이라 한 스코프에서 호이스팅**되므로 로드 순서와 무관하다. 반면 `const`(NATURES·ABILITY_OVERRIDE·SHINY_RATE)는 앞선 tables.js에 있어야 한다.
- **브라우저와 node가 문자 그대로 같은 코드를 돈다**: `build.py`가 `//@@RULES_*@@` 마커에 파일을 인라인하고, `scripts/rules_env.js`가 **같은 파일을 같은 순서로** 이어붙여 node `vm`에서 평가한다.
  - ⚠️ **순서는 `build.py`의 `repl`과 `rules_env.js`의 `ORDER`가 일치해야 한다**(util → tables → moves → dex → battle). `rules_unit_test`가 이 순서를 단정으로 잡아둔다.
  - ⚠️ 파일마다 `module.exports`를 다는 방식은 **일부러 피했다** — 그 export 목록이 또 하나의 동기화 대상(=위에서 없앤 병렬 테이블)이 된다. 대신 선언 이름을 소스에서 정규식으로 자동 추출한다. 그래서 규칙 파일의 **최상위 선언은 들여쓰기 없이** 쓸 것(추출 정규식이 행 첫 칸을 앵커로 쓴다).
  - ⚠️ vm 컨텍스트에 `document`/`window`가 **없다** = 규칙 계층에 브라우저 코드가 섞이면 즉시 터진다. `injectPalette`만 `typeof document!=="undefined"` 가드 뒤에서 호출된다.
- `scripts/rules_unit_test.js` — 단정 50여 개가 **0.07초**(브라우저 테스트는 개당 5~20초). `verify.sh` **맨 앞**에 있어, 구간을 나눠 돌리는 환경에서도 규칙 회귀는 항상 즉시 걸린다.
- **브라우저 테스트 감축 (누적 3건)**: `type_chart_test`(상성표) → `R.EFF` 직접 단정. **`movedesc_test`(jsdom)**·**`legendary_test`(jsdom)** → `MOVES`/`DEX`/`makeMon`을 규칙 계층으로 내린 뒤 `rules_unit_test`로 이관하고 파일 삭제.
  - ⚠️ **데이터를 규칙 계층으로 옮기는 건 "병렬 테이블 만들기"가 아니다** — 정의가 옮겨갈 뿐 사본이 생기지 않는다(build.py가 같은 파일을 인라인). 사본이 생기는 건 export 목록·테스트 안의 하드코딩 사본 같은 것들이고, 그건 여전히 금지다.
- **브라우저 테스트 감축 예시**: `type_chart_test.js`(얼음·독·땅 상성표)는 `S.damage().eff`만 봤는데 `eff`는 `EFF`의 곱이라, `R.EFF` 직접 단정으로 여기 이관하고 playwright 목록에서 뺐다(브라우저 1개 감축, 커버리지 동일). ⚠️ 나머지 후보(`movedesc`·`legendary`·`sim_status` 등)는 `MOVES`/`DEX`/`region`/`WILD_FLOOR`를 규칙 계층으로 **추출 선행**이 필요하고, 추출은 또 하나의 동기화 대상을 만드니 신중히. `foe_switch`·`newtypes`·`dex_flavor`는 DOM 렌더·게임 상태 결합이라 브라우저가 진짜 필요하다.
- 새 순수 로직(데미지·랭크·상태 규칙 등)은 **`src/rules/`에 넣고 여기서 테스트**할 것. 브라우저 테스트는 DOM/캔버스/오디오/입력이 실제로 필요한 것만.

## 타입·상태 단일 출처 (`TYPES` / `STATUSES`)
이 프로젝트에서 **가장 자주 재발한 버그가 "병렬 테이블 중 하나를 빠뜨림"** 이었다(TYPE_PARTICLE·STATUS_KO.slp·_MV_STATUS_KO.frz). 고칠 때마다 "한 세트로 보라"고 적었지만 사람이 지켜야 하는 규칙이라 계속 뚫렸다 → 이제 **객체 하나에서 전부 파생**된다.

- **타입을 추가/수정할 땐 `TYPES`만 고친다.** 파생: `TYPE_KO`·`TYPE_CLASS`·`TYPE_COLOR`·`TYPE_PARTICLE`·`TYPE_ICON`·`SPEC_TYPES`·`DEFAULT_ABILITY`·CSS `--<type>`·`.type-tag.t-<type>`·도감 타입 필터(`TYPE_LIST`)·`Audio.cry` 울음 파형.
  - 필드: `ko`(한글명) `col`(색) `par`(연출 파티클) `ic`(아이콘) `spec`(특수판정) `ab`(기본 특성) `wav`(울음 파형) `fg`(태그 글자색, 선택).
  - ⚠️ **`EFF`만은 파생이 아니다** — 10×10 상성값은 설계 데이터라 손으로 채워야 한다. 타입을 추가하면 `EFF`의 **행 하나와 모든 행의 열 하나**를 같이 넣을 것(누락 시 `damage`에서 NaN). 회귀가 전 조합을 검사한다.
- **상태를 추가할 땐 `STATUSES`만 고친다.** 파생: `STATUS_KO`·`STATUS_CLS`·`_MV_STATUS_KO`·`STATUS_TYPE_IMMUNE`·연출 글리프 2곳(`statusMoveFx`/`fxStatusAura`)·`.b-<st>`·`.dbst.b-<st>`.
  - 필드: `ko` `chip`(상태칩 배경) `g`(연출 글리프) `fx`(연출 색 — chip과 다를 수 있다) `imm`(면역 타입, 없으면 `null`).
- CSS는 `injectPalette()`가 `<style>`을 만들어 주입한다. ⚠️ `.dbst.b-*`는 `.dbst`를 specificity로 이겨야 하므로 규칙 형태를 유지할 것.
- 회귀 `scripts/palette_source_test.js`. ⚠️ **이 테스트는 개별 테이블을 손으로 나열하지 않는다** — 그러면 테스트 자체가 또 하나의 병렬 테이블이 되어 같은 실수를 반복하게 된다. `TYPES`/`STATUSES`의 키를 돌면서 파생 여부와 CSS 적용을 **실제 DOM에서** 확인한다.
- 이 리팩터로 드러나 같이 메워진 누락: `TYPE_ICON`이 7종뿐이라 얼음·독·땅이 `tkLabel`에서 아이콘 없이 렌더됐고, `Audio.cry` 파형도 7종뿐이라 신규 3타입은 전부 기본값 울음이었다.

## 타입 시스템 (10종)
불·물·풀·전기·노말·비행·바위 + **얼음·독·땅**(추가됨). 새 기술: 얼음(얼음뭉치[우선]/서리숨결/냉동빔/눈보라/한기/얼음바람), 독(독찌르기/오물폭탄/독가루), 땅(머드샷/땅파기/지진). 전설 5종은 `legend:true`+tier4+종족값 대폭 상향(여명룡 297)+조우 레벨↑(50~56)+포획 페널티(-0.38). XP base `foe.level*15+11`(완화 ~20%, 진행도 천천히 — `curve_test.js` sim과 동기화 필수). ⚠️ **jsdom 미설치면 jsdom 게이트 테스트(스모크·코치·목표·제단·커브·기술설명·대화)가 조용히 스킵됨** — 밸런스/커브 변경 시 `npm install jsdom` 후 `verify.sh`로 실제 실행 확인. `EFF`는 10×10 완전표(모든 조합 정의 — 누락 시 `damage`에서 NaN). 특수 타입(spa/spDef)=불·물·풀·전기·**얼음**(`damage`의 `SPEC`), 나머지 물리. 타입/상태 관련 테이블·CSS는 이제 `TYPES`/`STATUSES`에서 파생된다(위 「타입·상태 단일 출처」) — 손으로 동기화하지 말 것. 상태이상에 **냉동(frz)** 추가(잠듦류: 매턴 20% 해동, 못 움직임). 얼음 크리처(빙구리·서리강아지·빙하곰·얼음정·빙하룡·동결룡·설올빼미·빙하제 등)를 water→ice 재타이핑, 독(해파리정·개굴몽), 땅(굴다람·바위정·마그마룡) 재배치. 새 기술 얼음/독/땅 각 몇 종. 회귀 `scripts/type_chart_test.js`·`scripts/newtypes_test.js`.

## 완료된 개선 (되돌리지 말 것)
- 86종 전원 v2 아트 통일 (DEX 86 = PAINT_ART 86).
- 불여우 라인 파라꼬→파라울→파라온을 구미호 계보로 재설계, 이모지 🦊 통일.
- 넝쿠리(vinesnake) 독립화 — 새록정 진입경로는 leafwyrm 하나.
- HP바 빨간점 버그 수정: `.hpfill`/`.hpghost`의 border-radius 제거(컨테이너 overflow:hidden이 양끝 처리).
- 주인공 4명 회화체 빌보드(앞/뒤) + 캐릭터 선택 미리보기도 회화.
- 팔로워 타입색 오라 글로우 + 크기/접지 조정.
- NPC 생동감: 소프트 셰이딩(`_grad`/`_tint`) + 걸음 애니메이션(`_char`의 `moving` 인자 → 다리 번갈아+통통, 멈추면 아이들 바운스).
- **로밍 NPC 부드러운 보간**: NPC 그리기를 그리드 루프에서 분리해 별도 패스로. 각 NPC의 렌더 좌표 `rx/ry`가 논리 타일(`n.x/n.y`)로 이징(3.2 tiles/s) → 타일 텔레포트(툭툭 튐) 제거. `npcRoamTick`은 논리 좌표만 바꾸고, 상호작용은 논리 타일(`NPC_AT`) 기준이라 그대로. 회귀 테스트 `scripts/npc_roam_test.js`(G.busy로 로밍 얼려 보간 결정적 관찰). 계측용으로 `window.SG.NPCS`/`SG.Field` 노출.
- NPC가 말 걸면 플레이어 쪽으로 돌아봄(`faceNpcToPlayer`, `talkNPC` 진입 시). 대화 중엔 `_talking` 가드로 로밍 정지라 계속 응시.
- 인접 힐끗: 플레이어가 로밍 NPC 옆(8방)에 멈추면 그쪽을 본다(`faceAdjacentNpcs`, `onArrived`에서 즉시 + `npcRoamTick`에서 인접 시 배회 대신 응시 유지). 떠나면 다시 배회. 회귀 `scripts/npc_roam_test.js`에 포함.
- 타이틀/메뉴 음악: `Audio.tracks.title`(잔잔한 테마) + 첫 사용자 제스처 언락 리스너(오토플레이 정책). 메뉴 화면(맵/전투 아님)이면 재생 → 맵 진입 시 `startMusic(fieldMusic())`이 필드 음악으로 교체. 이전엔 타이틀~스토리 전 구간이 무음이었음. 회귀 `scripts/title_music_test.js`.
- 승리 팡파르 통일: 트레이너 격파(`trainerDefeated`)·야생 포획 성공(`tryCatch`)·야생 격파(`winBattle`) 모두 `victory` 트랙으로 교체(전에는 전투 음악이 계속 깔린 채 일회성 SFX만 얹힘). 포켓몬식으로 승리/포획=팡파르. `endBattle`이 필드 음악으로 복귀. 회귀 `scripts/victory_music_test.js`·`scripts/catch_music_test.js`(트랙 battle→victory 확인). `trainerDefeated`/`winBattle`을 `SG.flow`에 노출(테스트용).
- 스팅어 즉시 재생: `startMusic(name,immediate)` — `immediate=true`면 페이드인 없이 즉시 풀볼륨(0.30). 승리 팡파르 3곳에 적용 → 포켓몬식으로 '팡' 하고 터진다(예전엔 0.6초 페이드인으로 물러섬). 앰비언트 필드 음악은 기존대로 은은한 페이드인. 회귀 `victory_music_test.js`가 gain≈0.30 확인.
- 전멸(화이트아웃) 음악: `faintMine` 전멸 분기에서 `stopMusic()`+`sfx("defeat")`(느리게 하강하는 구슬픈 6음). 전에는 전투 음악이 깔린 채 그냥 필드 복귀. `endBattle`/`blackout`이 이후 필드 음악 복귀. 회귀 `scripts/defeat_music_test.js`(패배 사운드 노트 수 + stopMusic 호출 확인). `faintMine`을 `SG.flow`에 노출(테스트용).
- 눈 깜빡임: `_char`가 스프라이트별 위상(`spec._bseed`, 색 문자열 해시)으로 3.6초마다 ~0.12초 눈을 감았다 뜬다. reduceMotion이면 생략. 모든 `_char`(NPC·트레이너·캐릭터 미리보기)에 적용.

## 로드맵 (권장 순서)
1. ~~아키텍처 분리~~ ✅ 완료 (src 413KB + assets + dist 빌드).
2. 온보딩/튜토리얼 — **첫 전투 코치 ✅ · 목표 트래커 ✅ · 난이도 커브 ✅**. 게임필 폴리시 진행 중(타이틀 종수 표기 ✅ · 맵 카메라 클램프 ✅ · 전투 진입 연출 ✅ · NPC 생동감 ✅ · 타이틀/메뉴 음악 ✅). 남은 것: 추가 폴리시.

### 풀숲 게임필 (`Map2D._grassFx`) — 오버월드 손맛
오버월드가 "그냥 타일 위를 미끄러지는" 느낌이라 본가의 기본 손맛 3종을 넣었다. 전부 `_grassFx` 한 곳에 모여 있고 **reduceMotion이면 셋 다 꺼진다**.
1. **밟은 칸이 술렁인다** — `onArrived`에서 서 있는 칸이 `T`면 `Field.rustle(x,y)`. 최근 6칸만 들고 0.5초에 잦아든다(reduceMotion이면 기록조차 안 한다 — 상태 축적 방지).
2. **풀숲에 서면 하체가 풀에 가린다** — 주인공을 그린 **뒤**에 그 칸의 풀잎을 덧그린다. 본가에서 가장 알아보기 쉬운 디테일.
3. **달릴 때 발밑 먼지** — `G.running`이고 이동 중일 때만. 걸을 땐 안 난다 → 러닝이 실제로 빨라 보인다.
- ⚠️ 먼지의 "뒤" 방향은 **4방 벡터**로 잡을 것. 좌우만 처리하면(처음에 그랬다) 위/아래로 달릴 때 먼지가 발밑에 겹쳐 안 보인다.
- ⚠️ `Map2D`는 객체 리터럴이라 메서드 추가 시 앞 메서드 끝의 콤마를 확인할 것(`_itemBall` 때 이미 밟은 함정).
- 회귀 `scripts/grassfx_test.js`: 픽셀 비교 대신 **효과별 고유 색을 태그 삼아 드로우 콜을 센다**(`fillStyle`/`strokeStyle`은 컨텍스트에서 읽을 수 있다). 달리기/걷기·풀숲/비풀숲·reduceMotion 온오프를 대조군으로 잡아 "항상 그려짐"과 "아예 안 그려짐"을 둘 다 배제한다.

### 정령 관리(PC) 카드 — 목록에서도 위험/상태를 알 수 있게
전투 화면엔 있는 정보가 목록에선 통째로 빠져 있었다: HP 28%인 정령의 바가 **멀쩡한 초록**이고 독에 걸린 정령에 **상태 표시가 없었다**. 액션 버튼이 세로로 쌓여 카드가 204px라 한 화면에 2마리도 안 들어왔다.
- `miniHpHtml(m)` / `statusChipHtml(m)` **단일 출처**로 뽑아 파티·보관함·교체·데이케어 4곳이 같은 마크업을 쓴다. 위험색 기준은 전투 HP바와 동일(≤20% 위험 · ≤50% 주의), 상태칩은 `STATUS_KO`/`STATUS_CLS`(=`STATUSES` 파생)를 그대로 쓴다.
- 액션 버튼 `flex-direction:column` → `flex-wrap:wrap`(2열) → 카드 204px → 131px.
- 회귀 `scripts/pc_card_test.js`. ⚠️ **오버레이를 실제로 열지 않으면 rect가 전부 0**이라 높이 단정이 헛돈다(전투 레이아웃에서 이미 겪은 함정).

### 상단바 맞춤 (좁은 폰 · `topbar_fit_test`)
상단바 우측 그룹은 진행할수록 칩이 늘어난다(돈·설정·달리기·소리·도감·뱃지 **6개**). `space-between` 한 줄 배치라 **좁은 폰에서 뱃지 칩이 잘렸다** — 360px 40px·375px 25px·**390px(iPhone)도 중반엔 10px**. 시작 직후엔 칩이 적어 안 잘려서 오래 안 들켰다(스크린샷 검수로 발견).
- `.top-right`에 `flex-wrap:wrap`(안전장치 — 넘치면 두 줄로) + `@media (max-width:400px/360px)`로 간격·패딩·아이콘 크기 축소. 브랜드 제목은 `white-space:nowrap`(2줄 방지) + `flex-shrink:0`.
- ⚠️ 회귀는 **칩 6개를 강제로 켠 중반 상태**를 여러 폭(360/375/390/414)에서 재야 한다 — 시작 상태(칩 3개)만 보면 못 잡는다. 좌우 양쪽 넘침 + 브랜드 2줄 여부를 실좌표로 단정.

### 전투 화면 레이아웃 (`scripts/battle_layout_test.js`)
스크린샷 검수에서 좌상단이 **삼중으로 겹쳐** 있었다 — 적 HUD(`.foe-row` top/left 14px) 자리에 "가랏! X!" 등장 라벨(`top:10px`)과 날씨 칩(`#weatherBadge` `top:8px;left:8px`)이 같이 떠서 상대 이름·HP를 덮었다.
- 등장 라벨 → **좌하단**(내 정령이 나오는 쪽, `bottom:92px`) · 날씨 칩 → **우상단**(빨리감기 안내 아래, 오버월드 날씨 표시와 같은 위치 감각).
- 타입칩 행이 `justify-content:space-between`이라 2타입이면 양끝으로 벌어져 **빈 상자처럼** 보였다 → `flex-start` + `gap:4px`.
- 회귀는 **실제 좌표로 겹침을 판정**한다. ⚠️ 함정 3가지(전부 밟았다):
  1. `setupBattleUI`만 부르면 `#battle` 뷰가 안 켜져 **모든 rect가 0** → 겹침 단정이 전부 거짓 통과한다. 조우를 실제로 걸어 화면 전환까지 시킬 것. **HUD 크기 > 0 단정**을 같이 둬서 헛도는 걸 막는다.
  2. 발판(`.platform`) 같은 **뒤에 있는 장식**은 겹쳐도 문제가 아니다 → `z-index`로 거른다.
  3. 배경 레이어는 필드 전체를 덮으므로 면적 50% 이상은 제외.

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
- **(장기 플레이스루 봇이 발견) 탭 자동 이동이 체육관에 안 먹었다**: 목표 좌표가 체육관 입구 타일 `G`인데 그건 **비보행**(부딪혀 들어가는 문)이라 `bfsPath`가 항상 `null` → "길이 막혀 있다"만 뜨고 한 발도 안 움직였다. 센터 `+`·회관 `E`·리그 `U`·제단 `X` 전부 같은 문제. → 목표가 비보행이면 **인접한 보행 칸 중 가장 가까운 곳**으로 경로를 잡는다.
맵 좌상단에 "다음 목표 + 방향 화살표 + 거리"를 붙박아 둔다. **탭하면 그 지점까지 자동 이동.**
- 진행 사슬: 체육관 4곳(`GYM_AT`) → 정령 리그(`U` 타일 18,9 · 인장 4조각 필요) → 챔피언 → 도감 완성.
- 좌표를 상수로 박지 않고 실제 게이트 타일에서 가져오므로 맵을 바꿔도 안 어긋난다.
- 갱신 훅: `onArrived`(매 걸음) · `enterMap` · `endBattle` · `warpTo` · `enterInterior`/`exitInterior`. 전투 중엔 숨는다.
- 회귀 테스트: `scripts/goal_test.js`.

### 밸런스 실측 (`scripts/balance_test.js`)
`curve_test.js`는 XP 경제(킬당 레벨업 속도)만 모델링한 시뮬레이션이라 **실제로 이길 수 있는지는 안 본다.** 이건 게임의 진짜 전투 코드(`damage`·`foeChooseMove`·특성·급소·랭크·상성)로 게이트 전투를 수백 판씩 돌려 **승률 곡선**을 낸다.
- 양쪽 모두 `foeChooseMove`로 기술을 고른다 = "평범하게 두는 플레이어" 기준(숙련자는 이보다 잘한다).
- ⚠️ **파티를 고정으로 고르면 결과가 통째로 뒤집힌다.** 같은 챔피언전이 파티 구성만 바꿔 **0% ↔ 55%**로 흔들렸다 → 매 판 티어 풀에서 무작위로 뽑아 분포를 본다. 밸런스 수치를 볼 땐 "어떤 파티를 가정했나"를 항상 같이 볼 것.
- ⚠️ 판정 기준은 "동레벨 승률"이 아니라 **"-6레벨로도 이기는가"**다. 파티가 관장보다 많으면 동레벨 고승률은 자연스럽다.

#### 정령 리그는 따로 재야 한다 (`scripts/league_test.js`)
리그는 엘리트 4명 → 챔피언을 **회복 없이 연속으로** 치른다. `balance_test`는 각 전투를 풀피로 따로 재므로 **실제보다 훨씬 쉽게 나온다**(Lv48 기준: 개별 승률의 곱 73.5% vs 실제 연속 완주 46%).
- 실측으로 잡은 문제: **엘리트 4가 전원 3마리라 6마리 파티에게 무의미했다** — Lv48에서 넷 다 승률 100%, 탈락률 0%. 리그 난이도를 **챔피언 혼자** 짊어지고 있었다(Lv42 탈락의 81.5%가 챔피언).
- 조정: 엘리트 각 3 → **4마리**, 최종진화 에이스 배치. 조정 후 넷이 각자 물고(Lv48 탈락 0.5/5.5/12/15%p) 챔피언이 최종 벽(54%p)이 됐다.
  - ⚠️ 처음엔 에이스를 너무 강하게(tidalore 1256·titanoak 1167) 줘서 완주율이 46% → 5%로 무너졌다. 마릿수는 유지하고 **에이스 강도만** 낮춰 맞췄다.
- 완주율: Lv48 14.5%(전설 없음) / 25%(전설 1마리) · Lv51 29.5% / 42.5% · Lv54 47.5% / 63.5%.
  → **"신전에서 전설을 잡아 오는 것"이 리그 준비의 일부**라는 설계가 수치로 확인된다. 회귀가 이 보상 폭(≥5%p)을 강제한다.
- 게이트 램프(팀 규모/최고 레벨): 2/12 → 3/18 → 4/25 → 5/31 → 6/38 → 엘리트 4/40~43 → 챔피언 4/45. 점프는 전부 ≤7.

#### 실측으로 잡은 문제 (2026-07)
후반 게이트가 **수적으로 무너져 있었다** — 관장이 3마리인데 파티는 5~6마리라 6레벨 낮아도 96~99% 승리.
| 게이트 | 이전 | 조정 | 이후(도전 레벨/승률) |
|---|---|---|---|
| 체육관3 | 3마리(T1 섞임) | 4마리·물 최종진화 에이스 | -4 / 73% |
| 체육관4 | 3마리 | 5마리 | -2 / 69% |
| 숲의 군주 | 3마리(T2 섞임) | **6마리 전원 최종진화** | -2 / 72% |
- 체육관1·2와 챔피언은 원래 균형이 맞아 손대지 않았다(팀 규모가 파티와 대등했던 유일한 게이트들).
- 챔피언의 여명룡은 동급 티어3 대비 **총합 164%**다. 의도된 스파이크이며(전설 강화 커밋), 챔피언이 유일하게 "+2레벨을 요구하는" 최종 관문이 되는 이유다.

### 초반 난이도 완화 (`WILD_FLOOR` 앞 두 지역)
마을을 갓 나선 스타터(Lv5)가 지역1에서 **첫 야생 승률 24%**였다(4번 중 3번 짐) — `WILD_FLOOR[1]=9`가 스타터보다 +4라 벽이었다. 실측(실제 damage·AI로 300판) 후 조정:
- `WILD_FLOOR` 지역1 **9→7**(승률 24%→41%) · 지역2 **15→13**(43%→67%). 후반(지역3~6)은 불변.
- ⚠️ **레벨차는 작아 보여도 저레벨은 승률 낙폭이 크다** — Lv5 스타터에게 +4는 체감상 +4가 아니다. 그래서 `curve_test`의 초반 가드는 레벨차 **≤+3**으로 조인다(하한 9의 +4를 잡으려면 ≤+5론 부족). 감으로 정하지 말고 승률로 재라.
- 끌개(과다 그라인딩 폭주 방지)는 유지 — 낮춘 건 첫 두 구간뿐이고, curve_test의 폭주 방지·도착레벨(±4) 단정 모두 통과(오히려 체1 도착 격차가 아슬아슬 → 여유로 개선). 게이트 팀 레벨은 `WILD_FLOOR`와 무관하므로 balance 불변(재측정 확인).
- 회귀: `curve_test.js` [5] 초반 조우 완화(지역1 야생 ≤스타터+3 · 마을 야생 ≤7).

### 난이도 커브 (그라인딩 독립적)
문제였던 것: 야생 레벨이 내 평균 레벨을 따라오는(`al+depth*4`) 고무줄인데 체육관은 고정 레벨이라, 체감 난이도가 "얼마나 그라인딩했나"에 좌우됐다. 실측 결과 100전투 시 군주 도착 레벨이 59(에이스38, 완전 시시), 24전투면 전 구간 벽.
해결 — 두 지렛대:
- **`WILD_FLOOR=[5,9,15,20,23,28,34]`** (index=region): 야생 레벨의 하한이자 XP 끌개의 앵커. 덜 싸운 플레이어를 끌어올린다.
- **`xpMult(level)`**: 오버월드에서만, 정령 레벨이 지역 앵커를 넘을수록 XP 급감(1.4→1.0→0.45→0.15). 레벨이 지역에 수렴 → 그라인딩해도 폭주 없음. 실내(체육관·특수지역)는 관여 안 함.
- **게이트 리램프**: 체육관3 23~25, 체육관4 28~31, 제단수호 30~34, 숲의 군주 34~38, 챔피언 42~45. 게이트 간 점프 ≤8(챔피언 +15 절벽 제거).
측정 도구 `scripts/difficulty.js`(표 출력) · 회귀 테스트 `scripts/curve_test.js`(램프 단조·폭주 방지·보통 플레이 ±4.5).
⚠️ 밸런스는 플레이테스트가 최종 검증이다. 시뮬레이션은 XP 경제(킬당 ~1.45레벨)만 모델링하며 상성·교체·아이템은 빼고 본다.

### 체육관 얼음 퍼즐 (gym3 수정 호수)
얼음 타일 `I`: `walkable`은 기본 통행(제외목록에 없음), `_tile` 실내 렌더에 연한 얼음색+광택. `onArrived` 실내 블록에서 `_t==="I"`면 `Field.dir` 방향으로 계속 미끄러짐(다음 칸이 walkable이면 `move(dir,true)`, 벽/미격파 트레이너면 정지). ⚠️ 소프트락 방지 — 중앙 통로(x4)가 항상 통행 가능하도록 맵 설계, 미격파 가드 앞에서 슬라이드 정지. 회귀 `scripts/gym_ice_test.js`(슬라이드 2칸 이동 + 리더까지 소프트락 없이 도달). 다른 체육관에도 확장 가능. `enterInterior`/`INTERIORS`를 `SG.flow`에 노출(테스트용).

### 전멸 부활 지점 (`markHeal` / `blackout`)
예전엔 어디서 전멸하든 `G.pos=STARTPOS`로 시작 마을에 떨궜다 — 센터를 7곳 깐 의미가 없었다(리그 앞에서 ~50타일 왕복).
- `markHeal()`이 회복 지점을 `G.lastHeal={x,y,indoor}`에 기록. 호출 지점 4곳: `nurseHeal`(센터) · `B` 침대 · `R` 모닥불 · `H` 여관/오두막.
- **좌표는 반드시 오버월드 기준** — 실내면 `_owBackup.pos`가 그 오버월드 위치다(실내 좌표를 저장하면 복귀가 깨진다).
- `blackout`이 그 지점으로 되돌리고, 본가처럼 **회복 장소 '안'에서 눈뜬다**.
- ⚠️ 재진입(`REVIVE_REENTER`)은 **오버월드 타일에서 바로 들어가는 인테리어만**(center/house/snowfield). 배로만 가는 `isle`·`shrine`을 넣으면 `_owBackup`이 꼬여 나갈 때 엉뚱한 곳으로 나온다 → 그런 곳은 `indoor:null`로 기록해 문 앞에서 눈뜬다.
- 소지금 페널티 50%(본가 1세대). 세이브 키 `lh`, **버전은 4 유지**(구세이브 무효화 금지) → 없으면 `null` → STARTPOS 폴백.
- 회귀 `scripts/blackout_test.js`.
- ⚠️ **`deserialize`는 파티가 비면 `false`로 조기 반환**해 `G`를 그대로 둔다. 세이브 왕복 테스트에서 파티를 안 채우면 "값이 보존됐다"는 **거짓 양성**이 난다(실제로 겪었다). 반드시 파티를 채우고 `deserialize`의 반환값도 단정할 것.

### 상태이상 타입 면역 · 반동 공식 (2차 버그 사냥)
- **`applyStatus`가 유일한 관문**: 기술·특성·잔류효과의 상태 부여가 전부 여길 지나간다 → 면역 규칙은 여기 한 곳에만 넣는다. `STATUS_TYPE_IMMUNE={brn:"fire",frz:"ice",psn:"poison",par:"elec"}`. **잠듦은 타입 면역이 없다**(본가 동일).
- **반동은 "입힌 피해" 기준**. 예전엔 `att.maxHp*move.recoil`이라 상성으로 반감돼 1 데미지를 줘도 최대 HP의 25%가 깎였다(반동기 3종이 쓰면 손해인 기술이었다). **발버둥만 최대 HP 1/4**(본가 5세대 이후). 피해 0이면 반동도 없고, 메시지도 실제 반동이 났을 때만.
- **`HIDDEN`도 `GROUND_ITEMS`와 똑같이 실내 스코프**가 필요하다. 좌표만 키로 쓰면 늪지(W:17) 안 (2,10)에서 오버월드 숨은 도구가 딸려 나온다. `hiddenAt(x,y)`가 `groundItemAt`과 대칭 — 스코프 규칙을 한 곳에만 둔다.
  - ⚠️ **`GROUND_ITEMS`와 `HIDDEN`의 좌표가 겹치면** 한 걸음에 둘 다 발동해 `flashHint`가 서로를 덮는다. 회귀가 두 배열을 합쳐 중복을 본다(예전엔 CLAUDE.md가 "회귀가 중복도 본다"고 적어놨지만 **실제 테스트엔 HIDDEN 검사가 없었다** — 문서가 없는 커버리지를 주장하고 있었다).
- 회귀 `scripts/bugfix_round2_test.js`. **반례도 같이 검증할 것** — 잠듦은 면역 없음, 물 타입은 화상 면역 아님. 안 그러면 "전부 면역" 같은 과잉 구현을 못 잡는다.

### 맹독 · 다단히트 · 로드스컴 · 상점 게이팅 (3차)
- **맹독은 `status="psn"` 그대로 두고 `_tox` 카운터**로 구현한다. 본가에서 맹독은 '독의 변종'이라 해독제·독타입 면역·`immunity` 특성이 **전부 동일하게** 걸려야 한다 — 별도 status로 쪼개면 그 셋을 다시 배선해야 하고 `STATUS_KO`/`STATUS_CLS`/CSS 한 세트도 늘어난다. 피해는 `maxHp*n/16`(n=1..15).
  - ⚠️ **psn을 걸 때마다 `_tox`를 반드시 다시 쓴다**(`badly?1:0`). 치료 후 남은 옛 카운터가 새로 걸린 '보통 독'을 맹독으로 만들어버린다. `applyStatus`가 유일한 진입점이라 거기서 처리한다.
  - 교체 시 **카운터만 1로 리셋**(맹독 자체는 유지 — 본가 규칙). 세이브 키 `tox`. 듀오 배틀 잔뎀·`moveDesc` 표기도 한 세트.
- **다단히트 2~5회는 가중치**(2·3회 각 3/8, 4·5회 각 1/8 → 평균 3.0). 균등이면 평균 3.5로 부풀어 위력이 과대평가된다. `multiHits()`가 단일 출처이며 2~5 외 범위는 균등.
- **전투 중에는 저장하지 않는다**(`saveGame` 첫 줄에서 `G.inBattle`이면 return). `serialize`가 `inBattle`/`foe`/`trainer`를 안 담으므로, 저장이 남으면 지는 전투를 리로드로 없던 일로 만들 수 있다(로드스컴).
  - ⚠️ **버튼만 막아선 소용없다** — `battleUseItem` 등이 매 턴 자동 저장을 부른다. `saveGame` 자체를 막아야 한다. `endBattle`/`blackout`은 `inBattle=false` 이후 저장하므로 결과는 정상 반영된다.
  - 수동 저장 버튼과 **내보내기 문자열(`saveBox`)도** 같이 막을 것. 안 막으면 "저장 완료"가 거짓말이 되고 내보내기가 수동 세이브 경로로 남는다.
- **상점 재고는 `need`(뱃지 수)로 해금**. 예전엔 첫 상점에서 진화의 돌·기술머신까지 다 살 수 있어 공들여 잡은 커브를 돈으로 우회했다. 램프는 11→14→28→38 — ⚠️ 한 단계에 몰면 뭉툭해진다(처음에 기술머신을 전부 뱃지 2에 둬서 14→36으로 22종이 한꺼번에 열렸다).

### 상태 부여의 단일 관문 (`statusBlockReason` / `setStatusFields`)
면역 판정은 **규칙 계층(`src/rules/battle.js`)에 있고, 셋이 같은 출처를 쓴다** — 메인 전투(`applyStatus`) · 듀오 배틀(`dbStatus`) · 밸런스 시뮬(`battle_sim.js`).
- ⚠️ 예전엔 CLAUDE.md에 "`applyStatus`가 유일한 관문"이라 적어놓고도 **듀오 배틀이 자체 사본으로 우회**하고 있었다(독 타입이 중독되고, `_tox`도 안 건드려 치료 후 스테일 카운터로 보통 독이 맹독처럼 아팠다). "관문이 하나"라고 문서에 쓰는 것과 실제로 하나인 건 다르다 — 새 전투 모드를 만들면 **반드시 이 함수를 통과시킬 것.**
- `statusBlockReason(mon,st)`이 사유(`already`/`dead`/`ability`/`type`)를 문자열로 돌려주므로 호출부가 각자 맞는 메시지를 낸다. 실제 기록은 `setStatusFields(mon,st,badly)`.

### 전투 메시지 (본가 대조)
- **무효(0배)는 전용 문구**("효과가 없는 것 같다"). 예전엔 "효과가 별로인 듯하다"와 같아서 전기→땅처럼 아예 안 통하는 걸 맞아도 플레이어가 배울 수 없었다.
- ⚠️ **배타 분기(else-if)로 묶지 말 것.** 예전엔 급소나 다단히트가 나면 상성 문구가 통째로 묻혔다(가장 흔한 경우인데 "굉장했다!"를 못 봤다). 급소·타수·상성은 **함께** 보여준다.
- **서술은 `dispName(m)`을 쓴다**(닉네임+샤이니✨). 종족명(`m.name`)을 직접 박으면 HUD는 "무민"인데 다음 줄이 "파라꼬의 몸통박치기!"가 된다. 회귀가 `${att.name}` 잔존을 0으로 강제한다.

### 밸런스 하네스 (`scripts/battle_sim.js` 공용 시뮬레이터)
`balance_test`와 `league_test`는 **같은 시뮬레이터를 공유한다.** 예전엔 각자 사본을 갖고 있었고 이미 드리프트해 있었다(balance 쪽은 반동을 `maxHp*0.06`으로 손대중 — 게임과도, 다른 사본과도 달랐다). 하나만 고치면 두 측정이 다른 규칙으로 도는데 티가 안 난다 → **반드시 `battle_sim.js`만 고칠 것.**
- 모델링: 피해·명중·다단히트·회복·랭크 + **상태이상**(부여/타입·특성 면역/맹독 누적/잠듦·냉동·마비 행동불가/잔류 피해/풀죽음/혼란/씨뿌리기) + 우선도.
  - 면역 규칙은 게임과 **같은 출처**(`S.STATUS_TYPE_IMMUNE`)를 쓴다 — 손으로 복사하면 또 어긋난다.
- ⚠️ **일부러 뺀 것**: 장막(reflect/lightscreen) · 설치기(hazard) · 날씨. 전부 필드 상태(`G`)가 필요한데 시뮬엔 `G`가 없다. **이 수치는 "장막·설치·날씨 없는 전투"** 라는 걸 해석에 반영할 것.
- 회귀 `scripts/sim_status_test.js` — 상태이상 모델링이 조용히 사라지는 걸 막는다. **여기서 실패하면 밸런스 수치의 의미가 달라지므로 수치만 보고 넘어가지 말 것.**
- 과거 이력: 이 하네스가 `eff.status`를 아예 처리하지 않던 시절에는(상태이상 기술 18종을 전부 무시) 타입 면역·맹독 같은 변경을 넣고 "수치가 그대로"라고 나와도 **안전의 증거가 아니었다** — 측정 대상이 아니었을 뿐이다.

### ⚠️ 확률적 지표에 하드 임계값을 걸지 말 것
밸런스 실측 테스트는 몬테카를로라 **좁은 임계값을 걸면 간헐적으로 실패**한다. 실패를 보면 게임 회귀인지부터 재실행으로 가려낼 것.
- `league_test`의 전설 보상폭을 Lv51 **단일 지점**에서 `>5%p`로 재다가 3.6%p로 실패했다. n=250에서 비율 하나의 se가 ~3%p, 두 비율 차는 ~4.3%p라 임계값이 노이즈 안에 있었다. → **48/51/54 평균**으로 바꿔 분산만 줄였다(민감도는 유지). 재실행 평균 +10~15%p로 안정.
- `longrun_test`의 전멸 횟수는 **소지금 급감으로 추정하는 프록시**다(야생 수입과 섞임). "경향치로만 볼 것"이라 문서에 써놓고 하드 게이트를 걸고 있었다 — 같은 코드로 1·2·1·5회가 나온다. → 참고 출력으로 강등.
- 원칙: **여러 지점의 평균/누적으로 재거나, 게이트에서 빼고 출력만 하라.** 임계값을 그냥 느슨하게 푸는 건 진짜 회귀도 같이 숨긴다.

### ⚠️ 부하가 높은 환경에서의 브라우저 테스트
`playthrough_test.js`의 전투 후 `busy` 대기는 **고정 예산 → 실제 시계 예산으로 고쳤다**(예전엔 60×250ms=15초 고정이라 load 30~50에서 승리 연출·경험치 애니가 안 끝나 `G.busy가 풀려 있다 (true)`로 게임 버그가 아닌데 실패했다). 이제 45초 실측 예산으로 기다리고, 그래도 stuck이면 **`os.loadavg()`로 부하를 봐서 판별**한다 — 코어당 load>2면 환경 오탐으로 보고 경고만, 부하가 낮은데 stuck이면 진짜 회귀로 하드 실패. (전투 후 이동은 이 단정 앞에서 이미 통과 확인하므로 안전.)
- 판별법: **HEAD로 되돌려 같은 테스트를 돌려본다.** 베이스라인도 실패하면(단, 다른 단정에서 실패하는 게 전형) 환경 문제다.
- `uptime`으로 load를, `pgrep -f headless_shell | wc -l`로 샌 브라우저를 먼저 확인할 것. 테스트가 예외로 죽으면 브라우저가 남아 다음 테스트를 연쇄 실패시킨다.
- ⚠️ `pkill`로 정리할 땐 **`headless_shell`만** 노려라. `chrom`으로 넓게 잡으면 사용자가 쓰던 Chrome을 죽인다.

### 정령센터 (포켓몬센터)
내부 룩은 `GYM_THEME.center`(흰 타일 바닥 `fl` + 빨간 벽 `wl` + 벽 상단 `wt` + 줄눈 `gr`). 간호사는 `G.indoor==="center"`일 때만 흰 유니폼·분홍 머리·적십자 나스캡으로 그려진다.
오버월드 `+` 타일(비보행, 부딪혀 진입) → `INTERIORS.center`(11×9). 카운터(`#`) 뒤 간호사 `N`에 부딪히면 `nurseHeal()` — 인사 대화 → `healParty(true)` + `healFx()` → 배웅 + `saveGame()`. **회복소이자 세이브 포인트**(본가와 동일).
- 배치 7곳: 지역 밴드 0~6에 하나씩(마을 12,48 / 초원 20,45 / 숲 18,37 / 깊은 숲 21,31 / 수정 호수 9,22 / 고원 10,13 / 리그 앞 22,9). 예전엔 본토 회복 수단이 마을 집 침대뿐이라 깊은 숲에서 HP가 마르면 수십 타일을 왕복해야 했다.
- ⚠️ `N` 분기는 **`G.indoor==="center"` 체크가 범용 `N` 대화 분기보다 앞**에 와야 한다(안 그러면 간호사가 그냥 잡담 NPC가 됨).
- ⚠️ 인테리어 str에서 **카운터 중앙(x=5)이 뚫려 있어야** 간호사에게 접근 가능. 막으면 소프트락.
- `+`는 전 맵에서 미사용이던 문자다. `walkable` 제외목록 · 오버월드 `_tile` 렌더 · 미니맵 색까지 세 곳에 등록돼 있다.
- 회귀 `scripts/center_test.js`(배치·비보행·접근성·카운터 소프트락·HP/상태/PP 회복·세이브).

### 전투 연출 (`SIGFX` / `statusMoveFx` / 타입 폴백)
- **구조 함정**: `moveFx`에서 `if(move.power===0){...return;}`이 **`SIGFX` 조회보다 앞**에 있어서, 변화기는 전용 연출을 가질 *수가 없었다*(34종이 전부 같은 버스트). → SIGFX 조회를 앞으로 옮김. 순서를 되돌리지 말 것 — 회귀 테스트가 변화기에 SIGFX를 임시로 꽂아 호출되는지 확인한다.
- 변화기는 `statusMoveFx`가 `move.eff` 종류로 갈라 연출한다: 회복/날씨(화면 오버레이)/장막(방패 벽)/함정(발밑 설치)/씨앗/상태이상(해당 글리프)/혼란(회전 별)/급소/랭크(오라 링). 새 변화기를 추가하면 여기 분기도 볼 것.
- `SIGFX` 33종 · 공격기 52종 중 33종이 전용. 같은 타입 안에서도 성격을 나눈다(불: 세례=불티 / 방사=화염 줄기 / 인페르노=소용돌이 / 플레어드라이브=몸통 돌진).
- `SIGFX` 52종 — **공격기 52종 전원**이 전용 연출을 갖는다. 새 공격기를 추가하면 SIGFX도 같이 넣을 것(회귀가 `atkSig===atkAll`을 강제).
- ⚠️ 연출 테스트를 짤 때 밟은 함정 4가지:
  1. **스크린샷 타이밍에 의존하지 말 것** — MutationObserver로 배틀필드에 추가된 DOM의 지문을 본다.
  2. `el.style.cssText`는 **콜론 뒤에 공백을 넣어 직렬화**된다(`width: 100%`) → 스타일 정규식에 `\s*` 필수. 낙뢰 기둥처럼 `linear-gradient`를 쓰는 형태가 여럿이면 판정 순서도 주의.
  3. **앞 턴의 비동기 꼬리**(잔뎀·날씨·연출)가 다음 기술의 관측을 오염시킨다 → `G.busy`가 풀릴 때까지 기다린 뒤 다음으로.
  4. **빗나가면 연출이 아예 실행되지 않는다**(씨뿌리기·전기자극은 명중 90) → 프로브 동안만 `acc=100`으로 고정. 안 그러면 10% 확률로 실패하는 플레이키 테스트가 된다.
- 전 기술 전수 스윕은 `doMove`(턴 전체)가 아니라 `moveFx`를 직접 부른다 — 대사 대기 때문에 86종에 5분 넘게 걸렸다.

#### 타입 폴백
- **`TYPE_PARTICLE` 누락 = 화면에 "undefined"** (과거 이력): 타입 확장(얼음·독·땅) 때 `TYPE_COLOR`는 채웠는데 `TYPE_PARTICLE`을 안 채워서, `moveFx` 폴백과 `fxBurst`가 `fxGlyph(undefined)`를 호출 → **전투 화면에 그 글자가 날아다녔다**(피해 기술 11종).
  → **지금은 `TYPES` 단일 출처에서 파생되므로 이 부류는 구조적으로 불가능하다.** 아래 「타입·상태 단일 출처」 참조.
- 얼음·독·땅은 폴백(이모지 1발)에서 전용 연출로 승격: 얼음=파편 다발+서리 필터, 독=거품 상승+색조 틀기, 땅=발밑에서 솟구침+충격.
- `SIGFX` 10 → 16종 (눈보라·냉동빔·지진·땅파기·오물폭탄·독찌르기 추가).
- 회귀 `scripts/battlefx_daynight_test.js`가 **실제 전투를 돌려 MutationObserver로 "undefined" 글리프를 잡는다**.

### 낮/밤 생태
`NIGHT_MONS`/`DAY_MONS`가 5종뿐이라 낮/밤 사이클이 사실상 무의미했다 → 밤 11종 · 낮 9종으로 확대.
- **도감 설명문(`FLAVOR`)의 생태와 반드시 일치시킬 것.** "밤에만 활동한다"고 써놓고 낮에 나오면 도감이 거짓말이 된다. 회귀 테스트가 밤 종의 설명에 밤/달/야행/어둠/별 중 하나가, 낮 종에 낮/햇/태양/볕/아침/양지 중 하나가 있는지 강제한다.
- ⚠️ 늘릴 땐 **낮·밤 각 티어 풀이 마르지 않는지** 확인(`pickWild`가 티어로 먼저 거르므로 한쪽에 몰리면 고갈). 테스트가 티어별 6종 이상을 강제한다.

### 트레이너 교체 AI (`foeMaybeSwitch`)
적 트레이너가 상성 불리를 읽고 벤치에서 바꾼다. `doMove` 첫 줄에서 호출 — **교체가 상대의 턴을 소모**하므로 내 기술은 새로 나온 정령에게 들어간다(본가와 동일).
- 팀이 `[id,lv]` 배열이라 예전엔 교체가 불가능했다. → `G.trainer.mons[]` 인스턴스 캐시(`trainerMon(i)`)로 HP·PP가 남는다. `G.trainer.fainted`(Set)로 기절 관리, `trainerNextAlive()`가 다음 정령을 고른다(예전 `idx++` 순차 아님). **팀 도트 UI도 `fainted` 기준**.
- 판정: `matchupScore = bestEffAgainst(내가 때리는 배율) - bestEffAgainst(맞는 배율)`. 현재가 `-0.5` 미만이고 벤치에 `+0.5` 이상 나은 놈이 있을 때만.
- 브레이크: 한 전투 **최대 2회**(`t.switches`) + **25% 확률로 안 함**(읽히면 재미없다). 물러난 정령은 `resetStages` + 혼란/씨앗 해제.
- 회귀 `scripts/foe_switch_test.js`. ⚠️ 테스트에서 25% 변덕 분기를 통과시키려면 `Math.random`을 고정해야 한다.

### 도감 데이터 (`FLAVOR` / `findHint`)
- `FLAVOR`는 **DEX 86종 전원** 커버해야 한다(예전엔 32종뿐이라 63%가 "흔함/중급/희귀" 폴백). 새 종 추가 시 `FLAVOR`도 같이 넣을 것 — 회귀가 폴백 분류 0건을 강제한다.
- 진화하면 `h`(키)·`w`(무게)가 **반드시 증가**해야 한다(테스트가 역행을 잡는다).
- **서식지는 하드코딩 금지.** 특수 지역 조우 풀은 `ENC_POOLS` 상수 하나에 모여 있고 `findHint(sp)`가 거기서 파생한다. 예전엔 `FIND_HINT[sp.tier]` 문자열 3개뿐이라 **해안 전용 종도 "숲 · 초원"이라 뜨는 거짓 정보**였다. 풀을 고치면 도감 표기가 자동으로 따라온다.
- 오버월드 표기는 `SEA_MONS`/`NO_WILD`/`legend` 제외 규칙이 `pickWild`와 같아야 한다.
- ⚠️ `FLAVOR`는 `window.SG` 선언(1445줄)보다 **뒤에** 정의되므로 그 객체 리터럴에 넣으면 TDZ ReferenceError로 `SG` 자체가 죽는다. `window.SG.FLAVOR=FLAVOR;`처럼 flow 내보내기 시점에 붙일 것.
- 회귀 `scripts/dex_flavor_test.js`(커버리지·진화 크기·풀↔표기 전수 대조·울음 버튼).

### 명예의 전당 (`recordHallOfFame` / `showHallOfFame`)
챔피언 등극 시점의 파티를 박제한다. 예전엔 `G.champion=true` 플래그 하나뿐이라 "누구와 함께 챔피언이 됐는지"가 어디에도 안 남았다.
- `G.hallOfFame[]`(최근 10회) — 날짜·플레이시간·도감수 + 파티 스냅샷(id/이름/레벨/샤이니/타입). 세이브 키 `hof`.
- 챔피언전 승리 → `recordHallOfFame()` → `playStory(LEAGUE_WIN)` 콜백에서 `showHallOfFame()`. 트레이너 카드의 "👑 명예의 전당 보기" 버튼으로 재열람(여러 회차면 ◀▶).
- ⚠️ 엔딩 오버레이(`#endingOverlay`)를 **`showEnding`과 공유**한다. 헤더(`#endingTitle`)를 양쪽에서 각자 세팅해야 제목이 섞이지 않는다.
- ⚠️ 스냅샷 이름은 `dispName(m)`이 아니라 `m.nick||m.name`으로 저장할 것 — `dispName`은 샤이니 ✨ 접두어를 붙이는데 렌더에서 또 붙여 이중 표기됐다.
- ⚠️ `creatureVisual`이 뱉는 `<img class="cart">`는 **크기 제약이 없어 컨테이너를 뚫고 나온다.** 작은 목록에 쓸 땐 `.hofsp`/`.dbsp`처럼 이미지 크기를 강제하는 전용 클래스로 감쌀 것.

### PP 회복 · 급소 랭크
- **PP 회복**이 여관·센터뿐이라 PP가 마르면 걸어 돌아가야 했다 → `ether`(기력의 물방울, 가장 많이 닳은 기술 +10) / `elixir`(만능 물방울, 전 기술 완전 회복). 가득 찼으면 소모되지 않는다.
- **급소가 고정 1/16**이라 전략이 아니었다 → 본가 랭크표 `CRIT_RATE=[1/16,1/8,1/4,1/3,1/2]`, `critStage(att,move)`가 기술의 `highCrit` + `att._critStage` + 초점렌즈(`scopelens`)를 합산(상한 4).
  - 새 기술: 기합충전(`eff.crit:2`), 가르기·크로스촙(`highCrit:true`).
  - `_critStage`는 **휘발성** — `resetStages`가 같이 지운다(교체·전투 종료·기절).
  - 배율은 **1.5배 유지**(6세대 값). 2.0배는 기존 난이도 커브를 흔들어서 일부러 안 올렸다.

### 교체기 · 혼란 자해
- **배턴터치**(`batonpass`): 랭크·급소랭크·씨앗을 그대로 넘기고 교체. `doBatonPass`가 `openSwitchAwait(true)`(강제 교체 오버레이를 프라미스로 감싼 것)로 선택을 기다리고, `chooseSwitch`가 `_batonCarry`를 보고 새 정령에 랭크를 얹는다. **배턴터치 교체는 그 자체가 이번 턴 행동**이라 `chooseSwitch`의 `_bc` 분기가 `foeFreeTurn`·메뉴 복귀를 건너뛰고 doMove로 제어를 돌려준다.
- **울부짖기**(`roar`, 우선도 -6): 트레이너전이면 상대를 벤치의 다음 정령과 강제 교체(끌려나간 쪽 랭크 소멸), 야생이면 쫓아내고 `_phaseEnded`로 전투 종료(경험치 없음).
- ⚠️ 테스트에서 배턴터치를 검증할 땐 **교체 오버레이가 열릴 때까지 폴링**할 것. 앞의 대사 대기(`mw(700)`) 때문에 즉시 열리지 않아, 고정 지연으로 눌렀다가 `_batonCarry`가 아직 null이라 그냥 일반 교체가 되고 doMove가 영영 대기했다.
- **혼란 자해**(`confusionSelfHit`): `maxHp*0.09` 고정 → 본가처럼 **위력 40 무타입 물리기를 자신에게**. 예전엔 방어가 높아도 자해가 똑같아서 "고방어가 혼란에 강하다"는 성질이 통째로 없었다.
  - ⚠️ 이 게임 damage 공식은 본가와 상수가 달라(9로 나눔) 저레벨에서 자해가 maxHp의 37%까지 튄다. 평균 ~16%는 본가 대역이라 두되 **maxHp의 30% 상한**을 걸었다. 자해 테스트 픽스처는 maxHp를 넉넉히 줘야 상한이 먼저 걸려 공/방 영향이 가려지지 않는다.
- 참고: **학습장치는 불필요하다.** `winBattle`이 이미 파티 전원에게 40% 경험치를 나눠준다(`gainXpFor(o,base,false)`).

### 방어(protect) — 본가 대조 잔여분 구현
`protect`(위력0·`pri:4`·`eff:{protect:true}`): 우선도가 높아 먼저 나가 **이 턴 상대를 노리는 기술을 막는다**. 자기 회복·자기 버프·날씨·장막·설치기는 자신/필드 대상이라 통과.
- **볼라타일 2종**: `_protect`(이번 턴 방어 중) + `_protectStreak`(연속 성공 횟수). 연속 사용 성공률 `1/3^streak`(본가) — 방어가 아닌 기술을 쓰면 `_protectStreak=0`(`performMove` 첫 줄에서 리셋).
- ⚠️ **네 전투 시스템 전부에 같은 규칙을 넣어야 한다**(상태 부여 관문에서 배운 교훈): 메인(`performMove` 차단 가드 + 발동 분기) · 듀오(`dbExec` 차단/발동 + `dbBeginRound`에서 해제) · 적 AI(`foeChooseMove`가 22%로 가끔, 직전에 방어 안 했을 때만) · 밸런스 시뮬(`battle_sim.js`의 `applyMove` 차단/발동 + 턴 끝 해제). 하나라도 빠지면 그 모드에서 방어가 무시된다.
- ⚠️ **`_protect`는 매 턴 끝에 해제**(`doMove`에서 `activeMon()`/`G.foe` 둘 다). `_protectStreak`는 교체·전투종료로 사라지는 휘발성 — `_confuse`/`_seeded`/`_flinch`를 지우는 **모든 리셋 지점**에 같이 넣었다(`setupBattleUI`·`chooseSwitch`·`doPhaseOut`·`foeMaybeSwitch` 아웃몬·`tryCatch` 포획).
- **획득**: 레벨업 학습셋엔 안 넣었다 → 트레이너·야생이 자동으로 안 배운다 → **밸런스/시뮬은 구조적으로 불변**. 플레이어는 범용 기술머신 `tm_protect`(상점 need:2)로 가르친다.
- 회귀 `scripts/protect_test.js`: 실전투 차단(방어 턴 HP 불변 vs 대조 턴 피격) + 연속 카운터 set/reset + 시뮬 차단·연속 실패율(`1/3^streak`) 통계.
- **대타출동(substitute)은 평가 후 보류**: 로직만이 아니라 **가시 인형(decoy) UI**가 없으면 HP바가 얼어붙어 혼란스럽다(방어처럼 명확한 "막아냈다" 피드백이 안 나온다). 로직도 이동피해·상태·능력깎기 진입점을 다 가로채야 해 L 규모. 로직 절반·UX 절반 → 별도 작업으로 남긴다.
- **트레이드 진화는 갭 아님(의도적)**: P2P 교환이 없고, 유일한 트레이드-진화 계보(바위라인 megalith)는 이미 `evolveLv:36`로 대체돼 있다. NPC 트레이드(`TRADES`)는 완성형 정령을 직접 지급한다 — 구현 불필요.

### 특성 (20종) · 야생 지닌물건 · 도망 공식
- 특성이 10종뿐이고 대부분 `DEFAULT_ABILITY[type]` 폴백이라 **같은 타입 정령이 죄다 같은 특성**이었다(최다 13종). → 10종 추가해 20종, 최다 9종으로 분산.
  - 추가: 불꽃몸(피격 시 화상)·까칠한피부(물리 접촉 1/8 반동)·쓸비늘(비에 속도 2배)·엽록소(쨍쨍에 속도 2배)·불면(잠듦 무효)·면역(독 무효)·수의베일(화상 무효)·스나이퍼(급소 배율 1.5→2.25)·자연회복(교체 시 상태이상 해제)·순수한힘(물리 1.5배)
  - ⚠️ 특성 추가 시 **`ABILITY_KO`와 `ABILITY_DESC` 둘 다** 채울 것(회귀가 강제). 한글명을 빼먹어 UI에 키가 그대로 뜰 뻔했다.
  - ⚠️ 종에 개별 특성을 주면 **"이 종의 특성은 타입 기본값"이라 가정한 테스트가 깨진다.** 폴백 검증은 종이 아니라 `DEFAULT_ABILITY`를 직접 볼 것.
  - `SPEC_TYPES`(특수 판정 타입)를 모듈 레벨 단일 출처로 통일 — `damage()` 안의 지역 사본을 제거했다. 까칠한피부가 물리 판정에 이걸 쓴다.
- **야생 지닌물건**(`wildHeld`): `held:null` 고정이라 야생에서 도구를 얻을 길이 없었다 → 티어별 확률(5/9/14%)로 들고 나오고, 잡으면 딸려온다. 전설은 제외.
- **도망**: 고정 확률(빠르면 82%/느리면 45%)에서 본가 공식 `(A*128/B + 30*시도횟수)/256`으로. 시도할수록 잘 도망친다. `G.runTries`는 전투 시작 시 리셋.

#### ⚠️ 밸런스 테스트를 짤 때 (반복해서 밟은 함정)
`makeMon`은 **IV를 랜덤으로 굴린다.** 개체 둘을 비교해 배율(특성·랭크·아이템)을 검증하려면 **`atk`/`spd`/`def` 등 관련 스탯을 직접 못박아야** 한다. 안 그러면 IV 차이가 배율을 가려 간헐적으로 실패하는 플레이키 테스트가 된다(순수한힘·쓸비늘·엽록소에서 실제로 겪음).
그리고 실전 흐름으로 재는 값(반동·잔뎀)은 **상대의 반격 데미지가 섞이므로** 상대에게 무해한 변화기만 쥐여줄 것.

### 지역 콘텐츠 (바닥 아이템 · 정령 회관)
지역마다 체육관·센터는 있었지만 **바닥에 놓인 도구가 하나도 없었고**(숨겨진 `HIDDEN`만 존재), 제단권은 NPC 0명이었다. 그래서 "가볼 이유"가 없어 텅 빈 느낌.
- **`GROUND_ITEMS`**: 눈에 보이는 필드 도구 20개(7개 지역 전부). `groundItemAt(x,y)`가 미획득분만 반환하고, 오버월드 렌더가 그 위에 몬스터볼을 떠오르게 그린다. 줍기는 `onArrived`에서 `G.found`로 1회성.
  - ⚠️ **반드시 보행 가능한 타일 위에 둘 것.** 나무·벽 위에 두면 영영 못 줍는다(실제로 5개가 그랬고 테스트가 잡았다). 좌표 추가 시 `walkable` 검증이 회귀에 포함돼 있다.
  - ⚠️ `HIDDEN`과 좌표가 겹치면 하나가 묻힌다 — 회귀가 중복도 본다.
- **`INTERIORS.hall`(정령 회관)**: IV·닉네임·친밀도는 데이터로만 있고 플레이어가 볼 창구가 없었다. 오버월드 `E` 타일 → 회관에 3인:
  - `p` 감정사 — `ivTotal`/`ivBest`로 본가식 자질 총평
  - `n` 이름 짓는 사람 — 닉네임 변경(`m.nick`)
  - `s` 마사지사 — 친밀도 +30 (진화 조건과 연결)
  - ⚠️ **NPC 바로 아래 칸이 뚫려 있어야 부딪혀 대화가 된다.** 처음에 카운터(`#`)로 막아 대화 불가였다(정령센터에서 이미 겪은 실수를 반복).
  - ⚠️ **인테리어 폭은 11 이하.** 13으로 만들었더니 오른쪽 NPC가 화면 밖으로 잘렸다.
- ⚠️ **새 오버월드 건물 타일을 추가하면 `walkable` 제외목록에 꼭 넣을 것.** `E`를 빠뜨려 타일 위를 그냥 지나가고 진입이 아예 안 됐다(부딪혀 진입은 `!walkable`이 전제).
- ⚠️ `Map2D`는 **객체 리터럴**이다. 메서드를 추가할 땐 앞 메서드 끝에 **콤마**를 붙일 것(`_itemBall` 추가 때 빠뜨려 `SyntaxError: Unexpected identifier '_tile'`).
- **실내 바닥 아이템**: `GROUND_ITEMS`의 `in:"<interior id>"`로 스코프를 지정한다. ⚠️ **`in`이 없으면 오버월드 전용** — 스코프를 안 나누면 늪지 (2,10)에서 오버월드 아이템을 줍는 버그가 난다(`groundItemAt`이 `G.indoor`를 키에 포함). 용암 동굴·수정 동굴·늪지·설원이 사실상 빈 방이라 13개를 넣었다.
- **인게임 교환(`TRADES`)**: 포켓몬의 교환 아저씨. 원하는 종을 파티에 데려오면 자기 정령과 바꿔준다(닉네임·친밀도 120). NPC에 `trade:"<키>"` 플래그. 1회성(`G.trades`), **마지막 한 마리는 못 넘긴다**는 가드 필수.
- 필드 트레이너 3명 추가(수정 호수 2·제단권 1) — 두 지역이 각 2명뿐이었다.
- 회귀 `scripts/region_content_test.js`(배치·보행 가능성·중복·줍기 1회성·회관 접근성·서비스 3종·교환·표지판·지역별 NPC 존재).

#### ⚠️ 맵/필드 테스트를 짤 때 (실제로 겪은 것들)
- **프로브가 인테리어 안에서 끝나면 다음 블록의 오버월드 동작이 어긋난다.** 인테리어를 순회했으면 블록 끝에서 반드시 `exitInterior()`로 나올 것. 이걸 안 해서 바닥 아이템 줍기가 조용히 실패했다(위치는 맞는데 획득이 안 됨).
- 위치를 세팅한 뒤 **`enterMap(true)`를 다시 부르면 위치가 초기화된다.** 좌표만 세팅하고 바로 걷을 것.
- 앞 블록의 `walkTo`가 살아 있으면 새 상태의 위치를 멋대로 옮긴다 → `stopPath()` 후 한 박자 쉬고 시작.
- 아이템 옆칸에 플레이어를 세울 때 `y+1`을 무턱대고 쓰면 지도 경계(벽)라 이동이 시작조차 안 된다. **보행 가능한 이웃을 찾아서** 세울 것.

### 실내 트레이너 · 퀘스트
- 체육관·리그 밖 인테리어엔 트레이너가 **하나도 없었다** → `GUARD_TILES`에 `r`(수정 동굴)·`u`(용암 동굴)·`v`(안개 늪지) 추가. 가드 타일은 미격파 시 벽, 이기면 통과(`walkable`이 `G.defeated`로 열림).
  - ⚠️ **소프트락 주의**: 가드를 외길에 두면 갇힌다. 이웃 3칸 이상이 열린 자리에만 배치했고, 회귀가 "미격파 시 막힘 + 이기면 통과 + 우회 가능"을 전부 확인한다.
- 퀘스트 3 → 6개. 새로 만든 시스템과 엮었다: 필드 도구 회수(`G.found`) · 친밀도 150(회관 마사지사와 연결) · 밤 전용 정령 포획(`NIGHT_MONS` + `questFlags.nightCaught`).
  - ⚠️ `giver`는 **실존 NPC id**여야 한다(회귀가 유령 의뢰인을 잡는다). `check`/`prog`/`reward`/`offer`/`active`/`done`을 모두 채울 것.
- 회귀 `scripts/indoor_quest_test.js`.

### 맵 게이트 참고 (트래커/기획 수정 시)
- 체육관 입구 = `G` 타일, `GYM_AT`에 정의된 4곳. 뱃지 키는 TRAINERS `"1"~"4"`.
- 정령센터 입구 = `+` 타일 7곳 (위 참조).
- 정령 리그 입구 = `U` 타일 (18,9). `forestBadges()>=4`로 잠김.
- 군주의 제단 = `X` 타일 (8,8) → 제단 실내. 내부 `A` 타일의 진행은 `altarStage()`가 결정: **숲의 군주(`lord`) → 흑요마(`shadow`) → 오로르(`dawn`) → `quiet`**.
  - `lord`(메인 클라이맥스): `startTrainer("X")` → 승리 시 `G.badge`=숲의 인장 → `EPILOGUE` 엔딩 → **재대결 시스템 해금**(`maybeRematch`가 `G.badge`로 게이트됨).
  - `shadow`/`dawn`은 엔딩 후 제단에 다시 와서 잡는 포스트게임 보스. `showEnding` 텍스트가 이 구조를 전제로 쓰여 있다.
  - 복구 이력: 예전엔 `A` 타일이 숲의 군주를 건너뛰고 곧장 흑요마로 가서, 숲의 군주·EPILOGUE·인장·재대결이 통째로 죽어 있었다. `altarStage()`에 `lord` 단계를 앞에 끼워 복구. 회귀 테스트 `scripts/altar_test.js`.

### 다이어트 결과 (완료)
three.js(589KB) + BUNDLED_ART(616KB) + Map3D 코드 216줄 제거 → dist 4.7MB → **3.5MB**.
남은 용량은 사실상 전부 크리처 아트 86종(PAINT_ART)이라 더 줄이려면 아트 화질/해상도 트레이드오프가 필요하다.

## 실플레이 검증 (`scripts/playtest.sh`)
`verify.sh`는 "내가 상정한 경로"만 확인한다. 이건 **게임을 실제로 돌려서** 확인하는 쪽이다.
```bash
bash scripts/playtest.sh dist/spirit_grove_3d.html 40   # 마지막 인자 = 몽키 퍼즈 초
```
- **`reachability_test.js`** — 게임이 쓰는 바로 그 `walkable()`로 시작점부터 BFS. 오버월드 콘텐츠 90개 + 인테리어 17곳 내부가 정말 닿는지 증명한다. "놓았는데 못 가는" 버그(이미 두 번 났다)를 구조적으로 막는다.
  - ⚠️ **비전기술은 `walkable()`만으론 안 보인다.** 파도타기는 물에 부딪혀야 `G.surfing`이 켜지고, 자르기·괴력은 지형을 실제로 바꾼다 → 보유 플래그로 통행 가능 여부를 직접 모델링해야 한다. 안 하면 파도타기로 열리는 아이템이 "미도달"로 오판된다.
  - ⚠️ `enterInterior`는 **warpFade로 150ms 지연 스왑**이다. 덜 기다리면 `walkable()`이 아직 오버월드를 보고 있어 내부 콘텐츠가 전부 미도달로 잡힌다(실제로 겪었다 — 게임이 아니라 하네스 버그였다).
- **`playthrough_test.js`** — 내부 함수를 호출하지 않고 **진짜 키·클릭**으로 타이틀→캐릭터→스타터→이동→야생 전투→승리까지. 화면 전환 배선이 실제로 이어져 있는지 본다.
  - ⚠️ 스토리는 `#dialogBox`가 아니라 별도 `#storyOverlay`(storyNext/storySkip)다. 대화창만 처리하면 여기서 영영 막힌다.
  - ⚠️ 방향키를 번갈아 누르면 제자리 진동만 한다. 같은 방향을 여러 번 눌러야 실제로 이동한다. 마을(지역0)엔 야생 조우가 없으니 북쪽 풀숲으로 나가야 전투가 걸린다.
  - ⚠️ 전투 진행은 **고정 반복수 대신 실제 시계 예산**으로. 부하가 걸린 환경에선 애니가 느려져 고정 횟수로는 안 끝난다.
- **`longrun_test.js`** — 목표 트래커를 탭해 가며 **실제로 진행**하고 난이도를 실측한다(도달 레벨·전투 수·전멸·회복약 사용·누적 XP). `curve_test.js`는 XP 경제만 모델링한 시뮬레이션이라 상성·회복·도주·전멸이 빠져 있다 — 이건 그걸 실제로 겪는다.
  - ⚠️ 목표 탭 후 **매 루프 재탭하면 경로가 리셋돼 제자리를 맴돈다.** 이동이 멈추거나 전투가 걸릴 때까지 기다린 뒤 다음 판단을 할 것.
  - ⚠️ 봇이 **회복약을 못 쓰면 난이도 측정이 불공정해진다.** 가방은 주머니 탭이 있어 회복약이 첫 화면에 없을 수 있다 — 탭을 순회해야 한다. (이걸 고치기 전엔 전멸 3회/레벨 정체, 고친 뒤엔 Lv5→8로 결과가 완전히 달라졌다.)
  - ⚠️ 전멸(blackout)은 파티를 **즉시 회복**시키므로 `aliveCount===0`으로는 못 잡는다. 소지금 급감으로 추정하는데, 야생 승리 수입과 섞여 **정확한 수치는 아니다** — 경향치로만 볼 것.
- **`monkey_test.js`** — 시드 고정 무작위 실입력을 퍼붓고 런타임 에러·영구 잠금·상태 오염(NaN/음수 HP/파티 소실)을 감시한다. **실제로 버그 3건을 잡았다**(아래 이력 참조).
  - ⚠️ 전투에 들어가면 무작위 키로는 기술을 못 골라 그대로 갇힌다 → 전투 중엔 실제 메뉴 버튼을 눌러 턴을 진행시켜야 커버리지가 나온다.
  - ⚠️ busy 계측은 전투 분기보다 **앞**에서 해야 한다. 뒤에 두면 `continue`로 샘플이 건너뛰어져 "연속 busy"가 아니라 샘플 간격을 재게 된다(27초로 보였다).
  - ⚠️ 무작위 탐험에 의존하는 단정(전투 N회 이상 등)은 **플레이키**다. 게이트는 커버리지로 두고 나머지는 참고치로 출력할 것.

### ⚠️ 브라우저 테스트가 많아 한 번에 못 돌 때
playwright 테스트가 50개가 넘어 메모리 압박이 큰 환경에선 중간에 `Target page, context or browser has been closed`가 **매번 다른 테스트에서** 난다(게임 버그가 아니다). 구간을 나눠 돌린다:
```bash
PW_FROM=1  PW_TO=18 bash scripts/verify.sh
PW_FROM=19 PW_TO=36 bash scripts/verify.sh
PW_FROM=37 PW_TO=60 bash scripts/verify.sh
```
테스트가 예외로 죽으면 headless 브라우저가 그대로 남는다(세션 중 66개까지 쌓여 다른 테스트를 실패시켰다). 새 브라우저 테스트를 만들 땐 `uncaughtException`/`unhandledRejection`에서 반드시 `b.close()` 할 것. 이미 샜다면 `pkill -f headless_shell`.

## 시각 검증 (스크린샷)
`scripts/screenshot.js` — Playwright + Chromium으로 dist를 실제로 띄워 타이틀→캐릭터→스타터→맵→전투까지 자동으로 몰고 가며 PNG 캡처 + 런타임 에러 수집. UI/아트/게임필 변경은 이걸로 눈으로 확인한다.
```bash
npm install playwright && npx playwright install chromium   # 최초 1회
node scripts/screenshot.js dist/spirit_grove_3d.html <출력폴더>
```
canvas 기반이라 jsdom으로는 렌더가 안 잡히므로, 시각 확인은 반드시 Playwright로.

## 세션 워크플로
"새 아트 왔어 → 파이프라인 → 빌드 → 검증 → 커밋" 순으로. 큰 변경 전 `git commit`. 코드 회귀는 `verify.sh`(jsdom 5종), 시각 확인은 `screenshot.js`(Playwright).
