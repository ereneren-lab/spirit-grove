# 정령 픽셀 아트 생성 프롬프트 — Phase 2 (물/얼음 배치 20종)

작성 2026-08-12 · 규격: `2026-08-12_spirit-grove_creature-pixel-style-bible.md`(§3 규격표·§4-1 팔레트 계승표·§4-2 타입 단서·§5 치트시트·§7 검수)
형식: `2026-08-12_spirit-grove_creature-pixel-prompts-phase1.md`(§1 공통 프리픽스·§2 공통 네거티브 — **본문은 복제하지 않고 `[공통 프리픽스]`로만 참조**한다. 생성 시 Phase 1 §1 텍스트를 그대로 각 프롬프트 앞에 붙이고, 네거티브는 Phase 1 §2를 그대로 쓴다.)

> 각 정령의 색·형태·자세는 재설계 2종(개굴알·서리랑)을 제외하고 **`assets/art/creatures/{id}.webp` 현재 페인터리 원본을 직접 보고** 추출했다. 목표는 "새 정령"이 아니라 **"같은 정령의 픽셀 버전"**이다. 재설계 2종은 `evolution-realign-strategy.md` §9-1(G·H)의 새 디자인을 그대로 따른다(원본 그림은 폐기).

---

## 0. 반입 순서 (생성 후 — Phase 1 §0과 동일)

```
① 생성 → art_inbox/creatures/{id}.png   (파일명 = 각 항목의 id)
② python3 scripts/make_creature_art.py         # Phase 1에서 락된 size/colors 값 사용
③ python3 scripts/build.py
④ 전투/도감 스크린샷으로 기존 12종·주인공·NPC와 같은 화면에서 화풍 확증
```

---

## 1. 담당 20종 개요 (라인 · 타입 · 원종 근거)

| 라인 | id (단계) | 타입 | 원종 근거 |
|---|---|---|---|
| 빙구리 | frostfish→sharkfin | ice → ice/rock | 원본 웹피(물고기→상어) |
| 무라리 | otterwave→tidewhale | water | 원본 웹피(수달→고래) |
| 집게공 | nipling→crablord | water/rock | 원본 웹피(게→갑주게) |
| 개굴알 | jellure→swampfrog | water/poison | ⚠️ jellure 재설계(§9-1-G) · swampfrog는 원본 웹피 + 흔적 무늬 추가 |
| 서리강아지 | frostpup→glacibear | ice → ice/rock | frostpup 원본 웹피 · ⚠️ glacibear 재설계(§9-1-H) |
| 월광정/윤슬정 | moonytide · glimmertide | water · water/flying | 원본 웹피(이슬방울의 밤/낮 분기 진화, 이슬방울 자체는 Phase 1 §6 기수록) |
| 물방울 | puddlet→riverine→tidalore | water (점층) | 원본 웹피(물방울→물살도마뱀→해일군주) |
| 동결룡 | cryogon | ice/dragon | 원본 웹피(얼음고래) + 스타일바이블 §4-2 용 단서 override |
| 얼음정 | iceling→frostwyrm | ice → ice/dragon | 원본 웹피(얼음공→얼음용, frostwyrm은 이미 용형) |
| 빙하제 | glaciarch (전설) | ice/dragon | 원본 웹피(얼음골렘) + 용 단서 override, 위엄 최상단 |
| 수룡왕 | aqualord (전설) | water/dragon | 원본 웹피(이미 수룡 형태), 위엄 최상단 |

---

## 2. ❄️ 빙구리 라인 (frostfish→sharkfin, ice→ice/rock) — 계승: **하늘색+흰색 + 머리 위 얼음 크리스탈 가시**

> 계승 항목: 몸 하늘색~흰색 2단 색면, 머리 위 크리스탈 가시(1단 작은 왕관형 → 2단 등지느러미 전체를 감싸는 대형 크리스탈 날로 확장), 크고 반짝이는 파란 눈. 2단은 신규 타입 rock을 크리스탈이 각진 바위질감으로 겸한다(성분은 얼음, 질감만 암석처럼 각지게).

#### `frostfish` — 빙구리 (1단, 통통한 얼음 물고기)
```
[공통 프리픽스]
A chubby cute ice fish. Round pale sky-blue body fading to white belly, small
overlapping scale texture rendered as hard 2-tone facets, a crown of small angular
ice-crystal spikes on top of the head, big sparkly blue eyes, pink cheek blush,
cheerful open smile, small side fins and a light-blue tail fin with a darker blue
edge. Floating pose, slightly puffed chest. Reads round and adorable.
```

#### `sharkfin` — 빙구악 (2단, 얼음 크리스탈 갑주를 두른 상어)
```
[공통 프리픽스]
A sleek ice shark, larger and more angular than its fish form. Dark navy-blue back,
white/pale-blue underside, sharp toothy grin, one blue eye. A LARGE crest of angular
ice-crystal blades runs along the dorsal fin and back — the same crystal-spike motif
from its fish stage now grown into hard, faceted, rock-like ice plates (jagged
geometric facets, not smooth ice). Small crystal shards also line the pectoral fins.
Confident mid-swim pose. Same sky-blue-to-navy + white palette as the fish stage,
crystal crown motif carried into full dorsal armor.
```

---

## 3. 💧 무라리 라인 (otterwave→tidewhale, water) — 계승: **파란 소용돌이(물결) 무늬 + 하늘색 포인트**

> 계승 항목: 수달(1단)의 갈색 털은 고래(2단)에겐 없는 아키타입 전환(§4 규칙3 허용)이지만, 몸에 새겨진 **파란 소용돌이 물결 무늬**와 **하늘색 액센트**가 색·모티프 다리 역할을 해 같은 라인으로 읽히게 한다.

#### `otterwave` — 무라리 (1단, 물구슬을 쥔 수달)
```
[공통 프리픽스]
A cute otter standing upright. Warm brown fur, cream-white muzzle and chest, a
sky-blue tuft of fur on the head like a small crest, big sparkly blue eyes, cheerful
open smile with a small pink tongue. A glowing round water orb held in both front
paws (rendered as a solid pale-cyan sphere with a hard white highlight, not a soft
glow). A dark-blue spiral wave-pattern marking flows down the chest and back like a
tattoo, sky-blue accents on the tail tip and paws. Sitting-back pose.
```

#### `tidewhale` — 무르경 (2단, 물을 뿜는 둥근 고래)
```
[공통 프리픽스]
A round, plump baby whale floating in place. Mid-blue back fading to a cream-white
belly with soft rounded belly ridges, a small fountain of hard-edged water droplets
spouting from the blowhole (solid pale-cyan droplet shapes, no soft spray), big
sparkly blue eyes, pink cheek blush. The SAME dark-blue spiral wave-pattern marking
from the otter stage flows across its back and flanks, sky-blue accents on the small
pectoral fins and tail fluke. Calm floating pose, tail fluke raised slightly.
```

---

## 4. 🦀 집게공 라인 (nipling→crablord, water/rock) — 계승: **파란 돔형 껍질 → 금테 두른 갑주 + 파란 몸체**

> 계승 항목: 1단의 파란 돔 껍질(밝은 물방울 무늬)이 2단에서 금테 두른 짙은 남색 갑주판으로 발전한다. 2단의 흰 갈기·붉은 볏은 "게 전사"로의 아키타입 전환(§4 규칙3)이며, 파란+금색 갑주 계승이 다리를 놓는다.

#### `nipling` — 집게공 (1단, 동글동글한 아기 게)
```
[공통 프리픽스]
A tiny round cute crab. Light sky-blue domed shell with a few small darker-blue spot
highlights (like light bumps, hard-edged), a cream-white belly, big sparkly round
eyes, cheerful open smile, two stubby cream-white claws with pale-blue tips raised
up, small pale-blue crab legs peeking from under the shell. Squat sitting pose.
Reads round and harmless.
```

#### `crablord` — 집게왕 (2단, 갑주를 두른 게 전사)
```
[공통 프리픽스]
An imposing armored crab warrior, larger and more angular than its round baby form.
Deep navy-blue shell now hardened into segmented plate armor with gold trim lines,
a curved red horn/crest rising from the head, a ring of white-gray fur mane framing
the face like a lion's mane, fierce orange eyes, bared teeth. Two massive claws —
navy-blue with gold-trimmed edges and red claw-tips — raised in a battle stance, a
short red cape-like fin trailing behind. Same navy-blue + gold palette rooted in the
baby crab's shell color, dome shell shape now read as the chest armor plate.
```

---

## 5. 🪼 개굴알 라인 (jellure→swampfrog, water/poison) — ⚠️ **재설계(2026-08-12) — jellure 원본(성체 해파리) 폐기**

> 재설계 근거: `outputs/strategy/2026-08-12_spirit-grove_evolution-realign-strategy.md` §9-1-G. 최종형(개굴몽)이 이미 확고한 개구리 정체성을 가져, 1단을 "성체 해파리"가 아니라 **개구리 알/올챙이 무리**로 재정의했다(원칙1 예외 적용). 계승 팔레트(스타일바이블 §4-1 표): **반투명연두+보라반점(독)**, §5 치트시트 "유리질→밝은몸+흰 하이라이트" 적용.

#### `jellure` — 개굴알 (1단, ⚠️ 재설계 — 반투명 독개구리알 무리) — **원본 이미지 참조 금지, 아래 새 디자인만 사용**
```
[공통 프리픽스]
A cluster of translucent poison-frog eggs and tadpoles, NOT a jellyfish. A rounded
gelatinous egg-mass body in bright lime-green, rendered as SOLID color with hard
white highlight patches on the upper curves and a darker green outline to suggest
jelly translucency (do NOT render actual transparency — highlights and outline only,
per style guide). Scattered purple poison spots across the mass (solid purple dot
blocks, hard-edged, not glowing). Several jelly-like tendrils of egg-string dangle
and sway from the underside like thin strands (a deliberate visual echo of the old
jellyfish silhouette, reinterpreted as strung egg-clusters). One or two tiny tadpole
faces with big round cute eyes peek out from within the translucent mass, small open
mouths smiling. Sitting/floating in a shallow puddle. Reads soft, wet, and slightly
eerie-cute — a cluster of life, not a single animal.
```

#### `swampfrog` — 개굴몽 (2단, 원본 충실 + 알 시절 흔적 무늬 추가)
```
[공통 프리픽스]
A cheerful upright frog, teal-green skin with a cream-white belly, three small
leaf-like spikes crowning the head, big round amber eyes, wide open smile, one arm
raised waving, standing on a small lily-pad/puddle base with a sprig of green reed
beside it. A small translucent-looking round bubble ornament at the throat (solid
pale-green block with a hard white highlight dot, per glassy cheat-sheet). ADD: a
few soft-edged-looking but HARD-EDGED lime-green patches with tiny purple spot dots
scattered on the belly and back — a vestige pattern left over from its egg-cluster
larval stage (jellure), tying the two stages together. Confident standing pose.
```

---

## 6. 🐺 서리강아지 라인 (frostpup→glacibear, ice→ice/rock) — ⚠️ **glacibear 재설계(2026-08-12) — 원본(곰) 폐기**

> 재설계 근거: §9-1-H. glacibear는 "빙하곰"이 아니라 **frostpup(강아지)에서 이어지는 늑대**로 재정의했다(개과 안에서만 전환, 곰→늑대 오분류 수정). 계승 팔레트(스타일바이블 §4-1 표): **흰색+하늘색(서리)+회색(바위갑주)**, 2단에 회색 갑주 신규 추가. 귀·주둥이·꼬리 형태는 강아지 시절과 동일하게 유지한다.

#### `frostpup` — 서리멍 (1단, 원본 웹피 그대로 — 복슬복슬한 눈강아지)
```
[공통 프리픽스]
A tiny fluffy white puppy. Thick white fur, pale sky-blue snowflake-shaped markings
on the forehead and ear tips, small hard-edged ice-crystal shard clusters decorating
the ears and tail tip, big sparkly blue eyes, pink cheek blush, cheerful open smile.
A fluffy ring of icy blue-white fur like a collar around the neck. Sitting pose,
round and soft. Pointed upright ears, a rounded snout, a plume tail — note these
exact ear/snout/tail shapes for continuity into its evolved wolf form.
```

#### `glacibear` — 서리랑 (2단, ⚠️ 재설계 — 서리 갑주를 두른 설원 늑대) — **원본 이미지(곰) 참조 금지, 아래 새 디자인만 사용**
```
[공통 프리픽스]
A lean, powerful snow WOLF (NOT a bear) — the grown form of a fluffy ice puppy. Keep
the SAME pointed upright ear shape, rounded snout, and plume tail silhouette as the
puppy stage, now on a sleek muscular quadruped wolf body. Thick white fur with pale
sky-blue frost patterns, the same snowflake forehead mark carried over from the
puppy. Hard-edged ice-crystal shards have fused into armor-like plating across the
back, shoulders, and lower legs — and NEW jagged gray rock-toned plates are mixed in
among the blue crystal shards, like stone growing alongside the frost (new rock-type
armor color). Blue eyes, confident mid-stride stance, bushy tail with a crystal-
shard tip. White + sky-blue + gray palette, wolf silhouette, NO bear features (no
stocky bear build, no bear snout).
```

---

## 7. 🌙 월광정 / 윤슬정 라인 (dewdrop 분기 진화 — 이슬방울은 Phase 1 §6 기수록) — 계승: **이슬방울의 흰 하이라이트 반짝임 + 큰 사파이어색 눈**

> `dewdrop`(이슬방울)이 밤/낮 분기로 진화한다(`evolveBranch`, 레벨24). 이슬방울 자체 프롬프트는 Phase 1에 이미 있으므로 여기서는 두 진화형만 다룬다. 계승 항목: 이슬방울의 하늘색 반짝임(흰 하이라이트 도트)과 크고 맑은 눈이 두 분기 모두에 남되, **밤 분기(moonytide)=차분한 흰빛/크림 달빛 톤**, **낮 분기(glimmertide)=청록 파도 톤+금장식(신규)**로 갈라진다.

#### `moonytide` — 월광정 (밤 분기, 우아한 물의 여우/기린수 정령)
```
[공통 프리픽스]
An elegant fox-kirin water spirit standing on all four legs. Pale sky-blue-to-white
flowing mane and multiple wavy flowing tail-streams rendered as hard-edged ribbon
shapes (NOT soft flowing gradient — solid color bands with 2 shade steps), a pale
cream crescent-moon shape glowing softly behind the head (solid cream block with a
white highlight edge, not a glow effect), sparkling white highlight dots scattered
across the mane echoing its droplet-spirit origin, small jewel-like pale markings
down the legs, calm sapphire-blue eyes. Dignified standing pose, tall and serene.
```

#### `glimmertide` — 윤슬정 (낮 분기, 파도관을 쓴 물의 정령)
```
[공통 프리픽스]
An elegant humanoid-mermaid water spirit. Teal-cyan flowing wave-shaped hair/crest
on the head, a gold collar and chest ornament with a teardrop-shaped cyan gem (solid
gold blocks with hard highlight, no glow), a serpentine tail-like lower body of
layered teal-and-cyan wave shapes instead of legs, arms trailing short fin-fringe.
Broad hard-edged wave-crest shapes flare out from both shoulders like fin-wings — a
visual nod to its water/flying typing while keeping the mermaid silhouette from the
source art. Sparkling white highlight dots on the crest echo the droplet-spirit
origin shared with its night-branch sibling. Bright sapphire-blue eyes, serene
expression, upright floating pose.
```

---

## 8. 🌊 물방울 라인 (puddlet→riverine→tidalore, water 점층) — 계승: **하늘색~짙은 파랑 색면 + 물결 볏(頭飾)이 단계마다 확장**

> 계승 항목: 1단 앞머리의 작은 물방울 컬(curl)이 → 2단에서 등줄기 지느러미 볏으로 → 3단에서 거대한 파도형 볏/갈기로 확장된다. 크림색 배(1·2단 공통)와 사파이어 눈은 3단까지 유지.

#### `puddlet` — 또랑이 (1단, 또랑이 컬을 가진 물 정령)
```
[공통 프리픽스]
A tiny round living water-blob spirit. Bright cyan-blue body rendered as SOLID color
with a hard white highlight patch on the upper body and a slightly darker blue
outline to suggest translucency (do NOT make it transparent). A single curled
water-drip shape sticking up from the top of the head like a wave curl (this exact
curl motif carries into later evolutions as a growing crest). Big sparkly blue eyes,
tiny stubby arms and feet, cheerful open smile. Sitting on a small flat puddle base.
```

#### `riverine` — 물살정 (2단, 날렵한 물살 도마뱀)
```
[공통 프리픽스]
A sleek quadruped river-lizard spirit, larger and faster-looking than its blob form.
Teal-blue scaled body with a cream-white belly marked by a subtle dark-blue spiral
swirl pattern, a wavy blue crest/mane running from the head down the neck — the SAME
curl motif from the puddlet's head-drip, now grown into a full flowing crest of
hard-edged wave-shaped spikes. A small orange-gold streak marking down the snout,
spiky fins along the back, sharp claws, bright blue eyes. Dynamic low crouching
stance, ready to dart forward.
```

#### `tidalore` — 해일군주 (3단, 위엄 있는 파도의 군주)
```
[공통 프리픽스]
A majestic long serpentine sea sovereign, the grand final form of the water-drop
line. Deep blue back fading to a cream-white belly, an ENORMOUS wave-shaped crest
sweeping back from the head — the curl motif from stage 1 now a full crown of
hard-edged foam-and-wave blades — gold trim lines along the crest and fin edges, a
pale cyan gem set on the brow (solid color block with a hard white highlight dot,
no glow). Long sinuous body with layered fin frills down the spine, a huge tail fin
curling into a stylized wave/foam splash shape at the base. Bright sapphire eyes,
calm commanding expression. Grand, large-scale pose filling the frame — this is the
biggest and most detailed silhouette of the three stages.
```

---

## 9. 🐋 동결룡 (cryogon, 단일종, ice/dragon) — ⚠️ 신규 타입 단서 적용(원본은 얼음고래, 용 실루엣 없음)

> 스타일바이블 §4-2: dragon 타입은 원소색을 유지하되 **뿔·비늘·긴 목/꼬리**를 공통 단서로 넣는다. cryogon 원본은 얼음 결정으로 뒤덮인 고래형 생물로 뿔·다리·긴 목이 없다 — 타입이 ice/dragon으로 확정된 이상 **몸 형태를 용 실루엣으로 재구성**하고, 원본의 정체성 앵커(크리스탈 뒤덮인 질감·하늘색-흰색 팔레트·큰 지느러미)는 그대로 가져간다.

#### `cryogon` — 동결룡 (단일종, 얼음 크리스탈 용)
```
[공통 프리픽스]
A long-necked ice dragon whose body is entirely encrusted with angular ice-crystal
formations (the SAME crystal-covered texture and pale sky-blue-to-white palette as
its original whale-like concept, now reshaped into a dragon). A long serpentine neck
and tail (not a stubby whale body), two curved ice-crystal horns on the head, small
clawed forelimbs, rows of crystal-plate scales down the back, and a large fin-like
frilled tail-fin retained from its aquatic origin as a dragon tail-fin instead of a
whale fluke. Big pale-blue eyes, calm powerful expression, coiled resting pose.
Reads clearly as BOTH ice and dragon — long neck/tail and horns are the dragon cue,
the crystal-covered hide is the identity anchor from its original form.
```

---

## 10. 🐉 얼음정 라인 (iceling→frostwyrm, ice→ice/dragon) — 계승: **하늘색 얼음 크리스탈 가시 + 이마 눈꽃 무늬가 뿔로 발전**

> iceling은 단일 ice 타입(용 단서 불필요), frostwyrm에서 ice/dragon으로 확정된다. 원본 웹피의 frostwyrm은 이미 뿔·비늘·긴 몸을 갖춘 용형이라 재구성 없이 그대로 픽셀화한다.

#### `iceling` — 얼음정 (1단, 둥근 얼음 정령 — 용의 씨앗)
```
[공통 프리픽스]
A small round ice spirit, ball-shaped body in pale sky-blue with a white belly
patch, a ring of small hard-edged ice-crystal spikes jutting around the body's
equator, a white snowflake-shaped mark on the forehead (this exact mark grows into
the horn base on its dragon evolution), big sparkly blue eyes, cheerful open smile,
small crystal-shard feet nubs underneath. Simple round sitting pose, cute and inert
like a seed waiting to hatch into something bigger.
```

#### `frostwyrm` — 빙하룡 (2단, 얼음 결정 용)
```
[공통 프리픽스]
A serpentine ice dragon, coiled in a resting pose. Pale white-to-sky-blue scaled
body, a crest of hard-edged ice-crystal spikes running from the head down the neck
like a mane — the SAME crystal-spike motif from the round spirit stage, now grown
into full horns and a head crest with the snowflake mark visible at the horn base.
Wing-like frills of angular ice-crystal blades along the back and tail (read as
wings, hard-edged and faceted, not feathered). Long sinuous dragon body and tail,
small clawed limbs, bright blue eyes, serene powerful expression. Clear dragon
silhouette: horns, scales, long neck-and-tail.
```

---

## 11. 🐉👑 빙하제 (glaciarch, 전설, ice/dragon) — ⚠️ 신규 타입 단서 적용(원본은 얼음 골렘, 용 실루엣 없음) · 위엄·스케일 최상단

> 원본 웹피는 룬 문양·얼음 갑주를 두른 거대 골렘(인간형)이다. 타입이 ice/dragon으로 확정된 이상 뿔·비늘·긴 목/꼬리의 용 실루엣을 넣어야 하지만, 골렘의 **압도적 벌크와 룬 문양은 위엄의 핵심 정체성**이므로 버리지 않는다 → 가늘고 긴 서양형 용이 아니라 **거대하고 육중한 4족/반기립 야수형 용**으로 재구성한다(§10 미확정 참조).

#### `glaciarch` — 빙하제 (전설, 거대한 얼음 룬 용)
```
[공통 프리픽스]
A colossal, monumentally bulky ice dragon — the most imposing creature in this set.
Thick powerful quadruped beast-dragon body (NOT a slender serpent-dragon; keep the
massive muscular bulk of a golem-like beast) covered in icy white-blue fur-like
crystal texture, a single large curved ice horn crowning the head (kept from the
source art), a long heavy tail and a thick short neck rather than a long slender
neck (mass over elegance), rows of hard angular ice-crystal plate scales down the
back and shoulders. Glowing cyan rune-diamond markings on the chest and shoulder
(solid bright-cyan geometric blocks with a hard white highlight, no glow effect) —
carried over from the source art as the identity anchor. Clawed feet planted in a
wide dominant stance, glowing pale-blue eyes, an aura of overwhelming scale and
power. This creature should read as visually LARGER and more detailed than every
other creature in this document (legendary-tier).
```

---

## 12. 🐉👑 수룡왕 (aqualord, 전설, water/dragon) — 위엄·스케일 최상단 (원본이 이미 완전한 용형 — 재구성 불필요)

> 원본 웹피가 이미 뿔·비늘·긴 몸·금장식을 갖춘 우아한 수룡이다. 재구성 없이 위엄과 디테일 밀도만 최상단으로 끌어올려 픽셀화한다.

#### `aqualord` — 수룡왕 (전설, 우아하고 위엄 있는 심해 수룡)
```
[공통 프리픽스]
A majestic, elegant sea dragon coiled in a grand regal pose — a legendary ruler of
the water. Deep blue scaled back fading to a cream-white/pearl underside, TWO
curved gold-trimmed horns sweeping back from the head, ornate gold trim lines and
swirl ornaments running down the long serpentine neck and body (solid gold blocks
with hard highlights, no glow), a small pale cyan gem set on the brow. A long
flowing tail curling into a large fan-shaped fin with wave/foam details at the tip.
Bright sapphire-blue eyes, calm sovereign expression, powerful coiled resting pose
with the head held high. Maximum ornament density and scale among all 20 creatures
in this document — this is the other legendary-tier creature, water's counterpart
to glaciarch's ice dominance.
```

---

## 13. 받은 뒤 검수 (스타일 바이블 §7 + Phase 2 전용)

- [ ] 스타일 바이블 §7 공통 체크리스트 전부 통과(투명 배경·그림자 없음·정사각 중앙·3/4 방향·1px 외곽선·2단 셰이딩·24색 이내)
- [ ] **5개 라인(빙구리·무라리·집게공·개굴알·서리강아지)을 각각 나란히** 놓고 1→2(→3)단이 같은 색·모티프 가족으로 읽히는가
- [ ] **개굴알**: 원본(해파리) 대신 새 디자인(알/올챙이 무리)으로 뽑혔는가 — 생성기가 옛 해파리 형태로 회귀하지 않았는지 확인
- [ ] **서리랑**: 곰이 아니라 늑대로 뽑혔는가 — frostpup과 귀·주둥이·꼬리 형태가 이어지는지 확인
- [ ] **dragon 4종(동결룡·빙하룡·빙하제·수룡왕)**: 뿔·비늘·긴 목/꼬리가 공통으로 보이는가, 각자 원소색(얼음/물)이 유지되는가
- [ ] **전설 2종(빙하제·수룡왕)**: 나머지 18종보다 스케일·디테일 밀도가 확실히 큰가(한 판에 놓고 비교)
- [ ] 원종 대조(재설계 2종 제외): `assets/art/creatures/{id}.webp`와 나란히 — 같은 정령으로 알아보는가
- [ ] 12종(Phase 1)과 한 판에 놓고 도트 굵기·채도가 통일됐는가

---

## 14. 미확정 사항

- **cryogon·glaciarch의 몸 형태 재구성**: 두 종 모두 원본 원화가 용이 아니었는데(고래·골렘) 타입 재설계로 ice/dragon이 됐다. 본 문서는 "원소색·정체성 앵커(크리스탈 질감·룬 문양)는 유지 + 몸 형태만 용 실루엣으로 교체"하는 절충안을 택했다 — 이는 "원종을 알아볼 수 있어야 한다"는 원칙과 "용 실루엣을 넣어야 한다"는 타입 단서 원칙이 정면 충돌하는 지점이라 **크리에이티브 디렉터/PM 확인 필요**. 대안: 몸 형태를 원본대로 유지하고 뿔·발톱 등 최소 단서만 얹는 보수적 버전도 병행 생성해 스크린샷 비교 후 택일 가능.
- **glimmertide의 "날개형 파도 볏"**: water/flying 타입을 암시하려 어깨 파도 크레스트를 넣었으나 스타일바이블 §4-2에는 flying 타입 전용 시각 단서가 아직 명문화되어 있지 않다(§4-2는 dragon·bug만 규정). 이후 flying 타입 배치 때 규칙이 확정되면 재검토.
- **해상도/색상 값**: Phase 1 스크린샷 확정 결과(96px vs 80/64, 24색 유지 여부)를 아직 전달받지 못해 본 문서는 스타일 바이블 §3 기본값(96px·24색)을 그대로 가정했다. 확정값이 다르면 파이프라인 `--size`/`--colors` 옵션만 조정하면 되므로 프롬프트 재작성은 불필요.

---

## 15. Phase 3 예고 (참고)

남은 배치는 스타일 바이블 §9 순서를 따른다: elec 잔여 → rock/ground 잔여 → flying 잔여 → normal 잔여 → 나머지 전설 3종(shadowlord·dawnguard·dawnwyrm). 같은 형식(계승 항목 명시 + 원종 근거 + 타입 단서 적용)으로 이어서 작성한다.
