/* ===== 타입 단일 출처 =====
   ⚠️ 타입을 추가/수정할 땐 여기만 고친다. 예전엔 TYPE_KO·TYPE_CLASS·TYPE_COLOR·TYPE_ICON·
   TYPE_PARTICLE·SPEC_TYPES·DEFAULT_ABILITY·CSS 변수·.type-tag·도감 필터·Audio.cry가
   따로 놀아서, 타입을 늘릴 때마다 어딘가 하나가 빠졌다(TYPE_PARTICLE 누락 → 화면에 "undefined",
   TYPE_ICON·Audio.cry는 신규 3타입이 아직도 비어 있었다). 이제 전부 여기서 파생된다.
     ko=한글명 · col=색 · par=연출 파티클 · ic=아이콘 · spec=특수판정 · ab=기본 특성 · wav=울음 파형
     fg=태그 글자색(생략 시 기본) */
const TYPES={
  fire:   {ko:"불",  col:"#f08a5d", par:"🔥", ic:"🔥", spec:1, ab:"blaze",       wav:"sawtooth"},
  water:  {ko:"물",  col:"#5d9cf0", par:"💧", ic:"💧", spec:1, ab:"torrent",     wav:"sine"},
  grass:  {ko:"풀",  col:"#7fd16f", par:"🍃", ic:"🍃", spec:1, ab:"overgrow",    wav:"triangle"},
  elec:   {ko:"전기",col:"#f0cf5d", par:"⚡", ic:"⚡", spec:1, ab:"static",      wav:"square"},
  normal: {ko:"노말",col:"#c7bca6", par:"💢", ic:"⭐", spec:0, ab:"guts",        wav:"triangle"},
  flying: {ko:"비행",col:"#9db8e0", par:"🪶", ic:"🪶", spec:0, ab:"intimidate",  wav:"sine"},
  rock:   {ko:"바위",col:"#c2a878", par:"🪨", ic:"🪨", spec:0, ab:"sturdy",      wav:"square"},
  ice:    {ko:"얼음",col:"#88d6e6", par:"❄️", ic:"❄️", spec:1, ab:"icebody",     wav:"sine"},
  poison: {ko:"독",  col:"#b57fd0", par:"🫧", ic:"🫧", spec:0, ab:"poisonpoint", wav:"sawtooth", fg:"#f3ecdd"},
  ground: {ko:"땅",  col:"#d2a862", par:"🪨", ic:"⛰️", spec:0, ab:"sturdy",      wav:"square"},
};
const TYPE_LIST=Object.keys(TYPES);
const _derive=(src,f)=>{ const o={}; for(const k in src)o[k]=f(src[k],k); return o; };
const TYPE_KO=_derive(TYPES,t=>t.ko);
const TYPE_CLASS=_derive(TYPES,(t,k)=>"t-"+k);
const TYPE_COLOR=_derive(TYPES,t=>t.col);
const TYPE_PARTICLE=_derive(TYPES,t=>t.par);
const TYPE_ICON=_derive(TYPES,t=>t.ic);
// 특수 판정 타입(나머지는 물리). damage()·까칠한피부 등이 공유하는 단일 출처.
const SPEC_TYPES=(()=>{ const o={}; for(const k in TYPES)if(TYPES[k].spec)o[k]=1; return o; })();
const DEFAULT_ABILITY=_derive(TYPES,t=>t.ab);
// ⚠️ 특성을 추가하면 ABILITY_KO·ABILITY_DESC 둘 다 채울 것(회귀가 강제).
const ABILITY_KO={blaze:"맹화",torrent:"급류",overgrow:"신록",static:"정전기",intimidate:"위협",sturdy:"옹골참",thickfat:"두꺼운지방",guts:"근성",levitate:"부유",poisonpoint:"독가시",icebody:"얼음몸",flamebody:"불꽃몸",roughskin:"까칠한피부",swiftswim:"쓸비늘",chlorophyll:"엽록소",insomnia:"불면",immunity:"면역",waterveil:"수의베일",sniper:"스나이퍼",naturalcure:"자연회복",hugepower:"순수한힘"};
const ABILITY_DESC={blaze:"HP가 낮으면 불 기술 위력 ↑",torrent:"HP가 낮으면 물 기술 위력 ↑",overgrow:"HP가 낮으면 풀 기술 위력 ↑",static:"맞으면 30% 확률로 상대 마비",intimidate:"등장 시 상대 공격 1 ↓",sturdy:"풀피일 때 한 방에 안 쓰러짐",thickfat:"불 기술 피해 절반",guts:"상태이상이면 공격 ↑",levitate:"땅 타입 기술 무효",poisonpoint:"맞으면 30% 확률로 상대 중독",icebody:"싸라기눈일 때 매턴 회복",flamebody:"맞으면 30% 확률로 상대 화상",roughskin:"물리 기술로 맞으면 상대도 깎인다",swiftswim:"비가 오면 속도 2배",chlorophyll:"햇살이 강하면 속도 2배",insomnia:"잠들지 않는다",immunity:"독에 걸리지 않는다",waterveil:"화상을 입지 않는다",sniper:"급소에 맞히면 위력이 더 오른다",naturalcure:"교체하면 상태이상이 낫는다",hugepower:"물리 기술 위력이 크게 오른다"};
const NATURES=[
  {k:"hardy",ko:"노력하는",up:null,down:null},{k:"docile",ko:"온순한",up:null,down:null},
  {k:"lonely",ko:"외로운",up:"atk",down:"def"},{k:"brave",ko:"용감한",up:"atk",down:"spd"},
  {k:"bold",ko:"대담한",up:"def",down:"atk"},{k:"relaxed",ko:"무사태평",up:"def",down:"spd"},
  {k:"timid",ko:"겁쟁이",up:"spd",down:"atk"},{k:"hasty",ko:"성급한",up:"spd",down:"def"},
  {k:"adamant",ko:"고집있는",up:"atk",down:"def"},{k:"jolly",ko:"명랑한",up:"spd",down:"atk"},
];
const NATURE_BY_K={}; NATURES.forEach(n=>NATURE_BY_K[n.k]=n);
const STAT_KO={atk:"공격",def:"방어",spd:"속도",spa:"특수공격",spDef:"특수방어",acc:"명중률",eva:"회피율"};
function natureLabel(k){ const n=NATURE_BY_K[k]; if(!n)return ""; if(!n.up)return n.ko+" (보정 없음)"; return `${n.ko} (${STAT_KO[n.up]}↑ ${STAT_KO[n.down]}↓)`; }
const SHINY_RATE=1/64;
// 지닌 물건. 전투 효과는 **데이터 필드**로 표현해 damage()/effSpd()가 단일 출처(HELD_ITEMS)에서 읽는다:
//   dmg=기술 위력 배율 · boost=이 타입 기술 +20% · spdx=속도 배율 · recoil=공격 시 최대HP 반동 비율 ·
//   lock=구애(첫 기술로 고정) · sash=풀피에서 치명타를 1HP로 버팀(1회). em/ko/desc는 표시용.
const HELD_ITEMS={
  leftovers:{ko:"먹다남은음식",em:"🍖",desc:"매 턴 HP를 조금씩 회복"},
  oranberry:{ko:"오랭열매",em:"🫐",desc:"HP 절반 이하가 되면 25% 회복(1회)"},
  cureberry:{ko:"정화열매",em:"🍇",desc:"상태이상이 되면 회복(1회)"},
  powerband:{ko:"힘의띠",em:"💪",desc:"기술 위력이 약간 오른다(×1.1)",dmg:1.1},
  scopelens:{ko:"초점렌즈",em:"🔍",desc:"급소에 맞히기 쉬워진다(급소 랭크 +1)"},
  lifeorb:{ko:"생명의구슬",em:"💎",desc:"기술 위력 ×1.3 · 대신 공격할 때마다 최대HP 1/10 반동",dmg:1.3,recoil:0.1},
  focussash:{ko:"기합의띠",em:"🎽",desc:"풀피일 때 쓰러질 공격을 1HP로 버틴다(1회)",sash:true},
  choiceband:{ko:"구애머리띠",em:"🎗️",desc:"기술 위력 ×1.3 · 대신 처음 쓴 기술만 계속 쓴다",dmg:1.3,lock:true},
  choicescarf:{ko:"구애스카프",em:"🧣",desc:"속도 ×1.5 · 대신 처음 쓴 기술만 계속 쓴다",spdx:1.5,lock:true},
};
// 타입별 강화 부적 — TYPES에서 파생(단일 출처). 해당 타입 기술 위력 +20%.
// ⚠️ 손으로 10개 나열하지 않는다 — 그러면 타입 추가 시 또 하나의 병렬 테이블을 빠뜨린다.
TYPE_LIST.forEach(t=>{ HELD_ITEMS["charm_"+t]={ko:TYPE_KO[t]+"부적",em:TYPE_ICON[t]||"🔮",desc:TYPE_KO[t]+" 타입 기술 위력 +20%",boost:t}; });
// 종별 특성 지정. 없으면 DEFAULT_ABILITY[type] → "guts" 폴백이라
// 지정을 안 하면 같은 타입 정령이 죄다 같은 특성이 된다. 라인마다 흩뿌릴 것.
const ABILITY_OVERRIDE={magmahound:"thickfat",tidewhale:"thickfat",riverdrake:"intimidate",blazelion:"intimidate",krakentide:"intimidate",grovespirit:"thickfat",shadowlord:"intimidate",dawnguard:"sturdy",voltrat:"static",harelord:"guts",jellure:"levitate",emberfly:"flamebody",pyrmoth:"flamebody",cindercat:"flamebody",lavakit:"flamebody",boulderin:"roughskin",crablord:"roughskin",hedgemoss:"roughskin",otterwave:"swiftswim",sharkfin:"swiftswim",frostfish:"swiftswim",nipling:"swiftswim",seedbean:"chlorophyll",sproutcat:"chlorophyll",palmore:"chlorophyll",leafwyrm:"chlorophyll",thunderowl:"insomnia",lunarmoth:"insomnia",swampfrog:"immunity",burrowmouse:"immunity",tidalore:"waterveil",shellow:"waterveil",stormhawk:"sniper",sandwhirl:"sniper",sprigfawn:"naturalcure",bunnyhop:"naturalcure",dewdrop:"naturalcure",tigerflame:"hugepower",magmadon:"hugepower"};
/* ===== 상태이상 단일 출처 =====
   ⚠️ 상태를 추가할 땐 여기만 고친다. 예전엔 STATUS_KO·STATUS_CLS·_MV_STATUS_KO·
   STATUS_TYPE_IMMUNE·연출 글리프 2곳·.b-* CSS·.dbst.b-* CSS가 따로 놀아서
   slp와 frz가 각각 한 번씩 누락됐다(상태칩에 "undefined", 기술 설명에 "frz").
     ko=한글명 · chip=상태칩 배경색 · g=연출 글리프 · fx=연출 색 · imm=면역 타입(없으면 null) */
const STATUSES={
  psn:{ko:"독",  chip:"#b07fd1", g:"🫧", fx:"#b07fd1", imm:"poison"},
  brn:{ko:"화상",chip:"#f0875d", g:"🔥", fx:"#f0795d", imm:"fire"},
  par:{ko:"마비",chip:"#f0cf5d", g:"⚡", fx:"#f0cf5d", imm:"elec"},
  slp:{ko:"잠듦",chip:"#6a7fb0", g:"💤", fx:"#9fb4d8", imm:null},
  frz:{ko:"냉동",chip:"#6fc4e0", g:"❄️", fx:"#6fc4e0", imm:"ice"},
};
const STATUS_LIST=Object.keys(STATUSES);
const STATUS_KO=_derive(STATUSES,s=>s.ko);
const STATUS_CLS=_derive(STATUSES,(s,k)=>"b-"+k);
// 타입 면역(본가): 불=화상, 얼음=냉동, 독=중독, 전기=마비. 잠듦은 면역이 없다.
const STATUS_TYPE_IMMUNE=(()=>{ const o={}; for(const k in STATUSES)if(STATUSES[k].imm)o[k]=STATUSES[k].imm; return o; })();
const _MV_STATUS_KO=STATUS_KO;   // 기술 설명용 = 상태 한글명. STATUSES 단일 출처에서 파생.

// 타입·상태 팔레트 CSS를 단일 출처에서 생성해 주입한다.
// 예전엔 CSS에 손으로 적어둬서 타입을 늘릴 때 --ice/--poison/--ground 같은 게 빠지기 쉬웠다.
// ⚠️ .dbst.b-*는 .dbst를 specificity로 이겨야 하므로 규칙 형태를 유지할 것.
function injectPalette(){
  const L=[":root{"];
  for(const k in TYPES)L.push(`--${k}:${TYPES[k].col};`);
  for(const k in STATUSES)L.push(`--${k}:${STATUSES[k].chip};`);
  L.push("}");
  for(const k in TYPES){ const t=TYPES[k];
    L.push(`.type-tag.t-${k}{background:var(--${k})${t.fg?";color:"+t.fg:""}}`); }
  for(const k in STATUSES){
    L.push(`.b-${k}{background:var(--${k})}`);
    L.push(`.dbst.b-${k}{background:var(--${k})}`); }
  const el=document.createElement("style"); el.id="palette"; el.textContent=L.join("");
  document.head.appendChild(el);
}
// node(규칙 단위 테스트)에는 document가 없다 — 브라우저에서만 주입한다.
if(typeof document!=="undefined")injectPalette();

/* 타입 상성 10×10 완전표.
   ⚠️ 이것만은 TYPES에서 파생할 수 없다(설계 데이터). 타입을 추가하면
   행 하나와 '모든 행의 열 하나'를 같이 넣을 것 — 누락 시 damage()에서 NaN.
   회귀(palette_source_test)가 전 조합을 검사한다. */
const EFF={
  fire:   {fire:.5,water:.5,grass:2, elec:1, normal:1,flying:1, rock:.5,ice:2, poison:1, ground:1},
  water:  {fire:2, water:.5,grass:.5,elec:1, normal:1,flying:1, rock:2, ice:1, poison:1, ground:2},
  grass:  {fire:.5,water:2, grass:.5,elec:1, normal:1,flying:.5,rock:2, ice:1, poison:.5,ground:2},
  elec:   {fire:1, water:2, grass:.5,elec:.5,normal:1,flying:2, rock:1, ice:1, poison:1, ground:0},
  normal: {fire:1, water:1, grass:1, elec:1, normal:1,flying:1, rock:.5,ice:1, poison:1, ground:1},
  flying: {fire:1, water:1, grass:2, elec:1, normal:1,flying:1, rock:.5,ice:1, poison:1, ground:1},
  rock:   {fire:2, water:1, grass:1, elec:1, normal:1,flying:2, rock:1, ice:2, poison:1, ground:.5},
  ice:    {fire:.5,water:.5,grass:2, elec:1, normal:1,flying:2, rock:1, ice:.5,poison:1, ground:2},
  poison: {fire:1, water:1, grass:2, elec:1, normal:1,flying:1, rock:.5,ice:1, poison:.5,ground:.5},
  ground: {fire:2, water:1, grass:.5,elec:2, normal:1,flying:0, rock:2, ice:1, poison:2, ground:1},
};
