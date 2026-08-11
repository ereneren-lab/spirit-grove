# 지형지물 아트 — 4차 발주안 (건물 7 + 오브젝트 6)

작성 2026-08-11 · 상태 **아트 대기 · 코드 미착수**

유저: *"지형지물도 이미지 필요하면 이야기해."*

---

## 0. 왜 지금인가 — 격차가 인물에서 지형으로 옮겨갔다

08-11에 인물이 전부 픽셀 시트가 됐다(야외 47/47 + 실내·특수 8/8 · 시트 32종).
**남은 절차적 그림은 이제 지형지물뿐이다.** 원래 유저가 지적한 이질감("주인공들 너무 이질감 들어")이
같은 형태로 지형에 남아 있다 — 손으로 그린 인물 옆에 도형으로 그린 집이 서 있다.

📌 **그런데 인물과 성격이 다르다.** 인물은 "한 장 받으면 코드 수정 0"이었는데 지형은 아니다.

| | 인물 (1~3차) | 지형 |
|---|---|---|
| 규격 | 3자세 한 장 | **건물·오브젝트는 한 장** / **바닥은 이어붙임(seamless)** |
| 변형 | 없음 | 바닥은 오토타일 모서리 13~47종 |
| 코드 | 이미 완성돼 있었다 | **분기를 새로 넣어야 한다** (§3) |
| 폴백 | 있다(절차적) | 만들면 있다 — 같은 방식으로 짠다 |

---

## 1. ⛔ 이번에 **안 하는 것** — 바닥 타일셋

**바닥(풀·길·물)은 발주하지 않는다.** 이유가 셋이다.

1. **지역이 7개다**(마을·초원·숲·깊은 숲·수정 호수·고원·제단). 지역마다 바닥 팔레트가 다르다.
2. **`Map2D._gcol`이 지역 경계 4칸을 색으로 블렌딩한다.** 이미지로 바꾸면 이 구조를 통째로 버리고
   경계마다 하드 컷이 생긴다 — 07-28에 *"맵이 너무 타일처럼"* 이라고 지적받아 넣은 장치다.
3. **오토타일**(`_autoPath`)이 이웃을 보고 모서리를 깎는다. 이미지로 하려면 모서리 조합을 전부 받아야 한다.

→ 바닥은 **지금 구조가 더 낫다.** 정말 하고 싶으면 지역 하나(마을)만 시험용으로 따로 논의한다.

---

## 2. 발주 — 무엇을 받나

### 2-A. 건물 7종 (1순위)

타일 문자는 `DOOR_TILES="+EHGUSX"` 가 **단일 출처**다.

| 타일 | 무엇 | 지금 색 (그대로 유지할 것) |
|---|---|---|
| `+` | **정령센터** | 흰 벽 · **붉은 지붕** · 흰 십자 |
| `S` | **상점** | 나무 상자색 벽 · 노란 띠 |
| `E` | **회관** (감정·개명·안마) | 크림 벽 · **파란 지붕** · 금색 띠 |
| `G` | **체육관** (4곳) | **보라 계열** |
| `U` | **도장** | 짙은 보라 · 뾰족 지붕 |
| `H` | **출신지 집** (4곳) | 붉은 지붕 · 작은 집 |
| `X` | **제단** | 어두운 보라 · 돌 |

⚠️ **색을 바꾸지 말 것.** 미니맵(`drawTopo`)이 **같은 색을 따로 칠한다**(`t==="+"→#e8524e` 등).
   아트만 바꾸면 지도와 실제가 어긋난다. 색을 바꾸려면 미니맵 표도 같이 고쳐야 한다.

### 2-B. 오브젝트 6종 (2순위)

배경이 아니라 **위에 얹는 물체**라 이어붙임 걱정이 없다.

| 타일 | 무엇 | 비고 |
|---|---|---|
| `x` | **작은 나무** | ⚠️ **'자르기'로 베는 대상**이다. 벨 수 있어 보여야 한다 |
| `o` | **바위** | ⚠️ **'괴력'으로 미는 대상**. 밀 수 있어 보여야 한다 |
| `P` | **팻말** | |
| `R` | **모닥불** | 회복 지점. 불은 코드가 애니메이션한다 → **불꽃 없이 장작만** 그릴 것 |
| `T` | **긴 풀숲** | ⚠️ 여러 칸이 붙어 깔린다 → **한 장을 반복해도 티가 덜 나는** 형태로 |
| — | **큰 나무** | 숲 캐노피. 지역마다 색이 다르니 **무채색에 가깝게**(코드가 지역색을 얹는다) |

---

## 3. 규격 — 인물과 다른 점만

```
배경     완전 투명
그림자   그리지 말 것 — 게임이 타원 그림자를 따로 그린다
캔버스   정사각 1장 (자세 3개가 아니다 — 건물은 방향이 없다)
접지선   물체의 **밑면이 캔버스 아래 92%** 에 오도록. 아래 8%는 비운다
정면     문은 **아래쪽 중앙**에 그릴 것
```

⚠️ **위로 크게 그리지 말 것 — 이게 이 발주의 가장 중요한 제약이다.**
건물은 `_k=1.45` 배 좌표계에 **접지선을 고정한 채** 그려진다(07-28 작업).
그때 실측한 것: **문 20곳 중 16곳은 바로 위 칸이 걸을 수 있는 풀밭**이다.
지붕이 위로 뻗으면 **갈 수 있는 칸을 덮어 "막힌 것처럼" 보인다.** 그래서 07-28에도
"위로 늘려 키우지 말고 접지선을 고정한 채 좌표계만 확대"로 갔다.
→ **건물 높이는 캔버스의 위쪽 5% 안쪽까지만.** 첨탑·굴뚝을 길게 뽑지 말 것.

⚠️ **문 앞 신호와 겹치지 말 것.** `Map2D._doorFx`가 문틀·손잡이·문등과
**정면 칸의 발판·위 화살표**를 따로 그린다. 그림에 발판이나 화살표를 넣으면 이중이 된다.

---

## 4. 코드에 필요한 작업 (아트가 오기 전에 미리 할 수 있다)

인물 때와 같은 구조로 간다. **아트가 없으면 지금 절차적 그림으로 폴백**한다.

1. `assets/art/terrain/<타일이름>.webp` — 파일 이름은 타일 문자를 못 쓴다(`+`·`$` 등).
   → `center` `shop` `hall` `gym` `dojo` `home` `altar` / `tree_s` `rock` `sign` `campfire` `tallgrass` `tree_l`
   **타일 문자 ↔ 이름 표를 한 곳에** 둔다(`TERRAIN_ART_ID`). 두 벌이 되면 갈라진다.
2. `build.py`에 `terrain` 임베딩 — manifest에 없으면 빈 객체(빌드 안 깨짐).
3. `Map2D`의 타일 그리기 **맨 앞**에 시트 분기 하나. ⚠️ **한 곳에만 둔다** —
   지금 `t==="o"` 같은 가지가 실외·실내·미니맵에 **각각 있다**(실측 3곳). 가지마다 넣으면 반드시 하나를 빠뜨린다.
4. 회귀 `terrain_art_test` — 인물의 `npc_sheet_test`와 같은 방식:
   아트 없을 때 폴백 · 주입하면 실제로 `drawImage` · **실린 아트가 전부 디코드되는지**(`[5]`와 같은 단정) ·
   ⚠️ **미니맵 색과 아트가 어긋나지 않는지**(§2-A의 함정).

📌 **아트 없이 코드부터 넣어도 된다.** 1~3차가 그렇게 했고, 그래서 그림이 도착한 날 바로 붙었다.

---

## 5. 프롬프트

### 공통 프리픽스 (13장 전부 앞에 붙인다)

```
A single top-down 2D pixel-art RPG map object, drawn from a slightly high front angle
(three-quarter top-down, the same viewpoint as classic 16-bit RPG overworld maps).
Chunky readable pixel art, limited palette, crisp hard pixel edges, no anti-aliasing.
The object sits flat on the ground with its base at the bottom of the frame.
Fully transparent background. No ground shadow, no grass, no terrain, no base plate,
no frame, no text, no labels. Centered, filling the frame horizontally.
```

### 공통 네거티브

```
anti-aliasing, blurry, soft gradients, painterly, 3D render, photo, isometric,
background, ground, grass patch, terrain, base plate, ground shadow, drop shadow,
frame, text, watermark, multiple objects, cropped, tall spire, chimney
```

⚠️ 대조표 한 장에 **건물 7종**, 다른 한 장에 **오브젝트 6종**으로 나눠 받는다.
   자세가 1개뿐이라 인물보다 여유가 있지만 **13개를 한 장에 몰지 말 것**(1차 12장이 상한선이었다).

---

### 5-1. 건물

**① `center` — 정령센터** *(타일 `+`)*
```
A small friendly clinic building with white plaster walls and a bright red roof,
a large white cross on the roof front, a wooden double door centered at the bottom,
two small square windows flanking the door. Wide and low, not tall.
```

**② `shop` — 상점** *(타일 `S`)*
```
A small general store with warm timber walls and a flat awning over the front,
a yellow signboard band across the facade, a wooden door centered at the bottom,
crates stacked beside the entrance. Wide and low, not tall.
```

**③ `hall` — 회관** *(타일 `E`)*
```
A civic hall with cream plaster walls and a blue tiled roof, a gold trim band
across the facade, a wide arched door centered at the bottom, two lantern sconces
on either side of the door. Wide and low, not tall.
```

**④ `gym` — 체육관** *(타일 `G`)*
```
A sturdy training hall with deep violet stone walls and a darker slate roof,
a banner hanging above the wide door centered at the bottom,
two stone pillars framing the entrance. Broad and imposing, but low.
```

**⑤ `dojo` — 도장** *(타일 `U`)*
```
A martial arts dojo with dark violet timber walls and a steep tiled roof with
upturned eaves, sliding paper doors centered at the bottom,
a small hanging plaque above the doors. Wide and low, not tall.
```

**⑥ `home` — 출신지 집** *(타일 `H`)*
```
A small cottage with warm cream walls and a red tiled roof, a single wooden door
centered at the bottom, one round window, a flower box under the window.
Cozy and small.
```

**⑦ `altar` — 제단** *(타일 `X`)*
```
An ancient stone shrine of dark violet weathered rock, a carved archway opening
centered at the bottom, glowing runes along the stones, moss in the cracks.
Broad and low, worn by age.
```

---

### 5-2. 오브젝트

**⑧ `tree_s` — 작은 나무** *(타일 `x` · '자르기' 대상)*
```
A small slender sapling tree with a thin trunk and a compact round canopy,
low enough that it clearly blocks a path rather than towering over it.
Muted natural green.
```

**⑨ `rock` — 바위** *(타일 `o` · '괴력' 대상)*
```
A single rounded boulder of grey stone with flat facets and a few chips,
sitting loose on the ground as if it could be pushed. Muted grey, no moss.
```

**⑩ `sign` — 팻말** *(타일 `P`)*
```
A wooden signpost: one plank board on a single post, blank face with a wood grain,
a small peaked cap on top of the board.
```

**⑪ `campfire` — 모닥불** *(타일 `R`)*
```
A campfire pit: a ring of small stones with charred logs stacked inside.
NO flames and no smoke — only the stones and the logs.
```

**⑫ `tallgrass` — 긴 풀숲** *(타일 `T`)*
```
A dense clump of tall grass blades filling the frame edge to edge,
irregular blade heights, no distinct silhouette or outline on the outer edges
so that several copies placed side by side read as one continuous field.
Muted natural green.
```

**⑬ `tree_l` — 큰 나무** *(숲 캐노피)*
```
A large broadleaf tree seen from a high angle, thick trunk and a wide layered canopy,
canopy drawn in near-neutral desaturated green so a colour tint can be applied later.
Round and full, wider than tall.
```

> 🔴 **여기 틀린 말이 있었다** (2026-08-11 정정). *"코드가 지역 색을 얹는다"* 고 적었는데
> **아트 경로는 틴트를 하지 않는다** — 그림을 그대로 그리고 반환한다.
> NPC 시트 때 §0에 적었던 것과 **똑같은 착각**이다(계획을 구현으로 읽었다).
>
> `REGIONPAL`의 `t0`/`t1`/`big`은 **절차적 경로에서만** 쓰인다. 그래서 나무·풀숲을 아트로 바꾸면
> **지금 있는 지역별 색이 사라진다**(마을 밝은 초록 / 깊은 숲 짙은 초록 / 고원 올리브 / 제단 보라).
>
> 선택지 셋 — 유저 결정 대기:
> 1. **그대로 간다** — 전 지역 통일. 무채색 원본이면 그나마 덜 튄다
> 2. **틴트를 코드로 넣는다** — 오프스크린에 그려 지역색을 곱연산으로 얹고 캐시. `tree_s`·`tallgrass`·`tree_l`
>    3종에만 걸면 된다. 📌 **NPC 때와 달리 조건이 맞는다** — 그때 기각 이유가 "원본이 이미 원색"이었는데
>    이번엔 무채색으로 받는다
> 3. **나무·풀숲은 절차적으로 두고** 바위·팻말·모닥불만 아트로 — 지역색을 지키면서 디테일만 얻는다

⚠️ 그래도 ⑫⑬은 **무채색에 가깝게** 받는다 — 위 2번을 고르면 틴트가 그 위에 얹히고,
   1번을 골라도 무채색이 전 지역에서 가장 덜 튄다.

---

## 6. 확인 체크리스트

- [ ] 배경 알파 0 · **바닥/풀/그림자가 안 그려져 있는가**
- [ ] 물체 밑면이 캔버스 **아래 92%** 에 있는가
- [ ] 건물의 **문이 아래쪽 중앙**인가
- [ ] **위로 뻗은 첨탑·굴뚝이 없는가** (위 칸을 덮는다 — §3)
- [ ] 발판·화살표가 그려져 있지 않은가 (`_doorFx`와 이중이 된다)
- [ ] 건물 색이 §2-A 표와 같은가 (미니맵과 어긋난다)
- [ ] ⑫⑬이 무채색에 가까운가

---

## 7. 미확정 · 유저가 정할 것

1. **건물 7종만 먼저 받을지, 오브젝트까지 한 번에 받을지.** 건물이 가성비가 훨씬 높다.
2. **체육관 4곳을 한 그림으로 쓸지 지역별로 4벌 받을지.** 지금은 한 벌이고, 4벌이면 지역감이 생기지만
   그림이 3장 더 늘고 `GYM_AT` 좌표별 분기가 필요하다.
3. **바닥 타일** — §1의 이유로 이번엔 뺐다. 뒤집을 근거가 생기면 그때.
