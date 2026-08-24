// 교배(육아방) 회귀 테스트 — canBreed 규칙 · baseForm · makeEgg/hatchEgg 유전(IV·성격·egg move).
// 왜: 교배 시스템은 완전 구현·연결돼 있으나(육아방 NPC + dayStep 부화) 회귀가 없어
//     IV/성격 엔진·타입·특성 변경 시 조용히 깨질 수 있었다. 이 테스트가 유전 불변식을 못박는다.
const { chromium } = require("playwright"); const path=require("path");
(async()=>{ const b=await chromium.launch();
  const p=await b.newPage({viewport:{width:430,height:760}});
  const errs=[]; p.on("pageerror",e=>errs.push(e.message));
  await p.goto("file://"+path.resolve(process.argv[2])); await p.waitForTimeout(800);
  const ok=(c,m)=>{ console.log((c?"  ✅ ":"  ❌ ")+m); if(!c)process.exitCode=1; };

  const r=await p.evaluate(()=>{
    const S=window.SG; S.setG(S.freshState());
    const mk=(id,lv,g,iv)=>{ const m=S.makeMon(id,lv); if(g)m.gender=g; if(iv)m.ivs=iv; return m; };

    // ── canBreed 규칙 ──
    const aM=mk("emberwolf",30,"M",{hp:31,atk:31,def:5,spa:5,spDef:5,spd:5});
    const cF=mk("blazelion",40,"F",{hp:2,atk:2,def:30,spa:30,spDef:30,spd:30});
    const sameGender=mk("emberwolf",30,"M");
    const diffLine=mk("shellow",20,"F");
    const legend=S.makeMon("aqualord",50);   // secret/legend → gender N
    const okSame=S.canBreed(aM,cF);
    const okSameGender=S.canBreed(aM,sameGender);
    const okDiffLine=S.canBreed(aM,diffLine);
    const okGenderless=S.canBreed(aM,legend);

    // ── baseForm ──
    const base3=S.baseForm("blazelion"), base3w=S.baseForm("krakentide"), base1=S.baseForm("dewdrop");

    // ── makeEgg / hatchEgg 유전 ──
    const egg=S.makeEgg(aM,cF);
    const baby=S.hatchEgg(egg);
    let inhCount=0; for(const k in baby.ivs){ if(baby.ivs[k]===aM.ivs[k]||baby.ivs[k]===cF.ivs[k]) inhCount++; }
    const eggMovesFromParents=(egg.moveInherit||[]).every(mv=> aM.moves.includes(mv)||cF.moves.includes(mv));

    // ── IV 유전이 실제로 부모를 표본한다(여러 번) ──
    let sampled=0, runs=30;
    for(let i=0;i<runs;i++){ const e=S.makeEgg(aM,cF); const bb=S.hatchEgg(e);
      let c=0; for(const k in bb.ivs){ if(bb.ivs[k]===aM.ivs[k]||bb.ivs[k]===cF.ivs[k])c++; }
      if(c>=2)sampled++; }

    // ── 변함의돌(everstone) 성격 고정 ──
    let lockHit=0, lockRuns=24;
    const dad=mk("emberwolf",30,"M"); dad.held="everstone"; dad.nature="brave";
    const mom=mk("blazelion",40,"F"); mom.nature="timid";
    for(let i=0;i<lockRuns;i++){ if(S.makeEgg(dad,mom).natureInherit==="brave")lockHit++; }
    const everstoneLocks=(lockHit===lockRuns);
    const everstoneIsHeld=!!(S.HELD_ITEMS&&S.HELD_ITEMS.everstone&&S.HELD_ITEMS.everstone.natureLock);

    return { okSame, okSameGender, okDiffLine, okGenderless, everstoneLocks, everstoneIsHeld,
      legendGender:legend.gender, base3, base3w, base1,
      eggIsEgg:!!egg.isEgg, eggName:egg.name, hatch:egg.hatch,
      babyId:baby.id, babyLv:baby.level, babyFriend:baby.friendship,
      inhCount, natureFromParent:(egg.natureInherit===aM.nature||egg.natureInherit===cF.nature),
      eggMoves:egg.moveInherit, eggMovesFromParents, sampledRatio:sampled/runs };
  });

  ok(r.okSame===true, "같은 라인·이성이면 교배 가능");
  ok(r.okSameGender===false, "같은 성별은 교배 불가");
  ok(r.okDiffLine===false, "다른 진화 라인은 교배 불가");
  ok(r.legendGender==="N" && r.okGenderless===false, `무성(전설)은 교배 불가 (성별 ${r.legendGender})`);
  ok(r.base3==="foxfire" && r.base3w==="shellow", `baseForm이 라인 최하단을 찾는다 (blazelion→${r.base3}, krakentide→${r.base3w})`);
  ok(r.base1==="dewdrop", `1단은 자기 자신이 baseForm (${r.base1})`);
  ok(r.eggIsEgg===true && r.eggName==="알", "makeEgg가 알(isEgg) 엔티티를 만든다");
  ok(r.hatch>=15 && r.hatch<=40, `알 부화 걸음수가 범위 내 (${r.hatch})`);
  ok(r.babyId==="foxfire" && r.babyLv===5, `알은 라인 최하단·Lv5로 부화 (${r.babyId} Lv${r.babyLv})`);
  ok(r.babyFriend>=50, `부화한 아기는 친밀도가 높다 (${r.babyFriend})`);
  ok(r.inhCount>=2, `IV가 부모에게서 여러 개 유전된다 (이 개체 ${r.inhCount}/6)`);
  ok(r.sampledRatio>=0.9, `IV 유전이 항상 부모를 표본한다 (${Math.round(r.sampledRatio*100)}%가 ≥2 유전)`);
  ok(r.natureFromParent===true, "성격이 부모 중 하나에게서 유전된다");
  ok(r.everstoneIsHeld===true, "변함의돌이 natureLock 지닌물건으로 정의됨");
  ok(r.everstoneLocks===true, "변함의돌을 지니면 그 정령 성격이 100% 유전(24/24)");
  ok((r.eggMoves||[]).length>0 && r.eggMovesFromParents, `egg move가 부모 기술에서 유전된다 (${(r.eggMoves||[]).join(",")||"없음"})`);
  ok(errs.length===0, "런타임 에러 0"+(errs.length?": "+errs.slice(0,3).join(" / "):""));
  console.log(process.exitCode?"\n❌ 실패":"\n🎉 교배(육아방) 통과");
  await b.close(); process.exit(process.exitCode||0);
})();
