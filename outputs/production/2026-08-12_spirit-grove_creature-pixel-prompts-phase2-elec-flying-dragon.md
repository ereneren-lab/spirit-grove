# 정령 픽셀 아트 생성 프롬프트 — Phase 2 (전기 · 비행 · 용 · 전설 21종)

작성 2026-08-12 · 규격: `2026-08-12_spirit-grove_creature-pixel-style-bible.md`(§3 규격표·§4-1 팔레트표·§4-2 타입 단서·§5 번역 치트시트·§7 체크리스트)
형식: `2026-08-12_spirit-grove_creature-pixel-prompts-phase1.md` §3~6과 동일 (라인 헤더 + `#### \`id\` — 이름` + `[공통 프리픽스]` 코드펜스). **공통 프리픽스/네거티브 전문은 Phase 1 §1·§2를 그대로 쓴다(아래 §1·§2는 참조 포인터일 뿐, 복제하지 않는다).**
대상: 전기(elec) 8종 · elec/dragon 1종 · elec/flying 2종 · elec/poison 1종 · elec/bug 1종 · elec/rock(전설) 1종 · dragon 5종(그중 전설 1종) · flying 6종(그중 전설 2종) · poison/bug 1종 = 21종.

> 각 종의 색·형태는 재설계 2종(⚠️ 표시)을 제외하고 전부 `assets/art/creatures/{id}.webp` 원본을 직접 보고 추출했다. 목표는 "새 정령"이 아니라 **"같은 정령의 픽셀 버전"**이다.

---

## 0. 반입 순서

Phase 1 §0과 동일: `art_inbox/creatures/{id}.png` 저장 → `scripts/make_creature_art.py` → `scripts/build.py` → 전투/도감 스크린샷 확증. (파일명 = 아래 각 항목의 `id`)

## 1. 공통 프리픽스

Phase 1 §1 원문 그대로 사용 (96×96px, 3/4 왼쪽, 1px 하드 외곽선, 셀 셰이딩 2단, 24색 이내, 완전 투명 배경 등). 여기서는 반복하지 않는다.

## 2. 공통 네거티브

Phase 1 §2 원문 그대로 사용. 여기서는 반복하지 않는다.

---

## 3. ⚡ 찌리볼 (voltrat, elec 단독)

계승: 없음(단독종). 단, 이미 픽셀화된 `sparkmouse`(찌리몽, elec)와 같은 "전기 설치류" 아키타입이므로 **실루엣을 겹치지 않게 분화**한다 — 찌리몽보다 몸이 더 다부지고 낮은 자세, 꼬리가 그라데이션 번개 형태로 더 길다.

#### `voltrat` — 찌리볼
```
[공통 프리픽스]
A stocky electric rodent (rat/hamster hybrid build), bigger and more grounded than a
typical mouse — do NOT reuse the exact silhouette of the game's other electric mouse
species. Bright yellow fur with slightly darker yellow shading, big round ears with
warm orange-tan inner surfaces and a short pale streak inside each ear, a soft
cream-white lightning-bolt-shaped mark on the forehead, big round amber eyes with a
white highlight dot, small open fanged grin. Cream-white belly patch. Long tail with
a color gradient from body-yellow into deep orange, ending in a hard-edged
lightning-bolt tip. A few small hard-edged triangular yellow spark pixels floating
near the paws and tail (no soft glow). Low forward-leaning pouncing stance, front
paws raised, sturdy haunches. Reads energetic and slightly feistier than a cute
mouse.
```

---

## 4. 🐍 가시몽 라인 (hedgemoss → vinesnake, poison/grass) — ⚠️ **진화 재설계 반영(2026-08-12)** · 계승: **올리브그린+보라(독) + 가시=크림색 하이라이트 밴드**

> 재설계 근거: `outputs/strategy/2026-08-12_spirit-grove_evolution-realign-strategy.md` §9-1 표 D(가시몽 라인, id: hedgemoss→vinesnake). 2단 이름을 "넝쿠리"에서 "가시넝쿨"로 바꿔 1단과 어간(가시)을 공유시켰고, "가시가 길게 자라 온몸을 휘감은 독가시뱀"이 되는 것을 **곤충 변태에 준하는 의도된 변태**로 명시했다. 스타일 바이블 §4-1: 팔레트는 올리브그린+보라(독), 가시의 크림색 하이라이트 밴드가 1→2단으로 이어져야 한다.

#### `hedgemoss` — 가시몽 (1단, 정체성 앵커 · 넝쿠왕의 유생)
```
[공통 프리픽스]
A round chubby hedgehog spirit covered in soft moss and short olive-green quills, with
a FEW tiny budding vines and small closed amethyst-purple flower-buds sprouting among
the moss — these buds are what bloom in its evolution (the mandatory carry-over trait).
Two or three small purple berry accent dots as a subtle poison-type hint. Cream-white
fluffy round face, pink cheek blush, big round teal-green eyes, small brown snout and
stubby brown paws held near the chest. Sitting pose, reads soft and round.
```

#### `vinesnake` — 넝쿠왕 (2단, ⚠️ **재설계** — 꽃넝쿨 나가, poison/grass)
```
[공통 프리픽스]
A regal serpent-naga wreathed in flowering vines — the budding vines of its hedgehog
form now grown and bloomed (NEW design; ignore any thorn/bird concept). Long coiled
amethyst-purple scaled body with a cream-white banded underside, wrapped in twisting
green leafy vines that trail along its length, small six-petal purple flowers and
purple berry accents blooming on the vines. A crown/mane of green leaves framing the
head with a small purple gem at the brow, a forked purple tongue, small fangs, faint
purple poison-mist wisps rising off the body. Big teal-green eyes, calm venomous
expression. Coiled upright battle pose, 3/4 view facing left. Clearly the bloomed
adult of the mossy hedgehog — elegant and poisonous.
```

---

## 5. 🪲 찌리딱 라인 (voltbeetle → thunderowl, elec/bug → elec/flying) — ⚠️ **진화 재설계 반영(2026-08-12)** · 계승: **채도 높은 노랑(전기)+짙은갈색(딱정벌레 갑각), 지그재그 번개 무늬, 더듬이**

> 재설계 근거: 위 전략 문서 §9-1 표 F(찌리딱 라인, id: voltbeetle→thunderowl). "부르릉"이라는 2단 이름은 유지하되 그림은 **올빼미를 폐기하고 딱지날개가 열리며 거대해진 장수풍뎅이형**으로 바꾼다 — 딱정벌레는 원래 딱지날개 밑에 비행 날개가 있어 조류로 갈 필요가 없었다는 것이 근거. 스타일 바이블 §4-2: bug 타입 단서(더듬이·겹눈·갑각)를 1단에서 확실히 세우고 2단(성체)까지 이어간다.

#### `voltbeetle` — 찌리딱 (1단, 변경 없음·정체성 앵커, elec/bug)
```
[공통 프리픽스]
A cute ladybug-beetle spirit. Glossy black-and-yellow hard shell (elytra) on the back
with a bold yellow lightning-bolt zigzag pattern across it, a glossy rounded black
head, two antennae with round yellow ball-tips, big round black compound-eye-style
eyes with a white highlight, small cheerful open smile. Six segmented black-and-yellow
legs visible beneath the shell. Low crouched beetle stance. Bug identity clear:
antennae + hard shell + multiple legs.
```

#### `thunderowl` — 부르릉 (2단, ⚠️ **재설계** — 올빼미 아님, 거대 장수풍뎅이형, elec/flying)
```
[공통 프리픽스]
A large elec/flying stag-beetle spirit — the evolved form of the beetle, NOT a bird
or owl (ignore any old owl concept entirely). Dark glossy brown elytra (wing cases)
now split open wide on the back, folded outward to reveal a pair of large hard-edged
flight wings underneath (translucent-look wing membrane rendered as solid pale-yellow
with dark vein lines, per the glass/translucency cheat sheet — NOT actually
see-through). The same bold yellow lightning-bolt zigzag pattern from stage 1
continues across the now-open elytra. A single curved rhinoceros-beetle horn grows
from the head, dark brown with a yellow tip. Thick antennae with yellow ball-tips
carried over from stage 1. Bright saturated yellow segmented body and legs, a few
hard-edged triangular spark pixels crackling off the horn tip and wingtips. Hovering
mid-flight battle pose, wings spread. Same yellow + dark-brown beetle-carapace
palette as stage 1, now larger and more powerful with the horn as its new emblem.
```

---

## 6. ⚡🐉 번개뱀 라인 (voltsnake → thundwyrm, elec → elec/dragon) — 계승: **노랑+검정 지그재그 비늘 무늬 + 스파크 오라, 뱀→용 실루엣 전환**

> 뱀에서 용으로의 아키타입 전환은 재설계가 아니라 원본 그대로다(브리프에서 명시). 스타일 바이블 §4-2 dragon 단서(뿔·비늘·긴 목/꼬리)를 살려 thundwyrm에 적용한다.

#### `voltsnake` — 번개뱀 (1단, elec)
```
[공통 프리픽스]
A cute coiled baby snake. Yellow body with bold black zigzag-lightning band markings
wrapping around the coils, a dark blue-black hood marking on the head, big round
brown eyes with a white highlight, a small red forked tongue sticking out of an open
smile. A hint of blue at the tail tip. A few tiny hard-edged yellow spark pixels
floating around the coils (no soft glow). Coiled resting pose, reads playful and
round.
```

#### `thundwyrm` — 뇌전룡 (2단, ⚠️ **elec/dragon** — 뱀에서 용으로 아키타입 전환)
```
[공통 프리픽스]
A golden-yellow quadruped dragon — the fully-transformed evolution of the coiled
snake. Clear DRAGON silhouette: four clawed legs, a long serpentine tail (a callback
to the snake form), a maned head with a row of jagged black spike-fins running from
the crown down the spine, sharp curved horns, an open roaring mouth with visible
fangs, one visible teal-blue eye accent. Body scales keep the SAME yellow base with
the black zigzag-lightning banding carried over from voltsnake, now arranged along
the flanks and tail like scale rows. Dark bluish-black claws. A crackling hard-edged
electric aura (small yellow spark/flame-shaped pixel shapes, opaque, not a soft glow)
radiating from the body and tail. Low aggressive coiled-to-strike stance.
```

---

## 7. ⚡🪶 번개새 라인 (zapfinch → voltfalcon, elec → elec/flying) — 계승: **노랑(몸)+파랑(장식깃) + 번개꼬리/번개깃 모티프**

#### `zapfinch` — 번개새 (1단, elec)
```
[공통 프리픽스]
A tiny round yellow chick. Bright yellow fluffy body, a single upright feather tuft
on the head with a blue tip, big sparkly round blue-black eyes, small orange beak
open in a cheerful chirp, small stubby yellow wings held out slightly, pale blue
sock-like leg markings above orange feet. Tail rendered as a single hard-edged
yellow lightning-bolt shape. Standing pose, reads tiny and adorable.
```

#### `voltfalcon` — 뇌전매 (2단, elec/flying)
```
[공통 프리픽스]
A sharp diving falcon, the evolved form of the chick. Body proportions now sleek and
aerodynamic. Deep blue plumage as the dominant flight-feather color with bright
yellow accent stripes and covert feathers (same yellow + blue palette family as the
chick, now blue promoted to primary and yellow to accent). Several long primary
wing feathers shaped with hard zigzag lightning-bolt notches at the tips (direct
callback to the chick's lightning-bolt tail). Sharp focused blue-yellow eye, hooked
beak, yellow taloned feet outstretched for a strike. Wings fully spread in a diving
battle pose, aggressive and fast-reading silhouette.
```

---

## 8. ⚡🐛 반딧불이 라인 (glowfly → arcmoth, elec/bug → elec/poison) — 계승: **연두~라임 글로우 + 더듬이/날개맥(곤충) → 성체는 나비 문양+보라 포인트**

> ⚠️ 가정 표시: `arcmoth` 원본 페인터리는 청색/남색 계열(icy-looking) 나방으로, elec/poison 배색과 직접 일치하지 않는다. 정체성(더듬이·눈꼴 날개무늬·풍성한 털)은 원본을 그대로 따르되, **타입 가독성을 위해 날개 하단 트림 색만 남색→짙은 보라(독)로 살짝 틀었다** — 이는 재설계가 아니라 색 보정이며, §10 미확정 사항에 표기한다.

#### `glowfly` — 반딧불이 (1단, elec/bug)
```
[공통 프리픽스]
A tiny cute lime-green firefly spirit. Fluffy rounded lime-green body, two long
antennae ending in hard-edged glowing yellow ball-tips, big sparkly round eyes, a
small leaf-shaped collar around the neck, small wings rendered as SOLID pale
yellow-green with visible hard vein lines (per the glass/translucency cheat sheet —
NOT transparent), a bright yellow-white glowing abdomen tip at the base (opaque
color block + white highlight dot, not a soft glow). Small happy open smile.
Hovering pose. Bug identity clear via antennae + veined wings.
```

#### `arcmoth` — 뇌광나방 (2단, elec/poison, 성체 나방)
```
[공통 프리픽스]
A large fluffy adult moth spirit, the evolved form of the firefly. Two long feathery
antennae swept back from the head (carried over and enlarged from stage 1's
antennae), big round blue eyes, a thick fluffy white-and-blue ruff around the neck
and chest. Four large wings with bold concentric ring "eye-spot" markings in white
and cyan-blue on a deep blue base (moth wing-pattern identity from the original
design), the markings on the upper wings sharpened into a jagged lightning-chevron
shape as an elec-type cue. Lower wing edges and the wingtip trim shift from the
original navy into a deep amethyst-purple (poison-type cue — see assumption note
above). Fluffy clawed legs in dark purple-black. Wings spread wide, calm hovering
battle pose. Bug identity via antennae + wing vein pattern; poison via the purple
wing trim; elec via the chevron-sharpened eye-spots.
```

---

## 9. 🐉 새끼용 라인 (drakeling → wyverna → skydrake, dragon 전체 · skydrake는 dragon/flying) — 계승: **크림+하늘색+골드 팔레트 + 볏/뿔 모티프 성장 + 날개 성장** · 원본 충실(이미 코히런트한 라인, 그림/이름 변경 없음 — 타입만 dragon으로 재분류)

> §9-1-D "이미 코히런트한 라인" 목록에 속해 그림은 그대로 도마뱀→와이번→용을 따른다. dragon 타입 단서(뿔·비늘·긴 목/꼬리)를 세 단계 모두에서 강조한다.

#### `drakeling` — 새끼용 (1단, dragon)
```
[공통 프리픽스]
A tiny chubby baby dragon (lizard-like). Cream-white scaly body with pale blue
crystalline spike-shaped horns and small blue crystal shard clusters running down
the head and back, big round sparkly blue eyes, a cheerful open smile, tiny stub
wings folded on the back (not yet functional for flight), short thick legs, small
clawed feet, a short curled tail with a few blue scale accents. Standing/sitting
pose, reads round and hatchling-like. Dragon cues: horns + scales + tail, present
even at this small stage.
```

#### `wyverna` — 비룡 (2단, dragon)
```
[공통 프리픽스]
A young winged dragon, leaner and more elongated than the hatchling. Cream-tan
scaly body with blue scale markings along the back and tail (same cream + blue
palette family as stage 1, with blue now more prominent), a crest of blue-tipped
horns swept back from the head (grown from the hatchling's crystal spikes), a pair
of medium-sized functional wings with blue-and-tan membrane now able to lift the
body, a long tail, sharp claws on all four limbs, bright blue eyes. Standing
alert battle pose with wings half-spread. Dragon cues stronger: visible wing
membrane + longer neck/tail + developed horns.
```

#### `skydrake` — 천공룡 (3단, dragon/flying — 위엄 최상단)
```
[공통 프리픽스]
A majestic large dragon, the final form of the line, filling the frame with scale
and presence. Cream-and-gold feathered/scaled body, large ornate wings spread wide
with cream, gold and blue feather-scale layering (wings now the dominant silhouette
element, marking the flying sub-type), a crest of golden feather-horns grown from
the earlier crystal/horn motif, a long serpentine tail with blue scale accents
carried from earlier stages, a small glowing cyan gem at the chest (bright cyan
block + white highlight dot, not a soft glow), sharp golden claws, calm regal
expression. Standing tall with wings fully spread — reads powerful, ancient, and
noble. Same cream+blue+gold palette family as stages 1-2, now with gold promoted to
a major accent for legendary-adjacent weight.
```

---

## 10. 🪶⚡ 회리매 (stormhawk, flying/elec 단독)

계승: 없음(단독종).

#### `stormhawk` — 회리매
```
[공통 프리픽스]
A fierce storm-hawk in flight. Dark blue-grey and violet-grey plumage over most of
the body, sharp bright yellow lightning-bolt-shaped accent markings streaking across
the head crest and along the leading edge of each wing, a sharp piercing blue eye,
a hooked grey-yellow beak, strong orange-yellow taloned feet with claws extended.
Wings fully spread in an aggressive mid-flight battle pose, feathers rendered as
overlapping hard-edged color blocks (dark blue-grey base, pale grey mid-feathers,
yellow lightning accents at the tips). Reads stormy, fast, and predatory.
```

---

## 11. 🪶❄️ 설올빼미 (snowl, flying/ice 단독)

계승: 없음(단독종).

#### `snowl` — 설올빼미
```
[공통 프리픽스]
A tiny round baby snow owl. Fluffy white body with pale icy-blue feather-pattern
accents, a small crystalline ice-crystal crest on the head (hard-edged light-blue
shard shapes), big round sparkly blue eyes, a small orange-yellow beak, one small
wing raised in a wave-like pose, blue snowflake-shaped chest marking, black clawed
feet. A couple of tiny hard-edged white snowflake pixels floating nearby (no soft
glow/bloom). Standing pose, reads soft, round, and wintry.
```

---

## 12. 🫧🐛 루나비 (lunarmoth, poison/bug 단독) — ⚠️ 타입 변경(브리프): 이제 poison/bug

계승: 없음(단독종). 원본이 이미 보라 톤이라 별도 색 보정 불필요 — 곤충 단서(더듬이형 귀·눈꼴 날개무늬)를 명확히 하고 보라를 poison 단서로 유지한다.

#### `lunarmoth` — 루나비
```
[공통 프리픽스]
A fluffy pale-lavender moth spirit. Two long moth-antenna-shaped ear/crest tufts on
the head (rendered clearly as insect antennae, not rabbit ears), big round purple
sparkly eyes, a soft white-lavender fluffy chest ruff, four wings in pale lavender
and cream with crescent-moon-shaped eye-spot markings (hard-edged, 2-3 shade steps),
the lower wing panels darkening into a deep violet-purple toward the bottom edge
(poison-type cue, kept from the original art's dark base). Small clawed feet just
visible beneath the wings. Wings spread wide, calm floating battle pose. Bug
identity via antennae + wing vein/eye-spot pattern; poison via the deep violet
lower-wing gradient.
```

---

## 13. 🪶💧 갈매정 (gullian, flying/water 단독, 원본 충실)

계승: 없음(단독종, "변경 없음" — 스타일 바이블 §4-1 표: 흰색+하늘색, 변경 없음).

#### `gullian` — 갈매정
```
[공통 프리픽스]
A cheerful white-and-blue seagull spirit in flight. Mostly white feathered body,
blue accent feathers along the wingtips and a wave-shaped blue tail fan, a few small
hard-edged water-droplet shapes (light cyan-blue, opaque with a white highlight dot,
per the water-splash cheat sheet — no soft translucent particles) scattered near the
wings and feet, bright orange-yellow beak and feet, big round blue eyes, cheerful
expression. Wings spread mid-flight, one foot tucked up. Reads light, breezy, and
coastal — faithful to the original design.
```

---

## 14. 전설 3종 (위엄·스케일 최상단)

전설 정령은 스타일 바이블 §8 범위 지정(전설은 위엄·스케일을 최상단으로) 대상이다. 프레임을 최대한 채우고, 장식·문양·오라를 다른 종보다 한 단계 더 정교하게 넣는다(단, 여전히 24색·2단 셰이딩·하드 외곽선 규칙은 지킨다 — 색을 더 쓰지 않고 배치를 더 정교하게 한다).

#### `shadowlord` — 흑요마 (elec/rock, 전설)
```
[공통 프리픽스]
A LEGENDARY-scale dark nine-tailed fox spirit, filling nearly the entire frame with
imposing presence. Deep violet-black fur body, a pale grey-white mask-like marking
on the face, sharp narrow purple-glowing eyes. Many long flowing tails fan out
behind the body, EACH tail tipped with a glowing purple eye-shaped marking (bright
purple block + small white highlight dot, not a soft glow) — this repeated eye
motif across the tails is the mandatory darkness/eye emblem. Swirling hard-edged
dark-purple flame-like energy shapes trail from the tails and paws (opaque color
blocks, not soft mist). For elec/rock type legibility: small hard-edged yellow-white
spark accents nested inside a few of the tail eye-markings, and the lower legs/paws
textured with cracked obsidian-black stone plates (hard geometric crack lines, rock
cue) rather than plain fur. Low prowling stance, head slightly lowered, reads
ancient and dangerous.
```

#### `dawnguard` — 오로르 (flying, 전설)
```
[공통 프리픽스]
A LEGENDARY-scale golden guardian bird spirit, filling nearly the entire frame.
Ornate gold-and-cream plumage, elaborate gold armor-plate details on the chest,
shoulders, and legs (hard-edged metallic gold blocks with a single bright highlight
dot each, per the metal/gem cheat sheet), a crown-like crest of golden feathers on
the head, a glowing star-shaped gem at the chest (bright white-gold block + white
highlight cross, not a soft glow), large wings spread fully wide filling most of the
frame's width with layered cream-and-gold feathers, calm noble golden eyes. Standing
tall with wings raised like a dove/guardian pose (🕊️ dawn/light motif). Reads
radiant, warrior-like, and supreme among the flying-type roster.
```

#### `dawnwyrm` — 여명룡 (flying/dragon, 전설)
```
[공통 프리픽스]
A LEGENDARY-scale white-and-gold dawn dragon, filling nearly the entire frame,
combining the dragon line's horn/scale identity with dawnguard-tier wing scale.
Pearl-white and pale-gold scaled body, a long serpentine neck and tail, sharp
curved golden horns, large ornate wings composed of overlapping feather-like scale
layers in white and gold spreading fully open, sharp golden claws, a calm
half-lidded regal expression suggesting quiet overwhelming power rather than
aggression. A soft dawn-gold rim of hard 1px highlight along the wing edges and
spine ridge (hard line, not a soft bloom). Standing in a rearing, wings-spread
battle pose. Reads as the most majestic dragon in the roster — dragon cues (horns,
scales, long tail) fused with flying-type cues (huge spread wings) at legendary
scale.
```

---

## 15. 진화 라인 계승 요약표

| 라인 | 계승 색 | 계승 모티프 | 비고 |
|---|---|---|---|
| 가시몽→가시넝쿨 | 올리브그린+보라(독) | 가시 끝 크림색 하이라이트 밴드, 얼굴(뭉툭한 주둥이·귀 흔적) | ⚠️ 재설계 — 뱀 형태 |
| 찌리딱→부르릉 | 채도높은노랑(전기)+짙은갈색(갑각) | 지그재그 번개 무늬, 더듬이 | ⚠️ 재설계 — 장수풍뎅이형 |
| 번개뱀→뇌전룡 | 노랑+검정 지그재그 | 스파크 오라, 뱀→용 실루엣 전환 | 원본 그대로(재설계 아님) |
| 번개새→뇌전매 | 노랑+파랑 | 번개꼬리→번개깃 노치 | |
| 반딧불이→뇌광나방 | 연두~라임 → 청+백(원본), 하단 보라 보정 | 더듬이, 눈꼴 무늬 | ⚠️ 색 보정(가정) |
| 새끼용→비룡→천공룡 | 크림+하늘색(+3단 골드) | 볏/뿔 성장, 날개 성장(무→소→대) | 원본 충실, 타입만 dragon |

---

## 16. 받은 뒤 검수 (스타일 바이블 §7 + Phase 2 전용)

- [ ] 스타일 바이블 §7 공통 체크리스트 전부 통과 (투명 배경·그림자 없음·24색·1px 외곽선·3/4 왼쪽 등)
- [ ] `vinesnake`·`thunderowl` 두 장을 원본(hedgemoss·voltbeetle)과 나란히 — **뱀/장수풍뎅이로 명확히 재설계됐는지, 원본 올빼미·넝쿠리 잔재가 없는지** 확인
- [ ] dragon 5종(drakeling·wyverna·skydrake·thundwyrm·dawnwyrm)을 한 판에 — 뿔·비늘·긴 목/꼬리 단서가 공통으로 읽히는가
- [ ] bug 3종(voltbeetle·glowfly·lunarmoth)을 한 판에 — 더듬이·겹눈/눈꼴무늬·갑각/날개맥이 명확한가
- [ ] 전설 3종(shadowlord·dawnguard·dawnwyrm)이 나머지 18종보다 프레임 점유율·장식 밀도가 확실히 높은가
- [ ] 라인별(가시몽·찌리딱·번개뱀·번개새·반딧불이·새끼용) 진화 단계가 같은 색·모티프 가족으로 읽히는가
- [ ] `voltrat`이 기존 픽셀화된 `sparkmouse`(찌리몽)와 실루엣이 겹치지 않는가

---

## 17. 전제 / 미확정

- `arcmoth`의 남색→보라 트림 보정은 **가정**이다 — elec/poison 타입 가독성을 위한 색 조정이며, 검수 시 "원본과 너무 달라졌다"는 판단이 나오면 남색 그대로 두고 poison 단서는 다리/눈 색으로만 대체하는 대안이 있다.
- `shadowlord`의 elec(스파크)·rock(균열 흑요석) 단서는 원본 페인터리에 없던 요소를 소량 추가한 것이다 — 브리프가 지정한 "어둠/눈 모티프 최우선"은 그대로 유지했고, 타입 단서는 보조적으로만 얹었다.
- 해상도/팔레트 상한(96px·24색)은 Phase 1 스크린샷 락 결과를 그대로 상속한다. Phase 1이 아직 확정 전이라면 이 문서의 21종도 같은 값으로 재조정될 수 있다.
