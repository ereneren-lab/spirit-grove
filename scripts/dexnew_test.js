// 도감 신규 등록 메시지 회귀 테스트: 새 종을 처음 포획하면 "도감에 새로 등록" 안내가 뜨는가.
const { chromium } = require("playwright"); const path=require("path");
(async()=>{ const b=await chromium.launch();
  const p=await b.newPage({viewport:{width:430,height:760}});
  const errs=[]; p.on("pageerror",e=>errs.push(e.message));
  await p.goto("file://"+path.resolve(process.argv[2])); await p.waitForTimeout(900);
  const ok=(c,m)=>{ console.log((c?"  ✅ ":"  ❌ ")+m); if(!c)process.exitCode=1; };

  await p.evaluate(()=>{ const SG=window.SG,G=SG.freshState(); G.party=[SG.makeMon("emberwolf",20)]; G.pos={x:8,y:44}; G.items={ball:9}; SG.setG(G); SG.flow.enterMap(true); });
  await p.waitForTimeout(400);
  await p.evaluate(()=>{ const SG=window.SG; SG.G().foe=null; SG.flow.startEncounter(0.05); });
  await p.waitForTimeout(2200);
  const wasNew = await p.evaluate(()=>!window.SG.G().caught.has(window.SG.G().foe.id));
  await p.evaluate(()=>{ Math.random=()=>0.001; const G=window.SG.G(); if(G.foe)G.foe.hp=1; window.SG.flow.tryCatch(); });

  let saw=false;
  for(let i=0;i<30;i++){ await p.waitForTimeout(200);
    const m=await p.evaluate(()=>document.getElementById("battleMsg").textContent);
    if(m.includes("도감에 새로 등록")){ saw=true; break; }
    if(await p.evaluate(()=>document.getElementById("nickOverlay").classList.contains("active")))break;
  }
  ok(wasNew, "포획 대상이 도감 신규 종이다");
  ok(saw, "신규 포획 시 '도감에 새로 등록' 메시지가 뜬다");
  ok(errs.length===0, "런타임 에러 0");

  console.log(process.exitCode?"\n❌ 실패":"\n🎉 도감 신규 등록 통과");
  await b.close(); process.exit(process.exitCode||0);
})();
