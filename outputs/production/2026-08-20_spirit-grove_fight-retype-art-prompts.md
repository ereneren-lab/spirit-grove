# 격투 재타이핑 2종 픽셀 아트 프롬프트 (집게왕·쿵쿵왕)

작성 2026-08-20 · 규격: `2026-08-12_spirit-grove_creature-pixel-style-bible.md`
목적: 격투(fight) 타입으로 재타이핑된 2종에 **무투가 느낌**을 강화한 새 픽셀 아트.
**원칙: "새 정령"이 아니라 "같은 정령의 격투 버전"** — 기존 실루엣·색을 유지하고 무술 요소만 얹는다.

> 업로드: 생성 후 `art_inbox/creatures_pixel/` 에 올리면(파일명 자유) 내가 id로 정리·변환.
> URL: https://github.com/ereneren-lab/spirit-grove/upload/claude/continue-c4gyj2/art_inbox/creatures_pixel

---

## `crablord` — 집게왕 (water/fight, 3단)

**계승(유지):** 짙은 파랑 몸 + **붉은 큰 집게발** + 금색 갑주 트림 + 흰 수염/갈기 = 사무라이형 게 전사.
**격투 강화:** 한 집게를 앞으로 든 **파이팅 가드 자세**, 집게·팔에 감은 흰 **무술 붕대(주먹싸개)**, 허리에 무도 **띠(오비)**, 물 타입 앵커로 이마/가슴에 청록 물방울 젬 유지.

**Prompt**
```
96x96 pixel art creature sprite for a 2D JRPG, GBA / 16-bit era battle sprite look.
Single creature, full body, one idle battle pose, seen in 3/4 view facing slightly
toward the LEFT of the frame. Chunky readable silhouette. Hard 1px dark outline in a
dark shade of the creature's own color, flat cel shading with at most two shade steps
per material and one hard highlight, limited palette of at most 24 colors, NO
anti-aliasing, NO gradients, NO dithering, NO soft glow, NO blur. Crisp square pixels
on a 96x96 grid. Fully transparent background — no backdrop, no frame, no card, no
ground circle, no drop shadow. Creature centered with a small even margin on all sides.
A crab-warrior martial artist — the armored final form of the crab line. Deep blue
carapace body with a cream-white beard/mane, TWO large red crab claws, gold plate
trim on the shell and shoulders. Now styled as a fighter: it stands in a low martial
guard stance with one big red claw raised forward as a guard and the other cocked
back, thick WHITE cloth combat wraps bound around both claw-arms like a boxer's hand
wraps, a wide cloth martial-arts belt (obi) knotted at the waist in a matching red,
sturdy braced legs. A small teal water-droplet gem set on the brow (solid cyan block +
one white highlight dot, not a glow) keeps its water identity. Fierce determined eyes,
compact powerful build. Reads as a disciplined crab brawler — blue + red + gold +
cream palette, same crab-samurai identity as before, now clearly a fighter.
```
**Negative**
```
painterly, watercolor, gouache, anime illustration, realistic, soft shading, rim light,
glow, bloom, lens flare, translucent particles, blurry, anti-aliased edges, gradient,
3D render, drop shadow, ground shadow, background plate, card frame, sticker border,
glass reflection, text, watermark, signature, multiple creatures, cropped, extra limbs,
human, humanoid body, holding weapon, sword, spear
```

---

## `thumplord` — 쿵쿵왕 (ground/fight, 3단)

**계승(유지):** 크림-갈색 **근육질 대형 토끼** + 긴 귀 + 큰 뒷발 + 발밑에 튀는 흙(땅 타입).
**격투 강화:** 두 앞발을 **복싱 가드로 들어올린 파이팅 스탠스**, 앞발에 감은 흙빛 **주먹 붕대**, 머리에 **무투가 머리띠(하치마키)**, 정강이 붕대, 한쪽 큰 뒷발은 **땅을 내리찍는 스톰프** 자세로 흙먼지 픽셀이 튐.

**Prompt**
```
96x96 pixel art creature sprite for a 2D JRPG, GBA / 16-bit era battle sprite look.
Single creature, full body, one idle battle pose, seen in 3/4 view facing slightly
toward the LEFT of the frame. Chunky readable silhouette. Hard 1px dark outline in a
dark shade of the creature's own color, flat cel shading with at most two shade steps
per material and one hard highlight, limited palette of at most 24 colors, NO
anti-aliasing, NO gradients, NO dithering, NO soft glow, NO blur. Crisp square pixels
on a 96x96 grid. Fully transparent background — no backdrop, no frame, no card, no
ground circle, no drop shadow. Creature centered with a small even margin on all sides.
A hulking muscular brawler rabbit — the powerful final form of the rabbit line.
Cream-and-brown fur, long upright ears, a broad muscular chest and big powerful hind
legs, thick forearms. Now styled as a martial fighter: it stands in a boxing guard
with both front paws raised as fists, earth-brown cloth combat wraps bound around
both forepaws and shins, a tied fighter's headband (hachimaki) across the brow, one
large hind foot planted mid-stomp with a few hard-edged dust/pebble pixels kicking up
around the feet (its ground typing). Confident fierce expression, sturdy grounded
stance. Palette: warm cream + brown + earthy tan dust accents — same big-rabbit
identity as before, now unmistakably a ground-type brawler.
```
**Negative**
```
painterly, watercolor, gouache, anime illustration, realistic, soft shading, rim light,
glow, bloom, lens flare, translucent particles, blurry, anti-aliased edges, gradient,
3D render, drop shadow, ground shadow, background plate, card frame, sticker border,
glass reflection, text, watermark, signature, multiple creatures, cropped, extra limbs,
human, humanoid proportions, holding weapon, boxing gloves as separate objects
```

---

## 검수 포인트 (받은 뒤)

- [ ] **원종 대조**: 기존 집게왕(파랑+붉은집게+금)·쿵쿵왕(크림갈색 근육토끼)로 여전히 알아보는가
- [ ] 격투 단서(붕대 주먹·파이팅 스탠스·띠/머리띠)가 **한눈에** 읽히는가
- [ ] 타입 앵커 유지: 집게왕=물방울 젬 / 쿵쿵왕=발밑 흙먼지
- [ ] 96px·24색·1px 외곽선·투명 배경 등 스타일 바이블 §7 통과
- [ ] 전투 화면에서 `땅/격투`·`물/격투` 칩과 함께 화풍이 붙는가

> 참고: 둘 다 **이미 전사/근육 실루엣**이라 큰 변화 없이 무술 액세서리(붕대·띠·머리띠)와 스탠스만 얹으면 충분하다. 과하게 바꾸면 원종 식별이 깨지니 주의.
