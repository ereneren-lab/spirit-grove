// 실내 연속 이동 회귀 테스트: onArrived의 실내 블록이 continueMovement()를 안 불러
// 탭-이동이 한 칸 후 멈추던 버그(뚝뚝 끊김). 실내 탭-이동이 여러 칸 이어가는지 확인.
const { chromium } = require("playwright"); const path=require("path");
(async()=>{ const b=await chromium.launch();
  const p=await b.newPage({viewport:{width:430,height:760}});
  const errs=[]; p.on("pageerror",e=>errs.push(e.message));
  await p.goto("file://"+path.resolve(process.argv[2])); await p.waitForTimeout(900);
  const ok=(c,m)=>{ console.log((c?"  ✅ ":"  ❌ ")+m); if(!c)process.exitCode=1; };

  await p.evaluate(()=>{ const SG=window.SG,G=SG.freshState(); G.party=[SG.makeMon("emberwolf",30)];
    G.pos={x:8,y:44}; G.defeated=new Set(["7","a","1"]); SG.setG(G); SG.flow.enterMap(true); });
  await p.keyboard.press("ArrowUp"); await p.waitForTimeout(600);   // 체육관 입장
  const indoor = await p.evaluate(()=>window.SG.G().indoor);
  ok(indoor==="gym1", `체육관 입장 (indoor=${indoor})`);

  const r = await p.evaluate(async()=>{ const G=window.SG.G(); const sy=G.pos.y;
    window.SG.flow.walkTo(G.pos.x, G.pos.y-4);                      // 4칸 위로 탭-이동
    await new Promise(res=>setTimeout(res,2600));
    return { moved: sy - window.SG.G().pos.y }; });
  ok(r.moved>=3, `실내 탭-이동이 연속으로 여러 칸 이동 (moved=${r.moved}, 기대≈4)`);
  ok(errs.length===0, "런타임 에러 0");

  console.log(process.exitCode?"\n❌ 실패":"\n🎉 실내 연속 이동 통과");
  await b.close(); process.exit(process.exitCode||0);
})();
