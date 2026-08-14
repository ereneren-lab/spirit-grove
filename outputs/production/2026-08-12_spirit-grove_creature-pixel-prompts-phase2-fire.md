# 정령 픽셀 아트 생성 프롬프트 — Phase 2 · fire 배치 (11종)

작성 2026-08-12 · 규격: `2026-08-12_spirit-grove_creature-pixel-style-bible.md` · 형식: `2026-08-12_spirit-grove_creature-pixel-prompts-phase1.md` 프롬프트 문서와 동일
반입 순서: **① `art_inbox/creatures/`에 파일명=id로 넣고 → `python3 scripts/make_creature_art.py` → `python3 scripts/build.py`**

대상 = fire 타입 잔여 11종(재설계 없음, 원본 그림에 충실). `foxfire`/`emberwolf`/`blazelion`(파라꼬 라인)은 Phase 1에서 이미 완료했으므로 이 문서에서 제외한다.

> 각 종의 색·형태 묘사는 `assets/art/creatures/{id}.webp`(= `art_inbox/creatures_src/{id}.webp`와 동일 원본)를 **직접 열어 보고** 추출했다.
> 목표는 "새 정령"이 아니라 **"같은 정령의 픽셀 버전"** — 원종을 알아볼 수 있어야 한다.
> 공통 프리픽스·공통 네거티브는 Phase 1 문서 §1·§2와 **완전히 동일**하다. 아래 코드펜스의 `[공통 프리픽스]` `[공통 네거티브]`는 그 문서를 그대로 참조하라(본문 재작성 금지 — 중복 방지).

---

## 0. 반입 순서 (생성 후)

```
① 생성 → art_inbox/creatures/{id}.png   (파일명 = 아래 각 항목의 id)
② python3 scripts/make_creature_art.py         # Phase 1에서 확정된 size/colors 값 그대로 적용
③ python3 scripts/build.py
④ 전투/도감 스크린샷으로 기존 12종·주인공·NPC와 같은 화면에서 화풍 확증
```

---

## 1. 🔥 냥불 라인 (fire) — 계승: **주황(#f4832e 계열)+크림 팔레트 + 머리 위 불꽃 벼슬·꼬리끝 불꽃 모티프**

`foxfire`/`emberwolf`/`blazelion`(파라꼬 라인)과는 다른 별도 고양이과 라인이다. 원본은 이미 통일된 주황+크림 팔레트를 쓰고 있어 계승이 쉽다. 2단에서 검은 호랑이 줄무늬가 새로 들어가지만 주황+크림 바탕과 불꽃 모티프는 그대로 이어진다.

#### `cindercat` — 냥불 (1단, 재 속에서 뒹구는 아기 고양이)
```
[공통 프리픽스]
A tiny cute kitten made of embers. Bright orange fur (#f4832e-ish), cream-white
inner ears, muzzle, chest and paw tips, a small hard-edged flame tuft on top of the
head (orange-to-yellow, 2-3 shade steps), a few tiny dark ember freckle dots on the
cheeks, big round amber eyes, open fanged smile. Bushy tail tipped with a pointed
hard-edged flame (orange to yellow). Standing/walking pose, plump and round. Reads
adorable and warm.
```

#### `tigerflame` — 냥호 (2단, 줄무늬가 달아오르는 맹화범)
```
[공통 프리픽스]
A bold young fire tiger cub, larger and more athletic than the kitten form. Orange
fur (same #f4832e-ish family) with bold hard-edged BLACK tiger stripes across the
back, legs and tail, cream-white muzzle, chest, belly and paws. A hard-edged flame
mane/tuft on the head continuing the kitten's head-flame, tail still tipped with a
pointed orange-to-yellow flame. Amber-gold eyes with a fierce narrowed brow, mid-
pounce dynamic pose, mouth open in a snarl. Same orange+cream+flame family as
cindercat, now with black tiger stripes added and a stockier, fiercer silhouette.
```

---

## 2. 🔥 불씨늑대 라인 (fire) — 계승: **차콜(짙은 회흑색)+주황-빨강 불꽃 반점/갈기 모티프**

늑대 라인. 1단은 몸의 극히 일부에만 불씨가 있고, 3단(중간 단계 없이 바로 진화)은 그 불씨가 몸 전체로 번져 거대한 갈기·꼬리 불꽃이 된다. 어두운 차콜 바탕은 라인 전체에서 고정.

#### `cindercub` — 불씨늑대 (1단, 목덜미에 불씨가 반짝이는 강아지)
```
[공통 프리픽스]
A tiny cute wolf pup with charcoal-black fur (#241f1c-ish). Hard-edged orange-to-red
flame markings limited to a forehead streak and the inner ears, glowing orange-red
eyes, a bushy tail tipped with a small pointed flame (orange-to-yellow gradient in
flat color steps), pale cream paw pads. Standing pose, round and fluffy, looks a
little timid. Small amount of flame — most of the body is plain dark fur.
```

#### `pyrewolf` — 화염랑 (3단, 갈기가 길게 나부끼는 큰불늑대)
```
[공통 프리픽스]
A large fierce fire wolf, the grown form of the ember pup. Charcoal-black fur (same
#241f1c-ish family) now covered in hard-edged orange-to-red flame streak patterns
spreading across the chest, shoulders, back and legs — the same flame markings from
the pup, now multiplied and enlarged. A huge blazing mane of hard-edged flame
(orange to yellow) around the head and neck, and multiple long flame wisps
streaming from the tail. Glowing red-orange eyes, bared fangs, sturdy aggressive
standing pose, bright orange-yellow claws. Same charcoal + orange-red flame family
as the pup, now flame-dominant instead of flame-accented.
```

---

## 3. 🔥 불티나방 라인 (fire → **bug/flying**) — 계승: **주황빛 몸통 + 깃털형(불꽃형) 더듬이 + 나방 날개 모티프**

> ⚠️ 신규 타입 단서(스타일 바이블 §4-2): `emberfly`는 이제 **fire/bug** — 곤충 요소(더듬이·겹눈·마디진 다리·날개맥)를 또렷하게. `pyrmoth`는 **fire/flying** 성체 — 크고 위압적인 날개로 비행형임을 분명히.

#### `emberfly` — 불티나방 (1단, 불티를 흩날리는 솜털 유충, fire/bug)
```
[공통 프리픽스]
A tiny fluffy fire-bug creature. Round puffball body shading from orange
(#ff8a2e-ish) core to pale cream-yellow fluff tips, two long feather-shaped
antennae in an orange-to-red flame gradient rising from the head (read clearly as
INSECT ANTENNAE, not hair), a pair of small butterfly-moth wings folded/spread
behind the body in orange-yellow with hard-edged wing-vein lines, big round amber-
brown eyes rendered with a faceted compound-eye highlight to sell the bug type,
small dark jointed insect limbs/claws at the sides, tiny blush cheek dots, open
happy mouth. Small hovering pose. Reads as an insect larva/nymph, not a mammal —
NO fur texture, keep the body smooth-puffy like an insect thorax.
```

#### `pyrmoth` — 화염나방 (3단, 거대한 화산 날개를 펴는 성체 나방, fire/flying)
```
[공통 프리픽스]
A large majestic fire moth, the adult form of the fire-bug — clearly built for
flight. Big fanned wings dominate the silhouette: dark charcoal (#241f1c-ish) wing
base with hard-edged molten orange-red circular eye-spot markings (bright
#ff5a1f-ish core, #ffce54-ish ring, NOT a glow) and fiery orange wing edges with
visible vein lines. A fluffy cream-white ruff of fur/fluff around the face
(carried over from the puffball body of stage 1), the same flame-gradient feather
antennae now larger and more pronounced, fierce amber eyes, a dark segmented
insect thorax/body between the wings, and a long flame-tipped abdomen trailing
below (orange-to-red flame, hard-edged). Wings spread wide and readable at a
glance as a flying-type insect. Same orange+cream identity as stage 1, now
dominated by dark charcoal wings with molten eye-spots.
```

---

## 4. 🔥 용암구리 라인 (fire → **rock/ground**) — 계승: **차콜 암석 플레이트 + 주황-빨강 마그마 균열 모티프**

바위(1단)에서 육중한 지상형 용(3단)으로 커지는 라인. 몸을 덮은 각진 암석 판과 그 틈으로 빛나는 마그마 균열이 라인 전체의 시그니처.

#### `lavakit` — 마그구리 (1단, 몸의 틈으로 용암이 비치는 돌덩이, fire/rock)
```
[공통 프리픽스]
A small round rock-boulder creature. Dark grey-charcoal stone-plate body
(#3a332e-ish) made of angular jagged rock chunks stacked over the back like a
shell, hard-edged glowing orange-red magma cracks running between the rock plates
(#ff5a1f-ish, flat color, not a glow effect), a cream-tan round face patch
(#e8c39a-ish) with big round amber eyes and a small open smile, stubby stone legs
with a warm orange glow at the feet. Sitting/standing pose, chunky and round.
```

#### `magmadon` — 마그마룡 (3단, 등이 갈라져 마그마가 끓는 화산룡, fire/ground)
```
[공통 프리픽스]
A large heavy quadruped lava dragon, the grown form of the rock-boulder — planted
firmly on four sturdy clawed legs to read as a ground-type (NOT airborne, no
wings). Dark charcoal rock-plate armor (same #2b2622-ish family as the boulder
form) covers the back and shoulders in tall jagged spikes continuing the stacked-
rock silhouette of stage 1, with hard-edged glowing orange-red magma cracks
running across the body and a bright molten chest/belly plate (#ff5a1f-ish core).
A single round glowing orange eye per side (#ffb23c-ish, flat color with one hard
highlight dot), a spiky flame-tipped tail, bright orange claws. Heavy grounded
stance, low center of gravity. Same charcoal-rock + magma-crack family as lavakit,
now a towering armored quadruped instead of a small round boulder.
```

---

## 5. 🔥 단독종 3종 — 계승 없음(각 1종), 원본 정체성만 유지

라인이 아니므로 "계승 항목"은 없다. 대신 각 종의 원본 색·형태·자세를 그대로 픽셀로 옮긴다.

#### `emberdrake` — 마그룡 (단일종, fire/dragon)
```
[공통 프리픽스]
A small baby dragon. Dark charcoal-black scaled body (#241f1c-ish) with hard-edged
glowing orange-red crack/vein markings across the skin (like cooling magma rock,
flat color steps, not a glow), two flame-shaped horn crests in orange-to-yellow
gradient rising from the forehead, a pair of bat-like wings with dark charcoal
membrane edged in fiery orange-red, round amber eyes, a cream-tan belly patch
(#e8c39a-ish), a short tail tipped with a small pointed flame, four clawed legs
plus wings (biped/quadruped hybrid dragon stance), standing pose with wings
slightly spread. Read the DRAGON silhouette clearly — horns, scaled body, wings,
long tail — since this species carries the dragon type visual cue per the style
bible.
```

#### `magmahound` — 마그멍 (단일종, fire)
```
[공통 프리픽스]
A sturdy fire dog. Dark brown-charcoal fur body (#3a2a22-ish) textured with cooled-
lava rock patches, hard-edged glowing orange-red cracks/glow at the chest and
joints (#ff5a1f-ish, flat color), a small flame-shaped tuft between the ears in
orange-to-yellow, warm amber-orange eyes, a cream-tan snout and chest patch
(#e8c39a-ish), a bushy tail tipped with hard-edged orange-yellow flame. Confident
standing pose, sturdy build, calm friendly expression.
```

#### `emberlix` — 불도롱 (단일종, fire)
```
[공통 프리픽스]
A bipedal fire salamander/lizard in a boxer-like fighting stance, one fist raised.
Black skin (#201a17-ish) with bright orange-yellow leopard-style spots
(#ffb23c-ish), a segmented orange-yellow belly and throat (#ffce54-ish, hard-edged
scale-segment lines), three flame-shaped spikes crowning the head in orange-to-
yellow, a long tail ending in a hard-edged pointed flame (orange-to-red), pale
cream claws (#f5ead8-ish), big round amber eyes, open fanged smile. Dynamic
standing fighting pose, one arm cocked back.
```

---

## 6. 받은 뒤 검수 (스타일 바이블 §7 + 이 배치 전용)

- [ ] 스타일 바이블 §7 공통 체크리스트 전부 통과 (투명 배경·그림자 없음·정사각 중앙·3/4 좌측 방향·1px 외곽선·2단 셰이딩·24색 이내)
- [ ] **냥불 라인**: 1→2단이 주황+크림+불꽃 벼슬로 같은 가족인가 (줄무늬는 2단에만 추가되는 것이 맞는 계승인지 확인)
- [ ] **불씨늑대 라인**: 1단(불씨 소량)→3단(불씨 전신 확산)이 같은 차콜+주황-빨강 가족으로 읽히는가
- [ ] **불티나방 라인**: `emberfly`가 포유류 털이 아니라 곤충(더듬이·겹눈·마디다리)로 읽히는가 / `pyrmoth`가 비행형답게 날개가 실루엣을 지배하는가
- [ ] **용암구리 라인**: 1단 돌 실루엣의 암석판+균열이 3단 갑주로 그대로 계승됐는가 / `magmadon`이 지상형답게 4족 접지 자세인가
- [ ] `emberdrake`: 뿔·비늘·날개·긴 꼬리로 dragon 실루엣이 명확한가
- [ ] 원종 대조: `assets/art/creatures/{id}.webp`와 나란히 — 11종 전부 **같은 정령으로 알아보는가**
- [ ] Phase 1 12종 + 이 11종을 한 판에 놓고 — 외곽선 굵기·해상도·팔레트 톤이 통일됐는가

---

## 7. 전제 / 미확정

- **전제**: 원본 그림(`art_inbox/creatures_src/{id}.webp`)에 재설계가 없으므로 색·형태 전부 원본 관찰값을 그대로 썼다. 헥스코드는 원본 이미지에서 육안 추출한 근사값("-ish")이며 파이프라인의 자동 팔레트 정리 단계에서 미세 조정될 수 있다.
- **미확정**: 해상도/색 상한은 Phase 1에서 락된 값(96px·24색 기본)을 그대로 상속한다 — 이 배치에서 별도 튜닝은 하지 않았다. 실물 생성 후 스크린샷에서 Phase 1 12종과 나란히 재확인 필요.
- **판단 근거 표시**: `emberfly`의 "유충/곤충" 인상은 스타일 바이블 §4-2(곤충 요소 명확화 요구)에 따른 해석이며, 원본 자체가 유충 형태로 그려져 있진 않다(원본은 이미 솜털+나비날개 형태). 완전한 재설계가 아니라 **곤충 단서(더듬이·겹눈·마디다리)를 강조하는 수준**으로 절제했다.
