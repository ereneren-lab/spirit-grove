// H5-C 회귀 — 챌린지 룰(하드코어·누즐록) + 뉴게임+.
// ⚠️ 위험: 누즐록은 정령을 영구 제거하고, 뉴게임+는 상태를 통째로 갈아엎는다 — 유지/초기화 경계가 틀리면
//    도감이나 정령이 날아간다. 이 테스트가 그 경계를 못박는다.
const { chromium } = require("playwright"); const path=require("path");
(async()=>{ const b=await chromium.launch();
  const p=await b.newPage({viewport:{width:430,height:760}});
  const errs=[]; p.on("pageerror",e=>errs.push(e.message));
  await p.goto("file://"+path.resolve(process.argv[2])); await p.waitForTimeout(800);
  await p.evaluate(()=>{ window.confirm=()=>true; });
  const ok=(c,m)=>{ console.log((c?"  ✅ ":"  ❌ ")+m); if(!c)process.exitCode=1; };

  // ── 하드코어: 전투 중 회복 금지 ──
  const hc=await p.evaluate(async()=>{ const S=window.SG,F=S.flow; S.setG(S.freshState()); const G=S.G();
    G.rules={hardcore:true,nuzlocke:false}; G.party=[S.makeMon("foxfire",20)]; G.active=0; G.inBattle=true; G.foe=S.makeMon("bunnyhop",10);
    G.items={potion:3}; G.party[0].hp=5;
    await F.battleUseItem({key:"potion",use:"heal",amt:20},G.party[0]);
    return { pot:G.items.potion, hp:G.party[0].hp }; });
  ok(hc.pot===3 && hc.hp===5, "하드코어: 전투 중 회복약이 막힌다(소모·회복 없음)");

  // ── 누즐록: 기절=영구 방생(대체 있을 때) + 마지막 정령 보호 ──
  const nz=await p.evaluate(async()=>{ const S=window.SG,F=S.flow; const out={};
    { S.setG(S.freshState()); const G=S.G(); G.rules={hardcore:false,nuzlocke:true};
      G.party=[S.makeMon("foxfire",20),S.makeMon("dewdrop",18)]; G.active=0; G.inBattle=true; G.foe=S.makeMon("bunnyhop",10); G.party[0].hp=0;
      await F.faintMine(); await new Promise(r=>setTimeout(r,40));
      out.gone=!G.party.some(m=>m.id==="foxfire"); out.grave=(G.graveyard||[]).length===1; }
    { S.setG(S.freshState()); const G=S.G(); G.rules={hardcore:false,nuzlocke:true}; G.box=[];
      G.party=[S.makeMon("foxfire",20)]; G.active=0; G.inBattle=true; G.foe=S.makeMon("bunnyhop",10); G.party[0].hp=0;
      await F.faintMine(); await new Promise(r=>setTimeout(r,40));
      out.lastProtected=G.party.some(m=>m.id==="foxfire"); }
    return out; });
  ok(nz.gone && nz.grave, "누즐록: 기절한 정령이 영구히 떠나고 묘지에 기록된다");
  ok(nz.lastProtected, "누즐록: 마지막 정령은 보호된다(소프트락 방지)");

  // ── 뉴게임+: 유지/초기화 경계 ──
  const ng=await p.evaluate(async()=>{ const S=window.SG,F=S.flow; S.setG(S.freshState()); const G=S.G();
    G.champion=true; G.badge=true; G.badges=["1","2","3","4"]; G.shadowDone=true; G.money=10000; G.ngPlus=0;
    G.caught=new Set(["foxfire","blazelion","gearclad"]); G.seen=new Set(["foxfire","blazelion","gearclad","wispkin"]);
    G.party=[S.makeMon("blazelion",55),S.makeMon("gearclad",50)]; G.box=[S.makeMon("psykit",30)];
    G.achClaimed=["first","champion"]; G.towerBest=12; G.rules={hardcore:true,nuzlocke:false}; G.defeated=new Set(["V","X","1"]);
    F.startNewGamePlus(); await new Promise(r=>setTimeout(r,200));
    const g=S.G();
    return { ng:g.ngPlus, cReset:!g.champion, bReset:!g.badge&&(g.badges||[]).length===0, sReset:!g.shadowDone, dReset:(g.defeated&&g.defeated.size)===0,
      dexKept:g.caught.has("blazelion")&&g.caught.size===3, partyKept:g.party.map(m=>m.id).join()==="blazelion,gearclad",
      boxKept:(g.box||[]).map(m=>m.id).join()==="psykit", achKept:(g.achClaimed||[]).includes("champion"),
      towerKept:g.towerBest===12, rulesKept:!!(g.rules&&g.rules.hardcore), money:g.money }; });
  ok(ng.ng===1, "뉴게임+ 회차가 1 증가한다");
  ok(ng.cReset && ng.bReset && ng.sReset && ng.dReset, "초기화: 챔피언·배지·스토리·격파목록");
  ok(ng.dexKept && ng.partyKept && ng.boxKept, "⭐유지: 도감·파티·보관함(정령 손실 X)");
  ok(ng.achKept && ng.towerKept && ng.rulesKept, "유지: 업적·타워 기록·챌린지 룰");
  ok(ng.money===5000, "소지금은 절반");

  ok(errs.length===0, "런타임 에러 0"+(errs.length?": "+errs.slice(0,2).join(" / "):""));
  console.log(process.exitCode?"\n❌ 실패":"\n🎉 챌린지 룰·뉴게임+ 통과");
  await b.close(); process.exit(process.exitCode||0);
})();
