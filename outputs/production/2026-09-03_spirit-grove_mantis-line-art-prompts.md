# 사마귀 벌레 라인 3종 픽셀 아트 프롬프트 (애사마귀·낫사마귀·대검사마귀)

작성 2026-09-03 · 규격: `2026-08-12_spirit-grove_creature-pixel-style-bible.md`
목적: 희소 타입(벌레) 보강으로 추가된 **순수 벌레 물리 3단 라인**의 픽셀 아트.

> ⚠️ **이 라인은 이미 플레이 가능하다.** 절차적 스프라이트가 `assets/art/creatures/{mantlet,scythel,reapmantis}.webp`에 들어가 있어 매니페스트·PAINT_ART/DEX 대조·도감 렌더가 전부 통과한다. 이 문서는 **선택적 폴리시 패스** — 강철 라인처럼 GPT 손그림으로 교체하고 싶을 때 쓴다.

**정체성:** 기존 벌레 라인 sporelet(홀씨벌레→숲바람나방)은 **부드러운 나방·특수 어태커**다. 이 라인은 그와 **정반대**로 잡는다 — **날카로운 사마귀·물리 어태커·고속 크리티컬 사냥꾼**. 실루엣이 겹치면 안 된다.

라인 연속성: **애사마귀(1단) →(Lv16) 낫사마귀(2단) →(Lv34) 대검사마귀(3단)** — 전부 순수 **bug**, 물리 어태커(atk>spa). 색 앵커를 라인 전체에 고정: **잎사귀 녹색 외골격 + 노란 겹눈 + 밝은 낫날(연녹/상아색)**. 형태는 **여린 새끼(작고 세운 앞다리) → 두 자루 낫팔 사냥꾼 → 큰 낫을 세운 검귀**로, 앞다리 낫이 라인의 시각 훅이다.

> ⚠️ **소프트 글로우 금지.** 노란 눈도 발광이 아니라 **하드 하이라이트 도트**로.
> ⚠️ 색 앵커 = **녹색 외골격**(잎사귀 톤) + **노란 겹눈** + **밝은 낫날**. 3단은 더 진한 녹색 + 더 큰 낫으로 위압감.
> ⚠️ 방향은 기존 종과 동일하게 **화면 왼쪽으로 살짝 튼 3/4 정면**. 완전 측면·완전 정면 금지. 낫팔은 세워서 실루엣을 살린다.

> 업로드: `art_inbox/creatures_pixel/` (파일명 자유 — 내가 id 정리·변환)
> URL: https://github.com/ereneren-lab/spirit-grove/upload/claude/continue-c4gyj2/art_inbox/creatures_pixel

---

## `mantlet` — 애사마귀 (bug, 1단)

**컨셉:** 여리고 작은 **새끼 사마귀**. 풀잎 사이에 숨어 여린 앞다리를 세우고 먹이를 기다린다. 작지만 이미 **사냥꾼의 눈빛**(큰 노란 겹눈). 아직 낫이 자라지 않아 앞다리가 가늘고 귀엽다. 연한 잎사귀 녹색.

**Prompt**
```
96x96 pixel art creature sprite for a 2D JRPG, GBA / 16-bit era battle sprite look.
Single creature, full body, one idle battle pose, seen in 3/4 view facing slightly
toward the LEFT of the frame. Chunky readable silhouette. Hard 1px dark outline in a
dark shade of the creature's own color, flat cel shading with at most two shade steps
per material and one hard highlight, limited palette of at most 24 colors, NO
anti-aliasing, NO gradients, NO dithering, NO soft glow, NO blur. Crisp square pixels
on a 96x96 grid. Fully transparent background — no backdrop, no frame, no ground circle,
no drop shadow. Creature centered with a small even margin on all sides.
A small cute baby PRAYING MANTIS, a BUG type. Slender leaf-green exoskeleton, a small
triangular head with two BIG YELLOW COMPOUND EYES (flat yellow pixels with one white
highlight square each, alert but gentle — NOT glowing). Thin raised front forelegs held
up in a little praying pose (not yet grown into blades). A short slender body and a few
thin walking legs. Bright leaf-green body with darker green shade and a pale green
highlight. Cute and plucky, clearly the first stage of a mantis line, already a tiny
hunter.
```
**Negative**
```
painterly, watercolor, gouache, anime illustration, realistic, soft shading, rim light,
glow, bloom, lens flare, translucent particles, blurry, anti-aliased edges, gradient,
3D render, drop shadow, ground shadow, background plate, card frame, sticker border,
neon, text, watermark, signature, multiple creatures, cropped, extra limbs, human,
humanoid, moth wings, butterfly, fur, mammal
```

---

## `scythel` — 낫사마귀 (bug, 2단)

**계승(유지):** 애사마귀의 **잎사귀 녹색 + 노란 겹눈**. 여리던 앞다리가 이제 **두 자루 낫**으로 자랐다.
**성장:** 각지고 날렵한 사냥꾼 실루엣. 한 쌍의 **날카로운 낫팔**(밝은 연녹/상아색 날)을 세워 든다. 삼각 머리·긴 흉부·가는 뒷다리. 정확한 베기를 노리는 이등급 헌터.

**Prompt**
```
96x96 pixel art creature sprite for a 2D JRPG, GBA / 16-bit era battle sprite look.
Single creature, full body, one idle battle pose, seen in 3/4 view facing slightly
toward the LEFT of the frame. Chunky readable silhouette. Hard 1px dark outline in a
dark shade of the creature's own color, flat cel shading with at most two shade steps
per material and one hard highlight, limited palette of at most 24 colors, NO
anti-aliasing, NO gradients, NO dithering, NO soft glow, NO blur. Crisp square pixels
on a 96x96 grid. Fully transparent background — no backdrop, no frame, no ground circle,
no drop shadow. Creature centered with a small even margin on all sides.
A lean agile PRAYING MANTIS hunter, a BUG type, clearly evolved from a small mantis
nymph. Angular leaf-green exoskeleton, a sharp triangular head with two YELLOW COMPOUND
EYES (flat yellow pixels with a white highlight square, NOT glowing). A pair of raised
sharp SCYTHE FORELEGS with pale ivory-green cutting blades, held up ready to strike.
Slender thorax and thin walking legs. Leaf-green body with darker green shade and a pale
highlight, ivory blade edges. Poised, precise, a mid-stage ambush predator.
```
**Negative**
```
painterly, watercolor, gouache, anime illustration, realistic, soft shading, rim light,
glow, bloom, lens flare, translucent particles, blurry, anti-aliased edges, gradient,
3D render, drop shadow, ground shadow, background plate, card frame, sticker border,
neon, text, watermark, signature, multiple creatures, cropped, extra limbs, human,
humanoid, moth wings, butterfly, fur, mammal
```

---

## `reapmantis` — 대검사마귀 (bug, 3단, 최종)

**계승(유지):** 낫사마귀의 **녹색 외골격 + 노란 겹눈 + 낫날**. 이제 **숲의 그림자에서 큰 낫을 세운 검귀**로 완성.
**성장:** 더 크고 진한 녹색, 위압적인 자세. **거대한 한 쌍의 대검 낫팔**이 라인의 정점을 알린다. 등 능선·긴 흉부·날렵한 다리. 스쳐 지나간 자리엔 벤 흔적만 남는 무사의 기품.

**Prompt**
```
96x96 pixel art creature sprite for a 2D JRPG, GBA / 16-bit era battle sprite look.
Single creature, full body, one idle battle pose, seen in 3/4 view facing slightly
toward the LEFT of the frame. Chunky readable silhouette. Hard 1px dark outline in a
dark shade of the creature's own color, flat cel shading with at most two shade steps
per material and one hard highlight, limited palette of at most 24 colors, NO
anti-aliasing, NO gradients, NO dithering, NO soft glow, NO blur. Crisp square pixels
on a 96x96 grid. Fully transparent background — no backdrop, no frame, no ground circle,
no drop shadow. Creature centered with a small even margin on all sides.
A large imposing PRAYING MANTIS swordmaster, a BUG type, the final evolution of a mantis
line — a green blade-armed reaper of the forest shadows. Deep rich green exoskeleton, a
sharp triangular head with narrow YELLOW COMPOUND EYES (flat yellow pixels with white
highlight squares, NOT glowing). A pair of HUGE GREAT-SCYTHE FORELEGS with long pale
ivory-green blades raised high, marking the peak of the line — bigger than the previous
stage. A long ridged thorax, lean powerful stance. Deep green body with dark green shade
and pale highlights, bright ivory blade edges. Elegant, deadly, stoic — a bladed samurai
of the woods.
```
**Negative**
```
painterly, watercolor, gouache, anime illustration, realistic, soft shading, rim light,
glow, bloom, lens flare, translucent particles, blurry, anti-aliased edges, gradient,
3D render, drop shadow, ground shadow, background plate, card frame, sticker border,
neon, text, watermark, signature, multiple creatures, cropped, extra limbs, human,
humanoid, moth wings, butterfly, fur, mammal, holding a separate sword weapon
```

---

## 받은 뒤 절차 (코드 0 — 파일만)

1. `art_inbox/creatures_pixel/`에 세 장 업로드(파일명 자유, 어느 게 어느 단계인지만 알려줄 것).
2. 내가 `make_creature_art.py --hires --size 256`로 반입 → `assets/art/creatures/{mantlet,scythel,reapmantis}.webp` **덮어쓰기**(지금의 절차적 스프라이트 교체).
3. manifest·PAINT_ART는 이미 3종 등록돼 있으므로 재빌드만.
4. `bash scripts/verify.sh dist/spirit_grove_3d.html` 재확인: PAINT_ART/DEX 대조, `mantis_line_test`·`dead_content_test` 통과.

## 검수 포인트(이 라인 특화)

- [ ] 3종이 **같은 녹색+노란눈+낫날 가족**으로 읽혀 "성장한 같은 존재"로 보이는가
- [ ] 형태 진화가 읽히는가: **여린 새끼(작은 앞다리) → 두 낫팔 헌터 → 큰 대검 낫팔 검귀**
- [ ] sporelet 나방 라인과 **실루엣이 확실히 다른가**(사마귀 vs 나비, 낫팔 vs 날개)
- [ ] 노란 눈이 **글로우가 아니라 하드 도트**인가 (스타일 바이블 §2)
- [ ] 3단이 화면에서 **가장 크고 위압적**으로 라인의 정점으로 읽히는가
- [ ] 주인공·NPC 도트와 같은 굵기 계열
