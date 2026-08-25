# 신규 벌레(bug) 라인 2종 픽셀 아트 프롬프트 (홀씨벌레·숲바람나방)

작성 2026-08-24 · 규격: `2026-08-12_spirit-grove_creature-pixel-style-bible.md`
목적: 1차 bug 타입이 없던 도감에 추가한 나비 라인의 새 픽셀 아트.
**원칙:** 스타일 바이블 불변 규격(하드 1px 외곽선·플랫 셀 셰이딩 2단·AA/디더링/글로우 금지·24색 이내·투명 배경·96×96·정사각 중앙 정렬)을 그대로 따른다.
라인 연속성: **홀씨벌레(1단, 이끼 홀씨) → 숲바람나방(3단, 나방)** — 초록/이끼색 정체성을 유지하고, 등의 홀씨가 자라 **날개**가 된다는 흐름.

> ⚠️ **소프트 글로우/그라데이션 금지.** "달빛에 빛나는 인분"도 발광이 아니라 **하드 하이라이트 도트(작은 흰 사각)** 로만.
> ⚠️ 두 종 다 **bug**가 1차 타입 → 초록/이끼 실루엣이 앵커. 숲바람나방만 **flying** 2차 → 큰 날개·깃털 더듬이로 비행 정체성.

> 업로드: `art_inbox/creatures_pixel/` (파일명 자유 — 내가 id 정리·96px 변환)
> URL: https://github.com/ereneren-lab/spirit-grove/upload/claude/continue-c4gyj2/art_inbox/creatures_pixel

---

## `sporelet` — 홀씨벌레 (bug, 1단)

**컨셉:** 동글동글 **아기 애벌레/벌레**. 등에 **이끼 홀씨 뭉치**가 돋아 있고(포자 퍼프), 짧은 다리 몇 쌍, 작은 더듬이, 큰 순한 눈. 초록·이끼색 몸. 1단이라 작고 귀엽게 — "숲 바닥을 기어다니는 새싹 벌레".

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
A tiny round cute BUG-type larva, like a mossy caterpillar grub. Soft green segmented
body with a few short stubby legs, small antennae, and big gentle eyes. On its back
grows a cluster of pale mint MOSS SPORE puffs (rendered as flat rounded pixel blobs with
one hard highlight square each, NOT glowing). A couple of tiny leaf-flecks on the body.
Moss green + mint + pale cream + dark green outline palette. Sitting/crawling pose, cute
and small, clearly the first stage of a bug line.
```
**Negative**
```
painterly, watercolor, gouache, anime illustration, realistic, soft shading, rim light,
glow, bloom, lens flare, translucent particles, blurry, anti-aliased edges, gradient,
3D render, drop shadow, ground shadow, background plate, card frame, sticker border,
glass reflection, wings, moth wings, text, watermark, signature, multiple creatures,
cropped, extra limbs, human, humanoid, soft glowing aura
```

---

## `gustmoth` — 숲바람나방 (bug/flying, 3단)

**계승(유지):** 홀씨벌레의 **초록/이끼색** 몸통과 순한 눈. 등의 홀씨가 **큰 날개**로 자란 진화형.
**flying 강화:** 좌우로 넓게 펼친 **큰 나방 날개**(잎맥·바람 무늬), **깃털 같은 더듬이**, 폭신한 몸통 털. 날개 무늬는 **면을 나눈 색블록**으로(그라데이션 금지). "인분이 은은히 빛난다"는 **하드 하이라이트 도트 몇 개**로만 표현(발광 아님). 빠른 특수 어태커답게 **날렵하고 우아한** 실루엣.

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
A graceful forest MOTH, a BUG/FLYING type. Large moth wings spread to the sides with a
leaf-vein and gentle wind pattern drawn as flat divided color blocks (green and teal
with cream edges, NOT a gradient). Fuzzy green mossy body with a soft fur collar,
feathery antennae, and big gentle eyes — clearly evolved from a small mossy larva. A few
tiny pale highlight squares scattered on the wings suggest faintly shimmering scales
(hard pixel dots, NOT a glow). Moss green + teal + mint + pale cream + dark green outline
palette. Elegant hovering pose, slender and airy, a fast graceful bug-flyer.
```
**Negative**
```
painterly, watercolor, gouache, anime illustration, realistic, soft shading, rim light,
glow, bloom, lens flare, translucent particles, blurry, anti-aliased edges, gradient,
3D render, drop shadow, ground shadow, background plate, card frame, sticker border,
glass reflection, neon, text, watermark, signature, multiple creatures, cropped,
extra limbs, human, humanoid, soft glowing aura, butterfly (make it a moth)
```

---

## 받은 뒤 절차 (코드 0 — 파일만)

1. `art_inbox/creatures_pixel/`에 두 장 업로드(파일명 자유).
2. 내가 `make_creature_art.py`로 96px/24색 변환 → `assets/art/creatures/sporelet.webp`·`gustmoth.webp`.
3. `assets/manifest.json`의 `paint`에 `sporelet`·`gustmoth` 추가(98→100) → `build.py`가 자동 인라인.
4. 지금은 매니페스트 미등록이라 **SVG 플레이스홀더**로 나온다 — 파일만 넣으면 픽셀로 교체된다.

## 기술 메모 (질문 답)

**새 기술 추가 불필요.** 라인이 쓰는 6기술(몸통박치기·벌레먹기·흡수·벌레버즈·바람일격·쪼기)이 모두 실존하고,
숲바람나방(특수 어태커)은 **양쪽 특수 STAB**을 갖췄다 — 벌레버즈(bug 특수 70) + 바람일격(flying 특수 38, gust는 이 게임에서 특수기).
`balance_test` 통과. (원하면 더 센 비행 특수기를 신설할 수 있으나 다른 비행 종 밸런스 재측정이 필요한 선택 사항.)
