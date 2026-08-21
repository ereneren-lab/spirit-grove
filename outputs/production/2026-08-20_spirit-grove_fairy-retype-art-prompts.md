# 페어리 재타이핑 3종 픽셀 아트 프롬프트 (꽃날개·꽃호접·윤슬정)

작성 2026-08-20 · 규격: `2026-08-12_spirit-grove_creature-pixel-style-bible.md`
목적: 페어리(fairy) 타입으로 재타이핑된 3종에 **요정 느낌**을 강화한 새 픽셀 아트.
**원칙: "같은 정령의 페어리 버전"** — 기존 실루엣·색·1차타입 앵커 유지, 요정 요소만 얹는다.
(꽃날개→꽃호접은 같은 진화 라인 — 작은 꽃요정 → 화려한 꽃요정으로 이어지게.)

> ⚠️ **소프트 글로우/그라데이션 금지(스타일 바이블).** 요정 반짝임은 부드러운 빛이 아니라
> **하드엣지 픽셀**로만: **각진 4~5꼭짓점 별 스파클**(솔리드 흰/핑크 색면 + 그림자 1단),
> 꽃잎 조각, **파스텔 핑크 색면 악센트**, 작은 **하트/보석 젬**(색면 블록 + 흰 점 1개, 발광 아님).

> 업로드: `art_inbox/creatures_pixel/` (파일명 자유) → 내가 id 정리·96px 변환.
> URL: https://github.com/ereneren-lab/spirit-grove/upload/claude/continue-c4gyj2/art_inbox/creatures_pixel

---

## `petalwing` — 꽃날개 (grass/fairy, 1단)

**계승(유지):** 작고 귀여운 **분홍·연두 꽃 나비**, 머리의 작은 꽃, 곤충 더듬이·나비 날개.
**페어리 강화:** 머리에 **작은 꽃 화관(왕관)**, 몸 주위에 **각진 픽셀 별 스파클 2~3개**, 날개 끝에 파스텔 핑크 하트 무늬, 가슴에 작은 꽃 보석. 풀 앵커로 잎·꽃 모티프 유지.

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
A tiny cute flower-fairy butterfly. Soft pink-and-lime-green body with a little cream
face, feathery antennae, and rounded butterfly wings edged in petal shapes. Now a
FAIRY: a small blossom crown of petals on the head, two or three hard-edged pixel
sparkle stars (solid white/pink diamonds, NOT glowing) floating around it, pastel-pink
heart marks on the wingtips, a tiny flower gem at the chest (solid pink block + one
white highlight dot). Keeps its grass identity: leaf and flower-petal motifs on the
body. Adorable and small. Pink + lime-green + cream + a pastel fairy-pink accent.
Same little flower-butterfly identity as before, now clearly a fairy.
```
**Negative**
```
painterly, watercolor, gouache, anime illustration, realistic, soft shading, rim light,
glow, bloom, lens flare, translucent particles, blurry, anti-aliased edges, gradient,
3D render, drop shadow, ground shadow, background plate, card frame, sticker border,
glass reflection, text, watermark, signature, multiple creatures, cropped, extra limbs,
human, humanoid, soft glowing aura
```

---

## `blossomhawk` — 꽃호접 (grass/fairy, 3단)

**계승(유지):** 크고 화려한 **분홍·연두 호랑나비**(꽃날개의 성체), 우아한 큰 날개.
**페어리 강화:** 머리에 **꽃 티아라**, 날개를 따라 **각진 별 스파클 트레일**, 흩날리는 **꽃잎 조각**, 핑크+골드 요정 악센트. 풀 앵커로 잎맥·꽃 문양 유지.

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
A grand ornate flower-fairy swallowtail — the elegant final form of the little
flower-butterfly. Large graceful pink-and-lime-green swallowtail wings with petal-
shaped edges and leaf-vein patterning, a slender cream body, feathery antennae. Now a
regal FAIRY: a small flower tiara on the head, a trail of hard-edged pixel sparkle
stars (solid white/pink diamonds, not glowing) following the wings, a few loose
hard-edged petal chips drifting nearby, pink-and-gold fairy accent trim on the wings.
Keeps its grass identity: leaf-vein wing patterns and flower motifs. Pink + lime-green
+ cream + gold + pastel fairy-pink palette. Same flower-swallowtail identity as before,
now clearly a fairy — bigger and more ornate than its earlier form.
```
**Negative**
```
painterly, watercolor, gouache, anime illustration, realistic, soft shading, rim light,
glow, bloom, lens flare, translucent particles, blurry, anti-aliased edges, gradient,
3D render, drop shadow, ground shadow, background plate, card frame, sticker border,
glass reflection, text, watermark, signature, multiple creatures, cropped, extra limbs,
human, humanoid, soft glowing aura, hawk, bird, raptor
```

---

## `glimmertide` — 윤슬정 (water/fairy, 3단)

**계승(유지):** 우아한 **물의 인어 정령**, 청록 파도 머릿결·아랫몸, 금색 장식 = 물 실루엣.
**페어리 강화:** 머리에 **산호·조개 요정 티아라**, 주위에 **각진 별 스파클**과 **작은 진주 오브**, 가슴 젬을 하트/꽃형으로, 핑크 진주 악센트. 물 앵커로 파도 머릿결·물방울 유지.

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
An elegant water-fairy mermaid spirit. Teal-cyan wave-shaped hair and a serpentine
wave-shaped lower body instead of legs, gold ornament trim, broad hard-edged wave-crest
fins flaring from the shoulders, serene expression, floating upright. Now a FAIRY: a
small coral-and-seashell tiara on the head, hard-edged pixel sparkle stars (solid
white/pink diamonds, not glowing) and a couple of small round pearl orbs floating
nearby, a heart-or-flower shaped gem at the chest (solid pink block + one white
highlight dot), pink-pearl accents along the fins. Keeps its water identity: the
wave-shaped hair, teal body, and water-droplet accents. Teal + cyan + cream + gold +
pastel fairy-pink palette. Same water-mermaid identity as before, now clearly a fairy.
```
**Negative**
```
painterly, watercolor, gouache, anime illustration, realistic, soft shading, rim light,
glow, bloom, lens flare, translucent particles, blurry, anti-aliased edges, gradient,
3D render, drop shadow, ground shadow, background plate, card frame, sticker border,
glass reflection, text, watermark, signature, multiple creatures, cropped, extra limbs,
realistic human, human legs, soft glowing aura
```

---

## 검수 포인트 (받은 뒤)

- [ ] **원종 대조**: 꽃날개=작은 꽃나비 / 꽃호접=화려한 꽃나비 / 윤슬정=물의 인어로 여전히 알아보는가
- [ ] **라인 연속성**: 꽃날개→꽃호접이 같은 색·모티프 가족(작은→화려)으로 읽히는가
- [ ] 요정 단서(꽃 화관/티아라·픽셀 별 스파클·꽃잎/진주·하트 젬)가 **한눈에** 읽히는가
- [ ] **1차 타입 앵커 유지**: 꽃날개·꽃호접=잎·꽃 / 윤슬정=파도 머릿결·물방울
- [ ] **소프트 글로우 0** — 스파클은 전부 각진 색면 별로 표현됐는가
- [ ] 96px·24색·1px 외곽선·투명 배경 등 스타일 바이블 §7 통과
- [ ] 전투 화면에서 `풀/페어리`·`물/페어리` 칩과 함께 화풍이 붙는가

> 참고: 셋 다 원래 꽃/물의 우아한 디자인이라 **화관/티아라 + 픽셀 별 스파클 + 파스텔 핑크 악센트**만
> 얹으면 충분하다. 스파클을 소프트 글로우로 뽑으면 스타일이 깨지고 배경 제거에서 몸이 깎일 수 있으니 주의.
