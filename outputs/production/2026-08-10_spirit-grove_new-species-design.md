# 신규 정령 4종 — 설계 + 아트 프롬프트

작성 2026-08-10 · 상태 **아트 대기** (데이터·프롬프트 확정, 그림만 오면 바로 들어간다)

---

## 1. 왜 이 넷인가 (실측으로 고른 것)

전설·비밀 제외 81종을 훑어 **두 가지 구조적 공백**이 나왔다.

### ① 독 주타입의 최종진화가 **0개** — 유일하게 없는 타입
| 주 타입 | 최종진화(t3) 수 |
|---|---|
| 물 5 · 풀 5 · 불 4 · 전기 3 · 얼음 3 | |
| 비행 2 · 바위 2 · 땅 2 | |
| **노말 1** | ← 두 번째로 적다 |
| **독 0** | ← **없다** |

### ② t2에서 끊기는 라인이 **10개**
2단으로 끝나는 라인을 고른 플레이어는 종족값 합 **134~168**에서 멈춘다.
3단 라인은 **175~205**까지 간다 → 그 라인을 고르면 **끝까지 약하다.** 이건 취향이 아니라 손해다.

**→ 희소한 타입부터, 끊긴 라인에 최종형을 하나씩 붙인다.** 새 종 1개가 공백 1개를 닫는다.

| | 붙일 라인 | 새 종의 타입 | 닫는 공백 |
|---|---|---|---|
| 1 | 가시몽 → 넝쿠리 → **신규** | 독/풀 | **독 최종진화 0 → 1** |
| 2 | 토롱이 → 토롱크 → **신규** | 노말 | 노말 최종 1 → 2 |
| 3 | 빙구리 → 빙구악 → **신규** | 얼음/바위 | 바위 최종 2 → 3 |
| 4 | 찌리딱 → 부르릉 → **신규** | 전기/비행 | 비행 최종 2 → 3 |

⚠️ 남은 6개 라인(찌리볼·냥호·개굴몽·무르경·야자정·우직수)은 이번에 안 건드린다 — 타입이 이미 넉넉하다.
다음 사이클 후보로 문서에만 남긴다.

---

## 2. 종 데이터 (확정)

종족값은 기존 t3 대역(**175~205**, 중앙 184)에 맞췄고, **t2의 성격을 그대로 키웠다**
(특수형은 특수형으로). 진화 레벨은 기존 t2→t3 분포(Lv30~42, 최빈 **Lv32**)를 따른다.

### 2-1. `venomcrown` — 넝쿠리의 최종형
```
{id:"venomcrown", name:"넝쿠왕", em:"🐍", type:"poison", type2:"grass", tier:3,
 base:{hp:84, atk:20, def:18, spd:24, spa:30, spDef:18},        // 합 194
 moves:["toxicwave","bloom","venomfang","vine"], learn:[[8,"amnesia"],[20,"toxic"],[26,"nastyplot"],[34,"spore"],[42,"gigadrain"]]}
```
- 넝쿠리(합142 · spa21 특수형)를 그대로 키운 **특수 독 어태커**
- ⚠️ `넝쿠리`에 `evolveTo:"venomcrown", evolveLv:32` 를 추가해야 한다
- 특성: `poisonpoint`(독가시) — 넝쿠리와 같게

### 2-2. `harecrest` — 토롱크의 최종형
```
{id:"harecrest", name:"토롱제", em:"🐇", type:"normal", tier:3,
 base:{hp:88, atk:26, def:20, spd:34, spa:16, spDef:19},        // 합 203
 moves:["crush","quickstrike","slash","takedown"], learn:[[8,"agility"],[22,"swordsdance"],[30,"batonpass"],[38,"bite"],[44,"doubleteam"]]}
```
- 토롱크(spd22 최고속)를 그대로 키운 **물리 스피드 어태커**. 노말 최종이 하나뿐이라 성격을 겹치지 않게 잡았다
- ⚠️ `토롱크`에 `evolveTo:"harecrest", evolveLv:32`
- 특성: `guts`(근성)

### 2-3. `glaciarmor` — 빙구악의 최종형
```
{id:"glaciarmor", name:"빙벽상어", em:"🦈", type:"ice", type2:"rock", tier:3,
 base:{hp:90, atk:22, def:26, spd:18, spa:26, spDef:22},        // 합 204
 moves:["blizzard","rockslide","icebeam","boulder"], learn:[[8,"irondefense"],[24,"frostbreath"],[30,"amnesia"],[36,"crosschop"],[44,"hailstorm"]]}
```
- 빙구악(합137 · def/spDef 낮음)의 약점을 메운 **내구형**. 얼음/바위는 약점이 많아 내구로 보상
- ⚠️ `빙구악`에 `evolveTo:"glaciarmor", evolveLv:34`
- 특성: `swiftswim`(쓸비늘) — 빙구악과 같게

### 2-4. `stormowl` — 부르릉의 최종형
```
{id:"stormowl", name:"뇌풍올빼미", em:"🦉", type:"elec", type2:"flying", tier:3,
 base:{hp:80, atk:18, def:19, spd:28, spa:32, spDef:20},        // 합 197
 moves:["thunder","skyrush","voltfang","gust"], learn:[[8,"agility"],[20,"thunderwave"],[28,"nastyplot"],[36,"wildbolt"],[44,"recover"]]}
```
- 부르릉(합120 — t2 중 **최저**)이라 성장 폭을 크게 줬다. **특수 속공형**
- ⚠️ `부르릉`에 `evolveTo:"stormowl", evolveLv:30`
- 특성: `insomnia`(불면) — 부르릉과 같게

---

## 3. ⚠️ 넣을 때 같이 해야 하는 것 (빠뜨리면 조용히 깨진다)

| | 무엇 | 왜 |
|---|---|---|
| 1 | `assets/art/creatures/<id>.webp` 4장 | 없으면 `verify.sh`의 **PAINT_ART/DEX 대조**가 즉시 걸린다 |
| 2 | `assets/manifest.json`의 `paint` 배열에 id 4개 | 빌드가 안 싣는다 |
| 3 | 앞 단계 t2에 `evolveTo`·`evolveLv` | 안 붙이면 **도달 불가능한 종**이 된다 |
| 4 | `ENC_POOLS` 또는 진화로만 도달 | `dead_content_test`가 "잡을 길 없는 종"을 잡는다 |
| 5 | 도감 설명 | `dex_flavor_test`가 전 종 설명을 강제한다 |
| 6 | `SIGFX` 확인 | 새 **기술**을 안 넣으므로 이번엔 해당 없음 |

📌 **밸런스**: 넷 다 **진화로만** 도달하고 야생에 안 풀 것 → 트레이너 로스터가 안 변한다.
그래도 `balance_test`·`league_test`는 돌린다(플레이어 팀 풀이 넓어진다).

---

## 4. 아트 프롬프트

⚠️ **픽셀로 직접 뽑지 말 것.** 기존 86종은 **페인터리 원본을 64px로 변환**한 것이라
(원본 `art_inbox/creatures_src/`), 새 종도 **같은 페인터리로 받아서 같은 변환기를 통과**시켜야 화풍이 맞는다.
받은 뒤: `python3 scripts/pixelize_creatures.py --src <새그림폴더> --out assets/art/creatures`

### 공통 프리픽스
```
A single cute creature for a monster-collecting RPG, painterly gouache/watercolor style,
soft edges, no hard outline, warm rounded chibi proportions, big expressive eyes,
full body, three-quarter front view facing slightly left, standing on nothing.
Fully transparent background — no backdrop, no ground shadow, no frame, no text.
Centered, full body inside the canvas with a small margin.
```

### 공통 네거티브
```
pixel art, hard black outline, cel shading, 3D render, photo, background, ground shadow,
drop shadow, text, watermark, multiple creatures, cropped limbs, human, weapon
```

### 4-1. 넝쿠왕 (`venomcrown`) — 독/풀 최종
```
[공통 프리픽스]
A regal serpent spirit coiled upright. Deep violet-purple scales with moss-green vine
patterns winding along its body, a crown of curled leaves and small purple blossoms on its
head, faint toxic mist curling from its fangs. Elegant and a little dangerous, not cute-weak.
```

### 4-2. 토롱제 (`harecrest`) — 노말 최종
```
[공통 프리픽스]
A swift noble hare spirit standing tall on strong hind legs. Cream and tawny-brown fur,
long ears swept back like a banner, a light windswept crest of fur on its chest,
faint speed-wisps trailing from its heels. Athletic and alert.
```

### 4-3. 빙벽상어 (`glaciarmor`) — 얼음/바위 최종
```
[공통 프리픽스]
A sturdy shark spirit armored in pale blue glacier ice and grey stone plates,
a thick jagged dorsal fin like a frozen cliff, frost breath at its jaw,
short stubby fins and a heavy rounded body. Solid and immovable rather than sleek.
```

### 4-4. 뇌풍올빼미 (`stormowl`) — 전기/비행 최종
```
[공통 프리픽스]
A storm owl spirit with wide spread wings. Deep indigo and slate feathers with
electric-yellow tips, crackling arcs between its wingtips, bright round golden eyes,
small storm clouds gathering at its talons. Fast and sharp-eyed.
```

---

## 5. 확인 체크리스트
- [ ] 배경 완전 투명 · 그림자 없음(게임이 따로 그린다)
- [ ] 넷이 **서로 같은 화풍**이고 **기존 86종과도** 같은 결인가(기존 원본 몇 장과 나란히 볼 것)
- [ ] 변환 후 64px에서 실루엣이 읽히는가 — 얇은 장식은 도트에서 사라진다
- [ ] 타입 색이 읽히는가(독=보라 · 노말=베이지 · 얼음/바위=청회색 · 전기/비행=남색+노랑)
