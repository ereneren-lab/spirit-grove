# 희소 타입 보강 — 신규 진화 라인 3종 설계 + 픽셀 아트 프롬프트

작성 2026-08-27 · 근거: 도감 100종 타입 분포 실측(격투·페어리·악·강철·독·벌레가 각 2종뿐)
목적: 팀 빌딩 다양성이 낮은 **격투·페어리·악** 세 타입에 두 번째 진화 라인을 추가한다.
규격: `2026-08-12_spirit-grove_creature-pixel-style-bible.md`(하드 1px 외곽선·플랫 셀 셰이딩·24색 이내·투명 배경·96×96 원본은 256px 고해상 파이프라인으로 반입).

> **워크플로(기존 벌레 라인과 동일)**
> 1. 아래 프롬프트로 6종 픽셀 아트 생성 → `art_inbox/creatures_pixel/`에 업로드(파일명 자유, 내가 id 매칭).
> 2. 내가 고해상 변환(`make_creature_art --hires --size 256 --quality 82`) + dex/능력/학습셋/조우풀/진화 배선 + 카운트 테스트 갱신.
> 3. **아트가 오기 전엔 dex에 넣지 않는다** — 방금 통일한 고해상 화풍을 SVG 플레이스홀더로 깨뜨리지 않기 위해서.
>    (기존 실루엣과 겹치지 않도록 신규 3라인은 각각 원숭이·반딧불·까마귀로 차별화했다.)

---

## 라인 1 — 격투(fight): **숲 권법 계열** (기존 도장강아지→태권무제와 다른 "숲 수도승" 결)

물리 어태커. 기존 격투가 인간·개였다면 이 라인은 **숲의 원숭이 무술가**.

### `barkfist` — 나무주먹몽키 (fight, 1단) 🐒
- base `{hp:48, atk:18, def:14, spd:16, spa:9, spDef:12}` · moves `["tackle","karatechop"]`
- learn `[[10,"machpunch"],[16,"focusenergy"],[24,"closecombat"]]` · evolveTo `zenapex` · evolveLv `30`
- ability: `guts`(상태이상 시 공격↑) 제안
- **조우:** 이끼 골짜기(mosshollow) / 깊은 숲 낮

### `zenapex` — 참선권왕 (fight, 3단) 🥋
- base `{hp:80, atk:33, def:24, spd:25, spa:12, spDef:20}` · moves `["karatechop","closecombat","machpunch","focusenergy"]`
- learn `[[40,"aurasphere"]]` · ability: `guts`

**프롬프트 — barkfist**
```
96x96 pixel art creature sprite, GBA / 16-bit JRPG battle sprite, 3/4 view facing slightly LEFT.
Hard 1px dark outline, flat cel shading (max two shade steps + one hard highlight), <=24 colors,
NO anti-aliasing / gradients / dithering / glow. Transparent background, centered with small margin.
A small round FOREST MONKEY martial-arts trainee. Mossy brown-green fur, oversized padded fists wrapped
in leaf-bandages, a tiny bamboo headband, big determined eyes, a curled tail. Standing in a cute low
fighting stance. Earthy brown + moss green + cream wrap + dark brown outline palette. Clearly a stage-1
FIGHTING type, plucky and small.
```
**프롬프트 — zenapex**
```
96x96 pixel art creature sprite, GBA / 16-bit JRPG battle sprite, 3/4 view facing slightly LEFT.
Hard 1px dark outline, flat cel shading (max two shade steps + one hard highlight), <=24 colors,
NO anti-aliasing / gradients / dithering / glow. Transparent background, centered with small margin.
A tall wise FOREST APE martial master, evolved from a small mossy monkey. Broad shoulders, forearms
wrapped in worn leaf-cloth, a knotted rope belt, calm half-closed eyes, a single bamboo staff-less
zen pose (fists raised). Deep moss-green and bark-brown fur, cream wraps, a small carved wooden bead
necklace. Dignified, powerful, a FIGHTING type. Moss green + bark brown + cream + dark outline palette.
```

---

## 라인 2 — 페어리(fairy): **반딧불 요정 계열** (기존 요정봉오리→꽃요정과 다른 "빛" 결)

특수 어태커 + 스피드. 기존 페어리가 꽃이라면 이 라인은 **반딧불/빛의 요정** — `fireflyway`(반딧불길)에 딱 맞는다.

### `glimmite` — 반디요정 (fairy, 1단) ✨
- base `{hp:46, atk:9, def:12, spd:17, spa:19, spDef:15}` · moves `["tackle","fairywind"]`
- learn `[[12,"dazzlinggleam"],[20,"confusion"],[26,"moonblast"]]` · evolveTo `lumenfae` · evolveLv `30`
- ability: `levitate` 제안
- **조우:** 반딧불길(fireflyway) / 정원(garden) 밤

### `lumenfae` — 빛의요정 (fairy, 3단) 🧚
- base `{hp:74, atk:12, def:20, spd:32, spa:33, spDef:24}` · moves `["fairywind","dazzlinggleam","moonblast","psybeam"]`
- learn `[[40,"recover"]]` · ability: `levitate`

> ⚠️ 스타일 바이블상 **소프트 글로우 금지** — "빛난다"는 발광이 아니라 **하드 하이라이트 도트(작은 흰 사각)** 로만.

**프롬프트 — glimmite**
```
96x96 pixel art creature sprite, GBA / 16-bit JRPG battle sprite, 3/4 view facing slightly LEFT.
Hard 1px dark outline, flat cel shading (max two shade steps + one hard highlight), <=24 colors,
NO anti-aliasing / gradients / dithering / NO soft glow (use hard highlight square dots for sparkle).
Transparent background, centered with small margin.
A tiny cute FIREFLY FAIRY sprite. Round pale-yellow lantern belly, two small translucent-look wings
drawn as flat divided color blocks (NOT a gradient), little antennae with round tips, big gentle eyes.
A few hard white highlight squares suggest twinkling light. Pale gold + mint + lavender + dark outline
palette. Clearly a stage-1 FAIRY type, airy and small.
```
**프롬프트 — lumenfae**
```
96x96 pixel art creature sprite, GBA / 16-bit JRPG battle sprite, 3/4 view facing slightly LEFT.
Hard 1px dark outline, flat cel shading (max two shade steps + one hard highlight), <=24 colors,
NO anti-aliasing / gradients / dithering / NO soft glow (hard highlight square dots only).
Transparent background, centered with small margin.
An elegant LIGHT FAIRY, evolved from a small firefly sprite. Slender graceful body, two large gossamer
wings as flat divided teal/gold color blocks, a small lantern-orb held in delicate hands (rendered as a
flat orb with one hard highlight, NOT glowing), feathery antennae, serene eyes. Pale gold + teal + mint +
lavender + dark outline palette. Graceful hovering pose, a fast special FAIRY attacker.
```

---

## 라인 3 — 악(dark): **밤까마귀 계열** (기존 그믐고양이→심연표범과 다른 "새" 실루엣)

물리 + 스피드, `dark/flying` 이중 타입(비행 커버도 겸함). 밤/유적에 어울린다.

### `duskbeak` — 땅거미새 (dark/flying, 1단) 🐦‍⬛
- base `{hp:46, atk:17, def:12, spd:19, spa:11, spDef:12}` · moves `["tackle","peck"]`
- learn `[[10,"suckerpunch"],[16,"gust"],[22,"crunch"]]` · evolveTo `ravenveil` · evolveLv `32`
- ability: `keeneye`/기존 목록에 맞는 것 제안
- **조우:** 밤(NIGHT_MONS) / 유적(ruins)

### `ravenveil` — 흑요까마귀 (dark/flying, 3단) 🌑
- base `{hp:74, atk:31, def:20, spd:33, spa:14, spDef:18}` · moves `["crunch","suckerpunch","darkpulse","peck"]`
- learn `[[40,"nightburst"]]`

**프롬프트 — duskbeak**
```
96x96 pixel art creature sprite, GBA / 16-bit JRPG battle sprite, 3/4 view facing slightly LEFT.
Hard 1px dark outline, flat cel shading (max two shade steps + one hard highlight), <=24 colors,
NO anti-aliasing / gradients / dithering / glow. Transparent background, centered with small margin.
A small mischievous DUSK CROW chick. Fluffy charcoal-purple plumage, an oversized amber beak, one
crooked tail feather, big cunning yellow eyes, tiny clawed feet. Perched cheeky pose. Charcoal +
dusk purple + amber + dark outline palette. Clearly a stage-1 DARK/FLYING type, sly and small.
```
**프롬프트 — ravenveil**
```
96x96 pixel art creature sprite, GBA / 16-bit JRPG battle sprite, 3/4 view facing slightly LEFT.
Hard 1px dark outline, flat cel shading (max two shade steps + one hard highlight), <=24 colors,
NO anti-aliasing / gradients / dithering / glow. Transparent background, centered with small margin.
A sleek ominous RAVEN, evolved from a small dusk crow. Glossy black-purple feathers with sharp
swept wings spread slightly, a long amber beak, piercing yellow eyes, a fanned tail. A few violet
feather accents. Menacing elegant pose. Black-purple + violet + amber + dark outline palette.
A fast DARK/FLYING attacker.
```

---

## 반영 후 밸런스·테스트 메모

- 각 라인 3단 스탯 총합 190~195 — 기존 3단(태권무제 188·꽃요정 174·심연표범 178)과 같은 대역, `balance_test` 통과 예상.
- 신규 무브 **불필요** — 6종이 쓰는 기술 전부 실존(격투 karatechop·machpunch·closecombat·focusenergy·aurasphere / 페어리 fairywind·dazzlinggleam·moonblast·recover + psybeam·confusion / 악·비행 crunch·suckerpunch·darkpulse·nightburst·peck·gust).
- 반영 시 갱신할 카운트 의존 테스트: `dex_flavor`·`shinydex_stats`·`rules_unit`(100→106), `content_pack`, `dexnew`.
- 조우 배선: fireflyway(반디요정), mosshollow(나무주먹몽키), NIGHT_MONS/ruins(땅거미새) + 각 진화형은 상위 조우/진화로 획득.
