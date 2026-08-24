# H3-9 타입별 네이티브 정령 라인 — 설계 + 아트 프롬프트 (6종 라인 · 12정령)

작성 2026-08-24 · 규격: `2026-08-12_spirit-grove_creature-pixel-style-bible.md`
목적: 신규 타입들이 **재타이핑이 아닌 "자기 정령"** 을 갖게 한다. 이번 세션에 추가된 6타입(격투·에스퍼·페어리·고스트·악·강철)에 **고유 2단 진화 라인**을 하나씩 부여.

> **워크플로(기존과 동일):** 이 문서의 프롬프트로 아트를 생성 → `art_inbox/creatures_pixel/`에 업로드 →
> 내가 id 정리·96px 변환 후 **타입별로 하나씩 게임에 통합**(dex 엔트리·야생 스폰·회귀). 아트가 없어도 게임은
> `creatureVisual`이 **절차적 SVG 플레이스홀더**로 렌더하므로, 데이터만 먼저 넣어도 안 깨진다.
>
> 업로드 URL: https://github.com/ereneren-lab/spirit-grove/upload/claude/continue-c4gyj2/art_inbox/creatures_pixel

---

## 설계 요약 (dex 스펙 — 통합 시 그대로 붙여넣기)

기존 스탯 스케일 앵커: **1단 총합 ~115, 최종 ~190** (예: 화염랑 186, 결정룡 190). 기술키는 실제 존재하는 것만 사용.

| 타입 | id · 이름 · 이모지 | 타입 | tier | base(hp/atk/def/spd/spa/spDef) | 진화 | 특성 |
|---|---|---|---|---|---|---|
| 격투 | `pummelpup` 도장강아지 🐕 | fight | 1 | 50/16/13/14/9/12 | →taekwarrior L30 | guts |
| 격투 | `taekwarrior` 태권무제 🥋 | fight | 3 | 80/30/22/26/12/18 | — | guts |
| 에스퍼 | `psykit` 요술여우 🦊 | psychic | 1 | 46/10/12/16/20/14 | →mystfox L32 | insomnia |
| 에스퍼 | `mystfox` 구미술호 🦊 | psychic | 3 | 76/16/20/28/30/20 | — | insomnia |
| 페어리 | `pixibud` 요정봉오리 🌸 | fairy | 1 | 50/9/13/13/18/16 | →blossfae L30 | naturalcure |
| 페어리 | `blossfae` 꽃요정 🧚 | fairy | 3 | 76/14/20/26/30/24 | — | naturalcure |
| 고스트 | `wispkin` 도깨비불 👻 | ghost | 1 | 44/10/12/20/20/14 | →lanternox L31 | levitate |
| 고스트 | `lanternox` 청사초롱귀 🏮 | ghost | 3 | 72/16/22/26/32/22 | — | levitate |
| 악 | `nightkit` 그믐고양이 🐈‍⬛ | dark | 1 | 46/16/12/18/12/12 | →voidpanther L32 | guts |
| 악 | `voidpanther` 심연표범 🐆 | dark | 3 | 76/30/20/30/14/18 | — | guts |
| 강철 | `coglet` 톱니벌레 ⚙️ | steel | 1 | 50/15/20/10/9/14 | →gearclad L30 | sturdy |
| 강철 | `gearclad` 강철갑충 🛡️ | steel/bug | 3 | 80/26/34/14/18/22 | — | sturdy |

**제안 학습셋(기술키 검증 완료)**
- `pummelpup`: moves[tackle,growl] learn[[8,karatechop],[14,machpunch],[20,focusenergy]] · `taekwarrior`: moves[karatechop,machpunch,closecombat,focusenergy] learn[[40,aurasphere]]
- `psykit`: moves[tackle,confusion] learn[[10,psybeam],[18,zenheadbutt]] · `mystfox`: moves[psybeam,psystrike,confusion,zenheadbutt] learn[[40,recover]]
- `pixibud`: moves[tackle,fairywind] learn[[12,dazzlinggleam],[20,growl]] · `blossfae`: moves[fairywind,dazzlinggleam,moonblast,playrough] learn[[40,recover]]
- `wispkin`: moves[lick,ominouswind] learn[[12,shadowsneak],[22,shadowball]] · `lanternox`: moves[shadowball,ominouswind,shadowsneak,lick] learn[[40,lullaby]]
- `nightkit`: moves[tackle,growl] learn[[10,suckerpunch],[18,crunch]] · `voidpanther`: moves[crunch,suckerpunch,nightburst,darkpulse] learn[[40,darkpulse]]
- `coglet`: moves[tackle,metalclaw] learn[[14,bulletpunch],[22,mirrorshot]] · `gearclad`: moves[metalclaw,bulletpunch,mirrorshot,flashcannon] learn[[40,flashcannon]]

**스폰 배치(통합 시)**: 각 라인의 1단은 해당 타입이 어울리는 지역 야생 풀에, 최종은 진화로만. ⚠️ 스폰 편입은 매번 `balance_test`·`region_content_test` 재측정(makeMon 공유).

---

## 아트 프롬프트

**모든 프롬프트 = 아래 PREFIX + 각 정령 「설명」 + NEGATIVE 를 이어붙여 사용.** (스타일 바이블 준수 — 소프트 글로우·그라데이션·발광 금지.)

### PREFIX (고정 · 맨 앞)
```
96x96 pixel art creature sprite for a 2D JRPG, GBA / 16-bit era battle sprite look.
Single creature, full body, one idle battle pose, seen in 3/4 view facing slightly
toward the LEFT of the frame. Chunky readable silhouette. Hard 1px dark outline in a
dark shade of the creature's own color, flat cel shading with at most two shade steps
per material and one hard highlight, limited palette of at most 24 colors, NO
anti-aliasing, NO gradients, NO dithering, NO soft glow, NO blur. Crisp square pixels
on a 96x96 grid. Fully transparent background — no backdrop, no frame, no card, no
ground circle, no drop shadow. Creature centered with a small even margin on all sides.
```
### NEGATIVE (고정 · 맨 뒤)
```
painterly, watercolor, gouache, anime illustration, realistic, soft shading, rim light,
glow, bloom, lens flare, translucent particles, blurry, anti-aliased edges, gradient,
3D render, drop shadow, ground shadow, background plate, card frame, sticker border,
glass reflection, text, watermark, signature, multiple creatures, cropped, extra limbs
```

---

### 격투 — `pummelpup` 도장강아지 (1단)
```
A small round puppy dressed as a martial artist. Cream-tan fur, a white taekwondo
uniform (dobok) with a tiny yellow belt, little bandaged fists held up in a boxing
guard, round determined eyes, one ear flopped. Eager crouched fighting stance. Warm
tan + white gi + yellow belt + red bandage accent palette.
```
### 격투 — `taekwarrior` 태권무제 (최종)
```
A tall lean bipedal martial-arts hound, evolved fighter. Muscular tan-and-grey body in
a worn black-belt dobok open at the chest, wrapped fists and shins, a proud scar over
one eye, ears back in focus, one arm drawn back for a straight punch. Confident heroic
stance. Tan + charcoal gi + black belt + red wrap palette.
```

### 에스퍼 — `psykit` 요술여우 (1단)
```
A tiny mystic fox kit floating just off the ground. Pale lilac fur, cream muzzle and
paw tips, oversized violet eyes, a small third-eye mark on the forehead, two curled
tails, faint arcane rune shapes drawn as flat solid pixel marks (not glowing) on the
cheeks. Cute levitating pose. Lilac + cream + violet + soft gold rune palette.
```
### 에스퍼 — `mystfox` 구미술호 (최종)
```
An elegant nine-tailed mystic fox, evolved psychic. Silver-lilac fur, a fan of nine
flowing tails each tipped in violet, a glowing-free third eye rendered as a flat gold
diamond on the brow, small hovering flat rune tiles around the shoulders (solid pixels,
no glow), serene narrow eyes. Regal floating pose. Silver-lilac + violet tail tips +
gold rune palette.
```

### 페어리 — `pixibud` 요정봉오리 (1단)
```
A tiny flower-bud sprite. A round pink flower bud as the body with a cute face peeking
from the half-open petals, two tiny leaf arms, a small green stem-tail, big glossy eyes,
pink cheek dots. Sitting cheerfully. Pink petals + rose + leaf-green + cream palette.
```
### 페어리 — `blossfae` 꽃요정 (최종)
```
A dainty blossom fairy, evolved fairy. A slender sprite with a full-bloom pink-and-white
flower skirt, translucent-looking but flat cel-shaded petal wings (hard edges, no glow),
a flower crown, delicate leaf arms, gentle smiling eyes. Graceful hovering pose. Pink +
white blossom + leaf-green + soft gold pollen accent palette.
```

### 고스트 — `wispkin` 도깨비불 (1단)
```
A tiny mischievous will-o'-wisp spirit. A round wispy teal-blue flame body with a
ghostly forked tail-tip, two small floating mitten-hands, big hollow white eyes and a
wide toothy grin, a small floating dokkaebi horn nub. Bobbing playful pose. Teal-blue
flame + pale cyan + hollow-white eyes + dark navy core palette.
```
### 고스트 — `lanternox` 청사초롱귀 (최종)
```
A ghostly lantern spirit, evolved ghost. A tall spectral figure holding (and partly
made of) a traditional blue-and-white Korean cheongsachorong lantern, wispy trailing
tendrils instead of legs, long sleeves, a serene masked face lit from within (as flat
solid color, not glow), floating flame motes drawn as solid pixel dots. Haunting elegant
pose. Blue-white lantern + spectral teal + cream paper + dark navy palette.
```

### 악 — `nightkit` 그믐고양이 (1단)
```
A tiny sleek black kitten of the new moon. Charcoal-black fur with a faint crescent-moon
mark on the forehead, sharp yellow slit eyes, small fangs, a crooked tail, one paw
raised mid-swipe. Sly crouched pose. Charcoal-black + dark grey + yellow eyes + thin
purple sheen accent palette.
```
### 악 — `voidpanther` 심연표범 (최종)
```
A lithe shadow panther, evolved dark. Deep black-purple sleek body with faint void-purple
rosette markings, a full crescent-moon crest, glinting golden eyes, muscular predatory
build, low stalking pose ready to pounce. Black-purple + void-violet rosettes + gold
eyes + charcoal palette.
```

### 강철 — `coglet` 톱니벌레 (1단)
```
A tiny armored gear-beetle. A round steel blue-grey beetle whose back shell is a single
toothed gear (cog), small riveted metal legs, big simple eyes under a metal brow, a brass
antenna. Sitting sturdy pose. Steel blue-grey + gunmetal + brass accent + cream palette.
Hard faceted highlight blocks (small white squares), rivets and seams — no glow.
```
### 강철 — `gearclad` 강철갑충 (최종)
```
A hulking armored beetle-tank, evolved steel/bug. A broad steel-plated beetle with
interlocking gear-and-plate armor, two large cog shoulders, heavy riveted forelegs like
pistons, a gunmetal horn, small glowing-free red sensor eyes (flat red squares). Braced
powerful stance. Steel blue-grey + gunmetal + brass gears + red sensor accent palette.
Hard faceted metal highlights, rivets, plate seams — no glow, no gradient.
```

---

## ✅ 통합 완료 (2026-08-24) — 아트 대기(SVG 플레이스홀더)

12종 전부 **게임에 데이터 통합됨**. 아트가 없어 `creatureVisual`이 절차적 **SVG 플레이스홀더**로 렌더한다.
- DEX 86 → **98종**. 1단 6종은 테마 야생 풀(격투=고대유적·에스퍼=달빛화원·페어리=이끼골짜기·고스트=안개늪지·악=수정동굴·강철=버려진갱도), 최종 6종은 `NO_WILD`(진화로만).
- **특성 배정은 편중 상한(≤13) 때문에 문서안에서 일부 조정**: `pummelpup`→급소(sniper), `nightkit`/`voidpanther`→위협(intimidate)(포식자 컨셉). 나머지는 문서대로.
- FLAVOR(분류·키·무게·설명) 12종 추가(진화 시 키·무게 증가 불변식 준수). 회귀 `dex_flavor`·`rules_unit` 카운트 86→98.
- 전 회귀 통과: balance·league·dead_content·ability_expand·region_content·evo·palette_source·type_chart·newtypes.

**아트 도착 시**: 파일명 자유로 업로드 → id 매핑·96px 변환 → `manifest.json` paint에 id 추가하면 SVG가 픽셀아트로 교체된다(코드 수정 불필요).

## 통합 순서 (참고 · 이미 위 순서로 완료)
1. 아트 업로드 → id 매핑·96px 변환(파이프라인 그대로).
2. `src/rules/dex.js`에 2종 dex 엔트리 추가(위 스펙·학습셋), `assets/manifest.json` paint에 id 2개.
3. 야생 스폰 풀(`ENC_POOLS`)에 1단 편입 → `balance_test`·`region_content_test`·`dexnew_test` 재측정.
4. 최종 STAB 확인, `dead_content_test`(학습셋·진화 도달성) 통과.
5. 커밋(타입별). 6타입 = 6커밋으로 안전하게.
