# 특성·개체값·성격 시스템 마감 설계안

작성 2026-08-20 · 대상 저장소: Spirit Grove (`src/rules/*.js`, `src/index.html`)
전제: 코드 실측 기반. 인용한 파일:라인은 작성 시점 기준.

> **[2026-08-20 구현/정정 로그]**
> - **갭 A(인어트 특성 3종)는 오판이었다.** `poisonpoint·flamebody·roughskin`은 이미 `index.html:5327-5332`에 정상 구현돼 있었다(21개 특성 전부 전투 훅 보유). 최초 audit이 `grep`에서 `//` 주석 라인을 제외해 훅을 놓친 false negative였다. **§1은 신규 작업 불필요.**
> - **갭 B(미배정 47종 배정)만 실제 작업이었고, 완료했다.** `ABILITY_OVERRIDE`에 47종 추가 → 전 86종 명시 배정, 특성 21종 분산, 최다 intimidate 10종(회귀 상한 13 준수). `ability_expand_test·newtypes_test·type_chart_test·balance_test·league_test` 전부 통과.

---

## 0. 정정 및 현황 (먼저 읽을 것)

앞선 "포켓몬 대비 부족한 점" 분석에서 **"개체 다양성 레이어가 없다 / 특성이 타입 귀속이다"** 라고 지적했으나, `makeMon` 실측 결과 **이는 사실이 아니다.** 아래는 이미 구현·노출되어 있다.

| 시스템 | 상태 | 근거 |
|---|---|---|
| 개체값 IV(0~31, 6스탯) | ✅ 구현 + recalc 반영 | `dex.js:134` `ivs:{…ri(0,31)}`, `dex.js:148` |
| 노력치 EV(전투 획득·상한 510/252·아이템) | ✅ 구현 | `index.html:5840-5842`(승리 시 획득), `6603`(EV아이템), `6881` |
| 성격 Nature(16종, ±10%) | ✅ 구현 + 라벨 | `tables.js:43` `NATURES`, `dex.js:147`, `natureLabel` `tables.js:57` |
| 이로치 shiny(1/64 + 참·마스터 배수) | ✅ 구현 | `dex.js:134`, `tables.js:58` |
| 성별 gender | ✅ 구현 | `dex.js:134` |
| 특성 ability(**종별**) | ✅ 엔진+21종 한글화+상세뷰 노출, **39종 배정** | `dex.js:133`, `tables.js:33/86`, 상세뷰 `index.html:6370` |

**즉 남은 일은 "구현"이 아니라 "마감"이다.** 진짜 갭은 세 가지다.

- **갭 A** — 배정됐으나 전투 효과가 없는 **인어트(inert) 특성 3종**: `flamebody·roughskin·poisonpoint`
- **갭 B** — **47종이 종별 특성 미배정** → 타입 기본특성으로 폴백(타입 내 개성 납작)
- **갭 C**(선택) — 슬롯/히든 특성 부재(1종 고정)

개체값/성격(IV·EV·Nature)은 사실상 완성 상태라 별도 구현이 불필요하다. 폴리시만 §4에 정리한다.

---

## 1. 갭 A — ~~인어트 특성 3종 효과 구현~~ → **이미 구현됨(작업 불필요)**

> 🔴 **정정:** 아래 3종은 이미 `index.html:5327-5332`에 훅이 있어 정상 작동한다. 최초 audit이 `grep -v '//'`로 주석 달린 훅 라인을 제외해 오탐했다. 이 절은 "왜 오판했는지 + 실제 구현 위치" 기록용으로만 남긴다.

~~`ABILITY_KO`/`ABILITY_DESC`에 등록되고 종에도 배정됐지만 **전투 로직에 훅이 없어 아무 일도 안 하는** 특성:~~ (→ 실제로는 아래 모두 구현되어 있었음)

| 특성 | 한글 | 배정된 종(현재) | 의도한 효과(포켓몬 기준) |
|---|---|---|---|
| `flamebody` | 불꽃몸 | emberfly, pyrmoth, cindercat, lavakit | 접촉 물리기 피격 시 30% 상대 화상 |
| `roughskin` | 까칠한피부 | boulderin, crablord, hedgemoss | 접촉 물리기 피격 시 상대 HP 1/8 깎음 |
| `poisonpoint` | 독가시 | (독 타입 **기본특성**) | 접촉 물리기 피격 시 30% 상대 중독 |

> ⚠️ `poisonpoint`은 독 타입의 **DEFAULT_ABILITY**(`tables.js:17`)라, 이게 죽어 있으면 폴백하는 모든 독 정령이 무특성이 된다. 우선순위 높음.

### 삽입 지점
현재 접촉 후처리 훅이 이미 있는 지점 옆에 나란히 추가한다 — `static`(정전기) 처리부:

```js
// index.html:5326 (기존)
if(def.hp>0 && def.ability==="static" && !att.status && move.power>0 && Math.random()<0.3){ await mw(240); applyStatus(att,"par",side); }
```

이 블록 바로 아래에 "접촉 물리기" 판정을 공유하는 후처리 추가:

```js
// 접촉 물리 피격 시 방어측 특성 반격(정전기와 동일 트리거 계열)
const contact = move.power>0 && MOVES[move.key]?.cat!=="spec";   // 물리기만 접촉으로 간주(간이 규칙)
if(def.hp>0 && contact){
  if(def.ability==="flamebody" && !att.status && Math.random()<0.3){ await mw(240); applyStatus(att,"brn",side); }
  else if(def.ability==="poisonpoint" && !att.status && Math.random()<0.3){ await mw(240); applyStatus(att,"psn",side); }
  if(def.ability==="roughskin" && att.hp>0){ const c=Math.max(1,Math.floor(att.maxHp/8)); att.hp=Math.max(0,att.hp-c); renderCombatants(); setMsg(`<b>${dispName(att)}</b>은(는) 까칠한 피부에 상처 입었다!`); Audio.sfx&&Audio.sfx("weakhit"); await mw(360); }
}
```

- `contact` 판정은 기존 엔진에 접촉 플래그가 없으므로 **"물리기=접촉"** 간이 규칙으로 시작(추후 기술별 `contact:true` 플래그 도입 가능).
- `applyStatus` 시그니처는 `static` 호출부와 동일(`att,"par",side`)하게 맞춘다.
- `db`(도감 시뮬)에도 동일 훅 필요 여부 확인 — 전투 미리보기가 별도 경로면 `index.html:5488` 계열도 반영.

### 회귀
- `newtypes_test`/전투 테스트에 "접촉기 피격 → 화상/중독/반동" 케이스 추가.
- 밸런스: 독 타입 폴백 정령이 실효 특성을 갖게 되므로 트레이너/리그 체감 난이도 소폭 상승 → §5 재측정.

---

## 2. 갭 B — 47종 특성 배정

### 원칙
1. **구현된 특성만 사용**(갭 A 완료 후 21종 풀): blaze·torrent·overgrow·static·intimidate·sturdy·thickfat·guts·levitate·icebody·swiftswim·chlorophyll·insomnia·immunity·waterveil·sniper·naturalcure·hugepower + flamebody·roughskin·poisonpoint.
2. **타입 내 개성 분산** — 같은 타입이라도 역할(어태커/벽/스피드)이 다르면 특성도 다르게.
3. **종 컨셉 우선** — 늑대류 intimidate, 접촉 딜러 flamebody/roughskin, 스피드형 swiftswim/chlorophyll, 거체·바위 sturdy 등.

### 데이터 위치 — 권장: `dex.js` 종 엔트리의 `ability` 필드로 이관
`makeMon`은 이미 `sp.ability || ABILITY_OVERRIDE[id] || DEFAULT_ABILITY[type]` 순서(`dex.js:133`)라, **각 종 정의에 `ability:"…"`만 넣으면** 동작한다. 흩어진 `ABILITY_OVERRIDE`(tables.js:86)를 점진적으로 `dex` 필드로 흡수하면 **단일 출처**가 되어 유지보수가 쉬워진다. (급하면 `ABILITY_OVERRIDE`에 47줄 추가로도 가능.)

### 권장 배정표 (47종)

**불(6)**
| 종 | 특성 | 근거 |
|---|---|---|
| foxfire 파라꼬 | blaze | 스타터 정체성 |
| emberwolf 파라울 | intimidate | 늑대·위압 |
| cindercub 불씨늑대 | blaze | 초반 화력 |
| pyrewolf 화염랑 | intimidate | 대형 늑대 |
| emberdrake 마그룡 | flamebody | 접촉 견제 |
| emberlix 불도롱 | flamebody | 살라만더 접촉 |

**물(6)**
| 종 | 특성 | 근거 |
|---|---|---|
| puddlet 또랑이 | torrent | 물방울 스타터형 |
| riverine 물살정 | swiftswim | 급류 스피드 |
| gullian 갈매정 | swiftswim | 잠수 급강하 |
| glimmertide 윤슬정 | swiftswim | 물/비행 스피드 |
| moonytide 월광정 | naturalcure | 정화 컨셉 |
| aqualord 수룡왕 | intimidate | 전설 위압 |

**풀(8)**
| 종 | 특성 | 근거 |
|---|---|---|
| leafdrake 새록꼬 | overgrow | 스타터 정체성 |
| vinesnake 넝쿠왕 | poisonpoint | 독/풀 나가 |
| petalwing 꽃날개 | chlorophyll | 나비·양지 |
| blossomhawk 꽃호접 | chlorophyll | 대형 나비 |
| bloomlynx 꽃표범 | chlorophyll | 스피드 표범 |
| mossback 이끼돌이 | sturdy | 등껍질 |
| terrapin 대지거북 | sturdy | 거체 |
| titanoak 거목령 | sturdy | 나무 거인 |

**전기(9)**
| 종 | 특성 | 근거 |
|---|---|---|
| sparkmouse 찌리몽 | static | 전기 쥐 정석 |
| voltbeetle 찌리딱 | static | 접촉 마비 |
| voltsnake 찌릿뱀 | static | 〃 |
| thundwyrm 뇌전룡 | intimidate | 용격 위압 |
| zapfinch 삐릿새 | static | 초반 새 |
| voltfalcon 뇌전매 | sniper | 급강하 급소 |
| glowfly 반딧불이 | static | 접촉 마비 |
| arcmoth 뇌광나방 | poisonpoint | 전기/독 |
| crystalgon 결정룡 | levitate | 수정 부유·땅 무효 |

**노말(2)**
| 종 | 특성 | 근거 |
|---|---|---|
| racoonmon 라꾸리 | guts | 근성 |
| lumbeast 우직수 | intimidate | 부족장 위압 |

**얼음(7)**
| 종 | 특성 | 근거 |
|---|---|---|
| frostpup 서리멍 | icebody | 설원 회복 |
| glacibear 서리랑 | thickfat | 두꺼운 털 |
| snowl 눈올빼 | insomnia | 야행성 |
| cryogon 동결룡 | icebody | 얼음 회복 |
| iceling 얼음정 | icebody | 〃 |
| frostwyrm 빙하룡 | intimidate | 용격 위압 |
| glaciarch 빙하제 | sturdy | 전설 거체·옹골참 |

**용(4)**
| 종 | 특성 | 근거 |
|---|---|---|
| drakeling 꼬마룡 | guts | 근성 유생 |
| wyverna 비룡 | intimidate | 비룡 위압 |
| skydrake 천공룡 | intimidate | 최상위 위압 |
| dawnwyrm 여명룡 | sturdy | 전설 내구 |

**바위·땅(5)**
| 종 | 특성 | 근거 |
|---|---|---|
| pebblet 몽돌이 | sturdy | 옹골참 |
| megalith 거암왕 | sturdy | 거체 |
| burrowlord 대굴왕 | roughskin | 바위 등껍질 반격 |
| dustbunny 먼지깡총 | immunity | 흙먼지·중독 면역 |
| thumplord 쿵쿵왕 | hugepower | 근육 왕토끼 물리 x1.5 |

> ⚠️ `hugepower`(thumplord)는 물리 데미지 x1.5로 강력하다. 트레이너/리그 편성에 thumplord가 있으면 난이도가 크게 오르므로 §5 재측정 필수.

### (선택) 신규 특성 후보 — 더 큰 개성을 원하면
현재 풀로도 충분하지만, 아래를 추가하면 표현력이 늘어난다(각각 구현 필요, 후순위):
`keeneye`(명중 하락 무효)·`moxie`(쓰러뜨리면 공↑)·`speedboost`(매턴 속도↑)·`rockhead`(반동 무효)·`sandveil`(모래 회피↑). 도입 시 `ABILITY_KO`·`ABILITY_DESC` 동시 갱신(회귀가 강제).

---

## 3. 갭 C — 슬롯 / 히든 특성 (선택, 후순위)

포켓몬처럼 종당 2특성 + 히든을 주려면:
- `dex` 종 필드를 `ability:["A","B"], hidden:"H"` 로 확장.
- `makeMon`에서 `sp.ability`가 배열이면 랜덤 택1(히든은 낮은 확률/특정 조건).
- 상세뷰는 이미 단일 특성 chip이라, 배열 표기·현재 개체 특성 강조로 소폭 수정.
- **권장: 후순위.** 먼저 §1·§2로 "모든 종이 실효 특성 1개"를 달성한 뒤 검토.

---

## 4. 갭 D — 개체값·성격 폴리시 (작음)

IV/EV/Nature는 완성 상태이므로 신규 시스템은 불필요. 체감 향상용 소폭 개선만:

1. **IV 등급 표기** — 상세뷰에 합계/최고치 라벨(예: "개체값 최고: 공격 31" 또는 "우수/보통"). `evTotal`처럼 `ivTotal` 헬퍼 추가.
2. **성격 화살표 상시 노출** — `natureLabel`이 이미 "성격 (공↑ 특↓)"를 반환하므로, 파티/상세뷰에 항상 표시되는지 확인 후 누락 시 삽입.
3. **개체 영향 수단(별도 feature)** — 민트(성격 변경)·개체값 개방·교배는 별개 기획. 본 문서 범위 밖으로 명시. 원하면 후속 설계.

---

## 5. 밸런스·회귀 영향 (필수)

`makeMon`은 **야생·트레이너·리그가 공유**한다(주석 `dex.js:105-109`). 특성 배정/효과 구현은 곧 전투 난이도 변화다.

체크리스트:
- [ ] 갭 A 3종 효과 추가 후 `balance_test` 재측정(특히 접촉 딜러 상대 승률).
- [ ] `hugepower`(thumplord)·`intimidate` 다수 배정이 리그 보스전 난이도에 준 영향 `league_test` 재측정.
- [ ] `levitate`(crystalgon) 땅 무효로 특정 매치업 붕괴 없는지 확인.
- [ ] `poisonpoint` 부활로 독 타입 폴백 정령이 실효 특성을 얻음 — 초반 야생 난이도 확인.
- [ ] `newtypes_test`에 특성 발동(화상/중독/반동/마비) 단위 케이스 추가.
- [ ] 세이브 호환: 기존 세이브의 몬은 `ability` 필드가 이미 있으므로 무해하나, 로드 시 미보유 몬은 `recalc` 재적용 확인.

---

## 6. 작업 순서 & 산출물

| 단계 | 내용 | 규모 | 산출물 |
|---|---|---|---|
| 1 | 갭 A — 인어트 3종 효과 구현 + 테스트 | 반나절 | `index.html` 훅, 테스트 |
| 2 | 갭 B — 47종 특성 배정(dex `ability` 필드로) | 반나절 | `dex.js` 47필드, 빌드 |
| 3 | 회귀·밸런스 재측정 + 튜닝 | 반나절 | balance/league 리포트 |
| 4 | 갭 D — IV/성격 표기 폴리시 | 1~2시간 | 상세뷰 수정 |
| 5(선택) | 갭 C — 2슬롯/히든 특성 | 별도 | 스키마 확장 |

**핵심 요약:** 개체값·성격·특성 "시스템"은 이미 포켓몬급으로 존재한다. 진짜 할 일은 (1) 죽어 있는 특성 3개 살리기, (2) 절반(47종)의 무배정 특성 채우기, (3) 밸런스 재측정이다. 이 셋이면 "타입만 같으면 다 같은 유닛" 문제가 해소된다.
