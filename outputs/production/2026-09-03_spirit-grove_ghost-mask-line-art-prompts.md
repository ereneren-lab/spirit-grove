# 고스트 탈 라인 3종 픽셀 아트 프롬프트 (저주탈·탈망령·원귀탈)

작성 2026-09-03 · 규격: `2026-08-12_spirit-grove_creature-pixel-style-bible.md`
목적: 희소 타입(고스트) 보강으로 추가된 **순수 고스트 특수 3단 라인**의 픽셀 아트.

> ⚠️ **이 라인은 이미 플레이 가능하다.** 절차적 스프라이트가 `assets/art/creatures/{hexmask,wraithmask,dreadmask}.webp`에 들어가 있어 매니페스트·PAINT_ART/DEX 대조·도감 렌더가 전부 통과한다. 이 문서는 **선택적 폴리시 패스** — 강철·사마귀 라인처럼 GPT 손그림으로 교체하고 싶을 때 쓴다.

**정체성:** 부유하는 **저주받은 탈(가면)** + 아래로 자라는 **너덜너덜한 그림자 자락**. 특수 어태커(spa>atk)로 물리 사마귀와 대비. 색 앵커: **창백한 상아빛 탈면 + 자주빛 그림자 자락 + 시퍼런 눈불(도깨비불색)**. 형태는 **작게 둥실 뜬 탈 → 그림자 몸이 자란 탈망령 → 원한이 겹친 큰 탈귀**로, 탈면 + 눈불이 라인의 시각 훅이다. 한국형 탈(하회탈·방상시 같은 벽사면) 느낌.

> ⚠️ **소프트 글로우 금지.** 시퍼런 눈불도 발광이 아니라 **하드 하이라이트 도트(밝은 시안/흰 사각)** 로만.
> ⚠️ 색 앵커 = **상아빛 탈면**(뼈·나무 가면) + **자주빛 그림자 자락** + **시안 눈불**. 3종이 같은 팔레트 가족으로 읽혀야 한다.
> ⚠️ 방향은 기존 종과 동일하게 **화면 왼쪽으로 살짝 튼 3/4 정면**. 접지 없이 공중에 떠 있는 실루엣. 완전 측면·완전 정면 금지.

> 업로드: `art_inbox/creatures_pixel/` (파일명 자유 — 내가 id 정리·변환)
> URL: https://github.com/ereneren-lab/spirit-grove/upload/claude/continue-c4gyj2/art_inbox/creatures_pixel

---

## `hexmask` — 저주탈 (ghost, 1단)

**컨셉:** 버려진 사당에 걸려 있던 작은 **저주받은 탈**. 밤이면 스스로 떠올라 나직이 웃는다. 상아빛 탈면 하나가 둥실, 눈구멍에 시퍼런 눈불 두 점, 아래로 짧은 그림자 꼬리 한 자락. 아직 작고 귀엽지만 으스스한 첫 단계.

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
A small floating CURSED MASK ghost, a GHOST type — a pale ivory bone/wood mask (like a
Korean folk exorcism mask) hovering in the air. Two glowing CYAN EYE-FLAMES in the eye
holes (flat bright cyan pixels with a white highlight square each, hard pixel flames NOT
soft glow). A small dark mouth slit. Below the mask hangs a short tattered PURPLE SHADOW
WISP tail. Ivory-pale mask with darker shade, purple shadow accents, cyan eye-flames.
Cute but eerie, clearly the first stage of a haunted-mask line.
```
**Negative**
```
painterly, watercolor, gouache, anime illustration, realistic, soft shading, rim light,
glow, bloom, lens flare, translucent particles, blurry, anti-aliased edges, gradient,
3D render, drop shadow, ground shadow, background plate, card frame, sticker border,
neon, text, watermark, signature, multiple creatures, cropped, human face, person,
skin, hair, cute animal, fur
```

---

## `wraithmask` — 탈망령 (ghost, 2단)

**계승(유지):** 저주탈의 **상아빛 탈면 + 시안 눈불**. 짧던 그림자 꼬리가 이제 **너덜너덜한 그림자 몸(자락)** 으로 자랐다.
**성장:** 탈 아래로 찢긴 천 같은 자주빛 그림자 몸이 넓게 드리우고, 그 속에서 **두 유령 손(그림자 팔)** 이 뻗어 나온다. 지나는 이의 이름을 부르며 뒤를 따르는 원귀의 전 단계.

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
A floating WRAITH wearing a pale ivory mask, a GHOST type, evolved from a small cursed
mask. The same ivory mask face with two CYAN EYE-FLAMES (flat cyan, white highlight, NOT
glowing). Below the mask flows a ragged torn-cloth PURPLE SHADOW BODY, wispy and
tattered at the bottom edges. Two thin ghostly SHADOW ARMS reach out from the shroud.
Ivory mask, purple/dark violet shroud with a lighter purple highlight, cyan eye-flames.
Eerie and sorrowful, a mid-stage vengeful spirit.
```
**Negative**
```
painterly, watercolor, gouache, anime illustration, realistic, soft shading, rim light,
glow, bloom, lens flare, translucent particles, blurry, anti-aliased edges, gradient,
3D render, drop shadow, ground shadow, background plate, card frame, sticker border,
neon, text, watermark, signature, multiple creatures, cropped, human face, person,
skin, hair, legs, feet, fur
```

---

## `dreadmask` — 원귀탈 (ghost, 3단, 최종)

**계승(유지):** 탈망령의 **상아빛 탈면 + 자주 그림자 + 시안 눈불**. 이제 **수많은 원한이 겹쳐 굳은 큰 탈귀**로 완성.
**성장:** 더 크고 위압적인 탈(이마에 뿔 같은 돌기, 벽사면의 위엄), 텅 빈 눈구멍에서 냉기가 새어나온다(강조된 시안 눈불). 넓게 드리운 원한의 그림자 자락과 곁에서 뻗은 여러 유령 손. 방 안의 온기를 앗아가는 라인의 정점.

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
A large imposing MASKED WRAITH, a GHOST type, the final evolution of a haunted-mask line
— a big ivory exorcism mask hardened from layered grudges, with small horn-like ridges
on the brow (a fearsome Korean folk demon-mask look). Empty eye holes leaking cold CYAN
EYE-FLAMES (flat bright cyan with white highlight squares, bigger than the previous
stage, hard pixel flames NOT soft glow). A wide draping PURPLE SHADOW SHROUD flows below,
tattered at the edges, with several reaching ghostly SHADOW HANDS at its sides. Ivory
mask, deep purple shroud with lighter purple highlights, cold cyan eye-flames. Towering,
vengeful, chilling — the peak of the line.
```
**Negative**
```
painterly, watercolor, gouache, anime illustration, realistic, soft shading, rim light,
glow, bloom, lens flare, translucent particles, blurry, anti-aliased edges, gradient,
3D render, drop shadow, ground shadow, background plate, card frame, sticker border,
neon, text, watermark, signature, multiple creatures, cropped, human face, person,
skin, hair, legs, feet, fur, holding a weapon
```

---

## 받은 뒤 절차 (코드 0 — 파일만)

1. `art_inbox/creatures_pixel/`에 세 장 업로드(파일명 자유, 어느 게 어느 단계인지만 알려줄 것).
2. 내가 `make_creature_art.py --hires --size 256`로 반입 → `assets/art/creatures/{hexmask,wraithmask,dreadmask}.webp` **덮어쓰기**.
3. manifest·PAINT_ART는 이미 3종 등록돼 있으므로 재빌드만.
4. `bash scripts/verify.sh dist/spirit_grove_3d.html` 재확인: PAINT_ART/DEX 대조, `ghost_line_test`·`dead_content_test` 통과.

## 검수 포인트(이 라인 특화)

- [ ] 3종이 **같은 상아탈+자주그림자+시안눈불 가족**으로 읽혀 "성장한 같은 존재"로 보이는가
- [ ] 형태 진화가 읽히는가: **작은 탈(1단) → 그림자 몸이 자란 탈망령(2단) → 큰 원귀탈+뿔+여러 손(3단)**
- [ ] 눈불이 **글로우가 아니라 하드 도트**인가 (스타일 바이블 §2)
- [ ] 접지 없이 **떠 있는** 실루엣인가(다리·발 금지)
- [ ] 기존 고스트(도깨비불 wispkin·청사초롱 lanternox)와 **실루엣이 다른가**(탈 vs 불꽃/등불)
- [ ] 3단이 화면에서 **가장 크고 위압적**으로 라인의 정점으로 읽히는가
