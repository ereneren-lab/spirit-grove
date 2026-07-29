// 기술 데이터 + 사람이 읽는 한 줄 설명. **DOM을 쓰지 않는다**(순수 규칙 계층).
// 브라우저는 build.py가 //@@RULES_MOVES@@ 자리에 인라인하고, node는 rules_env.js가
// 같은 파일을 같은 순서로 평가한다 — 문자 그대로 같은 코드가 돈다.
// ⚠️ 최상위 선언은 들여쓰기 없이 쓸 것(rules_env의 선언 추출 정규식이 행 첫 칸을 앵커로 쓴다).
// eff: {status:'brn',chance} | {stat:'atk',stage:-1,target:'foe'|'self',chance}
const MOVES={
  tackle:{name:"몸통박치기",type:"normal",power:35,acc:100,pp:30,pri:0},
  slam:{name:"내려찍기",type:"normal",power:50,acc:95,pp:20,pri:0},
  crush:{name:"파괴광선",type:"normal",power:72,acc:90,pp:10,pri:0},
  reflect:{name:"리플렉터",type:"normal",power:0,acc:100,pp:20,pri:0,eff:{screen:"reflect"}},
  lightscreen:{name:"빛의장막",type:"normal",power:0,acc:100,pp:20,pri:0,eff:{screen:"light"}},
  leechseed:{name:"씨뿌리기",type:"grass",power:0,acc:90,pp:10,pri:0,eff:{seed:true}},
  confuse:{name:"혼란파",type:"normal",power:0,acc:100,pp:20,pri:0,eff:{confuse:true}},
  headbutt:{name:"박치기",type:"normal",power:55,acc:100,pp:15,pri:0,eff:{flinch:0.3}},
  stealthrock:{name:"스텔스록",type:"rock",power:0,acc:100,pp:20,pri:0,eff:{hazard:"rock"}},
  spikes:{name:"압정뿌리기",type:"rock",power:0,acc:100,pp:20,pri:0,eff:{hazard:"spikes"}},
  sunnyday:{name:"쾌청",type:"fire",power:0,acc:100,pp:5,pri:0,eff:{weather:"sun"}},
  raindance:{name:"비바라기",type:"water",power:0,acc:100,pp:5,pri:0,eff:{weather:"rain"}},
  sandstorm:{name:"모래바람",type:"rock",power:0,acc:100,pp:5,pri:0,eff:{weather:"sand"}},
  hailstorm:{name:"싸라기눈",type:"ice",power:0,acc:100,pp:5,pri:0,eff:{weather:"hail"}},
  quickjab:{name:"날쌘일격",type:"normal",power:40,acc:100,pp:30,pri:1},
  ember:{name:"불꽃세례",type:"fire",power:42,acc:100,pp:25,pri:0,eff:{status:"brn",chance:0.1}},
  flare:{name:"화염방사",type:"fire",power:58,acc:95,pp:15,pri:0,eff:{status:"brn",chance:0.12}},
  inferno:{name:"인페르노",type:"fire",power:74,acc:90,pp:8,pri:0,eff:{status:"brn",chance:0.2}},
  splash:{name:"물대포",type:"water",power:42,acc:100,pp:25,pri:0},
  hydro:{name:"하이드로펌프",type:"water",power:58,acc:90,pp:15,pri:0},
  tsunami:{name:"해일",type:"water",power:74,acc:85,pp:8,pri:0},
  leaf:{name:"잎날가르기",type:"grass",power:42,acc:100,pp:25,pri:0},
  vine:{name:"덩굴채찍",type:"grass",power:58,acc:95,pp:15,pri:0},
  bloom:{name:"꽃잎폭풍",type:"grass",power:74,acc:90,pp:8,pri:0},
  spark:{name:"전기쇼크",type:"elec",power:42,acc:100,pp:25,pri:0,eff:{status:"par",chance:0.1}},
  bolt:{name:"번개",type:"elec",power:58,acc:95,pp:15,pri:0,eff:{status:"par",chance:0.12}},
  thunder:{name:"천둥강타",type:"elec",power:74,acc:85,pp:8,pri:0,eff:{status:"par",chance:0.2}},
  growl:{name:"위협",type:"normal",power:0,acc:100,pp:40,pri:0,eff:{stat:"atk",stage:-1,target:"foe"}},
  harden:{name:"단단해지기",type:"normal",power:0,acc:100,pp:40,pri:0,eff:{stat:"def",stage:1,target:"self"}},
  screech:{name:"날카로운울음",type:"normal",power:0,acc:85,pp:20,pri:0,eff:{stat:"def",stage:-2,target:"foe"}},
  agility:{name:"가속",type:"normal",power:0,acc:100,pp:20,pri:0,eff:{stat:"spd",stage:2,target:"self"}},
  toxic:{name:"맹독",type:"normal",power:0,acc:90,pp:10,pri:0,eff:{status:"psn",chance:1,badly:true}},
  thunderwave:{name:"전기자극",type:"elec",power:0,acc:90,pp:20,pri:0,eff:{status:"par",chance:1}},
  lullaby:{name:"자장가",type:"normal",power:0,acc:75,pp:10,pri:0,eff:{status:"slp",chance:1}},
  spore:{name:"수면가루",type:"grass",power:0,acc:80,pp:12,pri:0,eff:{status:"slp",chance:1}},
  furyswipe:{name:"연속할퀴기",type:"normal",power:17,acc:95,pp:20,pri:0,multi:[2,5]},
  twinbolt:{name:"쌍전탄",type:"elec",power:22,acc:100,pp:15,pri:0,multi:[2,3]},
  absorb:{name:"흡수",type:"grass",power:40,acc:100,pp:20,pri:0,drain:0.5},
  megadrain:{name:"메가드레인",type:"grass",power:60,acc:95,pp:12,pri:0,drain:0.5},
  drainfang:{name:"흡혈송곳니",type:"normal",power:55,acc:100,pp:12,pri:0,drain:0.5},
  recover:{name:"회복",type:"normal",power:0,acc:100,pp:8,pri:0,heal:0.5},
  bloomheal:{name:"꽃잎치유",type:"grass",power:0,acc:100,pp:8,pri:0,heal:0.5},
  gust:{name:"바람일격",type:"flying",power:38,acc:100,pp:25,pri:0},
  wingatk:{name:"날개치기",type:"flying",power:55,acc:95,pp:15,pri:0},
  skyrush:{name:"창공돌격",type:"flying",power:74,acc:90,pp:8,pri:0},
  peck:{name:"쪼기",type:"flying",power:40,acc:100,pp:30,pri:1},
  rockthrow:{name:"바위던지기",type:"rock",power:45,acc:90,pp:20,pri:0},
  rockslide:{name:"락슬라이드",type:"rock",power:60,acc:90,pp:12,pri:0},
  boulder:{name:"거석충돌",type:"rock",power:74,acc:85,pp:8,pri:0},
  // ===== 얼음(특수) =====
  iceshard:{name:"얼음뭉치",type:"ice",power:40,acc:100,pp:20,pri:1},
  frostbreath:{name:"서리숨결",type:"ice",power:48,acc:100,pp:15,pri:0,eff:{status:"frz",chance:0.1}},
  icebeam:{name:"냉동빔",type:"ice",power:60,acc:95,pp:12,pri:0,eff:{status:"frz",chance:0.12}},
  blizzard:{name:"눈보라",type:"ice",power:76,acc:80,pp:6,pri:0,eff:{status:"frz",chance:0.15}},
  chill:{name:"한기",type:"ice",power:0,acc:95,pp:20,pri:0,eff:{stat:"spd",stage:-1,target:"foe",chance:1}},
  // ===== 독(물리 계열) =====
  poisonjab:{name:"독찌르기",type:"poison",power:50,acc:100,pp:20,pri:0,eff:{status:"psn",chance:0.2}},
  sludge:{name:"오물폭탄",type:"poison",power:62,acc:95,pp:10,pri:0,eff:{status:"psn",chance:0.3}},
  // ===== 땅(물리) =====
  mudshot:{name:"머드샷",type:"ground",power:42,acc:95,pp:15,pri:0,eff:{stat:"spd",stage:-1,target:"foe",chance:1}},
  icywind:{name:"얼음바람",type:"ice",power:38,acc:95,pp:15,pri:0,eff:{stat:"spd",stage:-1,target:"foe",chance:1}},
  poisonpowder:{name:"독가루",type:"poison",power:0,acc:75,pp:20,pri:0,eff:{status:"psn",chance:1}},
  dig:{name:"땅파기",type:"ground",power:60,acc:100,pp:10,pri:0},
  quake:{name:"지진",type:"ground",power:78,acc:100,pp:8,pri:0},
  /* ── 타입별 공격기 보강(평가 #3) ─────────────────────────────────────────
     불·물 정령이 30종인데 그 타입 공격기가 각 4개뿐이라 **같은 타입 정령이 거의 같은 기술**을 썼다.
     독은 2개, 땅은 4개로 더 심했다. 타입당 최소 6개가 되도록 13개를 추가한다.
     ⚠️ **전부 플레이어 전용 TM으로만 배운다** — 레벨업 학습셋에 안 넣으므로 트레이너·야생은 안 쓰고
        따라서 **밸런스는 구조적으로 불변**이다(지닌물건·방어·2턴기 때와 같은 원칙).
     ⚠️ 공격기를 추가하면 `SIGFX`에도 반드시 전용 연출을 넣을 것 — 회귀가 `atkSig===atkAll`을 강제한다. */
  // 불 4→6
  emberburst:{name:"불티폭발",type:"fire",power:50,acc:100,pp:15,pri:0,eff:{status:"brn",chance:0.15}},
  heatlance:{name:"열창",type:"fire",power:66,acc:95,pp:10,pri:0,highCrit:true},
  // 물 4→6
  bubblebeam:{name:"거품광선",type:"water",power:48,acc:100,pp:20,pri:0,eff:{stat:"spd",stage:-1,target:"foe",chance:0.35}},
  whirlpool:{name:"소용돌이",type:"water",power:56,acc:90,pp:12,pri:0,eff:{trap:true}},
  // 독 2→6
  acidspray:{name:"애시드샷",type:"poison",power:44,acc:100,pp:20,pri:0,eff:{stat:"spDef",stage:-2,target:"foe",chance:0.5}},
  venomfang:{name:"독니",type:"poison",power:58,acc:95,pp:15,pri:0,eff:{status:"psn",chance:0.3}},
  toxicwave:{name:"독의물결",type:"poison",power:70,acc:90,pp:10,pri:0,eff:{status:"psn",chance:0.2}},
  needlerush:{name:"바늘연타",type:"poison",power:22,acc:95,pp:15,pri:0,multi:[2,5]},
  // 땅 4→6
  sandblast:{name:"모래폭풍탄",type:"ground",power:52,acc:95,pp:15,pri:0,eff:{stat:"acc",stage:-1,target:"foe",chance:0.4}},
  fissure:{name:"땅가르기",type:"ground",power:68,acc:90,pp:8,pri:0,highCrit:true},
  // 전기·비행·얼음 5→6
  voltfang:{name:"전격니",type:"elec",power:56,acc:95,pp:15,pri:0,eff:{status:"par",chance:0.3}},
  windblade:{name:"질풍참",type:"flying",power:54,acc:100,pp:15,pri:0,highCrit:true},
  frostshard:{name:"서리파편",type:"ice",power:50,acc:100,pp:20,pri:0,eff:{status:"frz",chance:0.1}},
  // ===== 다단히트 =====
  doublekick:{name:"두번차기",type:"ground",power:18,acc:100,pp:20,pri:0,multi:[2,2]},
  rockblast:{name:"돌팔매연타",type:"rock",power:14,acc:90,pp:15,pri:0,multi:[2,5]},
  // ===== 반동(고위력) =====
  flareblitz:{name:"플레어드라이브",type:"fire",power:82,acc:100,pp:8,pri:0,recoil:0.25,eff:{status:"brn",chance:0.1}},
  wildbolt:{name:"와일드볼트",type:"elec",power:78,acc:100,pp:8,pri:0,recoil:0.2},
  takedown:{name:"돌진",type:"normal",power:70,acc:95,pp:12,pri:0,recoil:0.2},
  // ===== 우선도 =====
  aquajet:{name:"아쿠아제트",type:"water",power:40,acc:100,pp:20,pri:1},
  quickstrike:{name:"전광석화",type:"normal",power:40,acc:100,pp:25,pri:1},
  // ===== 흡수 =====
  gigadrain:{name:"기가드레인",type:"grass",power:55,acc:100,pp:10,pri:0,drain:0.5},
  // ===== 변화기 =====
  willowisp:{name:"도깨비불",type:"fire",power:0,acc:85,pp:15,pri:0,eff:{status:"brn",chance:1}},
  swordsdance:{name:"칼춤",type:"normal",power:0,acc:100,pp:20,pri:0,eff:{stat:"atk",stage:2,target:"self"}},
  irondefense:{name:"철벽",type:"rock",power:0,acc:100,pp:15,pri:0,eff:{stat:"def",stage:2,target:"self"}},
  nastyplot:{name:"나쁜음모",type:"normal",power:0,acc:100,pp:20,pri:0,eff:{stat:"spa",stage:2,target:"self"}},
  amnesia:{name:"기억상실",type:"water",power:0,acc:100,pp:20,pri:0,eff:{stat:"spDef",stage:2,target:"self"}},
  doubleteam:{name:"그림자분신",type:"normal",power:0,acc:100,pp:15,pri:0,eff:{stat:"eva",stage:1,target:"self"}},
  sandattack:{name:"모래뿌리기",type:"ground",power:0,acc:100,pp:15,pri:0,eff:{stat:"acc",stage:-1,target:"foe"}},
  batonpass:{name:"배턴터치",type:"normal",power:0,acc:100,pp:15,pri:0,eff:{baton:true}},
  roar:{name:"울부짖기",type:"normal",power:0,acc:100,pp:15,pri:-6,eff:{phase:true}},
  // 방어: 우선도 높음(pri:4)이라 먼저 나가 이 턴 상대를 노리는 공격을 막는다. 연속 사용하면 성공률 1/3씩 감소(본가).
  protect:{name:"방어",type:"normal",power:0,acc:100,pp:10,pri:4,eff:{protect:true}},
  selfdestruct:{name:"자폭",type:"normal",power:120,acc:100,pp:5,pri:0,eff:{selfKO:true}},   // 큰 피해 후 자신도 기절
  attract:{name:"헤롱헤롱",type:"normal",power:0,acc:100,pp:15,pri:0,eff:{attract:true}},     // 이성이면 50% 확률로 못 움직임
  bind:{name:"조이기",type:"normal",power:28,acc:90,pp:20,pri:0,eff:{trap:true}},             // 4~5턴 묶어 잔뎀 + 도주·교체 봉쇄
  fly:{name:"날기",type:"flying",power:75,acc:95,pp:10,pri:0,eff:{charge:true,invuln:true,chargeMsg:"은(는) 하늘 높이 날아올랐다!"}},   // 1턴 충전(반무적) → 2턴째 공격
  solarbeam:{name:"솔라빔",type:"grass",power:100,acc:100,pp:10,pri:0,eff:{charge:true,chargeMsg:"은(는) 빛을 모으고 있다!"}},            // 1턴 충전 → 강력한 한 방
  encore:{name:"앵콜",type:"normal",power:0,acc:100,pp:5,pri:0,eff:{encore:true}},    // 상대를 마지막 기술로 3턴 고정
  taunt:{name:"도발",type:"normal",power:0,acc:100,pp:15,pri:0,eff:{taunt:true}},     // 상대가 3턴간 변화기를 못 쓴다
  disable:{name:"방해",type:"normal",power:0,acc:100,pp:15,pri:0,eff:{disable:true}}, // 상대의 마지막 기술을 4턴 봉쇄
  focusenergy:{name:"기합충전",type:"normal",power:0,acc:100,pp:15,pri:0,eff:{crit:2,target:"self"}},
  slash:{name:"가르기",type:"normal",power:58,acc:100,pp:20,pri:0,highCrit:true},
  crosschop:{name:"크로스촙",type:"rock",power:72,acc:85,pp:10,pri:0,highCrit:true},
  charm:{name:"애교부리기",type:"normal",power:0,acc:100,pp:20,pri:0,eff:{stat:"atk",stage:-2,target:"foe"}},
  scaryface:{name:"위협하기",type:"normal",power:0,acc:100,pp:15,pri:0,eff:{stat:"spd",stage:-2,target:"foe"}},
  // ===== 풀죽음 =====
  ironhead:{name:"아이언헤드",type:"rock",power:60,acc:100,pp:12,pri:0,eff:{flinch:0.3}},
  bite:{name:"물기",type:"normal",power:48,acc:100,pp:20,pri:0,eff:{flinch:0.3}},
  struggle:{name:"발버둥",type:"normal",power:40,acc:100,pp:Infinity,pri:0,recoil:0.25},
};
// 기술 효과를 사람이 읽을 수 있는 한 줄로. 배우기/잊기/재습득 UI에서 "어떤 기술인지" 보여준다.
function moveDesc(mvKey){ const mo=MOVES[mvKey]; if(!mo)return ""; const p=[]; const e=mo.eff||{};
  if(mo.power>0)p.push("위력 "+mo.power);
  if(mo.heal)p.push("HP "+Math.round(mo.heal*100)+"% 회복");
  if(mo.drain)p.push("피해 "+Math.round(mo.drain*100)+"% 흡수");
  if(mo.multi)p.push(mo.multi[0]+"~"+mo.multi[1]+"연타");
  if(mo.recoil)p.push("반동");
  if((mo.pri||0)>0)p.push("선제공격");
  if(e.status)p.push("상대를 "+(e.badly?"맹독":(_MV_STATUS_KO[e.status]||e.status))+"으로");
  if(e.stat){ const st=STAT_KO[e.stat]||e.stat; const who=e.target==="self"?"자신":"상대"; const n=Math.min(3,Math.abs(e.stage||1)); const arw=((e.stage||0)>0?"↑":"↓").repeat(n); p.push(who+" "+st+arw); }
  if(e.screen)p.push(e.screen==="reflect"?"물리 피해 5턴 감소":"특수 피해 5턴 감소");
  if(e.seed)p.push("씨뿌리기(매턴 흡수)");
  if(e.confuse)p.push("상대 혼란");
  if(e.crit)p.push("자신 급소율↑↑");
  if(e.baton)p.push("랭크를 넘기고 교체");
  if(e.phase)p.push("상대를 강제 교체(후공)");
  if(e.protect)p.push("이 턴 상대 공격을 막음(연속 시 실패↑)");
  if(e.attract)p.push("이성이면 헤롱헤롱(50% 못 움직임)");
  if(e.trap)p.push("4~5턴 속박(잔뎀+도주·교체 봉쇄)");
  if(e.selfKO)p.push("큰 피해 · 자신도 기절");
  if(e.charge)p.push(e.invuln?"1턴 충전(반무적)":"1턴 충전 후 강타");
  if(e.encore)p.push("상대를 마지막 기술로 3턴 고정");
  if(e.taunt)p.push("상대 변화기 3턴 봉쇄");
  if(e.disable)p.push("상대 마지막 기술 봉인");
  if(mo.highCrit)p.push("급소율 높음");
  if(e.weather)p.push(({sun:"날씨 쨍쨍",rain:"날씨 비",sand:"날씨 모래바람"}[e.weather]||"날씨 변화"));
  if(e.hazard)p.push(e.hazard==="rock"?"바위 설치":"압정 설치");
  if(e.flinch)p.push("풀죽음 유발");
  return p.join(" · ");
}
function moveSummary(mvKey){ const mo=MOVES[mvKey]; if(!mo)return mvKey; const d=moveDesc(mvKey);
  return `${TYPE_KO[mo.type]||""} · ${d||"변화"} · PP ${mo.pp}`; }
