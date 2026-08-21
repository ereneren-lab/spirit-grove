# 정령 픽셀 아트 생성 프롬프트 — Phase 2 (풀/노말/바위·땅 22종)

작성 2026-08-12 · 규격: `2026-08-12_spirit-grove_creature-pixel-style-bible.md` (§3 규격표·§4-1 팔레트 계승표·§4-2 타입 단서·§5 번역 치트시트·§7 체크리스트)
형식 템플릿: `2026-08-12_spirit-grove_creature-pixel-prompts-phase1.md` §3~6 (공통 프리픽스·네거티브는 그 문서 §1~2를 그대로 쓴다 — 이 문서엔 복제하지 않는다. 아래 `[공통 프리픽스]`는 그 자리 표시다)
재설계 근거: `outputs/strategy/2026-08-12_spirit-grove_evolution-realign-strategy.md` §9-1-C(라꾸리)·§9-1-E(푸르사)·§9-1-I(꽃날개)·§9-1-J(먼지토끼)

> 재설계 아닌 18종은 `assets/art/creatures/{id}.webp` 페인터리 원본을 **직접 보고** 색·형태·자세를 추출했다. 목표는 "새 정령"이 아니라 **"같은 정령의 픽셀 버전"** — 원종을 알아볼 수 있어야 한다.
> ⚠️ 재설계 4종(`lumbeast` 우직수·`palmore` 야자정·`thumplord` 쿵쿵왕·`blossomhawk` 꽃호접)은 원본 이미지를 참고하지 않는다 — 원본은 폐기된 콘셉트(황소/야자나무/매머드/매)이고, 아래는 스타일 바이블 §4-1 팔레트 계승표 + 전략 문서 §9-1을 근거로 한 **새 디자인**이다.

---

## 0. 반입 순서 (생성 후, Phase 1 §0과 동일)

```
① 생성 → art_inbox/creatures/{id}.png   (파일명 = 아래 각 항목의 id)
② python3 scripts/make_creature_art.py         # Phase 1에서 확정된 size/colors 값 사용
③ python3 scripts/build.py
④ 전투/도감 스크린샷으로 Phase 1 12종·주인공·NPC와 같은 화면에서 화풍 확증
```

---

## 1. 🌿 GRASS 라인 (10종)

### 1-1. 푸르사 라인 (id: sprigfawn→palmore · grass(/normal)→grass · t1→t2) — ⚠️ **2단 재설계** · 계승: **연두+갈색(사슴) + 야자잎 진녹색 포인트**

> 재설계 근거: 전략 §9-1-E. 옛 "야자나무"(동물 흔적 없음) 폐기 → **뿔이 야자잎 왕관, 다리는 뿌리처럼 굵어진 사슴**으로 통일. 사슴 실루엣(다리4+몸통+머리)을 라인 끝까지 유지, 완전한 나무/인간형 금지.

#### `sprigfawn` — 푸르사 (1단, 원본 웹툰 참고)
```
[공통 프리픽스]
A tiny cute fawn. Pale spring-green fur with a cream-tan underbelly and faint cream
fawn-spot dapples on the back and legs, two leaf-shaped ears (green outer edge, tan-
cream inner surface), small nubby antlers each budding a single tiny leaf sprout at
the tip, big round green eyes, tiny pink nose, gentle closed smile, slender legs with
small brown hooves. Standing pose. Reads soft, gentle, sprout-like.
```

#### `palmore` — 야자정 (2단, ⚠️재설계 — 뿔이 야자잎 왕관, 다리는 뿌리)
```
[공통 프리픽스]
A sturdy adult deer — grown form of the fawn, NOT a tree or humanoid. Its antlers have
grown into a crown of broad palm-frond spikes (deep palm-green, fan-shaped, replacing
the tiny budding antlers of stage 1) — this is the ONLY new accent color. Its four legs
have thickened into gnarled root-like limbs, bark-brown and root-textured, ending in
small root-tendril "hooves." Head, muzzle proportions, leaf-shaped ears (same tan-green
two-tone) and big round green eyes are carried over unchanged from the fawn — must be
instantly recognizable as the same face. Body keeps the pale spring-green + cream
palette of stage 1. Calm, grounded, weight-settled stance (no longer bouncy), dignified
but still gentle expression. MUST read as a deer silhouette (four legs, torso, head with
antler-crown) — NO trunk, NO humanoid arms/legs, NO leaves covering the whole body.
```

---

### 1-2. 씨앗콩 라인 (id: seedbean→titanoak · grass · t1→t3, 기존 코히런트) — 계승: **라임그린 씨앗 + 잎 모티프 → 거대 숲**

#### `seedbean` — 떡잎이 (1단, 원본 참고)
```
[공통 프리픽스]
A tiny round lime-green bean/seed creature. Smooth glossy lime-green body, a single
bright green leaf sprouting upward from the top (slightly curled tip), big sparkly
green eyes, small pink dot cheek blush, a small closed happy smile, tiny stub arms
barely peeking at the sides. Sitting on a small tuft of grass. Reads simple, round,
seed-like.
```

#### `titanoak` — 거목령 (3단, 원본 참고 — 나무거인)
```
[공통 프리픽스]
A towering ancient tree-golem, the final form of the seed line. A blocky humanoid-ish
trunk-and-branch body made of thick brown bark segments, a full dense leafy canopy of
green foliage crowning the head (the single sprout-leaf of stage 1, now grown into an
entire tree crown — keep one especially tall leaf-tuft at the very top as the direct
callback), a glowing pale-green diamond-shaped gem mark on the chest and on the back of
each fist (bright pale-green block + one white highlight dot, not a soft glow), thin
vines wrapping the forearms and shins, small mossy undergrowth at the base of the trunk,
deep-set glowing pale-green eyes. Palette shifts from the seed's lime-green to deep
forest-green foliage + aged bark-brown. Powerful standing guardian pose, arms slightly
raised.
```

---

### 1-3. 꽃날개 라인 (id: petalwing→blossomhawk · grass/bug→grass/flying · t1→t3) — ⚠️ **3단 재설계** · 계승: **분홍+연두(꽃잎) + 곤충(더듬이·날개맥) 모티프, 색 동일**

> 재설계 근거: 전략 §9-1-I. 옛 최종형 "매"(조류) 폐기 → **화려해진 대형 호랑나비**로 곤충 정체성을 끝까지 유지. petalwing 자체도 타입이 grass/**bug**로 재분류돼(§9-2) 1단부터 곤충 단서(더듬이·겹눈·날개맥)를 명확히 넣어야 한다. dragon 계열 아님.

#### `petalwing` — 꽃날개 (1단, 원본 참고 — grass/bug 단서 강조)
```
[공통 프리픽스]
A tiny cute flower-moth spirit — an INSECT, not a flower. Pale cream-yellow round
fuzzy body, two long antennae each tipped with a small pink bud (clear insect-antenna
silhouette), a flower crown on the head made of soft pink petals around a small yellow
center, four wings — upper pair pale pink with two light cream eye-spots, lower pair
pale lime-green with soft petal-shaped edges, fine dark hard-edge vein lines across
each wing (reads as insect wing veins, not plain petals), big sparkly round eyes with
a faint faceted edge (1-2 extra facet pixels = compound-eye hint), tiny stub insect
legs. Sitting pose, wings held slightly open. Palette: pink + lime-green + cream.
```

#### `blossomhawk` — 꽃호접 (3단, ⚠️재설계 — 화려해진 대형 호랑나비, 매 아님)
```
[공통 프리픽스]
A large, flamboyant tiger-swallowtail-style butterfly — the grown form of the flower-
moth. NOT a bird of prey: NO beak, NO talons, NO feathers. Same two antennae carried
over (now longer, pink-budded tips) and the same flower-crown motif from stage 1, now a
fuller blossom headdress. Four wings dramatically enlarged: upper wings pale pink with
expanded eye-spot and hard-edge vein-line patterns, lower wings lime-green with long
swallowtail tail-streamers trailing behind, scalloped wing edges. Insect thorax and
abdomen clearly segmented with pink/cream bands visible between the wings. Big sparkly
eyes with the same faceted compound-eye hint as stage 1. Wide wings-spread flight pose.
Same pink + lime-green + cream palette as the moth form, richer saturation and larger
pattern blocks for a flamboyant impression.
```

---

### 1-4. 이끼등 라인 (id: mossback→terrapin · grass/rock→grass/ground, 기존 코히런트) — 계승: **올리브그린 이끼 모티프 → 돌·나무로 확장**

#### `mossback` — 이끼돌이 (1단, 원본 참고)
```
[공통 프리픽스]
A small round tortoise. Olive-green shell with darker green segmented plates, a tuft
of bright mossy-green growth sprouting from the top-front of the shell, a tan-brown
rim line where shell meets body, pale green-tan skin on the head and legs with a few
darker spots, big round brown eyes, small closed smile, stubby legs with tiny claws.
Resting low pose. Palette: olive-green + moss-green + tan.
```

#### `terrapin` — 대지거북 (3단, 원본 참고 — 돌+나무를 두른 거북)
```
[공통 프리픽스]
A massive ancient tortoise, the final form of the moss-shell line. The shell is now
heavily overgrown — thick gray-brown rock-textured plates fused with patches of deep
moss (the single moss tuft of stage 1, now spread across the whole shell), and a small
tree with a round leafy canopy growing directly out of the shell's center (escalating
that same sprout). Skin deepens to a stony gray-green, thick blocky legs with heavy
claws planted firmly, calm half-closed wise eyes. Palette shifts from stage 1's olive-
green toward stone-gray + deep moss-green + bark-brown, keeping the green-moss family
as the connective thread. Slow, grounded, monumental pose.
```

---

### 1-5. 새싹냥 라인 (id: sproutcat→bloomlynx · grass, 기존 코히런트) — 계승: **라임그린 고양이과 + 새싹→꽃 모티프**

#### `sproutcat` — 새싹냥 (1단, 원본 참고)
```
[공통 프리픽스]
A tiny cute lime-green kitten. Fuzzy lime-green fur, cream-tan chest and paw tips, a
single two-leaf sprout growing from the top of the head, pointed ears with a small
leaf tucked at each tip, a tail ending in a small leaf tuft, big round green eyes,
pink cheek blush, open happy meow-smile. Playful crouched pose on a small grass tuft.
```

#### `bloomlynx` — 꽃표범 (3단, 원본 참고 — 표범무늬 삵)
```
[공통 프리픽스]
A sleek adult lynx-like big cat, the grown form of the sprout kitten. Lime-green fur
now patterned with darker olive-green rosette/leopard spots, a floral mane and tufted
ear-tips made of small white blossoms (the single sprout of stage 1, expanded into a
full floral crown), a long curling vine-like tail ending in a cluster of small leaves
and one bud, cream-tan underbelly and paws carried over from the kitten's chest color,
sharp green eyes. Mid-stride running pose on grass. Same lime-green + cream family,
sprout motif expanded into full blossom-and-vine ornamentation.
```

---

## 2. NORMAL 라인 (3종)

### 2-1. 토롱이 라인 이어짐 (id: bunnyhop→**harelord** · normal · t1→t2, 단독 — bunnyhop은 Phase 1에서 완료) — 계승: **크림+황금갈색 토끼 + 잎/보석 모티프**

#### `harelord` — 토롱크 (2단, 원본 참고 — bunnyhop 성체형)
```
[공통 프리픽스]
A grown hare — the evolved form of the fluffy cream-tan kit rabbit. Golden-tan fluffy
body, long upright ears now edged in green with a soft pink-magenta inner surface,
small leaf-shaped tufts of fur along the ears/head/haunches (cream + olive-green leaf
patches, growing out of the kit's warm amber head-tuft), a small pale-yellow gem/leaf
pendant at the chest (bright pale-yellow block + one white highlight dot, not a glow),
big round green eyes (matured from the kit's amber), fluffy cream tail, sturdy standing
pose with one paw forward, confident cheerful expression. Palette: golden-tan + cream +
olive-green leaf accents — same warm base as the kit, now with a botanical growth motif.
```

### 2-2. 라꾸리 라인 (id: racoonmon→lumbeast · normal · t1→t2) — ⚠️ **2단 재설계** · 계승: **회갈색+눈가검정+꼬리고리무늬, 2단은 채도↓·명암↑**

> 재설계 근거: 전략 §9-1-C / 스타일 바이블 §4-1. 옛 최종형 "황소" 폐기 → **부족을 호령하는 거구가 된 너구리**. 소 모티프(뿔·발굽) 금지.

#### `racoonmon` — 라꾸리 (1단, 원본 참고)
```
[공통 프리픽스]
A tiny cute raccoon kit. Grayish-brown fur, a dark almost-black mask marking around
both eyes, cream-white muzzle and chest fluff, rounded ears with cream inner fur, a
ringed tail (alternating light-cream and brown bands, 3-4 hard-edge rings), big round
dark-brown eyes, small open happy panting smile. Playful crouched/sitting pose.
```

#### `lumbeast` — 우직수 (2단, ⚠️재설계 — 부족장 너구리, 소 아님)
```
[공통 프리픽스]
A massive, broad-shouldered tribal-chief raccoon — the grown form of the raccoon kit.
NO bull horns, NO bovine snout, NO hooves — must read unmistakably as a raccoon, just
larger and more imposing. Same grayish-brown fur family but desaturated and deepened
(lower saturation, two clearly separated shade steps for a dapper/dignified look), the
eye mask now darker and more pronounced, the ringed tail thicker with wider higher-
contrast bands. Stocky muscular build with a thick ruff of fur across the shoulders
(reads like a chief's mantle), standing upright on hind legs in a powerful grounded
stance with both fists ready, stern commanding expression (furrowed brow, closed mouth)
replacing the kit's playful grin. Cream muzzle/chest fur carried over from stage 1.
```

---

## 3. 🪨 바위·땅 라인 (rock/ground, 9종)

### 3-1. 모래매 (id: sandwhirl · ground/flying, 단독) — 원본 참고, 변경 없음

#### `sandwhirl` — 회오리매 (단일종, 사막 맹금)
```
[공통 프리픽스]
A large hawk-like raptor with a sand/desert palette. Sandy-tan and warm brown layered
feathers across the wings (darker brown feather tips, pale-tan bases — hard 2-tone
feather shingling), sharp amber eyes, a hooked beak, wings spread wide mid-flight,
powerful curved talons reaching forward, slightly ruffled/crested head feathers.
Palette: sandy-tan + warm brown + amber. Reads as a fierce desert bird of prey.
```

### 3-2. 먼지토끼 라인 (id: dustbunny→thumplord · ground(/normal) · t1→t3) — ⚠️ **3단 재설계** · 계승: **베이지+갈색(먼지), 귀 끝 색 강조로 "삽" 암시**

> 재설계 근거: 전략 §9-1-J / 스타일 바이블 §4-1. 옛 최종형 "매머드" 폐기 → **뒷다리로 땅을 굴러 진동을 내는 왕토끼**. 코끼리 모티프(코·상아) 금지.

#### `dustbunny` — 먼지깡총 (1단, 원본 참고)
```
[공통 프리픽스]
A round fluffy beige rabbit. Cream-beige fuzzy fur all over, very long floppy drooping
ears with soft pink inner surfaces, a few small hard-edge brown dust-fleck dots on the
head and back, tiny stubby round paws peeking out of the round fluff-ball body, big
round amber eyes, pink cheek blush, small happy open smile. Sitting round pose, body
reads almost like a soft ball.
```

#### `thumplord` — 쿵쿵왕 (3단, ⚠️재설계 — 삽귀 왕토끼, 매머드 아님)
```
[공통 프리픽스]
A powerful large upright rabbit — the king of the burrowing rabbit line, who thumps the
ground to send tremors. NO trunk, NO tusks, NO elephant ears — must read as a rabbit.
Beige-cream body with brown "dust" accents carried over and deepened (darker brown
patches on the back and shoulders). The long floppy ears of stage 1 have thickened
dramatically and flattened at the tips into hard shovel/spade-shaped paddles (brown-
tipped, for digging — the visual clue for its ability). Powerful thick coiled hind legs
as if about to stomp, small hard-edge opaque tan dust-puff pixel clusters kicked up
around the planted feet (NOT soft particle glow), stocky muscular torso, stern powerful
expression (set brow, determined mouth line) replacing the kit's soft smile. Big round
amber eyes carried over from stage 1. Palette: cream-beige + earth-brown, same family
as the kit, deepened for weight and power.
```

### 3-3. 조약돌 라인 (id: pebblet→boulderin→megalith · rock, 기존 코히런트) — 계승: **회색 돌 + 이끼 패치 → 청백색 크리스탈 뿔 점층**

#### `pebblet` — 몽돌이 (1단, 원본 참고)
```
[공통 프리픽스]
A small round pebble/boulder creature. Warm gray stone-textured round body with a few
small patches of bright mossy-green growth, big round sparkly green eyes, tiny nub
arms with stubby stone fingers, small happy open-mouth smile with a tiny pink tongue
peek. Sitting round pose on a grass tuft with one small white flower nearby. Palette:
warm gray stone + moss-green patches.
```

#### `boulderin` — 바위정 (2단, 원본 참고)
```
[공통 프리픽스]
A larger blocky stone creature, the mid form of the pebble line. Gray stone body with
clearly defined rock-block segmentation (visible seam lines between plates), the moss-
green patches of stage 1 continued and spread across the shoulders and back, a small
handful of pale icy blue-white crystal spikes beginning to jut from the head and
shoulders, bigger round green eyes, thicker stone arms and legs standing upright, one
fist raised, a sturdier but still friendly expression. Palette: same warm gray + moss-
green family, with the new icy-blue crystal-spike accent introduced.
```

#### `megalith` — 거암왕 (3단, 원본 참고)
```
[공통 프리픽스]
A towering rock-golem titan, the final form of the pebble line. Massive gray-brown
stone-block body with heavy layered rock plating, moss-green patches now spread
extensively across the shoulders and joints (continuing the moss motif from earlier
stages), large pale icy-blue crystal spikes bristling from the head, both shoulders,
and both fists (bright icy-blue block + one white highlight dot on each crystal tip,
not a soft glow — the crystal buds of stage 2, now grown large), glowing pale blue-
white eyes, a wide heavy stomping stance with arms held wide. Palette: gray-brown stone
+ moss-green + icy-blue crystal accent — same family as stages 1-2, scaled up to an
imposing size.
```

### 3-4. 굴다람 라인 (id: burrowmouse→burrowlord · ground(/normal), 기존 코히런트) — 계승: **적갈색 설치류 + 돌 모티프 → 전신 암석 갑주**

#### `burrowmouse` — 굴다람 (1단, 원본 참고)
```
[공통 프리픽스]
A small chubby ground squirrel. Warm reddish-brown fur with a cream-white chest and
muzzle, a small flat gray stone perched on top of the head like a digging helmet, a
bushy reddish-brown tail with a cream tip, big round dark eyes, tiny dark claws, open
happy smile. Crouched digging-ready pose with a small dirt mound and a couple of
pebbles nearby. Palette: reddish-brown + cream + gray-stone accent.
```

#### `burrowlord` — 대굴왕 (3단, 원본 참고)
```
[공통 프리픽스]
A large armored badger-like ground-beast, the final form of the burrowing squirrel
line. Golden-brown fur body now covered in overlapping gray-brown rock-plate armor
scales across the back and shoulders (the single stone-helmet of stage 1, escalated
into full armor), a cream-white muzzle and chest carried over from stage 1, sharp
curved digging claws, a fierce snarling expression with bared teeth, low powerful
quadruped stance ready to charge. Palette: golden-brown + cream + gray-stone armor —
same warm-brown family as the squirrel, now armored and larger.
```

### 3-5. 결정룡 (id: crystalgon · rock/elec, 단독) — 원본 참고, 변경 없음. **rock+elec 이중 단서 명시**

#### `crystalgon` — 결정룡 (단일종, 수정 용 — rock/elec 단서)
```
[공통 프리픽스]
A regal small crystal dragon. Body covered in faceted violet-and-blue crystal scales
(hard geometric crystal-facet shapes, NOT smooth reptile scales — the rock-type cue),
large crystal wings rendered as SOLID pale-blue/violet color blocks with white
highlight facets (do NOT render as actually transparent — solid color + hard highlight
per the glassy-translation rule), a crown of small crystal spikes on the head, a gold
underbelly-gem accent, sharp violet eyes, a few small hard-edge yellow spark pixel
accents near the wing joints and tail tip in a zig-zag shape (the elec-type cue — NO
soft glow, just opaque yellow spark dots), clawed feet with gold-tipped talons.
Standing alert dragon pose, wings partly spread. Palette: violet-purple + icy-blue
crystal + gold accent + a few yellow spark highlights.
```

---

## 4. 검수 결과 (자체 체크)

- [x] 22종 전부 프롬프트 작성 (grass 10 · normal 3 · rock/ground 9)
- [x] 재설계 4종(`lumbeast`·`palmore`·`thumplord`·`blossomhawk`) 모두 원본(황소/야자나무/매머드/매) 모티프를 명시적으로 금지하고 새 디자인만 기술 — 원본 이미지는 참고하지 않음
- [x] `petalwing` grass/bug 단서(더듬이·겹눈·날개맥) 1단부터 명시, `blossomhawk`도 곤충 유지
- [x] `crystalgon` rock(크리스탈 면)+elec(스파크 도트) 이중 단서 명시
- [x] 라인별 계승 항목(팔레트+모티프) 헤더에 한 줄씩 명시, §4-1 팔레트표 값 반영(라꾸리·푸르사·먼지토끼·꽃날개)
- [x] 비재설계 18종은 실제 원본 웹툰(`assets/art/creatures/{id}.webp`)을 Read로 확인 후 반영
- [x] Phase 1 §3~6과 동일한 형식(라인 헤더 + `#### \`id\` — 이름` + `[공통 프리픽스]` 코드펜스), 공통 프리픽스/네거티브 본문은 복제하지 않고 참조만
- [x] 코드/매니페스트 수정 없음 (문서만 작성)

## 5. 미확정 사항

- `harelord`(토롱크) 원본 이미지에 잎/보석 모티프가 있으나 dex 타입은 `normal` 단일 — 타입 재분류 대상 목록(§9-2)에 없어 타입은 그대로 두고 **그림 정체성만 원본 그대로 반영**했다. 위화감이 크면 잎 모티프 비중을 낮추는 대안이 있다(제작자 재량).
- `pebblet→boulderin→megalith` 크리스탈 뿔 색(icy-blue)이 `crystalgon`(violet+icy-blue)과 다소 겹친다 — 스타일 바이블 §4-1에 이 라인 팔레트 계승표가 없어 원본 이미지 관찰로 채웠다. 확정 필요 시 크리스탈 색상을 두 라인 간에 더 벌리는 것을 검토.
- `titanoak`(거목령)과 `grovespirit`(새록정, Phase 1 §5)이 "나무를 두른 거대 생물"로 콘셉트가 근접한다 — 각각 기존 라인 설계(비재설계 대상)라 이 문서 범위에서 손대지 않았으나, 나란히 배치 시 시각 차별화(파충류 실루엣 vs 인간형 골렘 실루엣)가 충분한지 최종 스크린샷 검수에서 확인 필요.

## 6. 다음 제작 단계

1. 위 프롬프트로 22장 생성 → `art_inbox/creatures/{id}.png` 저장 (파일명 = id)
2. `make_creature_art.py` → `build.py` 반입 파이프라인 실행 (§0)
3. 재설계 4종은 특히 도감 화면에서 "원본과 다른 디자인"이라는 의도가 사용자에게 이질감을 주지 않는지 우선 검수
4. petalwing→blossomhawk, crystalgon 등 타입 단서(bug/elec)가 픽셀 축소 후에도 살아있는지(디테일 손실 여부) 96px 변환본에서 재확인
