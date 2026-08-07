// 듀오 배틀 피격 연출 회귀 테스트: 데미지 시 대상 카드가 흔들린다(.dbhit) — 예전엔 로그 텍스트만.
const { chromium } = require("playwright"); const path=require("path");
(async()=>{ const b=await chromium.launch();
  const p=await b.newPage({viewport:{width:430,height:760}});
  const errs=[]; p.on("pageerror",e=>errs.push(e.message));
  await p.goto("file://"+path.resolve(process.argv[2])); await p.waitForTimeout(800);
  const ok=(c,m)=>{ console.log((c?"  ✅ ":"  ❌ ")+m); if(!c)process.exitCode=1; };

  await p.evaluate(()=>{ const S=window.SG; const G=S.freshState();
    G.party=[S.makeMon("skydrake",30), S.makeMon("crystalgon",30)]; G.active=0; S.setG(G); S.flow.enterMap(true); S.CONFIG.reduceMotion=false;
    S.flow.startDouble([["voltsnake",22],["seedbean",22]],"쌍둥이","DUO"); });
  await p.waitForTimeout(250);
  // 아군 2명: 기술 → 대상
  for(let a=0;a<2;a++){ const mv=await p.$("#dbMenu .dbmv"); if(mv){ await mv.click(); await p.waitForTimeout(180); }
    const tg=await p.$("#dbMenu .dbtg"); if(tg){ await tg.click(); await p.waitForTimeout(180); } }
  // 데미지 해결 중 .dbhit 흔들림 폴링
  let hitSeen=false;
  for(let i=0;i<35;i++){ if(await p.evaluate(()=>!!document.querySelector(".dbmon.dbhit"))){ hitSeen=true; break; } await p.waitForTimeout(80); }
  const dealt=await p.evaluate(()=>((document.getElementById("dbLog")||{}).innerText||"").includes("데미지"));

  ok(dealt, "듀오 턴 진행(데미지 발생)");
  ok(hitSeen, "피격 시 대상 카드 흔들림(.dbhit)");
  ok(errs.length===0, "런타임 에러 0"+(errs.length?": "+errs.slice(0,3).join(" / "):""));
  console.log(process.exitCode?"\n❌ 실패":"\n🎉 듀오 피격 연출 통과");
  await b.close(); process.exit(process.exitCode||0);
})();
