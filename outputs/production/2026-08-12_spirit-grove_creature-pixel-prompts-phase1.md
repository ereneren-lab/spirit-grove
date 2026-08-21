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

## 4. 💧 무르꼬 라인 (water) — ⚠️ **진화 재설계 반영(2026-08-12)** · 계승: **하늘색+크림+짙은파랑 + 화룡(化龍) 모티프**

> 재설계 근거: `outputs/strategy/2026-08-12_spirit-grove_evolution-realign-strategy.md` §9-1-A.
> 옛 설계(거북→악어→오징어)를 폐기하고 **거북→용거북→수호룡**으로 통일. 파충류 4족·등딱지 실루엣을 라인 끝까지 유지, 3단에 금색 뿔/갑주 포인트. 타입은 water 유지(dragon 타입 아님 — 시각 모티프일 뿐).

#### `shellow` — 무르꼬 (1단, 귀여운 아기 거북)
```
[공통 프리픽스]
A tiny cute baby turtle. Light cyan-blue skin with darker blue spots, a cream-tan
belly plastron, a blue segmented dome shell with a hard geometric pattern, big
sparkly blue eyes, small pink cheek blush, cheerful open smile, one little arm raised.
Sitting pose. Reads round and adorable.
```

#### `riverdrake` — 무르롱 (2단, 용이 되어가는 거북)
```
[공통 프리픽스]
A young dragon-turtle mid-transformation from its hatchling form. Cyan-blue body with a
cream-white belly, the rounded shell of stage 1 still carried on its back as it grows,
a lengthening neck and forelimbs, small horns just budding on the head, short whisker-
fins by the snout, blue eyes, fins edged in cream. Clearly still a four-legged reptile
WITH a shell — a turtle becoming a dragon, not a serpent. Same cyan + cream + darker-
blue palette as the turtle form, with a first hint of gold on the budding horns.
```

#### `krakentide` — 무르칸 (3단, 화룡한 심해 수호룡)
```
[공통 프리픽스]
A majestic deep-sea guardian dragon — the final form of the turtle line. A reptilian
body with FOUR clawed legs, the old shell now hardened into layered armor plating on
the back, several long flowing whiskers streaming from the face (the ONE trait kept
from its old kraken concept — these are whiskers, NOT tentacles), curved golden horns,
a glowing cyan gem on the brow (bright cyan block + white highlight dot, not a glow),
blue eyes. Deep blue body with cyan + cream accents and gold horn/armor trim. Imposing,
long-necked but firmly four-legged. NO octopus, NO tentacles, NO extra arms.
```

---

## 5. 🌿 새록꼬 라인 (grass) — ⚠️ **진화 재설계 반영(2026-08-12)** · 계승: **라임그린+크림 + 잎 모티프 · 파충류 실루엣 유지**

> 재설계 근거: `outputs/strategy/2026-08-12_spirit-grove_evolution-realign-strategy.md` §9-1-B.
> 옛 설계(도마뱀→공룡→나무정령 인간체)를 폐기하고 **도마뱀→잎용→나무 두른 거대 파충류**로 통일. 4족·긴 꼬리 실루엣을 라인 끝까지 유지, 3단은 이끼짙은녹색+고목갈색 비중↑. 타입 grass 유지.

#### `leafdrake` — 새록꼬 (1단, 귀여운 새싹 도마뱀)
```
[공통 프리픽스]
A tiny cute grass dragon / lizard. Lime-green scaly skin with darker green spots, a
two-leaf sprout growing from the top of the head, small leaf-shaped frill wings, a
cream-yellow belly, big green eyes, cheerful open smile, a leaf-tipped tail. Sitting
pose. Reads soft and sprout-like.
```

#### `leafwyrm` — 새록룡 (2단, 잎갈기가 무성해진 잎용)
```
[공통 프리픽스]
A growing leaf dragon, larger than its sprout form. A LIZARD-like quadruped with four
legs and a long tail (NOT a serpent), lime-green scales, a thick mane of overlapping
leaves running down the neck and back, small twig-like horns, and the two-leaf sprout
of stage 1 grown into a leafy crown, a cream belly, teal-green eyes. Same lime-green +
cream palette as the sprout, leaf motif expanded across the body.
```

#### `grovespirit` — 새록정 (3단, 나무를 두른 거대 파충류)
```
[공통 프리픽스]
A giant ancient forest dragon — the final form of the sprout line. A large reptilian
QUADRUPED whose body is covered in gnarled tree bark and thick moss (NOT a humanoid
tree-ent). Four sturdy clawed legs and a long tail continue the lizard silhouette from
stage 1, twig antlers, a small forest of foliage growing along the back, a glowing
green gem in the chest (bright green block + white highlight dot, not a glow), wise
eyes. Palette shifts toward deep mossy green + aged-wood brown while keeping the lime-
green roots of earlier stages.
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

#### `dewdrop` — 이스리 (water, 살아있는 물방울)
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
