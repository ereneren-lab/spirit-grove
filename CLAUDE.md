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
- **포획 시 정령 정체성 소실**: `tryCatch`가 `makeMon(foe.id,foe.level)`로 **새 정령을 랜덤 생성**하고 hp/status만 복사 → 샤이니(이로치)·IV·성격·성별·기술이 전부 사라졌다. → 잡은 정령 = 그 야생 `foe` 객체 그대로(`const cap=foe`), 전투 잔여상태(stages/_confuse 등)만 리셋.
- **세이브 시 기술셋 소실**: `serMon`이 `moves`/`pp`를 저장 안 하고 `reviveMon`이 `makeMon` 기본 학습셋으로 재생성 → TM으로 배운 기술·커스텀 기술셋이 세이브/로드로 초기화됐다. → `serMon`에 `mv`/`pp` 추가, `reviveMon`이 있으면 복원(구세이브는 기본값 폴백). (샤이니·IV·성격·성별은 원래 저장됨.)
- 회귀 `scripts/catch_identity_test.js`(포획·세이브 후 샤이니/IV/성격/성별/기술/PP 보존).
- **주인공/팔로워 좌우 플립 반대**: 크리처·주인공 아트는 기본이 **좌향**(foxfire 코가 왼쪽. 배틀 me가 `.sprite.me` scaleX(-1)로 항상 뒤집혀 적을 향하는 것도 이 규칙). 그런데 오버월드 주인공은 `dir==="left"`일 때, 팔로워는 `facing<0`(왼쪽 이동)일 때 뒤집어서 **진행방향과 반대로** 봤다. → 주인공은 `dir==="right"`, 팔로워는 `facing>0`(오른쪽 이동)일 때 뒤집도록 반전. 이제 좌향 이동=기본 아트, 우향 이동=미러 → 진행방향을 본다.
- **경험치 바 애니 없음**: `gainXpFor`가 XP를 즉시 반영하고 레벨업 시 잔여치로 뚝 떨어져 포켓몬 느낌이 없었다. → 선두 정령은 `animExp(pct)`로 **100%까지 차오름 → 레벨업 0 리셋(`setExpBar0`) → 잔여치까지 계속** + `sfx("exp")` 상승음. 비선두는 기존처럼 즉시. 회귀 `scripts/exp_test.js`(바 폭 100→0→잔여치 확인).
- **정령 등장 애니 이중 재생**: `setupBattleUI`의 `.enter` CSS 애니 ✕ `sendOutAnim` JS 충돌 → `.enter` 제거(`scripts/sendout_test.js`).
- **문 진입 즉시 튕김**: 상점/체육관 등 인테리어는 입장 위치(startY)가 출구(exitY) 바로 위라, 위에서 아래키로 들어가면 `heldDir="down"`이 입장 후에도 남아 `onArrived`→`continueMovement`가 다시 아래로 이동→출구 타일→즉시 퇴장(튕김). → `_enterInterior`/`_exitInterior`에서 `heldDir=null; stopPath()` + `_warpLock`(입력잠금, `move()` 첫 줄에서 `performance.now()<_warpLock`이면 return). 회귀 `scripts/door_bounce_test.js`(아래키 홀드 입장 후 indoor 유지 확인, 구코드는 indoor=null로 튕김).

- **잠듦 상태 undefined**: `STATUS_KO`/`STATUS_CLS`에 `slp` 누락(psn/brn/par만) → 잠들면 상태 칩이 `undefined`. `_MV_STATUS_KO`엔 있었음. → `STATUS_KO.slp="잠듦"`, `STATUS_CLS.slp="b-slp"`(+`.b-slp` CSS) 추가.
- **소수점 레벨**: 특수 조우(파도/낚시/설원/섬/해안/용암/동굴)가 `clamp(avgLevel()+...)`만 하고 floor 안 해 소수점 레벨. → `makeMon`에서 `level=Math.max(1,Math.floor(level))`로 정수화(모든 조우/스탯 커버).
- 회귀: 위 세 가지 + 파티 재정렬 + 돌 진화는 `scripts/bugfix_batch_test.js`.

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

## 타입 시스템 (10종)
불·물·풀·전기·노말·비행·바위 + **얼음·독·땅**(추가됨). 새 기술: 얼음(얼음뭉치[우선]/서리숨결/냉동빔/눈보라/한기/얼음바람), 독(독찌르기/오물폭탄/독가루), 땅(머드샷/땅파기/지진). 전설 5종은 `legend:true`+tier4+종족값 대폭 상향(여명룡 297)+조우 레벨↑(50~56)+포획 페널티(-0.38). XP base `foe.level*15+11`(완화 ~20%, 진행도 천천히 — `curve_test.js` sim과 동기화 필수). ⚠️ **jsdom 미설치면 jsdom 게이트 테스트(스모크·코치·목표·제단·커브·기술설명·대화)가 조용히 스킵됨** — 밸런스/커브 변경 시 `npm install jsdom` 후 `verify.sh`로 실제 실행 확인. `EFF`는 10×10 완전표(모든 조합 정의 — 누락 시 `damage`에서 NaN). 특수 타입(spa/spDef)=불·물·풀·전기·**얼음**(`damage`의 `SPEC`), 나머지 물리. `TYPE_KO`/`TYPE_CLASS`/`TYPE_COLOR`/CSS `--<type>`·`.type-tag.t-<type>`·`.b-<st>`·`.dbst.b-<st>` 동기화 필수. 상태이상에 **냉동(frz)** 추가(잠듦류: 매턴 20% 해동, 못 움직임). 얼음 크리처(빙구리·서리강아지·빙하곰·얼음정·빙하룡·동결룡·설올빼미·빙하제 등)를 water→ice 재타이핑, 독(해파리정·개굴몽), 땅(굴다람·바위정·마그마룡) 재배치. 새 기술 얼음/독/땅 각 몇 종. 회귀 `scripts/type_chart_test.js`·`scripts/newtypes_test.js`.

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

### 체육관 얼음 퍼즐 (gym3 수정 호수)
얼음 타일 `I`: `walkable`은 기본 통행(제외목록에 없음), `_tile` 실내 렌더에 연한 얼음색+광택. `onArrived` 실내 블록에서 `_t==="I"`면 `Field.dir` 방향으로 계속 미끄러짐(다음 칸이 walkable이면 `move(dir,true)`, 벽/미격파 트레이너면 정지). ⚠️ 소프트락 방지 — 중앙 통로(x4)가 항상 통행 가능하도록 맵 설계, 미격파 가드 앞에서 슬라이드 정지. 회귀 `scripts/gym_ice_test.js`(슬라이드 2칸 이동 + 리더까지 소프트락 없이 도달). 다른 체육관에도 확장 가능. `enterInterior`/`INTERIORS`를 `SG.flow`에 노출(테스트용).

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
