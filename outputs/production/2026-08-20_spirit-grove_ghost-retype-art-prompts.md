# 고스트 재타이핑 3종 픽셀 아트 프롬프트 (흑요마·개굴알·눈올빼)

작성 2026-08-20 · 규격: `2026-08-12_spirit-grove_creature-pixel-style-bible.md`
목적: 고스트(ghost) 타입으로 재타이핑된 3종에 **유령 느낌**을 강화한 새 픽셀 아트.
**원칙: "같은 정령의 고스트 버전"** — 기존 실루엣·색·1차타입 앵커 유지, 유령 요소만 얹는다.

> ⚠️ **소프트 글로우/그라데이션/반투명 금지(스타일 바이블).** 유령 기운은 부드러운 빛·투명이 아니라
> **하드엣지 픽셀**로만: **텅 빈 발광 눈**(솔리드 색면 + 흰 점 1개), **너덜너덜한 유령 자락**(각진 픽셀 외곽),
> 각진 **도깨비불/영기 조각**, 인디고·보라 색면 악센트. "투명"은 밝은 색면 + 흰 하이라이트 + 어두운 테두리로 암시.

> 업로드: `art_inbox/creatures_pixel/` (파일명 자유) → 내가 id 정리·96px 변환.
> URL: https://github.com/ereneren-lab/spirit-grove/upload/claude/continue-c4gyj2/art_inbox/creatures_pixel

---

## `jellure` — 개굴알 (water/ghost, 1단)

**계승(유지):** 반투명 **알 뭉치 해파리**, 여러 개의 **큰 눈알**, 늘어진 촉수, 청록 톤 = 물 실루엣.
**고스트 강화:** 눈을 **텅 빈 발광 유령 눈**으로(인디고 색면+흰 점), 몸 아래 **너덜한 영기 자락**, 주위에 각진 **도깨비불 조각 1~2개**, 살짝 부양. 물 앵커로 청록 물방울·해파리 형태 유지.

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
A spectral jelly spirit — a floating cluster of pale cyan jelly-eggs with several big
round eyes, and drifting tendrils below. Its watery translucency is suggested with a
light cyan SOLID color body, a hard white highlight patch, and a darker cyan outline
(do NOT make it see-through). Now a GHOST: the eyes are hollow glowing spirit-eyes
(solid indigo blocks + one hard white highlight dot each), the lower tendrils fray
into tattered hard-edged ghost wisps, one or two small angular will-o-wisp flame chips
float nearby, and it hovers off the ground. Keeps its water identity: cyan jelly body
and a small teal droplet accent. Pale cyan + indigo ghost accent + cream palette.
Same jelly-cluster identity as before, now clearly a ghost.
```
**Negative**
```
painterly, watercolor, gouache, anime illustration, realistic, soft shading, rim light,
glow, bloom, lens flare, translucent particles, blurry, anti-aliased edges, gradient,
3D render, drop shadow, ground shadow, background plate, card frame, sticker border,
glass reflection, text, watermark, signature, multiple creatures, cropped, extra limbs,
transparent body, see-through, soft glowing aura
```

---

## `snowl` — 눈올빼 (flying/ghost, 2단)

**계승(유지):** 창백한 **올빼미**, 큰 눈·부리·넓은 날개 = 비행 실루엣.
**고스트 강화:** 눈을 **텅 빈 발광 유령 눈**으로, 깃털 끝을 **너덜한 유령 자락**으로, 몸을 창백한 흰-인디고 유령 톤으로, 주위에 각진 **영기 조각**, 부양 포즈. 비행 앵커로 큰 날개·깃털 유지.

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
A phantom owl — a pale ghostly owl with a round head, a small hooked beak, and broad
spread wings. Now a GHOST: its body is a pale ghost-white with cold indigo shading,
the eyes are hollow glowing spirit-eyes (solid indigo blocks + one hard white
highlight dot each), the wing and tail feather tips fray into tattered hard-edged
ghost wisps instead of neat feathers, a couple of small angular spectral flame chips
float nearby, and it hovers with no feet planted. Keeps its flying identity: large
feathered wings and an owl silhouette. Ghost-white + cold indigo + a little cream.
Eerie and calm. Same snowy-owl identity as before, now clearly a spectral ghost owl.
```
**Negative**
```
painterly, watercolor, gouache, anime illustration, realistic, soft shading, rim light,
glow, bloom, lens flare, translucent particles, blurry, anti-aliased edges, gradient,
3D render, drop shadow, ground shadow, background plate, card frame, sticker border,
glass reflection, text, watermark, signature, multiple creatures, cropped, extra limbs,
transparent body, see-through, soft glowing aura, cute happy expression
```

---

## `shadowlord` — 흑요마 (ghost/rock, 전설)

**계승(유지):** **모든 것을 보는 눈**의 어둠 마수, 흑요석(옵시디언) 파편·바위 몸 = 바위 실루엣. 위엄 최상.
**고스트 강화:** 몸을 **어둠 영체 + 너덜한 그림자 자락**으로, 몸 곳곳에 **여러 개의 텅 빈 발광 눈**(중앙에 거대한 하나), 주위에 각진 **보라 영기 조각**, 부양. 바위 앵커로 흑요석 각진 파편·돌 갑주 유지. 전설급으로 가장 크고 압도적으로.

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
A colossal all-seeing shadow demon — an imposing legendary spirit of darkness and
stone. A dark spectral body of tattered hard-edged shadow shrouds, wrapped in angular
black obsidian rock shards and stone-plate armor. One huge central hollow eye plus
several smaller hollow glowing spirit-eyes scattered across the body (solid violet
blocks + one hard white highlight dot each). Now clearly a GHOST: the lower body frays
into ragged shadow wisps instead of legs, it hovers, and a few angular violet spirit
flame chips orbit it. Keeps its rock identity: sharp black obsidian crystal shards and
stone armor plating. Black + deep violet + obsidian-purple + a cold violet ghost
accent. This creature should read as visually LARGER and more overwhelming than the
others (legendary-tier). Same all-seeing-eye shadow-demon identity as before, now
clearly a ghost.
```
**Negative**
```
painterly, watercolor, gouache, anime illustration, realistic, soft shading, rim light,
glow, bloom, lens flare, translucent particles, blurry, anti-aliased edges, gradient,
3D render, drop shadow, ground shadow, background plate, card frame, sticker border,
glass reflection, text, watermark, signature, multiple creatures, cropped, extra limbs,
transparent body, see-through, soft glowing aura, cute, friendly
```

---

## 검수 포인트 (받은 뒤)

- [ ] **원종 대조**: 개굴알=눈알 해파리 / 눈올빼=올빼미 / 흑요마=눈의 어둠마수로 여전히 알아보는가
- [ ] 유령 단서(텅 빈 발광 눈·너덜한 자락·도깨비불·부양)가 **한눈에** 읽히는가
- [ ] **1차 타입 앵커 유지**: 개굴알=청록 해파리·물방울 / 눈올빼=큰 날개·깃털 / 흑요마=흑요석 파편·돌갑주
- [ ] **소프트 글로우·투명 0** — 유령감은 색면+흰 점+어두운 테두리·너덜 외곽으로만
- [ ] 96px·24색·1px 외곽선·투명 배경 등 스타일 바이블 §7 통과
- [ ] 전투 화면에서 `물/고스트`·`비행/고스트`·`고스트/바위` 칩과 함께 화풍이 붙는가

> 참고: 특히 개굴알·눈올빼는 원래 귀여운 톤이라 **눈을 텅 빈 유령 눈으로 바꾸고 자락을 너덜하게**
> 하는 것만으로 인상이 확 바뀐다. 반투명/소프트 글로우로 뽑으면 배경 제거에서 몸이 깎이니 색면으로.
