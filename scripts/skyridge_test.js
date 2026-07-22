// 신규 지역 회귀: 뇌명 봉우리(skyridge) + 고대 유적(ruins) + 불꽃 분화구(crater) — 인테리어·조우풀·진입·가드·서식지·저장.
const { chromium } = require("playwright"); const path=require("path");
(async()=>{ const b=await chromium.launch();
  const p=await b.newPage({viewport:{width:430,height:760}});
  const errs=[]; p.on("pageerror",e=>errs.push(e.message));
  await p.goto("file://"+path.resolve(process.argv[2])); await p.waitForTimeout(800);
  const ok=(c,m)=>{ console.log((c?"  ✅ ":"  ❌ ")+m); if(!c)process.exitCode=1; };

  const r=await p.evaluate(()=>{ const S=window.SG, F=S.flow; S.setG(S.freshState()); const G=S.G();
    const out={};
    // 인테리어 + 조우풀 + 서식지
    const I=F.INTERIORS.skyridge; out.interior=!!(I && I.id==="skyridge" && I.str && I.str.length===I.H);
    out.pool=(F.ENC_POOLS.skyridge||[]).slice();
    out.allExist=out.pool.every(id=>S.byId(id));
    out.habitat=(F.HABITAT_KO||{}).skyridge;
    out.findHint=F.findHint(S.byId("zapfinch")).indexOf("뇌명 봉우리")>=0;
    // 가드 트레이너
    out.guard=!!(S.TRAINERS.y && S.TRAINERS.y.team && S.TRAINERS.y.team.length>=3);
    out.guardInTiles=S.flow.GUARD_TILES.indexOf("y")>=0;
    // 진입 타일 O 오버월드에 존재 + 비보행
    F.enterMap(true); let foundO=false;
    for(let y=0;y<50&&!foundO;y++)for(let x=0;x<25;x++){ if(F.tileAt(x,y)==="O"){ foundO=true; out.oPos=x+","+y; out.oWalkable=F.walkable(x,y); break; } }
    out.foundO=foundO;
    return out; });
  ok(r.interior, "INTERIORS.skyridge 정의(str 높이 일치)");
  ok(r.pool.length>=6 && r.allExist, `조우풀 ${r.pool.length}종 전부 실존 (${r.pool.slice(0,4).join(",")}…)`);
  ok(r.habitat==="뇌명 봉우리" && r.findHint, "HABITAT_KO + findHint에 서식지 반영");
  ok(r.guard && r.guardInTiles, "폭풍지기 가드(TRAINERS.y) + GUARD_TILES 등록");
  ok(r.foundO && r.oWalkable===false, `진입 타일 O 존재·비보행(부딪혀 진입) (${r.oPos})`);

  // 조우: startSkyEncounter가 풀에서 뽑는다
  const enc=await p.evaluate(()=>{ const S=window.SG, F=S.flow; S.setG(S.freshState()); const G=S.G();
    G.party=[S.makeMon("voltrat",40)]; G.pos={x:8,y:9}; G.indoor="skyridge"; G.busy=false;
    const pool=new Set(F.ENC_POOLS.skyridge);
    F.startSkyEncounter();
    return { foe:S.G().foe&&S.G().foe.id, inPool:S.G().foe&&pool.has(S.G().foe.id) }; });
  ok(enc.inPool, `startSkyEncounter가 봉우리 풀에서 조우 (${enc.foe})`);

  // 저장 왕복
  const save=await p.evaluate(()=>{ const S=window.SG, F=S.flow; S.setG(S.freshState()); const G=S.G();
    G.party=[S.makeMon("voltrat",40)]; G.skySeen=true;
    const okd=F.deserialize(JSON.parse(JSON.stringify(F.serialize())));
    return { okd, round:!!S.G().skySeen }; });
  ok(save.okd && save.round, "skySeen 세이브/로드 보존");

  /* ===== 고대 유적(ruins) — 봉우리와 병렬 검증 ===== */
  const ru=await p.evaluate(()=>{ const S=window.SG, F=S.flow; S.setG(S.freshState()); const G=S.G();
    const I=F.INTERIORS.ruins; const pool=(F.ENC_POOLS.ruins||[]);
    G.party=[S.makeMon("boulderin",30)]; G.pos={x:8,y:9}; G.indoor="ruins"; G.busy=false;
    const ps=new Set(pool); F.startRuinsEncounter();
    F.enterMap(true); let oPos=null,oWalk=null;
    for(let y=0;y<50&&!oPos;y++)for(let x=0;x<25;x++){ if(F.tileAt(x,y)==="z"){ oPos=x+","+y; oWalk=F.walkable(x,y); break; } }
    return { interior:!!(I&&I.id==="ruins"&&I.str.length===I.H), poolN:pool.length, allExist:pool.every(id=>S.byId(id)),
             habitat:(F.HABITAT_KO||{}).ruins, findHint:F.findHint(S.byId("thumplord")).indexOf("고대 유적")>=0,
             guard:!!(S.TRAINERS.h&&S.TRAINERS.h.team&&S.flow.GUARD_TILES.indexOf("h")>=0),
             encInPool:S.G().foe&&ps.has(S.G().foe.id), foe:S.G().foe&&S.G().foe.id, oPos, oWalk }; });
  ok(ru.interior && ru.poolN>=6 && ru.allExist, `유적 인테리어+조우풀 ${ru.poolN}종 실존`);
  ok(ru.habitat==="고대 유적" && ru.findHint, "유적 HABITAT_KO + findHint 반영");
  ok(ru.guard, "유적 수호자(TRAINERS.h) + GUARD_TILES 등록");
  ok(ru.oPos && ru.oWalk===false, `유적 진입 타일 z 존재·비보행 (${ru.oPos})`);
  ok(ru.encInPool, `startRuinsEncounter가 유적 풀에서 조우 (${ru.foe})`);

  const rs=await p.evaluate(()=>{ const S=window.SG, F=S.flow; S.setG(S.freshState()); const G=S.G();
    G.party=[S.makeMon("boulderin",30)]; G.ruinsSeen=true;
    const okd=F.deserialize(JSON.parse(JSON.stringify(F.serialize()))); return { okd, round:!!S.G().ruinsSeen }; });
  ok(rs.okd && rs.round, "ruinsSeen 세이브/로드 보존");

  /* ===== 미니보스 — 진화전용(NO_WILD) 종의 대체 획득 경로 ===== */
  const boss=await p.evaluate(()=>{ const S=window.SG, F=S.flow; S.setG(S.freshState()); const G=S.G();
    G.party=[S.makeMon("voltrat",44)]; G.busy=false;
    // 보스 타일 @가 각 인테리어 str에 있고, 스코프 조우 함수가 해당 종을 낸다
    const skyStr=F.INTERIORS.skyridge.str.join(""), ruStr=F.INTERIORS.ruins.str.join("");
    const skyHasAt=skyStr.indexOf("@")>=0, ruHasAt=ruStr.indexOf("@")>=0;
    G.indoor="skyridge"; F.startSkyBoss(); const skyFoe=S.G().foe&&S.G().foe.id;
    // done-flag 세이브 왕복
    S.setG(S.freshState()); const G2=S.G(); G2.party=[S.makeMon("voltrat",44)]; G2.skyBossDone=true; G2.ruinsBossDone=true;
    const okd=F.deserialize(JSON.parse(JSON.stringify(F.serialize())));
    const savedSky=!!S.G().skyBossDone, savedRu=!!S.G().ruinsBossDone;
    S.setG(S.freshState()); const G3=S.G(); G3.party=[S.makeMon("voltrat",44)]; G3.busy=false; G3.indoor="ruins"; F.startRuinsBoss(); const ruFoe=S.G().foe&&S.G().foe.id;
    return { skyHasAt, ruHasAt, skyFoe, ruFoe, okd, savedSky, savedRu,
             skyNoWild:F.findHint(S.byId("skydrake")).indexOf("숲")<0, megaExists:!!S.byId("megalith") }; });
  ok(boss.skyHasAt && boss.skyFoe==="skydrake", `봉우리 보스 @ 타일 + 천공룡 조우 (${boss.skyFoe})`);
  ok(boss.ruHasAt && boss.ruFoe==="megalith", `유적 보스 @ 타일 + 거암왕 조우 (${boss.ruFoe})`);
  ok(boss.okd && boss.savedSky && boss.savedRu, "skyBossDone/ruinsBossDone 세이브/로드 보존");
  ok(boss.skyNoWild && boss.megaExists, "보스 종은 진화전용(야생 미출현) — 보스가 유일 야생 획득 경로");

  /* ===== 불꽃 분화구(crater) — 불 타입 전용 서식지 ===== */
  const cr=await p.evaluate(()=>{ const S=window.SG, F=S.flow; S.setG(S.freshState()); const G=S.G();
    const I=F.INTERIORS.crater; const pool=(F.ENC_POOLS.crater||[]);
    G.party=[S.makeMon("cindercat",30)]; G.pos={x:7,y:9}; G.indoor="crater"; G.busy=false;
    const ps=new Set(pool); F.startCraterEncounter();
    F.enterMap(true); let oPos=null,oWalk=null;
    for(let y=0;y<50&&!oPos;y++)for(let x=0;x<25;x++){ if(F.tileAt(x,y)==="^"){ oPos=x+","+y; oWalk=F.walkable(x,y); break; } }
    // 조우풀이 실제로 '불 서식지'인지 — 전 종이 불 타입이어야 테마가 거짓말이 아니다
    const allFire=pool.every(id=>{ const d=S.byId(id); return d && (d.type==="fire"||d.type2==="fire"); });
    // 인테리어 폭 15 이하(넘으면 화면 밖으로 잘린다) + str 높이 일치
    const shape=!!(I && I.id==="crater" && I.str.length===I.H && I.str.every(r=>r.length===I.W) && I.W<=15);
    return { shape, poolN:pool.length, allExist:pool.every(id=>S.byId(id)), allFire,
             habitat:(F.HABITAT_KO||{}).crater, findHint:F.findHint(S.byId("pyrewolf")).indexOf("불꽃 분화구")>=0,
             guard:!!(S.TRAINERS["*"]&&S.TRAINERS["*"].team&&S.flow.GUARD_TILES.indexOf("*")>=0),
             encInPool:S.G().foe&&ps.has(S.G().foe.id), foe:S.G().foe&&S.G().foe.id, oPos, oWalk }; });
  ok(cr.shape && cr.poolN>=6 && cr.allExist, `분화구 인테리어(폭\u2264 15)+조우풀 ${cr.poolN}종 실존`);
  ok(cr.allFire, "조우풀 전원이 불 타입 — '불 서식지'가 실제로 불이다");
  ok(cr.habitat==="불꽃 분화구" && cr.findHint, "분화구 HABITAT_KO + findHint 반영");
  ok(cr.guard, "화산 감시자(TRAINERS['*']) + GUARD_TILES 등록");
  ok(cr.oPos && cr.oWalk===false, `분화구 진입 타일 ^ 존재\u00b7비보행 (${cr.oPos})`);
  ok(cr.encInPool, `startCraterEncounter가 분화구 풀에서 조우 (${cr.foe})`);

  const cs=await p.evaluate(()=>{ const S=window.SG, F=S.flow; S.setG(S.freshState()); const G=S.G();
    G.party=[S.makeMon("cindercat",30)]; G.craterSeen=true;
    const okd=F.deserialize(JSON.parse(JSON.stringify(F.serialize()))); return { okd, round:!!S.G().craterSeen }; });
  ok(cs.okd && cs.round, "craterSeen 세이브/로드 보존");

  ok(errs.length===0, "런타임 에러 0"+(errs.length?": "+errs.slice(0,3).join(" / "):""));
  console.log(process.exitCode?"\n❌ 실패":"\n🎉 신규 지역(봉우리·유적·분화구) 통과");
  await b.close(); process.exit(process.exitCode||0);
})();
