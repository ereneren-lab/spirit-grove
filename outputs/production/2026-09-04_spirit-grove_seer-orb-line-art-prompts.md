# 에스퍼 예지 라인 3종 픽셀 아트 프롬프트 (점술구슬·천리안·심안자)

작성 2026-09-04 · 규격: `2026-08-12_spirit-grove_creature-pixel-style-bible.md`
목적: 희소 타입(에스퍼) 보강으로 추가된 **순수 에스퍼 특수 3단 라인**의 픽셀 아트.

> ⚠️ **이 라인은 이미 플레이 가능하다.** 절차적 스프라이트가 `assets/art/creatures/{mystorb,seergaze,omniseer}.webp`에 들어가 있어 매니페스트·PAINT_ART/DEX 대조·도감 렌더가 전부 통과한다. 이 문서는 **선택적 폴리시 패스** — 강철·사마귀·고스트 라인처럼 GPT 손그림으로 교체하고 싶을 때 쓴다.

**정체성:** **떠 있는 점술 구슬 → 큰 눈이 뜬 천리안 → 여러 눈을 두른 심안자** 예지자 계열. 특수 어태커(spa>atk). 기존 에스퍼 여우 라인(요술여우 psykit→구미술호 mystfox)과 실루엣이 겹치지 않게 **동물이 아닌 부유형 구슬·눈** 모티프. 색 앵커: **연보라~청보라 수정 구슬 + 금빛 테두리·장식 + 에스퍼 핑크 홍채**. 형태는 무기물 구슬에서 눈이 하나둘 뜨며 예지자로 각성.

> ⚠️ **소프트 글로우 금지.** 구슬 속 빛·홍채도 발광이 아니라 **하드 하이라이트 도트**로.
> ⚠️ 색 앵커 = **청보라 수정 구슬**(투명감은 하드 하이라이트 스팟으로만 표현) + **금테** + **핑크 홍채**. 3종이 같은 팔레트 가족으로.
> ⚠️ 방향은 기존 종과 동일하게 **화면 왼쪽으로 살짝 튼 3/4 정면**. 접지 없이 공중에 떠 있는 실루엣(다리 없음). 완전 측면·완전 정면 금지.

> 업로드: `art_inbox/creatures_pixel/` (파일명 자유 — 내가 id 정리·변환)
> URL: https://github.com/ereneren-lab/spirit-grove/upload/claude/continue-c4gyj2/art_inbox/creatures_pixel

---

## `mystorb` — 점술구슬 (psychic, 1단)

**컨셉:** 홀로 떠다니는 작은 **수정 구슬**. 안개 낀 표면에 스치는 이의 가까운 앞날이 어렴풋이 비친다. 아직 눈은 없고, 안개 소용돌이와 작은 금빛 받침 장식만. 신비롭고 귀여운 첫 단계.

**Prompt**
```
96x96 pixel art creature sprite for a 2D JRPG, GBA / 16-bit era battle sprite look.
Single creature, full body, one idle battle pose, seen in 3/4 view facing slightly
toward the LEFT of the frame. Chunky readable silhouette. Hard 1px dark outline in a
dark shade of the creature's own color, flat cel shading with at most two shade steps
per material and one hard highlight, limited palette of at most 24 colors, NO
anti-aliasing, NO gradients, NO dithering, NO soft glow, NO blur. Crisp square pixels
on a 96x96 grid. Fully transparent background — no backdrop, no frame, no ground circle,
no drop shadow. Creature FLOATING, centered with a small even margin on all sides.
A small floating CRYSTAL FORTUNE ORB, a PSYCHIC type — a lilac / blue-violet crystal
ball hovering in the air, its misty surface faintly swirling with visions of the near
future. A hard white highlight spot on the upper-left of the glass (a flat pixel gleam,
NOT soft glow). No eyes yet. A small GOLD ornamental band or stand at its base. Lilac
crystal with darker violet shade and a pale highlight, gold trim. Mystical and cute, the
first stage of a fortune-teller line.
```
**Negative**
```
painterly, watercolor, gouache, anime illustration, realistic, soft shading, rim light,
glow, bloom, lens flare, translucent particles, blurry, anti-aliased edges, gradient,
3D render, drop shadow, ground shadow, background plate, card frame, sticker border,
neon, text, watermark, signature, multiple creatures, cropped, animal, fox, face, mouth,
limbs, legs, fur
```

---

## `seergaze` — 천리안 (psychic, 2단)

**계승(유지):** 점술구슬의 **청보라 수정 + 금테**. 이제 구슬 한가운데 **커다란 눈** 하나가 떠졌다.
**성장:** 감기는 법 없는 큰 핑크 홍채의 눈이 정면을 응시. 구슬을 감싼 금빛 아치 장식, 아래로 흐르는 은은한 사이킥 자락 두 점. 먼 곳과 마음속을 동시에 들여다보는 천리안.

**Prompt**
```
96x96 pixel art creature sprite for a 2D JRPG, GBA / 16-bit era battle sprite look.
Single creature, full body, one idle battle pose, seen in 3/4 view facing slightly
toward the LEFT of the frame. Chunky readable silhouette. Hard 1px dark outline in a
dark shade of the creature's own color, flat cel shading with at most two shade steps
per material and one hard highlight, limited palette of at most 24 colors, NO
anti-aliasing, NO gradients, NO dithering, NO soft glow, NO blur. Crisp square pixels
on a 96x96 grid. Fully transparent background — no backdrop, no frame, no ground circle,
no drop shadow. Creature FLOATING, centered with a small even margin on all sides.
A floating CLAIRVOYANT ORB, a PSYCHIC type, evolved from a small crystal ball. A lilac
crystal orb with ONE LARGE OPEN EYE in its center — a wide almond eye with a bright PINK
IRIS and a dark pupil, plus a small white highlight (hard pixel, NOT glowing), gazing
forward, never blinking. A GOLD ornamental ARCH frames the top of the orb. Two faint
psychic wisps trail below. Lilac crystal with violet shade and pale highlight, gold trim,
pink iris. Watchful and serene, a mid-stage all-seeing eye.
```
**Negative**
```
painterly, watercolor, gouache, anime illustration, realistic, soft shading, rim light,
glow, bloom, lens flare, translucent particles, blurry, anti-aliased edges, gradient,
3D render, drop shadow, ground shadow, background plate, card frame, sticker border,
neon, text, watermark, signature, multiple creatures, cropped, animal, fox, mouth,
nose, limbs, legs, fur
```

---

## `omniseer` — 심안자 (psychic, 3단, 최종)

**계승(유지):** 천리안의 **청보라 수정 + 금테 + 핑크 홍채 큰 눈**. 이제 **수많은 눈을 두른 예지의 정령**으로 각성.
**성장:** 중앙의 큰 눈 둘레로 여러 개의 작은 눈이 원형으로 떠서 사방을 본다. 구슬을 감싼 완전한 금빛 원환(고리)과 별자리 같은 장식. 아직 오지 않은 일을 미리 보는 위엄. 라인의 정점.

**Prompt**
```
96x96 pixel art creature sprite for a 2D JRPG, GBA / 16-bit era battle sprite look.
Single creature, full body, one idle battle pose, seen in 3/4 view facing slightly
toward the LEFT of the frame. Chunky readable silhouette. Hard 1px dark outline in a
dark shade of the creature's own color, flat cel shading with at most two shade steps
per material and one hard highlight, limited palette of at most 24 colors, NO
anti-aliasing, NO gradients, NO dithering, NO soft glow, NO blur. Crisp square pixels
on a 96x96 grid. Fully transparent background — no backdrop, no frame, no ground circle,
no drop shadow. Creature FLOATING, centered with a small even margin on all sides.
A large floating ALL-SEEING ORACLE, a PSYCHIC type, the final evolution of a seer line.
A big lilac crystal orb with ONE LARGE central EYE (pink iris, dark pupil, white
highlight) surrounded by a RING OF SEVERAL SMALLER EYES that hover around it, watching in
every direction — bigger and more ornate than the previous stage. A complete GOLD RING
(halo) with small constellation-like ornaments encircles the orb. Lilac/blue-violet
crystal with violet shade and pale highlights, gold trim, pink irises (all flat hard
pixels, NOT glowing). Serene, imposing, prophetic — the peak of the line.
```
**Negative**
```
painterly, watercolor, gouache, anime illustration, realistic, soft shading, rim light,
glow, bloom, lens flare, translucent particles, blurry, anti-aliased edges, gradient,
3D render, drop shadow, ground shadow, background plate, card frame, sticker border,
neon, text, watermark, signature, multiple creatures, cropped, animal, fox, mouth,
nose, limbs, legs, fur, humanoid body
```

---

## 받은 뒤 절차 (코드 0 — 파일만)

1. `art_inbox/creatures_pixel/`에 세 장 업로드(파일명 자유, 어느 게 어느 단계인지만 알려줄 것).
2. 내가 `make_creature_art.py --hires --size 256`로 반입 → `assets/art/creatures/{mystorb,seergaze,omniseer}.webp` **덮어쓰기**.
3. manifest·PAINT_ART는 이미 3종 등록돼 있으므로 재빌드만.
4. `bash scripts/verify.sh dist/spirit_grove_3d.html` 재확인: PAINT_ART/DEX 대조, `seer_line_test`·`dead_content_test` 통과.

## 검수 포인트(이 라인 특화)

- [ ] 3종이 **같은 청보라수정+금테+핑크홍채 가족**으로 읽혀 "성장한 같은 존재"로 보이는가
- [ ] 형태 진화가 읽히는가: **눈 없는 구슬(1단) → 큰 눈 하나(2단) → 중앙 눈+여러 작은 눈+금환(3단)**
- [ ] 구슬 속 빛·홍채가 **글로우가 아니라 하드 도트**인가 (스타일 바이블 §2)
- [ ] 접지 없이 **떠 있는** 실루엣인가(다리·얼굴·입 금지)
- [ ] 기존 에스퍼 여우(요술여우·구미술호)와 **실루엣이 확실히 다른가**(구슬/눈 vs 동물)
- [ ] 3단이 화면에서 **가장 크고 위엄** 있게 라인의 정점으로 읽히는가
