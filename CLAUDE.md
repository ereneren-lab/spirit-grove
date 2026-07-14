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

## 완료된 개선 (되돌리지 말 것)
- 86종 전원 v2 아트 통일 (DEX 86 = PAINT_ART 86).
- 불여우 라인 파라꼬→파라울→파라온을 구미호 계보로 재설계, 이모지 🦊 통일.
- 넝쿠리(vinesnake) 독립화 — 새록정 진입경로는 leafwyrm 하나.
- HP바 빨간점 버그 수정: `.hpfill`/`.hpghost`의 border-radius 제거(컨테이너 overflow:hidden이 양끝 처리).
- 주인공 4명 회화체 빌보드(앞/뒤) + 캐릭터 선택 미리보기도 회화.
- 팔로워 타입색 오라 글로우 + 크기/접지 조정.

## 로드맵 (권장 순서)
1. ~~아키텍처 분리~~ ✅ 완료 (src 413KB + assets + dist 빌드).
2. 온보딩/튜토리얼 — **첫 전투 코치 ✅ · 목표 트래커 ✅**. 남은 것: 게임필 폴리시, 난이도 곡선, 오디오.
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

### 맵 게이트 참고 (트래커/기획 수정 시)
- 체육관 입구 = `G` 타일, `GYM_AT`에 정의된 4곳. 뱃지 키는 TRAINERS `"1"~"4"`.
- 정령 리그 입구 = `U` 타일 (18,9). `forestBadges()>=4`로 잠김.
- 군주의 제단 = `X` 타일 (8,8). 안에서 흑요마(`shadowDone`) → 오로르(`dawnDone`).
- ⚠️ `TRAINERS.X`(숲의 군주, `boss:true`)는 현재 **도달 불가**로 보인다 — 오버월드 `X` 타일이 트레이너 전투 대신 제단 실내로 보내고, 제단 안에는 `X` 타일이 없다. 따라서 `EPILOGUE` 엔딩도 이 경로로는 안 열린다(챔피언 경로의 `LEAGUE_WIN`으로는 열림). 손볼 때 확인할 것.

### 다이어트 결과 (완료)
three.js(589KB) + BUNDLED_ART(616KB) + Map3D 코드 216줄 제거 → dist 4.7MB → **3.5MB**.
남은 용량은 사실상 전부 크리처 아트 86종(PAINT_ART)이라 더 줄이려면 아트 화질/해상도 트레이드오프가 필요하다.

## 세션 워크플로
"새 아트 왔어 → 파이프라인 → 빌드 → 검증 → 커밋" 순으로. 큰 변경 전 `git commit`. 게임 확인은 `python3 -m http.server`로 `dist/spirit_grove_3d.html` 로컬 프리뷰(브라우저 자동화 MCP가 있으면 스크린샷 검증).
