# 정령 픽셀 아트 생성 프롬프트 — Phase 1 (핵심 12종)

작성 2026-08-12 · 규격: `2026-08-12_spirit-grove_creature-pixel-style-bible.md`
대상 12종 = 스타터 3라인(9) + 초반 야생 3종. **스타일·해상도를 여기서 락한 뒤 나머지 74종으로 확장한다.**

> 각 정령의 색·형태 묘사는 **기존 페인터리 원본(`art_inbox/creatures_src/`)을 직접 보고** 추출했다.
> 목표는 "새 정령"이 아니라 **"같은 정령의 픽셀 버전"** — 원종을 알아볼 수 있어야 한다.

---

## 0. 반입 순서 (생성 후)

```
① 생성 → art_inbox/creatures/{id}.png   (파일명 = 아래 각 항목의 id)
② python3 scripts/make_creature_art.py         # 기본 96px·24색
③ python3 scripts/build.py
④ 전투/도감 스크린샷으로 주인공·NPC와 같은 화면에서 화풍 확증
```

낱장으로 뽑든 대조표 한 장으로 뽑든 무방하다(대조표면 `scripts/split_contact_sheet.py`로 자른 뒤 파일명을 id로).

---

## 1. 공통 프리픽스 (12장 전부 앞에 붙인다)

```
96x96 pixel art creature sprite for a 2D JRPG, GBA / 16-bit era battle sprite look.
Single creature, full body, one idle battle pose, seen in 3/4 view facing slightly
toward the LEFT of the frame. Chunky readable silhouette. Hard 1px dark outline in a
dark shade of the creature's own color, flat cel shading with at most two shade steps
per material and one hard highlight, limited palette of at most 24 colors, NO
anti-aliasing, NO gradients, NO dithering, NO soft glow, NO blur. Crisp square pixels
on a 96x96 grid. Fully transparent background — no backdrop, no frame, no card, no
ground circle, no drop shadow. Creature centered with a small even margin on all sides.
```

## 2. 공통 네거티브

```
painterly, watercolor, gouache, anime illustration, realistic, soft shading, rim light,
glow, bloom, lens flare, translucent particles, blurry, anti-aliased edges, gradient,
3D render, drop shadow, ground shadow, background plate, card frame, sticker border,
glass reflection, text, watermark, signature, multiple creatures, cropped, extra limbs
```

---

## 3. 🔥 파라꼬 라인 (fire) — 계승: **주황+크림 + 불꽃 꼬리/갈기 모티프**

#### `foxfire` — 파라꼬 (1단, 귀여운 여우 새끼)
```
[공통 프리픽스]
A tiny cute fox kit. Bright orange fur (#f08a3c-ish), cream-white muzzle, chest,
inner ears and paw tips, big round amber eyes, tiny fangy open smile. Small tail
tipped with a hard-edged flame (orange to yellow, 2-3 shade steps, pointed pixel
shape). Playful crouched pose. Reads adorable and small.
```

#### `emberwolf` — 파라울 (2단, 날렵한 불여우)
```
[공통 프리픽스]
A sleek adolescent fire fox, larger and leaner than its kit form. Orange fur with a
cream-white underside and chest, a large flame mane of hard-edged fire around the
neck and a big bushy flaming tail (orange-to-yellow flames, solid color blocks).
Amber eyes, confident expression, mid-stride pose. Same orange+cream palette as the
kit, flame motif grown into mane and tail.
```

#### `blazelion` — 파라온 (3단, 위엄 있는 구미호형)
```
[공통 프리픽스]
A majestic regal fire-fox / nine-tail beast. Cream-white body with a flowing orange
flame mane and MULTIPLE flame tails fanning out behind. Gold ankle bands on all four
legs, a small red gem pendant at the chest, subtle golden swirl tribal markings on
the flanks. Amber eyes, calm noble expression, standing tall. Same orange+cream+flame
family as earlier stages, now with gold and red-gem accents and many tails.
```

---

## 4. 💧 무르꼬 라인 (water) — 계승: **하늘색+크림 + 짙은 파랑 무늬 / 물결 모티프**

#### `shellow` — 무르꼬 (1단, 귀여운 아기 거북)
```
[공통 프리픽스]
A tiny cute baby turtle. Light cyan-blue skin with darker blue spots, a cream-tan
belly plastron, a blue segmented dome shell with a hard geometric pattern, big
sparkly blue eyes, small pink cheek blush, cheerful open smile, one little arm raised.
Sitting pose. Reads round and adorable.
```

#### `riverdrake` — 무르롱 (2단, 동양 물 용)
```
[공통 프리픽스]
An elegant serpentine eastern water dragon. Cyan-blue body with a cream-white belly,
a blue mane and fins edged in cream, whisker-like fins by the snout, small horns,
blue eyes, feathery fin-tufts at the legs and tail tip. Coiled flowing S-shaped body.
Same cyan + cream + darker-blue palette as the turtle form.
```

#### `krakentide` — 무르칸 (3단, 왕관 쓴 크라켄)
```
[공통 프리픽스]
A royal deep-blue kraken / octopus. Deep blue body, a crown of water-crest spikes
with cream-tan coral tips on the head, a glowing cyan gem on the forehead (drawn as
a bright cyan block with a white highlight dot, not a glow), blue eyes, thick
tentacles curling like ocean waves with cream foam tips. Imposing wide pose. Blue +
cream family carried from earlier stages, wave/foam motif dialed up.
```

---

## 5. 🌿 새록꼬 라인 (grass) — 계승: **라임그린+크림 + 잎/새싹 모티프 (→ 나무)**

#### `leafdrake` — 새록꼬 (1단, 귀여운 새싹 도마뱀)
```
[공통 프리픽스]
A tiny cute grass dragon / lizard. Lime-green scaly skin with darker green spots, a
two-leaf sprout growing from the top of the head, small leaf-shaped frill wings, a
cream-yellow belly, big green eyes, cheerful open smile, a leaf-tipped tail. Sitting
pose. Reads soft and sprout-like.
```

#### `leafwyrm` — 새록룡 (2단, 잎사귀 뱀 용)
```
[공통 프리픽스]
A serpentine leaf dragon whose body is woven from vines and leaves. Green leafy body
with a cream segmented underbelly, a mane of leaves with small twig antlers, a few
tiny white flowers along the coils, teal-green eyes. Coiled S-shaped pose. Same
lime-green + cream palette as the sprout form, leaf motif expanded across the body.
```

#### `grovespirit` — 새록정 (3단, 나무 정령/골렘)
```
[공통 프리픽스]
A large wise tree-spirit golem. Sturdy brown bark body covered in mossy green
foliage, an elder face framed by a leafy beard and twig antlers/horns, a glowing
green gem set in the chest (bright green block + white highlight dot, not a glow),
big mossy fists, broad standing pose. Brown wood + mossy green palette, the green gem
echoing the leaf motif of earlier stages.
```

---

## 6. 초반 야생 3종 (아키타입 다양성 검증 — 설치류 / 토끼 / 비동물 엘리멘탈)

#### `sparkmouse` — 찌리몽 (elec, 통통한 전기 쥐)
```
[공통 프리픽스]
A chubby cute electric mouse. Bright yellow fur, big round ears with pale-yellow
inner surfaces, a small lightning-bolt mark on the forehead, big amber eyes, a
cream-white belly tuft, a tail tipped with a hard lightning-bolt shape. A few tiny
hard-edged yellow spark pixels around it (no soft glow). Standing upright, paws up,
happy expression.
```

#### `bunnyhop` — 토롱이 (normal, 긴 귀 아기 토끼)
```
[공통 프리픽스]
A tiny cute rabbit. Cream-tan fluffy fur, very long upright ears with pink inner
surfaces, a small tuft of amber-orange fur sticking up on the head, big amber eyes,
pink paw pads, cheerful open smile. Sitting pose, fluffy round body. Warm and soft.
```

#### `dewdrop` — 이슬방울 (water, 살아있는 물방울)
```
[공통 프리픽스]
A living water droplet spirit. Teardrop-shaped body in light cyan-blue, rendered as
SOLID color with a hard white highlight patch on the upper body and a slightly darker
cyan outline to suggest translucency (do NOT make it transparent — use highlights
and outline only). Big sparkly blue eyes, tiny stubby arms and feet, a happy open
mouth. Standing on a small flat green leaf. Simple and clean.
```

> ⚠️ `dewdrop`은 원본이 **유리질 투명체**다. 픽셀은 투명을 못 그리므로 스타일 바이블 §5대로
> **밝은 하늘색 색면 + 흰 하이라이트 + 어두운 테두리**로 "투명함"을 암시한다. 생성기가 자꾸
> 반투명/유리로 뽑으면 네거티브에 `transparent, glass, see-through`를 추가한다.

---

## 7. 받은 뒤 검수 (스타일 바이블 §7 + Phase 1 전용)

- [ ] 스타일 바이블 §7 공통 체크리스트 전부 통과
- [ ] **3라인을 각각 나란히** 놓고 — 1→2→3단이 같은 색·모티프 가족으로 읽히는가
- [ ] 12종을 **한 판에** 놓고 — 외곽선 굵기·도트 굵기·채도가 서로 통일됐는가
- [ ] 원종 대조: `art_inbox/creatures_src/{id}.webp`와 나란히 — **같은 정령으로 알아보는가**
- [ ] 전투 스크린샷: `.sprite.me`(내 정령)와 `.sprite.foe`(상대)로 띄워 주인공·NPC와 같은 화면에서 화풍이 붙는가

## 8. 해상도/색 튜닝 (Phase 1의 핵심 목적)

기본 96px·24색으로 먼저 본다. 스크린샷에서:
- **너무 매끈해 캐릭터보다 고해상도로 보이면** → `--size 80` 또는 `--size 64`로 낮춰 재변환(재생성 불필요, 파이프라인만 다시).
- **색이 뭉치거나 배경 제거가 몸을 깎으면** → `--colors`·`--bgthresh` 조정, 그래도 안 되면 Aseprite에서 한 번 정리.
- 확정된 값(size/colors)을 스타일 바이블 §3·§8에 기록하고 **나머지 74종은 그 값으로 일괄 진행**한다.

---

## 9. Phase 2 예고 (참고)

나머지 74종은 타입/라인 배치로: fire 잔여 → water 잔여 → grass 잔여 → elec → ice → rock/ground → flying → normal → 전설 5종(위엄 최상단). 각 배치도 이 문서와 같은 형식(계승 항목 명시 + 원종 근거)으로 프롬프트를 만든다.
