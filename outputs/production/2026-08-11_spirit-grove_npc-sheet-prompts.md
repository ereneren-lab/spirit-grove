# NPC 픽셀 시트 — 원형 12종 프롬프트 + 투입 절차

작성 2026-08-11 · **✅ 1차 12 + 2차 5 + 3차-A 8 = 원형 25종 투입 완료**
**게임의 모든 인물이 픽셀 시트다** (야외 NPC 47/47 + 지도 타일이 그리는 실내·특수 8/8).
남은 발주는 **§8-B(겹침 해소 7장)** 뿐이고 그건 폴리시다.

> 🔴 **이 문서의 틀린 서술 하나**(아래 §0): *"같은 원형끼리는 기존 색 지정을 그대로 틴트로 얹어 구분한다"*
> — **코드에 그 틴트가 없다.** `_char`의 시트 분기(`src/index.html:2865`)는 그림을 그대로 그리고 바로
> `return`한다. 계획을 구현으로 읽은 것이다.
> → 틴트를 넣는 대신 **변형 원형 5종을 더 받는 쪽**으로 갔다(§7). 받은 그림이 이미 원색이라
>   `hue-rotate`를 걸면 피부색까지 돈다는 게 기각 이유다.
>
> 📌 **받은 형식은 "원형당 1장"이 아니라 대조표 한 장이었다(1·2차 모두).** 그게 더 낫다 —
> 한 번에 뽑아야 화풍이 안 갈린다. 쪼개는 건 `scripts/split_contact_sheet.py`가 한다(§4 참조).

✅ 끝난 것: 원형 매핑(`NPC_ARCH`, 43명) · 시트 렌더 경로(`_char` 앞단) · 빌드 임베딩(`npc_sheet`) ·
   일괄 변환기(`scripts/make_npc_sheet.py`) · 회귀(`scripts/npc_sheet_test.js`) · **아트 17장**

유저 요청: *"npc 마주쳐서 배틀하는데 머리가 이상한 경우도 제거하고. **차라리 프롬프트 짜서 여러 간단한 npc들 만드는 게 낫겠다.**"*

---

## 0. 왜 47장이 아니라 12장인가 (실측)

지금 NPC는 **47명**이다. 한 명씩 그리면 47장인데, 그럴 필요가 없다.

절차적 스프라이트를 고쳐 **실루엣 조합을 12종 → 34종**으로 늘려둔 상태다
(체형 4 × 머리길이 2 × 모자 7 × 소품 9). 여기서 아트가 더할 수 있는 건 **"손으로 그린 질감"** 이지
"서로 다르다"가 아니다 — 다름은 이미 확보됐다.

**→ 47명을 12개 원형으로 묶고, 원형마다 시트 한 장.**
같은 원형끼리는 **기존 색 지정(`spr.outfit`/`accent`/`hair`)을 그대로 틴트로 얹어** 구분한다.
그래서 12장으로 47명이 다 달라 보인다.

⚠️ **아트가 없으면 지금의 절차적 스프라이트로 그대로 폴백한다.** 12장을 한 번에 다 받을 필요가 없고,
한 장씩 들어올 때마다 그 원형만 교체된다(정령 86종·주인공 4명이 쓰는 방식과 같다).

---

## 1. 원형 12종 — 누가 어디에 들어가나

> ⚠️ **이 표는 1차(12종) 시점이다. 2차에서 5명이 변형 원형으로 옮겨갔다** → §7-5.
> 실제 매핑은 언제나 `NPC_ARCH`가 단일 출처다.

| # | 원형 id | 성격 | 들어가는 NPC (47명 전원) |
|---|---|---|---|
| 1 | `kid` | 아이. 작고 머리가 크다 | 개구쟁이 하린 · 초보 정령사 준 · 물놀이 소년 하리 · 새싹 채집가 이든 · 풀잎소녀 도윤 · 쌍둥이 나나·리리 |
| 2 | `bugkid` | 채집망을 든 아이 | 벌레소년 메아 · 곤충채집가 나린 |
| 3 | `youth_f` | 소녀·젊은 여성. 긴 머리 | 풀숲 소녀 미나 · 꽃밭 소녀 채원 · 교환하는 소녀 하늘 · 불새지기 소연 |
| 4 | `youth_m` | 소년·젊은 남성 | 라이벌 카이(4곳) · 교환하는 청년 재하 · 들새 관찰자 소라 |
| 5 | `hunter` | 두건 + 활/매. 야외형 | 매잡이 세진 · 숲의 사냥꾼 강 · 설원 사냥꾼 하린 · 숲지기 도윤 |
| 6 | `angler` | 챙모자 + 낚싯대 | 호수 낚시꾼 도윤 · 호수지기 리오 |
| 7 | `miner` | 곡괭이 + 헬멧. 땅딸 | 동굴 탐사가 바위 · 등반가 강우 · 나무꾼 바우 |
| 8 | `scholar` | 안경 + 책/두루마리 | 수정 연구가 예린 · 연구소 조수 하린 · 조수 미나 · 기술 전문가 |
| 9 | `mystic` | 후드 + 지팡이 | 주술견습 유나 · 제단의 순례자 · 제단 감시인 · 용 수련생 하늘 |
| 10 | `guard` | 갑주 + 무기. 장신 | 제단 파수꾼 무진 · 고원 무사 태오 · 도장의 관장 세라 |
| 11 | `merchant` | 등짐 + 앞치마 | 봇짐장수 두식 · 교환상인 로엔 · 상점 점원 |
| 12 | `elder` | 노인. 굽은 등 + 지팡이/바구니 | 숲지기 노인 · 이웃 아주머니 복순 · 육아방 관리인 |

📌 실제 매핑은 `NPC_ARCH`(src/index.html)가 **단일 출처**다. 위 표는 설명용이니
어긋나면 코드를 믿을 것 — `npc_sheet_test [1]`이 "없는 NPC를 가리키는 매핑"을 자동으로 잡는다
(실제로 이 표를 코드로 옮길 때 `assistant`라는 없는 id를 적었고, 그 회귀가 잡아냈다).

⚠️ **간호사·회관 3인 등은 이번 범위 밖이다.** 그들은 `NPC_SPR` 상수로 따로 관리되고
역할이 뚜렷해(간호사 캡·적십자) 절차적 쪽이 이미 읽힌다. 원하면 다음 사이클에 `nurse`·`clerk`를 추가한다.

> 🔴 **이 문단이 한동안 틀린 말을 함께 담고 있었다** (2026-08-11 3차에 정정).
> *"47명 중 43명 — 나머지 4명은 실내 인물이라 범위 밖"* 이라고 적혀 있었는데, 그 4명은
> **지도 위에 서 있던 야외 NPC**였다(숲의 노인 · 떠돌이 학자 · 호수 어부 · 순례자).
> id가 원형 이름과 겹쳐서(`elder`·`scholar`) 이미 배정된 걸로 읽혔다.
> 넷 다 `spr`이 답을 갖고 있어 **그림 추가 없이** 기존 원형에 붙었다 →
> beard→`elder_m` · scroll→`scholar` · straw+rod→`angler` · hood+staff→`mystic`.
> **야외는 이제 47/47이다.** 진짜 남은 건 `NPC_SPR` 쪽이고, 거기는 새 그림이 필요하다 → **§8-A**.
> 📌 `isleLeader`·`snowMaster`는 `boss:true`다. 한때 **시트를 붙이면 보스 오라가 조용히 사라지는**
> 함정이 있었지만(시트 분기가 그림을 그리고 바로 `return`했다. 실측: 그라디언트 3 → 0)
> **08-11에 `_bossAura`를 두 경로가 공유하도록 고쳤다.** 이제 시트를 줘도 오라가 살아 있고,
> `npc_sheet_test [6]`이 그 동작을 단정한다(고치기 전 빌드에서 실패를 확인했다).

---

## 2. 무엇을 받는가 — **9칸 시트가 아니라 "3자세 한 장"이다**

⚠️ **처음에 3×3 시트로 프롬프트를 짰다가 고쳤다.** 이 저장소의 변환기(`make_hero_sheet.py`)는
9칸 시트를 받는 게 아니라 **자세 3개가 담긴 이미지 한 장**을 받아, 격자를 감지하고
**걷기 프레임 2장을 직접 합성**한다(`step_frame`). 주인공 4명이 그렇게 만들어졌다.
생성 AI에게 9칸 격자를 정확히 맞추라고 하면 거의 실패하는데, 이 방식은 그 문제를 통째로 피한다.

**받을 것 — 원형 1개당 이미지 1장, 그 안에 자세 3개가 가로로 나란히.**

```
[ ① 정면 ]   [ ② 뒷모습 ]   [ ③ 오른쪽 옆모습 ]
```

```
배경     완전 투명 (알파 0)
그림자   그리지 말 것 — 게임이 따로 그린다
크기     자세 3개가 서로 같은 키 · 같은 발밑 선
간격     자세 사이를 넉넉히 띄울 것 (격자 자동 감지가 붙어 있으면 한 덩어리로 읽는다)
```

⚠️ **옆모습은 오른쪽만 그린다.** 왼쪽은 게임이 좌우 반전해서 쓴다(`heroSheetFrame`의 `flip`).
왼쪽을 따로 그리면 반전과 겹쳐 어긋난다.

⚠️ **걷기는 안 그려도 된다.** 정지 자세만 주면 변환기가 몸통을 위아래로 살짝 흔들어 A/B를 만든다.
   (주인공 때 **다리만 잘라 옮겼더니 허리·장화에 투명한 이음매가 생겼다** → 스프라이트를 안 자르고
    통째로 흔드는 방식으로 바꿨다. 자르지 않으니 이음매가 없다.)
   직접 걷기 3자세를 그려 주면 그걸 그대로 쓴다(`--front r1c1,r1c2,r1c3` 형식).

---

## 3. 프롬프트

### 공통 프리픽스 (12장 전부 앞에 붙인다)

```
Three separate full-body poses of the SAME character, laid out in a single horizontal row
with clear empty space between them, for a top-down 2D pixel-art RPG sprite.
Pose 1: facing the viewer (front view).
Pose 2: seen from behind (back view).
Pose 3: right-facing side profile (character looks to the RIGHT).
Chunky readable pixel art, limited palette, crisp hard pixel edges, no anti-aliasing,
simple chibi proportions (about 2.5 heads tall), clear silhouette, standing idle.
All three poses must be the same height and stand on the same baseline.
Fully transparent background. No ground shadow, no frame, no text, no labels, no grid.
```

### 공통 네거티브

```
anti-aliasing, blurry, soft gradients, painterly, 3D render, photo, background,
ground shadow, drop shadow, frame, text, watermark, different characters,
cropped limbs, extra limbs, inconsistent size between poses, left-facing profile,
poses touching or overlapping
```

📌 **색은 무채색에 가깝게 받아라.** 게임이 `spr.outfit`/`accent`/`hair`로 틴트를 얹어
같은 원형에서 여러 사람을 만든다. 원색이 강하면 틴트가 안 먹는다.

---

### 3-1. `kid` — 아이
```
[공통 프리픽스]
A small child trainer, big head and short limbs, short tousled hair,
simple tunic and shorts, small satchel at the hip. Energetic posture.
```

### 3-2. `bugkid` — 벌레잡이 아이
```
[공통 프리픽스]
A child bug-catcher wearing a soft cap, holding a butterfly net over one shoulder,
a small collecting box on the belt. Shorts and sturdy shoes.
```

### 3-3. `youth_f` — 소녀
```
[공통 프리픽스]
A young girl traveler with long hair falling past her shoulders,
a simple dress over leggings, a small shoulder bag. Calm, upright posture.
```

### 3-4. `youth_m` — 소년
```
[공통 프리픽스]
A teenage boy trainer wearing a baseball-style cap turned forward,
a short jacket over a shirt, backpack straps visible on both shoulders. Confident stance.
```

### 3-5. `hunter` — 사냥꾼
```
[공통 프리픽스]
A lean outdoor hunter with a bandana tied around the forehead, a short cloak,
a bow slung across the back, boots laced high. Alert posture.
```

### 3-6. `angler` — 낚시꾼
```
[공통 프리픽스]
A fisher wearing a wide straw hat, a vest with many pockets,
holding a fishing rod resting on one shoulder, rolled-up trousers. Relaxed stance.
```

### 3-7. `miner` — 광부·등반가
```
[공통 프리픽스]
A stout miner with a hard helmet and a small lamp on it, thick gloves,
a pickaxe held at the side, sturdy heavy boots. Broad, heavy build.
```

### 3-8. `scholar` — 연구자
```
[공통 프리픽스]
A slender scholar with round glasses, a long open lab coat over simple clothes,
holding a closed book under one arm. Neat, composed posture.
```

### 3-9. `mystic` — 주술사·순례자
```
[공통 프리픽스]
A hooded mystic in a long robe reaching the ankles, the hood up and shadowing the face,
holding a plain wooden staff. Quiet, still posture.
```

### 3-10. `guard` — 파수꾼·무사
```
[공통 프리픽스]
A tall guard in light layered armor over a tunic, a shoulder guard on one side,
a sheathed short sword at the hip. Straight, disciplined posture.
```

### 3-11. `merchant` — 행상
```
[공통 프리픽스]
A traveling merchant with a large bundle pack on the back,
an apron over work clothes, a coin pouch on the belt. Slightly leaning forward from the load.
```

### 3-12. `elder` — 노인
```
[공통 프리픽스]
An elderly villager with a slightly bent back, grey hair tied back,
a shawl over the shoulders, holding a woven basket in one hand. Slow, gentle posture.
```

---

## 4. 받은 뒤 절차

```bash
# 0) 대조표 한 장으로 받았다면 먼저 쪼갠다 (실제로 08-11에 이렇게 왔다)
python3 scripts/split_contact_sheet.py <대조표.png> --out art_inbox/npc/_split \
        --names kid,bugkid,youth_f,youth_m,hunter,angler,miner,scholar,mystic,guard,merchant,elder

# 1) 원형 하나씩 변환 (주인공과 같은 변환기)
python3 scripts/make_hero_sheet.py <받은그림.png> assets/art/npc_sheet/kid.webp \
        --front r1c1 --back r1c2 --side r1c3

# 12장을 한 번에:
python3 scripts/make_npc_sheet.py --src art_inbox/npc/_split --out assets/art/npc_sheet

# 2) 매니페스트에 원형 id 추가 — assets/manifest.json 의 "npc_sheet" 배열
# 3) 빌드 + 회귀
python3 scripts/build.py && node scripts/npc_sheet_test.js dist/spirit_grove_3d.html
bash scripts/verify.sh
```

⚠️ **변환기의 함정 3개** (주인공 작업에서 전부 겪었다 — `scripts/make_hero_sheet.py`에 그대로 있다)
1. **배경 제거는 테두리 플러드필로 한다.** 색 거리로 지우면 인물이 든 갈색 배낭까지 날아간다.
2. **그림자는 알파 100~140이다.** 축소 **전에** 떨궈야 한다 — 축소 후엔 본체와 섞여 못 뗀다.
3. **한 칸씩 정사각으로 자르면 크기가 출렁인다.** 시트 전체 공통 `SIDE`로 잡아야 한다.

⚠️ 격자 감지(`detect_grid`)가 자세를 못 나누면 `r1c1`이 통째로 잡힌다.
   **자세 사이 여백을 넉넉히** 받아야 하는 이유가 이것이다. 변환 로그의 "격자 감지: N행 × M열"을 볼 것.

## 5. 확인 체크리스트

- [ ] 자세 3개가 **가로로 나란히** 있고 **서로 떨어져** 있는가 (붙어 있으면 격자 감지가 실패한다)
- [ ] 배경 알파 0 · 그림자 없음
- [ ] 세 번째가 **오른쪽** 옆모습인가 (왼쪽이면 게임에서 반전과 겹쳐 뒤집힌다)
- [ ] 세 자세의 키와 발밑 선이 같은가
- [ ] 변환 로그의 "격자 감지"가 **1행 × 3열**로 나오는가
- [ ] 12장이 서로 같은 화풍이고, **주인공 4명과도** 같은 결인가 (`assets/art/hero_sheet/` 와 나란히 볼 것)
- [ ] 색이 너무 원색이지 않은가 (틴트가 먹어야 한다)

---

## 6. 미확정 · 유저가 정할 것

1. ~~12종 전부 받을지~~ → **12종 전부 받았다(2026-08-11).**
2. **실내 인물(간호사·상점원·회관 3인)을 포함할지.** 지금은 범위 밖으로 뒀다.
3. **로밍 NPC의 걷기.** 지금 절차적 스프라이트는 걷기 사이클이 있다. 시트도 3열이라 그대로 돈다 —
   추가 작업은 없지만, 걸음 A/B가 부실하면 로밍할 때 티가 난다.

---

# 7. 변형 원형 — 2차 발주안 (2026-08-11 · 유저 선택 「인원 많은 원형만 변형 추가」)

## 7-1. 왜 필요한가

시트가 들어가면서 **43명이 12가지 외모**가 됐다(틴트가 코드에 없다 — 문서 머리말 참조).
그런데 실측해 보니 **"인원 수"만으로 고르면 틀린다.** 두 가지를 같이 봐야 한다.

**게임을 띄워 실제로 센 값** (`NPC_ARCH` + `NPCS` 좌표. 겹침 = 같은 원형 둘이 ±8칸 안에 있는 쌍)

| 원형 | 인원 | 겹침 | 실제로 다른 사람 | 비고 |
|---|---|---|---|---|
| `youth_m` | 6 | 2쌍 | **3명** | ⛔ 4명이 **같은 사람**(라이벌 카이가 4곳에 배치) |
| `kid` | 6 | **3쌍** | 6명 | 최다 겹침 |
| `scholar` | 4 | 2쌍 | 4명 | 연구소 앞(y47~48)에 3명이 몰려 있다 |
| `hunter` | 4 | 1쌍 | 4명 | |
| `mystic` | 4 | 1쌍 | 4명 | |
| `youth_f` | 4 | 1쌍 | 4명 | |
| `elder` | 3 | 2쌍 | 3명 | 인원 대비 겹침이 가장 높다 |
| `miner` | 3 | 2쌍 | 3명 | |
| `guard` | 3 | 2쌍 | 3명 | |
| `merchant`·`bugkid`·`angler` | 2 | 0~1쌍 | 2명 | 손댈 필요 없다 |

⛔ **`youth_m`에는 변형을 주면 안 된다.** 6명 중 4명이 라이벌 카이 한 사람이다 —
변형을 주면 **같은 인물이 장소마다 다르게 생기는** 더 나쁜 버그가 된다.
📌 인원 수 1위인데 발주에서 빠지는 이유가 이것이다. **표만 보고 고르면 여기서 틀린다.**

## 7-2. 겹침보다 큰 문제 — **역할과 그림이 어긋난 자리**

변형을 "옷만 다른 두 번째 사람"으로 뽑으면 절반만 버는 것이다. 지금 **틀린 그림**이 있다.

| 지금 | 무엇이 어긋났나 |
|---|---|
| `miner` = 헬멧+곡괭이 | **나무꾼 바우**가 광부 헬멧을 쓰고 있다 (도끼여야 한다) |
| `elder` = 할머니(바구니) | **숲지기 노인**도 같은 할머니다 |
| `kid` = 남자아이 | **풀잎소녀 도윤**·**쌍둥이 나나·리리**가 남자아이 그림이다 |
| `scholar` = 남성 연구자 | **조수 미나**·**수정 연구가 예린**이 같은 남자다 |
| `hunter` = 활 멘 사냥꾼 | **매잡이 세진**에게 매가 없다 |

→ **변형 5장이 겹침과 불일치를 동시에 푼다.** 아래가 그 5장이다.

## 7-3. 발주 — 변형 5장 (우선순위 순)

공통 프리픽스·네거티브·규격은 **§2·§3과 완전히 동일하다**. 대조표 한 장에 몰아 뽑을 것
(§4-0의 `split_contact_sheet.py`가 쪼갠다). 자세 사이 여백을 넉넉히.

### ① `kid_f` — 여자아이 *(겹침 3쌍 → 1쌍)*
```
[공통 프리픽스]
A small girl trainer, big head and short limbs, hair in two short braids,
a simple pinafore dress over leggings, a flower tucked behind one ear. Cheerful posture.
```

### ② `scholar_f` — 여성 연구자 *(겹침 2쌍 → 0쌍)*
```
[공통 프리픽스]
A young woman researcher with hair tied in a low bun, round glasses,
a long open lab coat over simple clothes, a clipboard held against the chest. Attentive posture.
```

### ③ `elder_m` — 남성 노인 *(겹침 2쌍 → 0쌍)*
```
[공통 프리픽스]
An elderly man with a slightly bent back, a short white beard and bald crown,
a worn work vest, holding a long walking stick. Slow, steady posture.
```

### ④ `woodcutter` — 나무꾼 *(겹침 2쌍 → 1쌍 · 역할 불일치 해소)*
```
[공통 프리픽스]
A broad-shouldered woodcutter with a cloth headband, rolled-up sleeves,
a wide axe resting on one shoulder, a bundle of logs strapped to the back. Sturdy stance.
```

### ⑤ `falconer` — 매잡이 *(역할 불일치 해소)*
```
[공통 프리픽스]
A hunter with a thick leather gauntlet on one arm and a hawk perched on it,
a short hooded cloak, a bandana around the neck. Alert, upright posture.
```

📌 **`guard`(3명 2쌍)는 뺐다.** 셋 다 투구를 써서 얼굴이 안 보이고, 서 있는 자리가
고원·제단·도장으로 지역이 갈려 실제로 나란히 보이는 일이 드물다. 6번째로 받을 만하지만 우선순위는 낮다.

## 7-4. ⚠️ 받기 **전에** `NPC_ARCH`를 고치지 말 것

원형 id를 먼저 바꿔놓으면 그 NPC들은 **아트가 없어 절차적 스프라이트로 폴백한다** →
한 화면에 픽셀 시트와 절차적 스프라이트가 섞여, 지금보다 더 튄다.
**그림이 도착한 뒤에 매핑과 매니페스트를 같이 바꾼다.** 순서는 이렇다.

```bash
python3 scripts/split_contact_sheet.py <대조표.png> --out art_inbox/npc/_split \
        --names kid_f,scholar_f,elder_m,woodcutter,falconer
python3 scripts/make_npc_sheet.py --src art_inbox/npc/_split --out assets/art/npc_sheet
# ⚠️ make_npc_sheet.py 의 ARCHETYPES 목록에 새 id 5개를 추가해야 경고 없이 지나간다
# 그다음 ① assets/manifest.json "npc_sheet" 에 5개 추가
#        ② src/index.html 의 NPC_ARCH 에서 아래 NPC들을 새 원형으로 옮긴다
python3 scripts/build.py && node scripts/npc_sheet_test.js dist/spirit_grove_3d.html
```

**옮길 NPC (실측 이름 그대로)**

| 새 원형 | 옮길 NPC |
|---|---|
| `kid_f` | 풀잎소녀 도윤 · 쌍둥이 나나·리리 · 새싹 채집가 이든 |
| `scholar_f` | 조수 미나 · 수정 연구가 예린 |
| `elder_m` | 숲지기 노인 |
| `woodcutter` | 나무꾼 바우 |
| `falconer` | 매잡이 세진 |

⚠️ `NPC_ARCH`는 **id**로 매핑한다 — 위 표는 사람 이름이다. 실제 id는 코드에서 확인할 것
(`npc_sheet_test [1]`이 없는 id를 가리키는 매핑을 자동으로 잡는다 — 08-11에 실제로 한 건 잡았다).


## 7-5. ✅ 결과 (2026-08-11 · 아트 5장 도착 후 실측)

원형 **12종 → 17종**. 겹침 **17쌍 → 11쌍**(라이벌 카이 2쌍은 같은 사람이라 원래 문제가 아니다 → 15 → 9).

> 📌 **그 직후 3차에서 14쌍으로 늘었다.** 빠져 있던 야외 4명을 배선했기 때문이다(§1의 정정 참조).
> 특히 `angler`가 1 → **3쌍**이다 — 호수 어부(7,22)와 호수 낚시꾼 도윤(8,22)이 **바로 옆 칸**이다.
> 겹침이 늘어도 배선한 이유: 대안이 **"혼자만 납작한 절차적 스프라이트"** 이고, 그게 원래 지적받은
> 이질감 그 자체다. → **`angler2`가 다음 발주 1순위다.**

| 원형 | 전 | 후 | 비고 |
|---|---|---|---|
| `miner` | 2쌍 | **0쌍** | 나무꾼이 `woodcutter`로 빠졌다 |
| `hunter` | 1쌍 | **0쌍** | 매잡이가 `falconer`로 빠졌다 |
| `scholar` | 2쌍 | 1쌍 | `scholar_f` 0쌍 |
| `elder` | 2쌍 | 1쌍 | `elder_m` 0쌍 |
| `kid` | 3쌍 | 2쌍 | `kid_f` 0쌍 |

### ⚠️ 발주안(§7-4)에서 **바꾼 것 둘** — 코드 데이터가 문서보다 옳았다

1. **`새싹 채집가 이든`(t12)을 `kid_f`로 옮기지 않았다.** 이름으로 정했던 건데,
   그 NPC의 `spr`은 **긴머리가 없고 `hat:"cap"`** 이다 → 여자아이 그림을 씌우면 데이터와 어긋난다.
   📌 이 저장소가 실제로 쓰는 성별 신호는 **`spr.hairlen==="long"`** 이다
   (도윤·나나리리·예린·복순·육아방 관리인이 그렇다). **이름으로 짐작하지 말 것.**
   그래서 `kid`는 3쌍 → 1쌍이 아니라 **2쌍**이 됐다. 옮기면 1쌍이 되지만 그림이 틀린다.
2. **`scholar_f`는 "2쌍 → 0쌍"이 아니라 1쌍이 남는다.** 문서의 0쌍은 계산 착오였다 —
   남는 둘(연구소 조수 하린 · 기술 전문가)이 (4,48)·(9,47)로 5칸 거리다.

---

# 8. 3차 발주안 (2026-08-11 · 야외 47/47이 끝난 뒤)

**대조표 두 장으로 나눠 받는다.** 한 장에 15명을 몰면 화풍이 흔들린다(1차가 12명이었고 그게 상한선에 가깝다).
공통 프리픽스·네거티브·규격은 **§2·§3과 완전히 동일하다.**

---

## 8-A. 발주 A — **실내·특수 8장** — ✅ **2026-08-11 도착·투입 완료**

> 받은 그림은 **배경이 검정이고 스프라이트 둘레에 빨강·청록 프린지**가 있었다.
> 그래도 그대로 통과했다 — **알파가 이미 들어 있었고**(투명 43.3%) 프린지가 반투명이라
> `drop_soft_alpha`가 떨궜다. 24자세 전부 정확히 갈렸다. **배경이 불투명해 보여도 일단 넣어볼 것.**

야외는 47/47이 끝났고, **아직 절차적으로 남은 건 `NPC_SPR` 쪽뿐이다.**
이들은 `NPCS` 배열이 아니라 **지도 타일이 직접 그린다**(`_char(…, NPC_SPR.x, …)`).

📌 **1순위인 이유**: 간호사와 상점 점원은 플레이어가 **가장 자주 보는 인물**인데
지금 유일하게 납작한 절차적 스프라이트다. 원래 지적받은 이질감이 정확히 여기 남아 있다.

| id | 누구 | 어디서 그려지나 |
|---|---|---|
| `nurse` | 정령센터 간호사 | `N` 타일 (실내 center) |
| `clerk` | 상점 점원 | `N` 타일 (그 외 실내) |
| `lore` | 전승 기록자 | `N` 타일 (야외) |
| `p` | 감정사 🔍 | 회관 |
| `n` | 개명사 ✒️ | 회관 |
| `s` | 안마사 💆 | 회관 |
| `snowMaster` | 설원 사범 | `Q` 타일 (야외 · **보스**) |
| `isleLeader` | 섬 지도자 | `L` 타일 (야외 · **보스**) |

⚠️ **보스 둘은 붉은 오라가 뒤에 깔린다.** 오라와 겹쳐 읽히도록 **실루엣을 크고 단순하게**,
   색은 오라(분홍빛 붉은색)와 부딪히지 않게 **차가운 계열**로 받을 것.
   (08-11에 시트 경로가 오라를 안 그리던 함정을 고쳤다 — 이제 시트를 줘도 오라가 살아 있다.
    `npc_sheet_test [6]`이 고정한다.)

📌 **색은 코드의 기존 지정을 따랐다.** 간호사 분홍 머리처럼 플레이어가 기억하는 색이 있다.

### `nurse`
```
[공통 프리픽스]
A cheerful nurse in a white uniform dress with a red cross on the chest,
soft rose-pink hair curled at the shoulders, a small white nurse cap.
Hands clasped in front. Calm, welcoming posture.
```

### `clerk`
```
[공통 프리픽스]
A shop clerk in a blue button-up uniform with a name tag and a short apron,
short dark brown hair, sleeves rolled to the elbow, one hand raised in greeting.
```

### `lore`
```
[공통 프리픽스]
An archivist in a deep blue robe with silver-white hair tied back,
an open book cradled in one arm, a quill tucked behind the ear. Thoughtful posture.
```

### `p` — 감정사
```
[공통 프리픽스]
An appraiser in a plum-purple vest over a shirt, round spectacles low on the nose,
holding a magnifying glass up at eye level. Slightly stooped, scrutinizing posture.
```

### `n` — 개명사
```
[공통 프리픽스]
A calligrapher in a mauve tunic with wide sleeves, hair in a neat topknot,
holding a long writing brush upright in one hand, an inkstone in the other. Poised posture.
```

### `s` — 안마사
```
[공통 프리픽스]
A masseur in a sage-green short-sleeved work coat with a folded towel over one shoulder,
sturdy build, both hands open and relaxed at the sides. Friendly, grounded stance.
```

### `snowMaster` — 설원 사범 (보스)
```
[공통 프리픽스]
An ice master with spiky pale blue-white hair and a heavy fur-lined coat in cold slate blue,
a long scarf trailing to one side, arms crossed. Imposing, broad silhouette.
```

### `isleLeader` — 섬 지도자 (보스)
```
[공통 프리픽스]
An island leader with spiky dark hair and a sleeveless deep-teal coat over bare shoulders,
a wide sash at the waist, one fist clenched at the side. Imposing, broad silhouette.
```

---

## 8-B. 발주 B — **겹침 해소 변형 7장** (2순위)

지금 **14쌍**이다. 아래 7장이면 **라이벌 카이 2쌍(같은 사람이라 원래 문제가 아니다)을 빼고 0쌍**이 된다.
각 항목의 「옮길 NPC」는 실측 좌표로 고른 것이다 — **한 장이 2쌍을 지우는 배치**를 골랐다.

| 새 원형 | 지우는 겹침 | 옮길 NPC |
|---|---|---|
| `angler2` | **3쌍 → 1쌍** | 호수 어부 (7,22) ← **바로 옆 칸에 낚시꾼 도윤(8,22)이 있다. 최우선.** |
| `mystic2` | 2쌍 → 0쌍 | 용 수련생 하늘 (3,27) · 순례자 (16,16) |
| `kid2` | 2쌍 → 0쌍 | 새싹 채집가 이든 (3,40) · 초보 정령사 준 (16,47) |
| `guard_f` | 2쌍 → 0쌍 | 도장의 관장 세라 (16,9) — 여성 이름인데 지금 남성 갑주다 |
| `youth_f2` | 1쌍 → 0쌍 | 교환하는 소녀 하늘 (9,45) |
| `scholar2` | 1쌍 → 0쌍 | 기술 전문가 (9,47) |
| `elder2` | 1쌍 → 0쌍 | 육아방 관리인 (13,47) |

⚠️ **`angler`는 셋이 서로 다 겹친다**(어부·리오·도윤이 5칸 안에 몰려 있다). `angler2` 한 장으로 3 → 1이고,
   완전히 지우려면 `angler3`가 하나 더 필요하다. **1쌍은 남겨도 된다** — 그 둘은 5칸 거리라 화면 끝과 끝이다.
⛔ **`youth_m`은 손대지 않는다** — 6명 중 4명이 라이벌 카이 한 사람이다(§7-1).

### `angler2`
```
[공통 프리픽스]
An older fisherman with a weathered face and a short grey beard, a rolled bandana on the head,
a heavy oilskin coat, a wicker creel on the hip, a short rod held low. Patient, settled stance.
```

### `mystic2`
```
[공통 프리픽스]
A young shrine acolyte in pale cream robes with a wide sash, hood down showing short dark hair,
a string of prayer beads wound around one wrist. Upright, formal posture.
```

### `kid2`
```
[공통 프리픽스]
A small boy in denim overalls and a wide straw sun-hat, big head and short limbs,
a woven basket carried in front with both hands. Curious, leaning-forward posture.
```

### `guard_f`
```
[공통 프리픽스]
A tall woman guard captain in light layered armor over a tunic, a long dark ponytail,
a shoulder guard on one side, a sheathed sword at the hip. Straight, disciplined posture.
```

### `youth_f2`
```
[공통 프리픽스]
A young woman traveler with short bobbed hair and a headband, a hooded cape over a tunic,
a satchel across the body. Relaxed, easy stance.
```

### `scholar2`
```
[공통 프리픽스]
A move tutor in a rust-orange training jacket over a shirt, short cropped hair and a headband,
a rolled scroll held like a baton in one hand. Confident, instructive posture.
```

### `elder2`
```
[공통 프리픽스]
An elderly caretaker with white hair in a bun under a kerchief, a long apron over a plain dress,
holding a swaddled bundle in both arms. Warm, gentle posture.
```

---

## 8-C. 받은 뒤 절차

```bash
# 발주 A
python3 scripts/split_contact_sheet.py <A.png> --out art_inbox/npc/_split3 \
        --names nurse,clerk,lore,p,n,s,snowMaster,isleLeader
# 발주 B
python3 scripts/split_contact_sheet.py <B.png> --out art_inbox/npc/_split4 \
        --names angler2,mystic2,kid2,guard_f,youth_f2,scholar2,elder2

python3 scripts/make_npc_sheet.py --src art_inbox/npc/_splitN --out assets/art/npc_sheet
```
그다음 **세 군데**를 같이 고친다. 하나만 하면 조용히 폴백한다.
1. `scripts/make_npc_sheet.py`의 `ARCHETYPES`에 새 id 추가 (없으면 경고하고 건너뛴다)
2. `assets/manifest.json`의 `"npc_sheet"` 배열에 추가
3. **발주 A는 `NPC_SPR`의 각 항목에 `sheet:"<id>"` 를 넣는다** (`NPC_ARCH`가 아니다 —
   이들은 `NPCS` 배열에 없고 타일이 직접 그린다).
   **발주 B는 `NPC_ARCH`** 에서 위 표의 NPC를 새 원형으로 옮긴다.

⚠️ **아트가 없는 id를 먼저 적지 말 것** — 그 인물만 절차적으로 폴백해 한 화면에 두 화풍이 섞인다.
