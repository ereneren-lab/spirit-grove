// 배 이동(sail) 문 페이드 회귀 테스트: 섬↔해안 이동이 warpFade 암전으로 전환되고 맵이 정상 스왑.
const { chromium } = require("playwright"); const path=require("path");
(async()=>{ const b=await chromium.launch();
  const p=await b.newPage({viewport:{width:430,height:760}});
  const errs=[]; p.on("pageerror",e=>errs.push(e.message));
  await p.goto("file://"+path.resolve(process.argv[2])); await p.waitForTimeout(800);
  const ok=(c,m)=>{ console.log((c?"  ✅ ":"  ❌ ")+m); if(!c)process.exitCode=1; };

  await p.evaluate(()=>{ const S=window.SG; const G=S.freshState(); G.party=[S.makeMon("foxfire",10)]; S.setG(G); S.flow.enterMap(true); S.CONFIG.reduceMotion=false; });
  // 섬으로 항해
  await p.evaluate(()=>window.SG.flow.sailToIsle());
  let peak=0;
  for(let i=0;i<10;i++){ const o=await p.evaluate(()=>{ const e=document.getElementById("warpFade"); return e?parseFloat(getComputedStyle(e).opacity):0; }); if(o>peak)peak=o; await p.waitForTimeout(45); }
  await p.waitForTimeout(300);
  const s1=await p.evaluate(()=>window.SG.G().indoor);
  ok(peak>0.5, `항해 시 문 페이드 재생 (peak opacity=${peak.toFixed(2)})`);
  ok(s1==="isle", `섬 도착 (indoor=${s1})`);

  // 해안으로 복귀
  await p.evaluate(()=>window.SG.flow.sailToCoast());
  await p.waitForTimeout(700);
  const s2=await p.evaluate(()=>window.SG.G().indoor);
  ok(s2==="coast", `해안 도착 (indoor=${s2})`);

  ok(errs.length===0, "런타임 에러 0"+(errs.length?": "+errs.slice(0,3).join(" / "):""));
  console.log(process.exitCode?"\n❌ 실패":"\n🎉 배 이동 페이드 통과");
  await b.close(); process.exit(process.exitCode||0);
})();
