# 정령의 숲 (Spirit Grove 3D) — 프로젝트 가이드

이 파일은 Claude Code가 매 세션 자동으로 읽는 프로젝트 지침이야. (예전 `작업_인수인계.md`를 대체)

## 개요
- **단일 HTML 게임**: `spirit_grove_3d.html` (~4.7MB). DEX(종 정의) · PAINT_ART(base64 WebP 아트) · three.js · CSS · 게임 JS가 전부 인라인.
- 크리처 수집형 RPG. 렌더러는 **Map2D**(활성) / Map3D(비활성). 전투는 DOM UI.
- 아트는 **외부에서 생성**(ChatGPT 등) → PNG를 `art_inbox/`에 넣으면 파이프라인이 배경제거·인코딩·주입.

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
   - 크리처 → 360×360 중앙 정렬.
   - 주인공/캐릭터 → **알파 bbox로 잘라 발끝 하단정렬**(y≈356/360). 접지 일정.
3. **인코딩**: WebP quality 86 → base64 `data:image/webp;base64,...`
4. **주입**:
   - 크리처 → `const PAINT_ART={` 바로 뒤에 `id:"dataURL",` 삽입. 이미 있으면 해당 줄 교체. (BUNDLED_ART 구아트는 자동 덮임)
   - 주인공 → `HERO_ART` / `HERO_ART_BACK` 객체 교체.
- 한 이미지에 캐릭터 2명이 같이 오면 좌/우로 크롭 후 각각 처리.

## 빌드/검증 (반드시)
`scripts/verify.sh` 실행. 내용:
- **three.js 무결성**: `grep -c "^<script>/\*\*" spirit_grove_3d.html` → 반드시 **1**.
- **JS 문법**: 2번째 `<script>` 블록 추출 → `node --check`.
- **PAINT_ART/DEX 대조**: DEX 종수 == PAINT_ART 종수, 누락/중복 0.
- ⚠️ 파일 1~2번째 줄이 거대한 base64+three.js라, **흔한 단어로 grep 금지**. 정확한 앵커로만.

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
1. **아키텍처 분리** ← 지금 1순위. base64 아트를 별도 에셋으로 빼서 편집용 소스를 수백 KB로. dist는 인라인 번들로 한 파일 유지.
2. 온보딩/튜토리얼, 게임필 폴리시, 목표 루프+난이도, 오디오.
3. 신규 지역/콘텐츠는 마지막.

## 세션 워크플로
"새 아트 왔어 → 파이프라인 → 검증 → 커밋" 순으로. 큰 변경 전 `git commit`. 게임 확인은 `python3 -m http.server`로 로컬 프리뷰(브라우저 자동화 MCP가 있으면 스크린샷 검증).
