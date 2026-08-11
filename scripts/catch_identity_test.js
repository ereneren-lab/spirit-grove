// 포획/세이브 정령 정체성 보존 회귀 테스트:
//  1) 야생 정령을 잡으면 그 정령 그대로(샤이니·IV·성격·성별·기술 보존). 예전엔 makeMon로 새로 만들어 다 사라짐.
//  2) 세이브/로드가 커스텀 기술셋·샤이니·IV를 보존.
const { chromium } = require("playwright"); const path=require("path");
(async()=>{ const b=await chromium.launch({args:["--autoplay-policy=no-user-gesture-required"]});
  const p=await b.newPage({viewport:{width:430,height:760}});
  const errs=[]; p.on("pageerror",e=>errs.push(e.message));
  await p.goto("file://"+path.resolve(process.argv[2])); await p.waitForTimeout(800);
  const ok=(c,m)=>{ console.log((c?"  ✅ ":"  ❌ ")+m); if(!c)process.exitCode=1; };

  // 1) 샤이니 야생 정령 포획 → 파티에 샤이니 그대로
  await p.evaluate(()=>{ const S=window.SG; const G=S.freshState();
    G.party=[S.makeMon("emberwolf",20)]; G.active=0; G.inBattle=true; G.trainer=null; G.items.ball=9;
    const foe=S.makeMon("bunnyhop",8); foe.hp=1; foe.shiny=true; foe.nature="brave"; foe.ivs={hp:31,atk:31,def:31,spa:31,spDef:31,spd:31}; foe.gender="F";
    G.foe=foe; S.setG(G);
    document.querySelectorAll(".view").forEach(v=>v.classList.remove("active")); document.getElementById("battle").classList.add("active");
    S.flow.setupBattleUI(); S.CONFIG.reduceMotion=true; Math.random=()=>0.01; S.flow.tryCatch(); });
  let cap=null;
  for(let i=0;i<45;i++){ const r=await p.evaluate(()=>{ const g=window.SG.G(); const c=g.party[1]; return c?{shiny:c.shiny,nature:c.nature,ivhp:c.ivs&&c.ivs.hp,gender:c.gender,id:c.id}:null; }); if(r){cap=r;break;} await p.waitForTimeout(150); }
  ok(cap && cap.id==="bunnyhop", `포획된 정령 파티 합류 (${cap&&cap.id})`);
  ok(cap && cap.shiny===true, `샤이니 보존 (shiny=${cap&&cap.shiny})`);
  ok(cap && cap.nature==="brave" && cap.ivhp===31 && cap.gender==="F", `개성/성격/성별 보존 (nature=${cap&&cap.nature}, ivHP=${cap&&cap.ivhp}, gen=${cap&&cap.gender})`);

  // 2) 세이브/로드 — 커스텀 기술셋 + 샤이니 + IV 보존
  const round=await p.evaluate(()=>{ const S=window.SG; const G=S.freshState();
    const m=S.makeMon("sparkmouse",20); m.shiny=true; m.moves=["tackle","confuse","spark","bolt"]; m.pp={tackle:5,confuse:20,spark:10,bolt:8}; m.ivs={hp:20,atk:21,def:22,spa:23,spDef:24,spd:25};
    G.party=[m]; S.setG(G);
    const ser=S.flow.serialize(); S.flow.deserialize(JSON.parse(JSON.stringify(ser)));
    const r=S.G().party[0]; return { shiny:r.shiny, moves:r.moves.join(","), pp:r.pp.tackle, ivatk:r.ivs.atk }; });
  ok(round.shiny===true, `세이브/로드 샤이니 보존 (${round.shiny})`);
  ok(round.moves==="tackle,confuse,spark,bolt", `커스텀 기술셋 보존 (${round.moves})`);
  ok(round.pp===5, `기술 PP 보존 (tackle PP=${round.pp})`);
  ok(round.ivatk===21, `IV 보존 (atk IV=${round.ivatk})`);

  ok(errs.length===0, "런타임 에러 0"+(errs.length?": "+errs.slice(0,3).join(" / "):""));
  console.log(process.exitCode?"\n❌ 실패":"\n🎉 정령 정체성 보존 통과");
  await b.close(); process.exit(process.exitCode||0);
})();
