# 주인공 픽셀 스프라이트 제작 명세 + 생성 프롬프트

작성 2026-08-06 · 대상 `assets/art/hero/{0..3}.webp` · `assets/art/hero_back/{0..3}.webp`

---

## 1. 왜 이질감이 드는가 (실제 화면에서 확인한 것)

오버월드 한 화면에 **화풍이 네 개** 섞여 있고, 그중 주인공만 밖으로 튄다.

| 요소 | 지금 화풍 | 출처 |
|---|---|---|
| **주인공** | 애니 셀화 일러스트 + **베이지 팔각 배경판** | AI 생성 이미지(`HERO_ART`) |
| NPC·트레이너 | **픽셀/도트풍** | **코드가 그린다**(`trainerSpr` → 색 스펙으로 캔버스에 직접) |
| 정령 86종 | 수채·과슈 페인터리 | AI 생성 이미지(`PAINT_ART`) |
| 가구·아이템 | 플랫 아이콘 / 이모지 | 코드·이모지 |

**핵심은 이것이다 — NPC는 이미 픽셀인데 주인공만 일러스트다.** 주인공을 픽셀로 바꾸면
NPC·트레이너와 자동으로 맞는다. 방향이 옳다.

### 지금 아트의 구체적 결함 4가지
1. **배경판이 남아 있다.** `hero/0`·`hero_back/0`에 베이지 팔각 스티커 판이 붙어 있다.
   투명 배경이어야 하는데 판이 타일 위에 흰 사각형처럼 얹힌다.
2. **4종이 서로도 안 맞는다.** `hero/1`(미나)엔 그 판이 없다. 같은 배치에서 나온 그림이 아니다.
3. **발 위치가 안 맞는다.** 코드는 이미지 **아래 끝**을 발바닥으로 보고 거기에 그림자 타원을 그린다
   (`drawImage(img, x, gy-S, S, S)` + `ellipse(hx, gy, …)`). 지금 아트는 아래에 여백이 있어 **떠 보인다.**
4. **그림자가 이중이다.** 코드가 이미 타원 그림자를 그리는데 아트에도 그림자가 들어 있다.

---

## 2. ✅ 코드 준비 — **이미 넣었다** (2026-08-06)

원래 두 가지가 막고 있었다.

**① 캔버스 스무딩이 켜져 있었다.** `imageSmoothingEnabled`가 소스 어디에도 없어 브라우저 기본값 `true`.
픽셀 아트를 그대로 넣으면 보간돼 흐릿해진다.

**② 주인공 그리기 크기가 32의 정수배가 아니었다.** 실측:

| 뷰포트 | 타일 px | 주인공 그리기 px |
|---|---|---|
| 430×760 @2x | 77 | 75 |
| 390×844 @3x | 68 | 67 |
| 768×1024 @2x | 83 | 81 |

32×32 원본을 75px로 늘리면 2.34배라 어떤 도트는 2칸, 어떤 도트는 3칸이 되어 격자가 울퉁불퉁해진다.

### 어떻게 고쳤나 — **원본 크기 하나로 갈린다(플래그 데이 없음)**
둘을 그냥 켜면 **지금의 고해상도 일러스트가 오히려 나빠진다**(스무딩을 끄고 축소하면 거칠어진다).
그래서 `heroDrawSpec(srcW, ts)` 하나가 판단하게 했다(`src/rules/util.js`, DOM 없는 순수 함수):

| 원본 | 크기 | 보간 |
|---|---|---|
| **≤ 64px = 픽셀 스프라이트** | 32의 정수배로 **내림** (실측 대역에서 항상 **64**) | **끔**(최근접) |
| 그보다 크면 = 일러스트 | `ts*0.98` (지금 그대로) | 켬 |

→ **오늘 아무것도 안 바뀌고, 32×32 webp를 넣는 순간 자동으로 픽셀 경로로 넘어간다.**

⚠️ 반올림이 아니라 **내림**이다. 반올림하면 뷰포트에 따라 64↔96을 오가며 크기가 50% 튄다.
내림이면 타일 68~83px 대역 전체에서 64로 안정되고 스프라이트가 타일을 넘지 않는다.

**검증**: `rules_unit_test`에 「주인공 스프라이트 그리기 규격」 8단정 추가(브라우저 없이 돈다).
그리고 32×32 체커보드를 실제로 주입해 그려본 결과 **중간색 0.00%** — 최근접으로 정확히 그려진다.
캐릭터 선택 미리보기(`charPreview`)도 **같은 함수**를 쓴다(따로 계산하면 선택 화면과 실제가 갈린다).

---

## 3. 산출 규격 (생성기에 넣기 전에 확정할 것)

| 항목 | 값 | 이유 |
|---|---|---|
| 논리 해상도 | **32 × 32 px** | GBA 세대 오버월드 스프라이트 대역. 후드·배낭까지 들어간다 |
| 파일 | `hero/{0,1,2,3}.webp` · `hero_back/{0,1,2,3}.webp` | `assets/manifest.json`의 `hero`/`hero_back` 키와 1:1 |
| 배경 | **완전 투명** | 배경판·테두리·스티커 프레임 전부 금지 |
| 그림자 | **없음** | 코드가 타원 그림자를 따로 그린다 |
| 캔버스 | 정사각. **발바닥이 아래 끝에 닿게** | 아래 여백이 있으면 그림자에서 뜬다 |
| 앞모습 방향 | **정면에서 오른쪽으로 살짝 튼 3/4** | ⚠️ 아래 설명 |
| 뒷모습 | 완전한 뒤통수(위쪽 이동용) | |
| 외곽선 | 어두운 단색 1px | NPC 도트와 붙는 요소 |
| 팔레트 | 캐릭터당 **12~16색 이내** | 안티에일리어싱 금지 |

### ⚠️ "오른쪽으로 살짝 튼 정면"이 왜 중요한가
코드가 쓰는 아트는 **딱 2장**이다(앞·뒤). 방향 배정은 이렇다:

- 아래(down) → 앞모습 · 오른쪽(right) → **앞모습 그대로** · 왼쪽(left) → **앞모습 좌우 반전** · 위(up) → 뒷모습

즉 **한 장이 "정면"과 "오른쪽"을 겸한다.** 완전 정면이면 오른쪽으로 걸을 때 옆을 안 보고,
완전 측면이면 아래로 걸을 때 등을 돌린 것처럼 어색하다. **정면 기준에서 몸통과 발끝만 오른쪽으로 15~25° 튼 자세**가 정답이다.
얼굴은 거의 정면을 유지한다.

---

## 4. 프롬프트

### 4-1. 공통 프리픽스 (8장 전부 앞에 붙인다)

```
32x32 pixel art character sprite for a top-down 2D JRPG overworld, GBA-era style.
Single character, full body, standing idle. Chunky readable silhouette, big head,
short 3-head-tall proportions. Hard 1px dark outline, flat cel shading with at most
two shade steps per material, limited palette of 12-16 colors, NO anti-aliasing,
NO gradients, NO dithering on skin. Crisp square pixels aligned to a 32x32 grid.
Fully transparent background — no backdrop, no frame, no sticker border, no card,
no ground shadow, no glow. Character's feet touch the very bottom edge of the canvas,
centered horizontally, no empty margin below.
```

### 4-2. 공통 네거티브

```
anime illustration, painted, watercolor, soft shading, blurry, anti-aliased edges,
3D render, drop shadow, ground shadow, background plate, beige backdrop, sticker,
white border, outline frame, text, watermark, multiple characters, cropped feet,
floating pose, high resolution smooth art
```

### 4-3. 캐릭터별 (색은 게임 데이터 `CHARS`의 실제 hex — 바꾸지 말 것)

#### `hero/0.webp` — 연구원 리오 (앞)
```
[공통 프리픽스]
A young researcher boy. Facing the viewer but body and feet turned about 20 degrees
to the RIGHT. Deep teal-blue hooded travel cloak (#3d6e8a) with a steel-blue hood
worn DOWN on the shoulders (#4a6f8a), light warm skin (#e8b88a), near-black messy
hair (#2a2a33), brown leather satchel on his back (#6e4a32), dark navy boots (#2c3a4a).
Calm curious expression, two dark pixel eyes.
```

#### `hero_back/0.webp` — 연구원 리오 (뒤)
```
[공통 프리픽스]
Same young researcher boy seen from BEHIND, walking away from the viewer.
Back of the deep teal-blue cloak (#3d6e8a), steel-blue hood down on the shoulders
(#4a6f8a), near-black hair from behind (#2a2a33), brown leather satchel prominent
on his back (#6e4a32), dark navy boots (#2c3a4a). No face visible.
```

#### `hero/1.webp` — 여행자 미나 (앞)
```
[공통 프리픽스]
A young traveler girl. Facing the viewer but body and feet turned about 20 degrees
to the RIGHT. Red brimmed travel cap (#e14b4b), auburn red hair (#9a3b2a) in a short
braid, fair skin (#f0c49a), blue traveler's cape (#355a8a), brown backpack (#5a3c28),
dark slate-blue boots (#33405a). Bright confident expression.
```

#### `hero_back/1.webp` — 여행자 미나 (뒤)
```
[공통 프리픽스]
Same traveler girl seen from BEHIND, walking away from the viewer. Back of the red
cap (#e14b4b), auburn braid hanging down (#9a3b2a), blue cape from behind (#355a8a),
brown backpack prominent (#5a3c28), dark slate-blue boots (#33405a). No face visible.
```

#### `hero/2.webp` — 소년 토리 (앞)
```
[공통 프리픽스]
A cheerful young boy. Facing the viewer but body and feet turned about 20 degrees
to the RIGHT. Amber-orange cap (#e8a13c), dark brown hair (#3a2a1a), light warm skin
(#e8b88a), forest-green jacket (#4a7a48), tan-brown backpack (#6e5232), dark olive
boots (#394a2c). Energetic grin.
```

#### `hero_back/2.webp` — 소년 토리 (뒤)
```
[공통 프리픽스]
Same cheerful boy seen from BEHIND, walking away from the viewer. Back of the
amber-orange cap (#e8a13c), dark brown hair (#3a2a1a), forest-green jacket from
behind (#4a7a48), tan-brown backpack prominent (#6e5232), dark olive boots (#394a2c).
No face visible.
```

#### `hero/3.webp` — 숲의 아이 엘 (앞)
```
[공통 프리픽스]
A mysterious forest child. Facing the viewer but body and feet turned about 20 degrees
to the RIGHT. Deep green hooded forest cloak (#3a7a5a) with the hood worn UP over the
head (#4a8a6a), pale warm skin (#d8c0a0), pale mint-green hair (#a8d490) peeking from
under the hood, mossy green pouch (#4a5a3a), dark green boots (#2c4a3a). Quiet,
slightly otherworldly expression. Leaf motif on the cloak hem.
```

#### `hero_back/3.webp` — 숲의 아이 엘 (뒤)
```
[공통 프리픽스]
Same forest child seen from BEHIND, walking away from the viewer. Back of the deep
green hooded cloak with the hood UP (#3a7a5a / #4a8a6a), pale mint-green hair
(#a8d490) showing below the hood, mossy green pouch (#4a5a3a), dark green boots
(#2c4a3a). Leaf motif on the cloak hem. No face visible.
```

---

## 5. 받은 뒤 검수 체크리스트

생성기는 대개 **투명 배경**과 **정확한 32×32 격자**를 못 지킨다. 아래를 눈으로 확인하고,
안 맞으면 픽셀 에디터(Aseprite 등)에서 **다운샘플 + 팔레트 정리**를 한 번 거쳐야 한다.

- [ ] 배경이 완전 투명인가 (배경판·프레임·흰 테두리 없음)
- [ ] 아트 안에 그림자가 없는가 (코드가 그린다)
- [ ] 발바닥이 캔버스 **아래 끝**에 닿는가 (아래 여백 0)
- [ ] 앞모습이 **오른쪽으로 살짝** 틀어져 있는가 (좌우 반전해도 자연스러운가 — 왼쪽 이동에 그대로 쓴다)
- [ ] 앞·뒤 두 장의 **키·색·복장 디테일이 같은 사람**인가
- [ ] 4캐릭터가 **같은 굵기의 외곽선·같은 등신**인가
- [ ] 도트가 격자에 맞는가 (확대해서 반픽셀·흐린 경계 없는지)
- [ ] 색이 `CHARS` hex와 맞는가 — 캐릭터 선택 화면의 절차적 미리보기가 같은 색을 쓴다

교체는 파일만 덮어쓰면 된다(`assets/art/hero/…`). `manifest.json`·`build.py`는 그대로다.
빌드는 `python3 scripts/build.py`.

---

## 6. 전제 / 미확정

- **전제**: "주인공들"은 플레이어 캐릭터 4종을 뜻한다고 봤다. 트레이너·NPC는 이미 코드로 그리는 픽셀이라 손댈 게 없다.
- **전제**: 정령 86종은 **그대로 둔다**. 페인터리 화풍이 전투 화면에서 일관돼 있고, 픽셀로 바꾸면 86장 재제작이다.
  → 그 결과 **오버월드는 픽셀, 전투는 페인터리**로 층이 갈린다. 본가도 비슷한 구조라 어색하지 않다고 판단했지만,
  **정령까지 픽셀로 통일할지는 별개 결정**이다(아트 파이프라인 규모가 완전히 다르다).
- **확정됨**: 픽셀 스프라이트는 **64px로 그려진다**(타일 77px보다 작다). 타일보다 작은 게 GBA풍에 맞다.
  더 크게 보이길 원하면 `heroDrawSpec`의 내림을 반올림으로 바꾸면 96px이 되지만, 뷰포트에 따라 크기가 튄다.
- **대안(아트 0장) — 실제로 만들어 비교했다.** `HERO_ART`를 비우면 코드가 이미 가진 절차적 워커(`_walker`)로
  되돌아간다. 스크린샷으로 확인한 결과 **NPC와 화풍이 정확히 일치하고 배경판·뜸 현상이 즉시 사라진다.**
  다만 디테일이 확연히 적다(후드 실루엣 + 단색 몸통 수준). 빌드도 214KB 가벼워진다.
  → **픽셀 아트를 만들 이유는 "일관성"이 아니라 "일관성 + 디테일"이다.** 일관성만 원하면 오늘 공짜로 얻을 수 있다.
