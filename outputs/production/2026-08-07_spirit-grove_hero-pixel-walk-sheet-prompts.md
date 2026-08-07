# 주인공 픽셀 걷기 스프라이트 시트 — 제작 명세 + 생성 프롬프트

작성 2026-08-07 · 대상 `assets/art/hero_sheet/{0,1,2,3}.webp` · **코드는 이미 준비돼 있다**

> 어제 만든 [2026-08-06 문서](2026-08-06_spirit-grove_hero-pixel-art-prompts.md)를 대체한다.
> 정지 이미지 2장 → **걷기 시트 1장**으로 포맷이 바뀌었다.

---

## 1. 시트 규격 (이게 전부다)

**캐릭터 1명 = 시트 1장.** 3열 × 3행 = 9칸, 칸은 정사각.

| | 열 0 **정지** | 열 1 **걸음 A** | 열 2 **걸음 B** |
|---|---|---|---|
| **행 0 — 아래(정면)** | 정면 서 있기 | 왼발 앞 | 오른발 앞 |
| **행 1 — 위(뒷모습)** | 뒤통수 서 있기 | 왼발 앞 | 오른발 앞 |
| **행 2 — 옆** | 옆모습 서 있기 | 왼발 앞 | 오른발 앞 |

| 항목 | 값 |
|---|---|
| 칸 크기 | **32 × 32 px** → 시트 전체 **96 × 96 px** |
| 파일 | `assets/art/hero_sheet/0.webp` (리오) `1`(미나) `2`(토리) `3`(엘) |
| 배경 | **완전 투명** |
| 그림자 | **없음** (코드가 타원 그림자를 그린다) |
| 발 위치 | 각 칸 **아래 끝에 발바닥**이 닿게 (칸마다 개별로) |
| 옆모습 방향 | **오른쪽을 본다** — 왼쪽 이동은 코드가 좌우 반전한다 |

⚠️ **칸 크기는 이미지 폭 ÷ 3으로 잰다.** 48×48 칸(시트 144×144)도 그대로 돌아간다.
다만 화면에 64px로 그려지므로 32가 가장 또렷하다.

⚠️ **재생 순서는 [정지 → A → 정지 → B]**, 초당 8위상이다. 걸음 사이에 정지가 끼어야 걷는 것처럼 보인다.
이 박자는 기존 절차적 워커와 같은 값이라, 아트가 빠져도 걸음 속도가 안 바뀐다.

⚠️ **A와 B는 좌우 대칭이 되게** 그릴 것(A=왼발 앞, B=오른발 앞). 둘이 같으면 제자리걸음처럼 보인다.

---

## 2. 프롬프트

### 2-1. 공통 프리픽스 (4장 전부 앞에 붙인다)

```
A 3x3 pixel art sprite sheet for a top-down 2D JRPG overworld character, GBA-era style.
The sheet is exactly 96x96 pixels: 9 cells in a 3x3 grid, each cell exactly 32x32 pixels.
COLUMNS are animation frames: column 1 = standing idle, column 2 = walk step with the
LEFT foot forward, column 3 = walk step with the RIGHT foot forward.
ROWS are facing directions: row 1 = facing the viewer (front), row 2 = facing away
(back of the head, no face), row 3 = side view facing RIGHT.
Same character in every cell — identical height, palette, outfit and proportions.
Chunky readable silhouette, big head, 3-head-tall chibi proportions.
Hard 1px dark outline, flat cel shading with at most two shade steps per material,
limited palette of 12-16 colors, NO anti-aliasing, NO gradients.
Crisp square pixels aligned to the 32x32 grid, cells perfectly aligned, no gutters.
Fully transparent background — no backdrop, no frame, no grid lines, no ground shadow.
In every cell the character's feet touch the bottom edge of that cell, centered.
```

### 2-2. 공통 네거티브

```
anime illustration, painted, watercolor, soft shading, blurry, anti-aliased edges,
3D render, drop shadow, ground shadow, background plate, sticker, white border,
grid lines, cell borders, labels, text, watermark, different characters per cell,
inconsistent size between cells, cropped feet, floating pose, high resolution smooth art
```

### 2-3. 캐릭터별

색은 게임 데이터 `CHARS`의 실제 hex다. **바꾸면 캐릭터 선택 화면의 절차적 미리보기와 어긋난다.**

#### `hero_sheet/0.webp` — 연구원 리오
```
[공통 프리픽스]
A young researcher boy with light warm skin (#e8b88a) and near-black messy hair (#2a2a33).
Deep teal-blue travel cloak (#3d6e8a) with a steel-blue hood worn DOWN on the shoulders
(#4a6f8a), brown leather satchel on his back (#6e4a32), dark navy boots (#2c3a4a).
Calm curious expression with two dark pixel eyes in the front row.
```

#### `hero_sheet/1.webp` — 여행자 미나
```
[공통 프리픽스]
A young traveler girl with fair skin (#f0c49a) and auburn red hair (#9a3b2a) in a short braid.
Red brimmed travel cap (#e14b4b), blue traveler's cape (#355a8a), brown backpack (#5a3c28),
dark slate-blue boots (#33405a). Bright confident expression in the front row.
The braid is visible from behind in the back row.
```

#### `hero_sheet/2.webp` — 소년 토리
```
[공통 프리픽스]
A cheerful young boy with light warm skin (#e8b88a) and dark brown hair (#3a2a1a).
Amber-orange cap (#e8a13c), forest-green jacket (#4a7a48), tan-brown backpack (#6e5232),
dark olive boots (#394a2c). Energetic grin in the front row.
The cap's back and the backpack are prominent in the back row.
```

#### `hero_sheet/3.webp` — 숲의 아이 엘
```
[공통 프리픽스]
A mysterious forest child with pale warm skin (#d8c0a0) and pale mint-green hair (#a8d490).
Deep green forest cloak (#3a7a5a) with the hood worn UP over the head (#4a8a6a),
mossy green pouch (#4a5a3a), dark green boots (#2c4a3a). Quiet, slightly otherworldly
expression in the front row. Small leaf motif on the cloak hem.
```

---

## 3. ⚠️ 생성기가 거의 확실히 실패하는 것들

이건 비관이 아니라 실측 기반 경고다. 어제 받은 시트도 **투명 배경은 지켰지만 픽셀 격자는 전혀 못 맞췄다**
(고유색 331,434개 = 페인터리 일러스트). 시트 + 애니 프레임은 난이도가 한 단계 더 높다.

| 실패 항목 | 증상 | 대응 |
|---|---|---|
| **32px 격자** | 부드러운 일러스트로 나온다 | Aseprite 등에서 다운샘플 + 팔레트 축소 |
| **칸 정렬** | 9칸이 균등하지 않다 | 칸을 하나씩 잘라 96×96으로 재조립 |
| **프레임 일관성** | 칸마다 키·색·옷이 미묘하게 다르다 | **가장 안 되는 부분.** 아래 「대안」 참조 |
| **걸음 A/B 구분** | 두 걸음이 똑같다 | 정지 칸을 복사해 다리만 손으로 옮기는 게 빠르다 |

### 대안 — 프레임 일관성이 안 나오면
**정지 3방향(3칸)만 좋은 걸로 뽑고, 걸음 A/B는 그 칸에서 파생시킨다.**
32×32에서 걷기는 보통 **다리 픽셀 2~3줄만 좌우로 옮기고 몸통을 1px 올리는** 정도다.
픽셀 에디터로 칸당 몇 분이면 되고, 생성기로 일관성을 맞추려 씨름하는 것보다 훨씬 빠르고 결과도 낫다.

⚠️ **그래도 안 되면 정지 칸 3개만 채워도 게임은 돈다** — 걸음 칸이 정지와 같으면 애니만 없을 뿐
방향별 스프라이트는 정상 동작한다. 단계적으로 올릴 수 있다.

---

## 4. 넣는 방법

```bash
# 1) 파일을 넣는다
mkdir -p assets/art/hero_sheet     # 0.webp 1.webp 2.webp 3.webp

# 2) manifest에 등록한다 (이게 없으면 빌드가 시트를 안 싣는다)
python3 - <<'EOF'
import json; p="assets/manifest.json"; m=json.load(open(p))
m["hero_sheet"]=["0","1","2","3"]
json.dump(m, open(p,"w"), ensure_ascii=False, indent=1)
EOF

# 3) 빌드 + 검증
python3 scripts/build.py
node scripts/rules_unit_test.js | sed -n '/주인공/,/^$/p'
node scripts/hero_sheet_test.js dist/spirit_grove_3d.html
node scripts/screenshot.js dist/spirit_grove_3d.html /tmp/shots     # 눈으로 확인
```

⚠️ **시트가 3×3 정사각이 아니면 코드가 시트로 안 쓰고 조용히 예전 정지 이미지로 폴백한다.**
"넣었는데 아무 변화가 없다" 싶으면 시트 크기가 3의 배수이고 폭=높이인지 먼저 확인할 것.

---

## 5. 검수 체크리스트

- [ ] 시트가 정확히 96×96 (또는 3의 배수 정사각)
- [ ] 배경 완전 투명 · 격자선/테두리 없음
- [ ] 9칸 전부 **같은 인물**로 보임 (키·색·옷)
- [ ] 각 칸에서 발바닥이 칸 아래 끝에 닿음
- [ ] 행2(옆)가 **오른쪽**을 봄
- [ ] 걸음 A와 B의 다리가 **서로 반대**
- [ ] 행1(뒤)에 얼굴이 안 보임
- [ ] 게임에서 걸어보며 상하좌우 전부 확인 (`hero_sheet_test`가 자동으로도 잡는다)

---

## 6. 전제 / 미확정

- **전제**: 정령 86종은 **그대로 페인터리로 둔다.** 오버월드는 픽셀, 전투는 페인터리로 층이 갈린다.
  ⚠️ 주인공 뒤를 **항상 따라다니는 팔로워 정령**(`follower:"all"`이 기본)은 페인터리라,
  주인공을 픽셀로 만들면 **그 둘이 어긋난다.** NPC와는 맞아지지만 팔로워와는 멀어진다 — 맞바꿈이다.
  실제로 걸어보고 거슬리면 팔로워를 끄는 설정(`CONFIG.follower`)이 이미 있다.
- **미확정**: 픽셀 스프라이트는 **64px**로 그려진다(타일 77px보다 작다). GBA풍에 맞지만
  더 크게 하려면 `heroDrawSpec`의 내림을 바꿔야 하고, 그러면 뷰포트별로 크기가 튄다.
- **미확정**: 캐릭터 선택 화면 미리보기는 시트를 **아직 안 쓴다**(정지 이미지/절차적 워커를 쓴다).
  시트가 들어오면 선택 화면도 시트 0행 0열을 쓰도록 바꾸는 게 자연스럽다 — 아트 확정 후 처리.
