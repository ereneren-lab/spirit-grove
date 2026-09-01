# 사막 독전갈 라인 2종 픽셀 아트 프롬프트 (독꼬리·맹독전갈)

작성 2026-09-01 · 규격: `2026-08-12_spirit-grove_creature-pixel-style-bible.md`
목적: 모래바람 사막 지역에 추가된 **독전갈 라인**의 픽셀 아트. 지금은 매니페스트 미등록이라 SVG 플레이스홀더로 나오고, 이 때문에 `scripts/verify.sh`의 PAINT_ART/DEX 대조가 실패한다(도감 108 vs 페인트 106). 두 장을 넣으면 픽셀로 교체되고 대조가 맞는다.
**원칙:** 스타일 바이블 불변 규격(하드 1px 외곽선·플랫 셀 셰이딩 2단·AA/디더링/글로우 금지·24색 이내·투명 배경·96×96·정사각 중앙 정렬)을 그대로 따른다.

라인 연속성: **독꼬리(1단, poison) → 맹독전갈(2단, poison/ground, Lv24 진화)** — 모래색 몸 + 독보라 포인트를 라인 전체에 고정. 1단의 **과장된 독침 꼬리**가 2단에서 **맹독을 흘리는 큰 꼬리 + 큰 집게**로 자란다. 둘 다 🦂 전갈, **물리 어태커**(atk>spa).

> ⚠️ **소프트 글로우/그라데이션 금지.** "그림자 속 빛나는 눈"도 발광이 아니라 **하드 하이라이트 도트(작은 흰/노란 사각)** 로만.
> ⚠️ 색 앵커 = **poison 보라**(독침·관절·독액)와 **모래·사막 탄색**(갑각). 2단은 **ground** 2차 타입 → 탄색 갑각 비중↑, 더 두껍고 각진 사막 갑주 실루엣.
> ⚠️ 방향은 기존 106종과 동일하게 **화면 왼쪽으로 살짝 튼 3/4 정면**(코드의 `.me` 좌우 반전과 맞물림). 완전 측면·완전 정면 금지.

> 업로드: `art_inbox/creatures_pixel/` (파일명 자유 — 내가 id 정리·96px 변환)
> URL: https://github.com/ereneren-lab/spirit-grove/upload/claude/continue-c4gyj2/art_inbox/creatures_pixel

---

## `stingtail` — 독꼬리 (poison, 1단)

**컨셉:** 작고 다부진 **아기 사막 전갈**. 모래 밑에 숨어 발소리를 기다리는 매복형. 몸에 비해 **과장되게 큰 독침 꼬리**를 등 위로 곧추세웠고, 침 끝에 독보라 방울 한 점. 작은 집게 두 개, 낮게 웅크린 자세, 큰 순한 눈(아직 1단이라 위협적이기보단 야무진 인상). 모래 탄색 갑각 + 독보라 포인트(꼬리 마디·관절·침).

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
A small sturdy baby DESERT SCORPION, a POISON type. Low crouched ambush pose, sandy
tan segmented carapace. It has an OVERSIZED curved STINGER TAIL arched high over its
back, far bigger than its body, tipped with a single hard purple venom droplet (a flat
pixel blob with one white highlight square, NOT glowing). Two small pincer claws, a few
short legs, and big gentle eyes. Poison-purple accents on the tail segments, joints and
stinger; sandy tan + cream body. Cute but plucky, clearly the first stage of a scorpion
line.
```
**Negative**
```
painterly, watercolor, gouache, anime illustration, realistic, soft shading, rim light,
glow, bloom, lens flare, translucent particles, blurry, anti-aliased edges, gradient,
3D render, drop shadow, ground shadow, background plate, card frame, sticker border,
glass reflection, neon, text, watermark, signature, multiple creatures, cropped,
extra limbs, human, humanoid, soft glowing aura, wings, insect wings
```

---

## `venomscorp` — 맹독전갈 (poison/ground, 2단)

**계승(유지):** 독꼬리의 **모래 탄색 갑각 + 독보라 포인트**와 큰 독침 꼬리. 그 침이 이제 **맹독을 뚝뚝 흘리는 굵은 꼬리**로, 작던 집게가 **먹이를 붙드는 큰 집게 한 쌍**으로 자랐다.
**ground 강화:** 사막의 밤을 지배하는 사냥꾼 — 더 크고 각진 **사막 갑주**(탄색·모래빛 판갑) 비중↑, 무겁고 낮은 포식자 실루엣. 그림자 속에서 **눈만 빛나는** 인상은 **하드 하이라이트 도트(밝은 노랑/흰 사각 몇 개)** 로만(발광 아님). 위엄 있고 날렵한 밤의 헌터.

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
A large menacing DESERT SCORPION, a POISON/GROUND type night predator, clearly evolved
from a smaller sandy scorpion. Thick angular sand-colored plated armor (heavier, more
carapace than the first stage). A pair of big grasping PINCER CLAWS raised forward, and
a thick raised STINGER TAIL that drips hard purple venom (flat purple pixel droplets
with white highlight squares, NOT glowing). Its eyes are small bright points (a couple
of pale yellow/white highlight pixels) as if gleaming from shadow. Sandy tan + desert
ochre armor with poison-purple accents on joints, tail and venom; dark outline. Low
powerful stance, elegant and deadly, a desert-night hunter.
```
**Negative**
```
painterly, watercolor, gouache, anime illustration, realistic, soft shading, rim light,
glow, bloom, lens flare, translucent particles, blurry, anti-aliased edges, gradient,
3D render, drop shadow, ground shadow, background plate, card frame, sticker border,
glass reflection, neon, text, watermark, signature, multiple creatures, cropped,
extra limbs, human, humanoid, soft glowing aura, wings, insect wings
```

---

## 받은 뒤 절차 (코드 0 — 파일만)

1. `art_inbox/creatures_pixel/`에 두 장 업로드(파일명 자유).
2. 내가 `make_creature_art.py`로 96px/24색 변환 → `assets/art/creatures/stingtail.webp`·`venomscorp.webp`.
3. `assets/manifest.json`의 `paint`에 `stingtail`·`venomscorp` 추가(106→108) → `build.py`가 자동 인라인.
4. `bash scripts/verify.sh dist/spirit_grove_3d.html` 의 PAINT_ART/DEX 대조가 통과(안덮인 0, 빌드 108종 = 도감 108)하는지 확인. `new_species_test`·`dead_content_test`·`desert_test` 재확인.

## 검수 포인트(이 라인 특화)

- [ ] 독꼬리의 **꼬리가 몸보다 크게** 과장돼 "1단인데 침만은 위협적" 인상이 나오는가
- [ ] 맹독전갈이 독꼬리와 **같은 모래탄색+독보라 가족**으로 읽혀 "성장한 같은 존재"로 보이는가
- [ ] 독액·빛나는 눈이 **글로우가 아니라 하드 도트**인가 (스타일 바이블 §2 위반 금지)
- [ ] 2단이 **poison/ground** 답게 갑주 탄색 비중이 늘고 더 각진 실루엣인가
- [ ] 주인공·NPC 도트와 같은 굵기 계열(같은 화면 스크린샷)
