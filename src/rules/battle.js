function stageMul(s){ s=s||0; return s>=0?(2+s)/2:2/(2-s); }
// 급소 확률 랭크표(본가). 기술의 highCrit·기합충전·초점렌즈가 단계를 올린다.
const CRIT_RATE=[1/16,1/8,1/4,1/3,1/2];
function critStage(att,move){ let c=(move&&move.highCrit?1:0)+((att&&att._critStage)||0);
  if(att&&att.held==="scopelens")c++;
  return clamp(c,0,4); }
function critChance(att,move){ return CRIT_RATE[critStage(att,move)]; }
function accMul(s){ s=s||0; return s>=0?(3+s)/3:3/(3-s); }   // 본가 명중/회피 랭크표(3/3 기준)
function newStages(){ return {atk:0,def:0,spd:0,spa:0,spDef:0,acc:0,eva:0}; }
const STAGE_KO={atk:"공격",def:"방어",spd:"속도",spa:"특수공격",spDef:"특수방어",acc:"명중률",eva:"회피율"};
const STAGE_ABBR={atk:"공",def:"방",spd:"속",spa:"특공",spDef:"특방",acc:"명중",eva:"회피"};
function resetStages(m){ if(m){ m.stages=newStages(); m._critStage=0; } }   // 급소 랭크도 휘발성(교체·전투종료로 사라짐)
// 다단히트 타수. 2~5회짜리는 본가처럼 가중치(2·3회 각 3/8, 4·5회 각 1/8) —
// 균등 분포로 굴리면 평균 타수가 3.5로 부풀어 위력이 과대평가된다. 그 외 범위는 균등.
function multiHits(mr){ const [lo,hi]=mr;
  if(lo===2&&hi===5){ const r=Math.random(); return r<0.375?2:r<0.75?3:r<0.875?4:5; }
  return ri(lo,hi); }
function effSpd(m){ let w=1;
  if(typeof G!=="undefined"&&G&&G.weather){ if(m.ability==="swiftswim"&&G.weather==="rain")w=2; else if(m.ability==="chlorophyll"&&G.weather==="sun")w=2; }
  const _hi=m.held&&HELD_ITEMS[m.held]; if(_hi&&_hi.spdx)w*=_hi.spdx;   // 구애스카프
  return m.spd*stageMul(m.stages.spd)*(m.status==="par"?0.5:1)*w; }
// 혼란 자해: 본가는 "위력 40 무타입 물리 기술을 자신에게" 맞는 것과 같다.
// 예전엔 maxHp의 고정 9%라, 방어가 높은 정령이 혼란에 강하다는 성질이 통째로 사라져 있었다.
function confusionSelfHit(m){
  const st=m.stages||{};
  const A=m.atk*stageMul(st.atk||0)*((m.status==="brn"&&m.ability!=="guts")?0.5:1);
  const D=Math.max(1, m.def*stageMul(st.def||0));
  const lvf=2*m.level/5+2;
  let dmg=Math.floor((lvf*40*(A/D))/9+2);
  dmg=Math.floor(dmg*rand(0.85,1.0));
  // 이 게임 데미지 공식은 본가와 상수가 달라(9로 나눔) 저레벨에서 종족값이 들쭉날쭉하면
  // 자해가 maxHp의 37%까지 튄다. 평균 ~16%는 본가 대역이라 두되 상한만 건다.
  return clamp(Math.max(1,dmg), 1, Math.max(1,Math.floor(m.maxHp*0.30))); }
function damage(att,def,move){ let eff=EFF[move.type][def.type]; if(def.type2&&def.type2!==def.type)eff*=EFF[move.type][def.type2];
  if(def.ability==="levitate" && move.type==="ground")eff=0;   // 부유: 땅 기술 무효
  const burnMul=(att.status==="brn" && att.ability!=="guts")?0.5:1;
  const isSpec=isSpecMove(move);   // ⚠️ 기술 단위 계열(moves.js의 moveCat). 타입을 직접 보지 말 것
  const A=isSpec?(att.spa||att.atk):att.atk, D=isSpec?(def.spDef||def.def):def.def;
  const aSt=att.stages||{}, dSt=def.stages||{};
  let crit=Math.random()<critChance(att,move)?1.5:1;   // 배율은 6세대 1.5배 유지(밸런스 보존)
  if(crit>1 && att.ability==="sniper")crit=2.25;        // 스나이퍼
  // 급소는 공격자의 마이너스 랭크 / 방어자의 플러스 랭크를 무시한다(본가 규칙)
  let aRank=isSpec?(aSt.spa||0):(aSt.atk||0), dRank=isSpec?(dSt.spDef||0):(dSt.def||0);
  if(crit>1){ if(aRank<0)aRank=0; if(dRank>0)dRank=0; }
  const aMul=stageMul(aRank)*(isSpec?1:burnMul); const dMul=stageMul(dRank);   // 화상은 물리 공격만 반감
  let abil=1;
  if(att.hp/att.maxHp<=1/3 && ((att.ability==="blaze"&&move.type==="fire")||(att.ability==="torrent"&&move.type==="water")||(att.ability==="overgrow"&&move.type==="grass"))) abil*=1.5;
  if(att.ability==="guts" && att.status) abil*=1.5;
  if(def.ability==="thickfat" && move.type==="fire") abil*=0.5;
  const _hi=att.held&&HELD_ITEMS[att.held];   // 지닌 물건 위력 배율(단일 출처 HELD_ITEMS): powerband/lifeorb/구애/타입부적
  if(_hi){ if(_hi.dmg)abil*=_hi.dmg; if(_hi.boost===move.type)abil*=1.2; }
  if(att.ability==="hugepower" && !isSpec) abil*=1.5;   // 순수한힘: 물리만
  const lvf=2*att.level/5+2; const stab=(move.type===att.type||(att.type2&&move.type===att.type2))?1.5:1;
  let wMul=1; if(typeof G!=="undefined"&&G&&G.weather){ if(G.weather==="sun"){ if(move.type==="fire")wMul=1.3; else if(move.type==="water")wMul=0.7; } else if(G.weather==="rain"){ if(move.type==="water")wMul=1.3; else if(move.type==="fire")wMul=0.7; } else if(G.weather==="sand"){ if(move.type==="rock")wMul=1.2; } else if(G.weather==="hail"){ if(move.type==="ice")wMul=1.2; } }
  let scrMul=1; if(typeof G!=="undefined"&&G&&G.screens){ const _ds=(def===G.foe)?"foe":"me"; const _sc=G.screens[_ds]; if(_sc){ if(isSpec&&_sc.light>0)scrMul=0.5; else if(!isSpec&&_sc.reflect>0)scrMul=0.5; } }
  let dmg=Math.floor((lvf*move.power*((A*aMul)/(D*dMul)))/9+2);
  dmg=Math.floor(dmg*eff*stab*crit*abil*wMul*scrMul*rand(0.85,1.0)); return {dmg:Math.max(1,dmg),eff,crit:crit>1}; }

/* ===== 상태 부여 규칙 (단일 출처) =====
   ⚠️ 메인 전투(applyStatus) · 듀오 배틀(dbStatus) · 밸런스 시뮬(battle_sim.js)이 **전부** 이걸 쓴다.
   예전엔 듀오 배틀이 자체 사본을 갖고 있어서 면역 판정이 통째로 빠져 있었다
   (독 타입이 중독되고, 맹독 카운터도 안 건드려 스테일 _tox로 보통 독이 맹독처럼 아팠다).
   면역 사유를 문자열로 돌려주므로 호출부가 각자 맞는 메시지를 낼 수 있다. */
function statusBlockReason(mon, st){
  if(!mon || mon.hp<=0) return "dead";
  if(mon.status) return "already";
  const ab={insomnia:"slp", immunity:"psn", waterveil:"brn"}[mon.ability];
  if(ab && ab===st) return "ability";
  const ty=STATUS_TYPE_IMMUNE[st];
  if(ty && (mon.type===ty || mon.type2===ty)) return "type";
  return null;
}
// 실제 필드 기록. ⚠️ psn을 걸 때마다 _tox를 다시 쓴다 — 치료 후 남은 옛 카운터가
// 새로 걸린 '보통 독'을 맹독으로 만들어버리기 때문.
function setStatusFields(mon, st, badly){
  mon.status=st;
  if(st==="slp") mon._slp=ri(1,3);
  if(st==="psn") mon._tox=badly?1:0;
}
