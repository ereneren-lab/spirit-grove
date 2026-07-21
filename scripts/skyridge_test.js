// 신규 지역 '뇌명 봉우리(skyridge)' 회귀: 인테리어·조우풀·진입·가드·서식지·저장.
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

  ok(errs.length===0, "런타임 에러 0"+(errs.length?": "+errs.slice(0,3).join(" / "):""));
  console.log(process.exitCode?"\n❌ 실패":"\n🎉 뇌명 봉우리 통과");
  await b.close(); process.exit(process.exitCode||0);
})();
