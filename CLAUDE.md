# 정령의 숲 (Spirit Grove 3D) — 프로젝트 가이드

이 파일은 Claude Code가 매 세션 자동으로 읽는 프로젝트 지침이야. (예전 `작업_인수인계.md`를 대체)

## 개요
- 크리처 수집형 RPG. 렌더러는 **Map2D**(활성) / Map3D(비활성). 전투는 DOM UI.
- 아트는 **외부에서 생성**(ChatGPT 등) → PNG를 `art_inbox/`에 넣으면 파이프라인이 배경제거·정렬·저장.

## 아키텍처 (에셋 분리됨)
편집은 `src/` + `assets/`에서, 배포는 인라인 번들 한 파일(`dist/`)로.

| 경로 | 역할 |
|------|------|
| `src/index.html` | **편집용 소스 (~440KB)**. DEX·MOVES·전투·맵·UI 전부. 아트 자리에는 주입 마커(`//@@PAINT_ART@@` 등)만. |
| `assets/art/creatures/<id>.webp` | 크리처 아트 86종 (진짜 이미지 파일, 바로 열어볼 수 있음) |
| `assets/art/hero/<0-3>.webp`, `hero_back/<0-3>.webp` | 주인공 4명 앞/뒤 |
| `assets/vendor/` | three.js, bundled_art.js (원문 그대로, 편집 대상 아님) |
| `assets/manifest.json` | 번들에 넣을 크리처 id 순서. **새 종 추가 시 여기에도 추가해야 함** |
| `dist/spirit_grove_3d.html` | 빌드 결과물 (~4.7MB). 브라우저로 여는 건 이 파일. 직접 편집 금지 — 다음 빌드에 덮인다. |

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
- **three.js 무결성**: `grep -c "^<script>/\*\*"` → 반드시 **1**.
- **JS 문법**: 2번째 `<script>` 블록 추출 → `node --check`.
- **PAINT_ART/DEX 대조**: DEX 종수 == PAINT_ART 종수, 누락/중복 0.
- ⚠️ **dist**는 거대한 base64 줄이 있으니 **흔한 단어로 grep 금지**. 정확한 앵커로만. (src/index.html은 440KB라 자유롭게 grep 가능)

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
1. ~~아키텍처 분리~~ ✅ 완료 (src 440KB + assets + dist 빌드).
2. **다음**: 온보딩/튜토리얼, 게임필 폴리시, 목표 루프+난이도, 오디오.
3. 신규 지역/콘텐츠는 마지막.

### 남은 다이어트 여지 (선택)
- `assets/vendor/bundled_art.js` (616KB): 86종 전부 PAINT_ART로 덮여 `creatureVisual`이 절대 도달하지 않는 죽은 폴백. 빼면 dist가 616KB 줄어든다.
- `assets/vendor/three.min.js` (589KB): Map3D는 모든 진입 경로가 `Field=Map2D`로 덮어써서 사실상 도달 불가. Map3D를 걷어내면 589KB 추가 절감.

## 세션 워크플로
"새 아트 왔어 → 파이프라인 → 빌드 → 검증 → 커밋" 순으로. 큰 변경 전 `git commit`. 게임 확인은 `python3 -m http.server`로 `dist/spirit_grove_3d.html` 로컬 프리뷰(브라우저 자동화 MCP가 있으면 스크린샷 검증).
