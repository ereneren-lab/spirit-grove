// 종 데이터(DEX)와 개체 생성/스탯 계산. **DOM을 쓰지 않는다**(순수 규칙 계층).
// 브라우저는 build.py가 //@@RULES_DEX@@ 자리에 인라인하고, node는 rules_env.js가 같은 파일을
// 같은 순서로 평가한다 — 문자 그대로 같은 코드가 돈다.
// ⚠️ 최상위 선언은 들여쓰기 없이 쓸 것(rules_env의 선언 추출 정규식이 행 첫 칸을 앵커로 쓴다).
// ⚠️ makeMon은 newStages(battle.js)를 부른다 — 함수 선언이라 한 스코프에서 호이스팅되므로
//    로드 순서와 무관하다. NATURES/ABILITY_OVERRIDE/DEFAULT_ABILITY/SHINY_RATE는 tables.js에 있다.
/* ===== DEX (30) ===== */
const DEX=[
  {id:"foxfire",name:"파라꼬",em:"🦊",type:"fire",tier:1,starter:true,base:{hp:46,atk:10,def:9,spd:13,spa:14,spDef:9},moves:["tackle","ember"],learn:[[7,"growl"],[8,"toxic"],[10,"flare"],[12,"furyswipe"],[14,"agility"],[27,"roar"]],evolveTo:"emberwolf",evolveLv:16},
  {id:"emberwolf",name:"파라울",em:"🦊",type:"fire",tier:2,base:{hp:60,atk:13,def:12,spd:15,spa:18,spDef:12},moves:["ember","flare"],learn:[[8,"growl"],[16,"bite"],[22,"inferno"],[26,"takedown"],[28,"nastyplot"],[32,"focusenergy"],[36,"roar"]],evolveTo:"blazelion",evolveLv:32},
  {id:"blazelion",name:"파라온",em:"🦊",type:"fire",tier:3,base:{hp:80,atk:18,def:17,spd:18,spa:25,spDef:17},moves:["flare","inferno"],learn:[[8,"focusenergy"],[16,"confuse"],[23,"growl"],[31,"doubleteam"],[36,"crush"],[38,"swordsdance"],[40,"willowisp"],[46,"flareblitz"]]},
  {id:"shellow",name:"무르꼬",em:"🐢",type:"water",tier:1,starter:true,base:{hp:55,atk:8,def:15,spd:7,spa:11,spDef:15},moves:["tackle","splash"],learn:[[7,"harden"],[8,"roar"],[10,"hydro"],[13,"recover"],[21,"toxic"],[33,"nastyplot"]],evolveTo:"riverdrake",evolveLv:16},
  {id:"riverdrake",name:"무르롱",em:"🐉",type:"water",tier:2,base:{hp:68,atk:11,def:18,spd:10,spa:15,spDef:18},moves:["splash","hydro"],learn:[[8,"recover"],[14,"lullaby"],[21,"amnesia"],[22,"tsunami"],[27,"swordsdance"],[33,"doubleteam"],[40,"growl"]],evolveTo:"krakentide",evolveLv:32},
  {id:"krakentide",name:"무르칸",em:"🐉",type:"water",tier:3,base:{hp:86,atk:14,def:22,spd:11,spa:20,spDef:22},moves:["hydro","tsunami"],learn:[[8,"swordsdance"],[18,"lullaby"],[27,"recover"],[36,"slam"],[37,"confuse"],[40,"aquajet"],[42,"amnesia"],[46,"ironhead"]]},
  {id:"leafdrake",name:"새록꼬",em:"🦎",type:"grass",tier:1,starter:true,base:{hp:48,atk:9,def:11,spd:11,spa:13,spDef:11},moves:["tackle","leaf"],learn:[[7,"growl"],[8,"agility"],[10,"vine"],[12,"absorb"],[14,"quickjab"],[27,"batonpass"]],evolveTo:"leafwyrm",evolveLv:16},
  {id:"leafwyrm",name:"새록룡",em:"🐉",type:"grass",tier:2,base:{hp:64,atk:12,def:14,spd:13,spa:17,spDef:14},moves:["leaf","vine"],learn:[[8,"batonpass"],[18,"harden"],[22,"bloom"],[26,"megadrain"],[27,"agility"],[30,"bloomheal"],[36,"nastyplot"]],evolveTo:"grovespirit",evolveLv:32},
  {id:"grovespirit",name:"새록정",em:"🌳",type:"grass",tier:3,base:{hp:85,atk:16,def:20,spd:12,spa:22,spDef:20},moves:["vine","bloom"],learn:[[8,"roar"],[18,"bloomheal"],[27,"toxic"],[36,"crush"],[37,"agility"],[40,"gigadrain"],[42,"nastyplot"],[46,"swordsdance"]]},
  {id:"sparkmouse",name:"찌리몽",em:"🐹",type:"elec",tier:1,base:{hp:42,atk:9,def:9,spd:18,spa:13,spDef:9},moves:["tackle","spark"],learn:[[8,"roar"],[10,"thunderwave"],[12,"bolt"],[14,"twinbolt"],[21,"toxic"],[33,"nastyplot"]],evolveTo:"voltrat",evolveItem:"thunderstone"},
  {id:"voltrat",name:"찌리볼",em:"🐀",type:"elec",tier:2,base:{hp:58,atk:13,def:12,spd:21,spa:18,spDef:12},moves:["spark","bolt"],learn:[[8,"batonpass"],[16,"harden"],[23,"agility"],[28,"thunder"],[31,"nastyplot"],[32,"quickstrike"],[38,"toxic"]]},
  {id:"bunnyhop",name:"토롱이",em:"🐇",type:"normal",tier:1,base:{hp:44,atk:11,def:10,spd:16,spa:8,spDef:10},moves:["tackle","quickjab"],learn:[[8,"furyswipe"],[9,"agility"],[10,"slam"],[14,"recover"],[22,"batonpass"],[27,"harden"]],evolveTo:"harelord",evolveFriend:100},
  {id:"harelord",name:"토롱크",em:"🐇",type:"normal",tier:2,base:{hp:58,atk:16,def:13,spd:22,spa:12,spDef:13},moves:["slam","quickjab"],learn:[[8,"agility"],[14,"batonpass"],[21,"harden"],[27,"nastyplot"],[28,"crush"],[33,"toxic"],[40,"roar"]]},
  {id:"frostfish",name:"빙구리",em:"🐟",type:"ice",tier:1,base:{hp:46,atk:9,def:11,spd:13,spa:12,spDef:11},moves:["tackle","iceshard"],learn:[[8,"toxic"],[12,"icebeam"],[16,"roar"],[23,"batonpass"],[31,"harden"],[38,"agility"]],evolveTo:"sharkfin",evolveItem:"waterstone"},
  {id:"sharkfin",name:"빙구악",em:"🦈",type:"ice",type2:"rock",tier:2,base:{hp:62,atk:14,def:13,spd:16,spa:19,spDef:13},moves:["iceshard","icebeam"],learn:[[8,"agility"],[16,"harden"],[23,"batonpass"],[28,"blizzard"],[28,"slash"],[31,"nastyplot"],[38,"irondefense"]]},
  {id:"cindercat",name:"냥불",em:"🐈‍⬛",type:"fire",tier:1,base:{hp:45,atk:11,def:10,spd:15,spa:15,spDef:10},moves:["tackle","ember"],learn:[[8,"batonpass"],[12,"flare"],[16,"harden"],[23,"agility"],[31,"willowisp"],[38,"nastyplot"]],evolveTo:"tigerflame",evolveItem:"firestone"},
  {id:"tigerflame",name:"냥호",em:"🐅",type:"fire",tier:2,base:{hp:60,atk:14,def:13,spd:17,spa:20,spDef:13},moves:["ember","flare"],learn:[[8,"focusenergy"],[16,"confuse"],[23,"doubleteam"],[28,"inferno"],[30,"slash"],[31,"growl"],[38,"swordsdance"]]},
  {id:"racoonmon",name:"라꾸리",em:"🦝",type:"normal",tier:1,base:{hp:50,atk:12,def:12,spd:12,spa:9,spDef:12},moves:["tackle","growl"],learn:[[9,"slam"],[12,"furyswipe"],[15,"drainfang"],[18,"sandattack"],[24,"slash"],[28,"roar"]],evolveTo:"lumbeast",evolveLv:26},
  {id:"hedgemoss",name:"가시몽",em:"🦔",type:"poison",type2:"grass",tier:1,base:{hp:56,atk:12,def:15,spd:8,spa:9,spDef:15},moves:["tackle","rockthrow"],learn:[[8,"harden"],[9,"poisonpowder"],[13,"rockslide"],[18,"nastyplot"],[27,"batonpass"],[36,"agility"]],evolveTo:"vinesnake",evolveLv:24},
  {id:"sprigfawn",name:"푸르사",em:"🦌",type:"grass",type2:"normal",tier:1,base:{hp:50,atk:9,def:12,spd:13,spa:13,spDef:12},moves:["tackle","leaf"],learn:[[8,"nastyplot"],[12,"vine"],[18,"harden"],[26,"batonpass"],[27,"agility"],[36,"bloomheal"]],evolveTo:"palmore",evolveLv:28},
  {id:"voltbeetle",name:"찌리딱",em:"🪲",type:"elec",type2:"bug",tier:1,base:{hp:48,atk:9,def:13,spd:12,spa:13,spDef:13},moves:["tackle","spark"],learn:[[8,"doubleteam"],[10,"bugbite"],[12,"bugbuzz"],[13,"bolt"],[16,"growl"],[23,"confuse"],[31,"focusenergy"],[38,"lullaby"]],evolveTo:"thunderowl",evolveLv:22},
  {id:"swampfrog",name:"개굴몽",em:"🐸",type:"water",type2:"poison",tier:2,base:{hp:67,atk:13,def:17,spd:14,spa:18,spDef:17},moves:["splash","poisonjab"],learn:[[8,"lullaby"],[14,"amnesia"],[16,"sludge"],[21,"recover"],[27,"swordsdance"],[33,"doubleteam"],[40,"growl"]]},
  {id:"emberdrake",name:"마그룡",em:"🐉",type:"fire",type2:"dragon",tier:2,base:{hp:60,atk:13,def:13,spd:11,spa:18,spDef:13},moves:["ember","flare","dragonbreath"],learn:[[8,"swordsdance"],[14,"recover"],[21,"lullaby"],[24,"inferno"],[27,"confuse"],[33,"focusenergy"],[40,"doubleteam"]]},
  {id:"otterwave",name:"무라리",em:"🦦",type:"water",type2:"normal",tier:2,base:{hp:54,atk:11,def:12,spd:14,spa:15,spDef:12},moves:["splash","hydro"],learn:[[8,"lullaby"],[14,"amnesia"],[21,"recover"],[24,"tsunami"],[27,"swordsdance"],[33,"doubleteam"],[40,"growl"]],evolveTo:"tidewhale",evolveLv:30},
  {id:"vinesnake",name:"넝쿠왕",em:"🐍",type:"poison",type2:"grass",tier:2,base:{hp:63,atk:15,def:12,spd:19,spa:21,spDef:12},moves:["leaf","vine"],learn:[[8,"lullaby"],[16,"recover"],[20,"toxic"],[23,"swordsdance"],[24,"bloom"],[31,"growl"],[38,"doubleteam"]]},
  {id:"thunderowl",name:"부르릉",em:"🪲",type:"elec",type2:"flying",tier:2,base:{hp:54,atk:12,def:12,spd:13,spa:17,spDef:12},moves:["spark","bolt"],learn:[[8,"recover"],[18,"lullaby"],[20,"twinbolt"],[24,"thunder"],[27,"thunderwave"],[28,"nastyplot"],[32,"batonpass"]]},
  {id:"tidewhale",name:"무르경",em:"🐋",type:"water",tier:2,base:{hp:74,atk:10,def:16,spd:7,spa:14,spDef:16},moves:["splash","slam"],learn:[[8,"roar"],[16,"toxic"],[18,"hydro"],[23,"nastyplot"],[28,"tsunami"],[31,"harden"],[38,"batonpass"]]},
  {id:"magmahound",name:"마그멍",em:"🐕",type:"fire",tier:2,base:{hp:58,atk:14,def:12,spd:14,spa:19,spDef:12},moves:["ember","slam"],learn:[[8,"toxic"],[14,"roar"],[18,"flare"],[21,"agility"],[27,"harden"],[33,"batonpass"],[40,"nastyplot"]]},
  {id:"stormhawk",name:"회리매",em:"🦅",type:"flying",type2:"elec",tier:3,base:{hp:77,atk:25,def:16,spd:24,spa:17,spDef:16},moves:["gust","wingatk"],learn:[[8,"thunderwave"],[14,"swordsdance"],[21,"recover"],[26,"skyrush"],[27,"lullaby"],[30,"focusenergy"],[33,"confuse"],[40,"growl"]]},
  {id:"lunarmoth",name:"루나비",em:"🦋",type:"poison",type2:"bug",tier:3,base:{hp:80,atk:22,def:19,spd:19,spa:16,spDef:19},moves:["gust","peck"],learn:[[8,"growl"],[14,"focusenergy"],[18,"bugbite"],[20,"bugbuzz"],[21,"confuse"],[26,"wingatk"],[27,"lullaby"],[30,"doubleteam"],[33,"recover"],[40,"swordsdance"]]},
  {id:"nipling",name:"집게공",em:"🦀",type:"water",type2:"rock",tier:1,base:{hp:46,atk:15,def:20,spd:9,spa:7,spDef:13},moves:["tackle","rockthrow"],learn:[[8,"growl"],[12,"crush"],[18,"rockslide"],[19,"doubleteam"],[27,"focusenergy"],[36,"confuse"]],evolveTo:"crablord",evolveLv:28},
  /* ⚠️ 집게왕은 atk25/spa9인데 기본 기술셋에 하이드로펌프(물 특수)가 들어 있었다 —
   물 STAB을 spa9로 쏘느라 크로스촙의 1/3밖에 못 때렸다(실측 125 vs 363). 계열이 타입에 묶여 있어
   생긴 사고다. 기술 단위 계열 도입으로 아쿠아제트가 물리가 됐으므로 그걸로 바꾼다. */
{id:"crablord",name:"집게왕",em:"🦞",type:"water",type2:"rock",tier:3,base:{hp:82,atk:25,def:32,spd:11,spa:9,spDef:22},moves:["crush","rockslide","aquajet","boulder"],learn:[[8,"confuse"],[16,"focusenergy"],[23,"growl"],[31,"doubleteam"],[38,"crosschop"],[39,"swordsdance"]]},
  {id:"gullian",name:"갈매정",em:"🐦",type:"flying",type2:"water",tier:2,base:{hp:58,atk:16,def:12,spd:23,spa:16,spDef:13},moves:["peck","gust","wingatk","splash"],learn:[[8,"nastyplot"],[16,"skyrush"],[18,"batonpass"],[27,"harden"],[36,"agility"]]},
  {id:"palmore",name:"야자정",em:"🦌",type:"grass",tier:2,base:{hp:72,atk:18,def:22,spd:8,spa:16,spDef:18},moves:["vine","bloom","slam","absorb"],learn:[[8,"confuse"],[18,"focusenergy"],[20,"megadrain"],[27,"growl"],[36,"doubleteam"]]},
  {id:"jellure",name:"개굴알",em:"🪼",type:"water",type2:"poison",tier:1,base:{hp:54,atk:8,def:12,spd:15,spa:20,spDef:20},moves:["splash","sludge","hydro"],learn:[[8,"roar"],[12,"poisonpowder"],[22,"tsunami"],[26,"amnesia"],[27,"toxic"]],evolveTo:"swampfrog",evolveLv:25},
  {id:"emberlix",name:"불도롱",em:"🦎",type:"fire",tier:2,base:{hp:56,atk:20,def:14,spd:21,spa:19,spDef:12},moves:["ember","furyswipe","quickjab","flare"],learn:[[8,"toxic"],[18,"roar"],[24,"inferno"],[27,"batonpass"],[36,"harden"]]},
  {id:"seedbean",name:"씨앗콩",em:"🌱",type:"grass",tier:1,base:{hp:48,atk:11,def:14,spd:10,spa:13,spDef:13},moves:["tackle","leaf"],learn:[[8,"confuse"],[10,"absorb"],[16,"vine"],[18,"focusenergy"],[27,"growl"],[36,"doubleteam"]],evolveTo:"titanoak",evolveLv:30},
  {id:"titanoak",name:"거목령",em:"🌳",type:"grass",tier:3,base:{hp:88,atk:22,def:26,spd:9,spa:20,spDef:22},moves:["slam","bloom","megadrain","harden"],learn:[[8,"roar"],[18,"toxic"],[27,"nastyplot"],[36,"agility"],[38,"bloomheal"],[44,"gigadrain"]]},
  {id:"emberfly",name:"불티나방",em:"🔥",type:"fire",type2:"bug",tier:1,base:{hp:44,atk:12,def:10,spd:16,spa:15,spDef:11},moves:["ember","gust"],learn:[[8,"recover"],[14,"peck"],[16,"bugbite"],[17,"bugbuzz"],[18,"lullaby"],[20,"flare"],[27,"swordsdance"],[36,"doubleteam"]],evolveTo:"pyrmoth",evolveLv:30},
  {id:"pyrmoth",name:"화염나방",em:"🦋",type:"fire",type2:"flying",tier:3,base:{hp:76,atk:19,def:14,spd:23,spa:27,spDef:16},moves:["flare","wingatk","inferno","gust"],learn:[[8,"recover"],[16,"lullaby"],[23,"swordsdance"],[31,"growl"],[38,"doubleteam"],[40,"skyrush"]]},
  {id:"voltsnake",name:"번개뱀",em:"🐍",type:"elec",tier:1,base:{hp:46,atk:14,def:11,spd:15,spa:16,spDef:11},moves:["spark","tackle"],learn:[[8,"doubleteam"],[14,"bolt"],[18,"growl"],[22,"twinbolt"],[27,"focusenergy"],[36,"confuse"]],evolveTo:"thundwyrm",evolveLv:32},
  {id:"thundwyrm",name:"뇌전룡",em:"⚡",type:"elec",type2:"dragon",tier:3,base:{hp:80,atk:20,def:16,spd:24,spa:26,spDef:18},moves:["thunder","twinbolt","dragonpulse","skyrush"],learn:[[8,"recover"],[18,"lullaby"],[27,"thunderwave"],[36,"swordsdance"],[42,"quickstrike"],[48,"wildbolt"]]},
  {id:"frostpup",name:"서리강아지",em:"🐕",type:"ice",tier:1,base:{hp:50,atk:13,def:13,spd:12,spa:14,spDef:14},moves:["tackle","frostbreath"],learn:[[8,"swordsdance"],[12,"icebeam"],[16,"icywind"],[18,"harden"],[21,"recover"],[33,"lullaby"]],evolveTo:"glacibear",evolveLv:30},
  {id:"glacibear",name:"서리랑",em:"🐺",type:"ice",type2:"rock",tier:3,base:{hp:90,atk:24,def:24,spd:10,spa:16,spDef:22},moves:["crush","icebeam","rockslide","boulder"],learn:[[8,"recover"],[16,"lullaby"],[23,"swordsdance"],[31,"hailstorm"],[38,"blizzard"],[39,"growl"]]},
  {id:"dewdrop",name:"이슬방울",em:"💧",type:"water",tier:1,base:{hp:45,atk:9,def:11,spd:13,spa:14,spDef:12},moves:["tackle","splash"],learn:[[8,"roar"],[10,"hydro"],[16,"absorb"],[18,"toxic"],[27,"nastyplot"],[36,"batonpass"]],evolveTo:"moonytide",evolveLv:34,evolveBranch:[{to:"glimmertide",lv:24,time:"day"},{to:"moonytide",lv:24,time:"night"}]},
  {id:"glimmertide",name:"윤슬정",em:"🌊",type:"water",type2:"flying",tier:3,base:{hp:72,atk:17,def:17,spd:25,spa:25,spDef:19},moves:["hydro","wingatk","tsunami","skyrush"],learn:[]},
  {id:"moonytide",name:"월광정",em:"🌙",type:"water",tier:3,base:{hp:82,atk:18,def:22,spd:14,spa:24,spDef:24},moves:["hydro","tsunami","absorb","recover"],learn:[]},
  {id:"puddlet",name:"물방울",em:"💧",type:"water",tier:1,base:{hp:46,atk:12,def:13,spd:14,spa:15,spDef:13},moves:["tackle","splash"],learn:[[8,"harden"],[12,"hydro"],[18,"quickjab"],[19,"batonpass"],[27,"agility"],[36,"nastyplot"]],evolveTo:"riverine",evolveLv:20},
  {id:"riverine",name:"물살정",em:"🌊",type:"water",tier:2,base:{hp:64,atk:18,def:18,spd:20,spa:20,spDef:18},moves:["hydro","quickjab","crush","splash"],learn:[[8,"recover"],[18,"lullaby"],[27,"amnesia"],[30,"tsunami"],[36,"swordsdance"]],evolveTo:"tidalore",evolveLv:36},
  {id:"tidalore",name:"해일군주",em:"🐳",type:"water",tier:3,base:{hp:88,atk:23,def:23,spd:21,spa:27,spDef:23},moves:["tsunami","hydro","crush","quickjab"],learn:[]},
  {id:"cindercub",name:"불씨늑대",em:"🔥",type:"fire",tier:1,base:{hp:48,atk:16,def:13,spd:15,spa:16,spDef:12},moves:["ember","tackle"],learn:[[8,"roar"],[14,"furyswipe"],[18,"toxic"],[20,"flare"],[27,"nastyplot"],[36,"willowisp"]],evolveTo:"pyrewolf",evolveLv:30},
  {id:"pyrewolf",name:"화염랑",em:"🐺",type:"fire",tier:3,base:{hp:78,atk:26,def:18,spd:24,spa:24,spDef:16},moves:["inferno","flare","furyswipe","crush"],learn:[]},
  {id:"petalwing",name:"꽃날개",em:"🦋",type:"grass",type2:"bug",tier:1,base:{hp:44,atk:12,def:11,spd:18,spa:16,spDef:13},moves:["gust","leaf"],learn:[[8,"growl"],[14,"absorb"],[16,"bugbite"],[17,"bugbuzz"],[18,"doubleteam"],[20,"wingatk"],[27,"confuse"],[36,"focusenergy"]],evolveTo:"blossomhawk",evolveLv:30},
  {id:"blossomhawk",name:"꽃호접",em:"🦋",type:"grass",type2:"flying",tier:3,base:{hp:74,atk:20,def:16,spd:26,spa:26,spDef:18},moves:["skyrush","megadrain","wingatk","bloom"],learn:[]},
  {id:"lumbeast",name:"우직수",em:"🦝",type:"normal",tier:2,base:{hp:80,atk:24,def:22,spd:12,spa:12,spDef:18},moves:["crush","headbutt","slam","growl"],learn:[[8,"recover"],[18,"lullaby"],[27,"swordsdance"],[36,"boulder"],[37,"doubleteam"]]},
  {id:"snowl",name:"설올빼미",em:"🦉",type:"flying",type2:"ice",tier:2,base:{hp:62,atk:16,def:14,spd:24,spa:20,spDef:16},moves:["peck","icebeam","gust","wingatk"],learn:[[8,"nastyplot"],[18,"batonpass"],[27,"harden"],[32,"skyrush"],[36,"agility"]]},
  {id:"cryogon",name:"동결룡",em:"🐋",type:"ice",type2:"dragon",tier:3,base:{hp:84,atk:24,def:28,spd:14,spa:24,spDef:22},moves:["blizzard","rockslide","icebeam","dragonpulse"],learn:[]},
  {id:"iceling",name:"얼음정",em:"🧊",type:"ice",tier:1,base:{hp:48,atk:12,def:16,spd:12,spa:16,spDef:16},moves:["tackle","iceshard"],learn:[[8,"lullaby"],[14,"icebeam"],[18,"recover"],[20,"harden"],[27,"swordsdance"],[36,"doubleteam"]],evolveTo:"frostwyrm",evolveLv:32},
  {id:"frostwyrm",name:"빙하룡",em:"❄️",type:"ice",type2:"dragon",tier:3,base:{hp:82,atk:22,def:26,spd:16,spa:26,spDef:24},moves:["blizzard","icebeam","dragonpulse","harden"],learn:[[8,"swordsdance"],[16,"lullaby"],[23,"recover"],[31,"confuse"],[34,"hailstorm"],[38,"focusenergy"]]},
  {id:"drakeling",name:"새끼용",em:"🦎",type:"dragon",tier:1,base:{hp:50,atk:16,def:14,spd:14,spa:12,spDef:12},moves:["tackle","headbutt","dragonbreath"],learn:[[8,"agility"],[16,"crush"],[18,"batonpass"],[22,"slam"],[27,"harden"],[36,"nastyplot"]],evolveTo:"wyverna",evolveLv:25},
  {id:"wyverna",name:"비룡",em:"🐉",type:"dragon",tier:2,base:{hp:70,atk:22,def:20,spd:18,spa:16,spDef:16},moves:["crush","dragonbreath","slam","furyswipe"],learn:[[8,"roar"],[18,"toxic"],[27,"nastyplot"],[36,"gust"],[37,"agility"]],evolveTo:"skydrake",evolveLv:42},
  {id:"skydrake",name:"천공룡",em:"🐲",type:"dragon",type2:"flying",tier:3,base:{hp:88,atk:27,def:24,spd:24,spa:20,spDef:22},moves:["skyrush","crush","wingatk","dragonpulse"],learn:[]},
  {id:"mossback",name:"이끼등",em:"🐢",type:"grass",type2:"rock",tier:1,base:{hp:54,atk:14,def:20,spd:8,spa:12,spDef:16},moves:["tackle","rockthrow"],learn:[[8,"lullaby"],[14,"absorb"],[18,"recover"],[20,"rockslide"],[27,"swordsdance"],[36,"growl"]],evolveTo:"terrapin",evolveLv:30},
  {id:"terrapin",name:"대지거북",em:"🗿",type:"grass",type2:"ground",tier:3,base:{hp:90,atk:22,def:36,spd:8,spa:16,spDef:24},moves:["boulder","megadrain","rockslide","harden"],learn:[]},
  {id:"sandwhirl",name:"모래매",em:"🦅",type:"ground",type2:"flying",tier:2,base:{hp:64,atk:20,def:18,spd:24,spa:14,spDef:14},moves:["rockslide","gust","wingatk","rockthrow"],learn:[[8,"lullaby"],[18,"recover"],[27,"swordsdance"],[34,"skyrush"],[36,"doubleteam"]]},
  {id:"sproutcat",name:"새싹냥",em:"🌿",type:"grass",tier:1,base:{hp:46,atk:13,def:13,spd:16,spa:15,spDef:13},moves:["tackle","leaf"],learn:[[8,"confuse"],[12,"absorb"],[18,"furyswipe"],[19,"focusenergy"],[27,"growl"],[36,"doubleteam"]],evolveTo:"bloomlynx",evolveLv:28},
  {id:"bloomlynx",name:"꽃표범",em:"🐆",type:"grass",tier:3,base:{hp:76,atk:22,def:20,spd:26,spa:24,spDef:20},moves:["furyswipe","megadrain","bloom","quickjab"],learn:[[8,"doubleteam"],[16,"growl"],[23,"confuse"],[31,"focusenergy"],[38,"lullaby"],[40,"bloomheal"]]},
  {id:"zapfinch",name:"번개새",em:"🐤",type:"elec",type2:"flying",tier:1,base:{hp:42,atk:12,def:11,spd:20,spa:16,spDef:11},moves:["peck","spark"],learn:[[8,"confuse"],[14,"gust"],[18,"focusenergy"],[20,"bolt"],[27,"doubleteam"],[36,"growl"]],evolveTo:"voltfalcon",evolveLv:30},
  {id:"voltfalcon",name:"뇌전매",em:"🦅",type:"elec",type2:"flying",tier:3,base:{hp:72,atk:20,def:16,spd:30,spa:24,spDef:16},moves:["skyrush","twinbolt","wingatk","spark"],learn:[]},
  {id:"dustbunny",name:"먼지토끼",em:"🐰",type:"ground",tier:1,base:{hp:52,atk:13,def:14,spd:14,spa:9,spDef:13},moves:["tackle","growl"],learn:[[8,"lullaby"],[10,"quickjab"],[16,"headbutt"],[18,"recover"],[27,"swordsdance"],[36,"doubleteam"]],evolveTo:"thumplord",evolveLv:26},
  {id:"thumplord",name:"쿵쿵왕",em:"🐇",type:"ground",type2:"normal",tier:3,base:{hp:88,atk:26,def:24,spd:16,spa:12,spDef:22},moves:["crush","headbutt","slam","furyswipe"],learn:[]},
  {id:"glowfly",name:"반딧불이",em:"🪰",type:"elec",type2:"bug",tier:1,base:{hp:40,atk:10,def:10,spd:18,spa:18,spDef:12},moves:["spark","tackle"],learn:[[8,"nastyplot"],[14,"bolt"],[16,"bugbite"],[17,"bugbuzz"],[18,"agility"],[22,"confuse"],[27,"harden"],[36,"batonpass"]],evolveTo:"arcmoth",evolveLv:30},
  {id:"arcmoth",name:"뇌광나방",em:"🦋",type:"elec",type2:"poison",tier:3,base:{hp:71,atk:16,def:16,spd:24,spa:28,spDef:20},moves:["thunder","twinbolt","gust","spark"],learn:[]},
  {id:"pebblet",name:"조약돌",em:"🪨",type:"rock",tier:1,base:{hp:44,atk:14,def:22,spd:8,spa:6,spDef:14},moves:["tackle","rockthrow"],learn:[[8,"irondefense"],[12,"harden"],[18,"rockslide"],[19,"toxic"],[27,"roar"],[36,"batonpass"]],evolveTo:"boulderin",evolveLv:22},
  {id:"boulderin",name:"바위정",em:"⛰️",type:"rock",type2:"ground",tier:2,base:{hp:64,atk:20,def:34,spd:8,spa:8,spDef:20},moves:["rockthrow","rockslide","quake","harden"],learn:[[8,"toxic"],[21,"irondefense"],[30,"boulder"],[33,"roar"],[34,"crosschop"]],evolveTo:"megalith",evolveLv:36},
  {id:"megalith",name:"거암왕",em:"🗿",type:"rock",tier:3,base:{hp:88,atk:28,def:44,spd:9,spa:10,spDef:26},moves:["boulder","rockslide","crush","harden"],learn:[[8,"doubleteam"],[21,"growl"],[33,"focusenergy"],[40,"rockblast"],[44,"ironhead"],[50,"irondefense"]]},
  {id:"lavakit",name:"용암구리",em:"🌋",type:"fire",type2:"rock",tier:1,base:{hp:48,atk:15,def:16,spd:12,spa:16,spDef:12},moves:["ember","rockthrow"],learn:[[8,"focusenergy"],[16,"flare"],[18,"confuse"],[22,"rockslide"],[27,"growl"],[36,"doubleteam"]],evolveTo:"magmadon",evolveLv:32},
  {id:"magmadon",name:"마그마룡",em:"🔥",type:"fire",type2:"ground",tier:3,base:{hp:82,atk:26,def:26,spd:14,spa:24,spDef:18},moves:["inferno","boulder","flare","quake"],learn:[]},
  {id:"burrowmouse",name:"굴다람",em:"🐹",type:"ground",tier:1,base:{hp:46,atk:14,def:15,spd:16,spa:9,spDef:12},moves:["tackle","mudshot"],learn:[[8,"swordsdance"],[10,"sandattack"],[14,"furyswipe"],[20,"dig"],[21,"lullaby"],[33,"recover"]],evolveTo:"burrowlord",evolveLv:30},
  {id:"burrowlord",name:"대굴왕",em:"🦫",type:"ground",type2:"normal",tier:3,base:{hp:78,atk:24,def:26,spd:18,spa:12,spDef:20},moves:["crush","rockslide","headbutt","furyswipe"],learn:[]},
  {id:"crystalgon",name:"결정룡",em:"💎",type:"rock",type2:"elec",tier:3,base:{hp:74,atk:20,def:30,spd:16,spa:26,spDef:24},moves:["rockslide","twinbolt","boulder","spark"],learn:[[8,"recover"],[16,"lullaby"],[23,"thunderwave"],[31,"swordsdance"],[38,"growl"],[40,"thunder"]]},
  {id:"glaciarch",name:"빙하제",em:"🐉",type:"ice",type2:"dragon",tier:4,secret:true,legend:true,base:{hp:112,atk:33,def:37,spd:23,spa:41,spDef:35},moves:["blizzard","icebeam","dragonpulse","rockslide"],learn:[]},
  {id:"aqualord",name:"수룡왕",em:"🐉",type:"water",type2:"dragon",tier:4,secret:true,legend:true,base:{hp:112,atk:33,def:35,spd:27,spa:43,spDef:35},moves:["hydro","tsunami","dragonpulse","crush"],learn:[]},
  {id:"shadowlord",name:"흑요마",em:"👁️",type:"elec",type2:"rock",tier:4,secret:true,legend:true,base:{hp:110,atk:29,def:33,spd:33,spa:41,spDef:33},moves:["thunder","crush","toxic","lullaby"],learn:[]},
  {id:"dawnguard",name:"오로르",em:"🕊️",type:"flying",tier:4,secret:true,legend:true,base:{hp:110,atk:39,def:37,spd:33,spa:28,spDef:34},moves:["skyrush","wingatk","crush","recover"],learn:[]},
  {id:"dawnwyrm",name:"여명룡",em:"🐉",type:"flying",type2:"dragon",tier:4,secret:true,legend:true,base:{hp:118,atk:37,def:35,spd:35,spa:37,spDef:35},moves:["skyrush","dragonpulse","crush","recover"],learn:[]},
];
const byId=id=>DEX.find(d=>d.id===id);
const STARTERS=DEX.filter(d=>d.starter);
// 야생 정령이 들고 나오는 도구. 예전엔 held:null 고정이라 야생에서 도구를 얻을 길이 없었다.
// 티어가 높을수록 확률·품질이 오른다.
//
// ⚠️ **야생 풀과 트레이너 풀은 의도적으로 분리돼 있다** (2026-08-06).
//    trainerMon은 makeMon을 그대로 쓰고 held를 덮어쓰지 않는다 — 예전엔 한 풀을 공유했고
//    (실측: 트레이너 정령의 10.8%가 지닌물건을 들고 나온다) 그래서 **야생 풀을 넓히면 트레이너가 같이 세졌다**.
//    분리 이후로는 **WILD_HELD를 넓혀도 트레이너 정령의 지닌물건 분포는 불변**이다(= 밸런스 재측정 불필요).
//    트레이너를 세게 하려면 TRAINER_HELD를 고쳐야 하고, 그건 재측정 대상이다.
//    ⚠️ 트레이너 측 makeMon 호출부는 **반드시 3번째 인자로 TRAINER_HELD를 넘긴다**(현재 3곳:
//       trainerMon · startDouble의 DB.foes · DB.bench 교대). 빠뜨리면 그 트레이너만 조용히 야생 풀을 쓴다 →
//       `held_effect_test [5]`가 실제 트레이너 생성 경로를 돌려 이걸 단정한다.
//    상점에만 파는 지닌물건은 어느 풀에도 없으므로 플레이어 전용이다.
const WILD_HELD={
  1:["oranberry","cureberry"],
  2:["oranberry","cureberry","scopelens","swiftfeather"],
  3:["leftovers","powerband","scopelens","swiftfeather","lightwing","heavycore","recklessgem","resolvering"]};
// 트레이너 전용 풀 — **분리 시점의 옛 WILD_HELD 값 그대로 동결**했다. 손대면 트레이너가 세지거나 약해진다.
const TRAINER_HELD={
  1:["oranberry","cureberry"],
  2:["oranberry","cureberry","scopelens"],
  3:["leftovers","powerband","scopelens"]};
// 휴대율은 분리 전과 같다(5% / 9% / 14%) — 이번에 바꾼 건 "무엇을 드느냐"뿐이다.
function wildHeld(sp,pools){
  if(!sp||sp.legend)return null;
  const rate=sp.tier>=3?0.14:sp.tier===2?0.09:0.05;
  if(Math.random()>=rate)return null;
  pools=pools||WILD_HELD;
  const pool=pools[sp.tier]||pools[1];
  return pool[ri(0,pool.length-1)]; }
// heldPool: 지닌물건을 뽑을 풀. 생략하면 WILD_HELD(야생·플레이어). 트레이너 측은 TRAINER_HELD를 넘긴다.
function makeMon(speciesId,level,heldPool){ const sp=byId(speciesId); level=Math.max(1,Math.floor(level||1));   // 레벨은 항상 정수(avgLevel 등 float가 새어들어와 소수점 레벨 방지)
  const m={id:speciesId,name:sp.name,em:sp.em,type:sp.type, type2:sp.type2||null,level:level,moves:sp.moves.slice(),xp:0,
    status:null,stages:newStages(),pp:{},ability:sp.ability||ABILITY_OVERRIDE[speciesId]||DEFAULT_ABILITY[sp.type]||"guts",
    nature:NATURES[ri(0,NATURES.length-1)].k, shiny:Math.random()<(SHINY_RATE*((typeof G!=="undefined"&&G&&G.dexMaster)?3:1)*((typeof G!=="undefined"&&G&&G.shinyCharm)?2:1)), held:wildHeld(sp,heldPool), friendship:0, ivs:{hp:ri(0,31),atk:ri(0,31),def:ri(0,31),spa:ri(0,31),spDef:ri(0,31),spd:ri(0,31)}, evs:{hp:0,atk:0,def:0,spa:0,spDef:0,spd:0}, gender:(sp.secret||sp.genderless)?"N":(Math.random()<0.5?"M":"F")};
  if(sp.learn)sp.learn.forEach(([lv,mv])=>{if(level>=lv)addMove(m,mv);});
  m.moves.forEach(mv=>{m.pp[mv]=MOVES[mv].pp;});
  recalc(m,sp,true); return m; }
function addMove(m,mv){ if(m.moves.includes(mv))return; if(m.moves.length<4)m.moves.push(mv); else m.moves[3]=mv; if(!m.pp)m.pp={}; m.pp[mv]=MOVES[mv].pp; }
function recalc(m,sp,full){ sp=sp||byId(m.id);
  m.maxHp=Math.floor(sp.base.hp+sp.base.hp*0.12*(m.level-1)+m.level*2);
  m.atk=Math.floor(sp.base.atk+sp.base.atk*0.10*(m.level-1));
  m.def=Math.floor(sp.base.def+sp.base.def*0.10*(m.level-1));
  m.spd=Math.floor(sp.base.spd+sp.base.spd*0.08*(m.level-1));
  const _bspa=sp.base.spa!=null?sp.base.spa:sp.base.atk, _bspd=sp.base.spDef!=null?sp.base.spDef:sp.base.def;
  m.spa=Math.floor(_bspa+_bspa*0.10*(m.level-1));
  m.spDef=Math.floor(_bspd+_bspd*0.10*(m.level-1));
  const nat=NATURE_BY_K[m.nature]; if(nat&&nat.up){ m[nat.up]=Math.floor(m[nat.up]*1.1); m[nat.down]=Math.floor(m[nat.down]*0.9); }
  if(m.ivs){ const _iv=m.ivs,_l=m.level; m.maxHp+=Math.floor((_iv.hp||0)*_l/32); m.atk+=Math.floor((_iv.atk||0)*_l/40); m.def+=Math.floor((_iv.def||0)*_l/40); m.spa+=Math.floor((_iv.spa||0)*_l/40); m.spDef+=Math.floor((_iv.spDef||0)*_l/40); m.spd+=Math.floor((_iv.spd||0)*_l/40); }
  if(m.evs){ const _ev=m.evs,_l=m.level; m.maxHp+=Math.floor((_ev.hp||0)*_l/450); m.atk+=Math.floor((_ev.atk||0)*_l/500); m.def+=Math.floor((_ev.def||0)*_l/500); m.spa+=Math.floor((_ev.spa||0)*_l/500); m.spDef+=Math.floor((_ev.spDef||0)*_l/500); m.spd+=Math.floor((_ev.spd||0)*_l/500); }
  if(full)m.hp=m.maxHp; if(m.hp>m.maxHp)m.hp=m.maxHp; }
//@@RULES_BATTLE@@
