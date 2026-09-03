# 강철 정령 라인 3종 픽셀 아트 프롬프트 (쇳덩이·무쇠병·강철거병)

작성 2026-09-03 · 규격: `2026-08-12_spirit-grove_creature-pixel-style-bible.md`
목적: 희소 타입(강철) 보강으로 추가된 **순수 강철 3단 라인**의 픽셀 아트.

> ⚠️ **이 라인은 이미 플레이 가능하다.** 절차적(코드로 그린) 스프라이트가 `assets/art/creatures/{orelet,ironforge,steelgolem}.webp`에 들어가 있어 매니페스트·PAINT_ART/DEX 대조·도감 렌더가 전부 통과한다. 이 문서는 **선택적 폴리시 패스** — 그 절차적 도트를 스타일 바이블 손그림 픽셀로 교체하고 싶을 때 쓴다. 안 넣어도 게임은 정상이다.

**원칙:** 스타일 바이블 불변 규격(하드 1px 외곽선 · 플랫 셀 셰이딩 2단 · AA/디더링/글로우 금지 · 24색 이내 · 투명 배경 · 96×96 · 정사각 중앙 정렬)을 그대로 따른다.

라인 연속성: **쇳덩이(1단) →(Lv18) 무쇠병(2단) →(Lv36) 강철거병(3단)** — 전부 순수 **steel**, 물리 어태커(atk>spa). 색 앵커를 라인 전체에 고정한다: **차가운 강철 회색 갑각 + 놋쇠 리벳(주황 포인트) + 시안 코어(가슴/눈)**. 1단의 **둥근 무쇠 덩이**가 2단에서 **스스로 벼린 갑주 병사**로, 3단에서 **광산을 지키는 강철 거병**으로 자란다. 형태는 둥근 광물 → 각진 갑주 → 육중한 인간형으로 진화.

> ⚠️ **시안 코어는 발광이 아니다.** "어둠 속 빛나는 눈/가슴"도 소프트 글로우가 아니라 **하드 하이라이트 도트(작은 밝은 시안/흰 사각)** 로만. 스타일 바이블 §2 위반 금지.
> ⚠️ 색 앵커 = **강철 회색**(무채색 판갑) + **놋쇠 주황 리벳**(관절·볼트) + **시안**(코어·눈). 라인 3종이 같은 팔레트 가족으로 읽혀야 "성장한 같은 존재"가 된다.
> ⚠️ 방향은 기존 종과 동일하게 **화면 왼쪽으로 살짝 튼 3/4 정면**(코드의 `.me` 좌우 반전과 맞물림). 완전 측면·완전 정면 금지.

> 업로드: `art_inbox/creatures_pixel/` (파일명 자유 — 내가 id 정리·96px 변환)
> URL: https://github.com/ereneren-lab/spirit-grove/upload/claude/continue-c4gyj2/art_inbox/creatures_pixel

---

## `orelet` — 쇳덩이 (steel, 1단)

**컨셉:** 광맥에서 굴러나온 **살아있는 둥근 무쇠 덩이**. 둥글넓적한 몸에 작은 볼트 뿔 하나, 아래쪽에 놋쇠 리벳 몇 개. 어둠 속에서 **두 개의 시안 눈**이 반짝인다(하드 도트). 아직 손발이 뚜렷하지 않은 광물 상태 — 순하고 야무진 인상, "굴러다니는 아기 쇳덩이".

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
A small round living NUGGET OF IRON, a STEEL type, like a chunk of ore rolled out of a
mine vein. Rounded chunky steel-gray body with a plated metal surface, a single small
bolt-horn on top, and a few brass rivets (flat orange squares) near the bottom. Two
small CYAN EYES made of flat bright cyan pixels with one white highlight square each,
gleaming as if in the dark (hard pixel highlights, NOT glowing). Cool gray steel armor,
brass-orange rivet accents, cyan eye cores. Cute and sturdy, clearly the first mineral
stage of a steel line, no clear limbs yet.
```
**Negative**
```
painterly, watercolor, gouache, anime illustration, realistic, soft shading, rim light,
glow, bloom, lens flare, translucent particles, blurry, anti-aliased edges, gradient,
3D render, drop shadow, ground shadow, background plate, card frame, sticker border,
glass reflection, neon, text, watermark, signature, multiple creatures, cropped,
extra limbs, human, humanoid, soft glowing aura, wings
```

---

## `ironforge` — 무쇠병 (steel, 2단)

**계승(유지):** 쇳덩이의 **강철 회색 갑각 + 놋쇠 리벳 + 시안 코어**. 둥글던 덩이가 이제 **스스로 두들겨 벼린 갑주 병사**로 섰다.
**성장:** 각진 육각 몸통에 **양 어깨 판갑**, 가슴 한가운데 **시안 화로 코어**(식지 않는 불), 좁은 **바이저 슬릿 눈**, 리벳 박힌 다리. 방패를 내리지 않는 굳건한 병사 인상 — 1단보다 크고 각지고 무겁다.

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
An armored STEEL soldier that forged its own body, clearly evolved from a round iron
nugget. Angular hexagonal steel-gray torso with layered SHOULDER PLATES, riveted legs,
and a narrow dark VISOR SLIT for eyes with a thin cyan glint. In the center of its chest
is a square CYAN FORGE CORE (flat bright cyan pixels with a white highlight square, like
an inner furnace that never cools — a hard pixel core, NOT glowing). Brass-orange rivets
at the joints and armor seams. Cool gray plate armor, brass rivet accents, cyan chest
core. Sturdy dutiful warrior stance, heavier and more angular than its first stage,
never lowering its guard.
```
**Negative**
```
painterly, watercolor, gouache, anime illustration, realistic, soft shading, rim light,
glow, bloom, lens flare, translucent particles, blurry, anti-aliased edges, gradient,
3D render, drop shadow, ground shadow, background plate, card frame, sticker border,
glass reflection, neon, text, watermark, signature, multiple creatures, cropped,
extra limbs, human, soft glowing aura, wings
```

---

## `steelgolem` — 강철거병 (steel, 3단)

**계승(유지):** 무쇠병의 **강철 판갑 + 놋쇠 리벳 + 시안 코어**. 이제 **광산 깊은 곳을 지키는 육중한 강철 거병**으로 완성됐다.
**성장:** 블록형 머리 + 바이저, 넓은 어깨, 두꺼운 팔뚝과 **큰 주먹**, 굵은 다리와 발. 가슴의 코어가 **크게 커져** 라인의 정점을 알린다(여전히 하드 도트, 발광 아님). 코어가 울릴 때 산이 떨리는 위엄 — 크고 무겁고 압도적인 인간형 실루엣.

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
A massive humanoid STEEL GOLEM, guardian of the deep mines, the final evolution of a
steel armor line. Blocky steel-gray head with a dark VISOR and a thin cyan slit, broad
angular shoulders with plates, thick riveted arms ending in big BLOCKY FISTS, heavy legs
and slab feet. A large square CYAN CORE in the center of its chest — bigger than the
previous stage, marking the peak of the line (flat bright cyan pixels with white
highlight squares, a hard pixel core, NOT glowing). Brass-orange rivets across joints
and armor seams. Cool gray heavy plate armor, brass rivet accents, big cyan chest core.
Towering, heavy, imposing stance — a mountain that walks, powerful and stoic.
```
**Negative**
```
painterly, watercolor, gouache, anime illustration, realistic, soft shading, rim light,
glow, bloom, lens flare, translucent particles, blurry, anti-aliased edges, gradient,
3D render, drop shadow, ground shadow, background plate, card frame, sticker border,
glass reflection, neon, text, watermark, signature, multiple creatures, cropped,
extra limbs, soft glowing aura, wings
```

---

## 받은 뒤 절차 (코드 0 — 파일만)

1. `art_inbox/creatures_pixel/`에 세 장 업로드(파일명 자유).
2. 내가 `make_creature_art.py`로 96px/24색 변환 → `assets/art/creatures/{orelet,ironforge,steelgolem}.webp` **덮어쓰기**(지금 있는 절차적 스프라이트를 교체).
3. manifest·PAINT_ART는 이미 3종 등록돼 있으므로 추가 작업 불필요 — `build.py` 재빌드만.
4. `bash scripts/verify.sh dist/spirit_grove_3d.html` 재확인: PAINT_ART/DEX 대조(안덮인 0), `steel_line_test`·`dead_content_test` 통과.

## 검수 포인트(이 라인 특화)

- [ ] 3종이 **같은 강철회색+놋쇠+시안 가족**으로 읽혀 "성장한 같은 존재"로 보이는가
- [ ] 형태 진화가 읽히는가: **둥근 광물(1단) → 각진 갑주 병사(2단) → 육중한 인간형 거병(3단)**
- [ ] 시안 코어·눈이 **글로우가 아니라 하드 도트**인가 (스타일 바이블 §2 위반 금지)
- [ ] 순수 강철답게 무채색 판갑 비중이 크고, 주황 리벳이 포인트로만 들어갔는가
- [ ] 주인공·NPC 도트와 같은 굵기 계열(같은 화면 스크린샷)
- [ ] 3단이 화면에서 **가장 크고 무겁게** 느껴져 라인의 정점으로 읽히는가
