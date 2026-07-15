// 체육관 관장 전투 트리거 회귀 테스트: 실제 키보드로 체육관 입장 → 관장 타일로 이동 →
// 전투 발동 확인. (버그: 관장 타일 1~4가 walkable/트리거 목록에서 빠져 전투가 안 걸렸음)
const { chromium } = require("playwright"); const path=require("path");
(async()=>{ const b=await chromium.launch();
  const p=await b.newPage({viewport:{width:430,height:760},deviceScaleFactor:2});
  const errs=[]; p.on("pageerror",e=>errs.push(e.message));
  await p.goto("file://"+path.resolve(process.argv[2])); await p.waitForTimeout(900);
  const ok=(c,m)=>{ console.log((c?"  ✅ ":"  ❌ ")+m); if(!c)process.exitCode=1; };

  await p.evaluate(()=>{ const SG=window.SG, G=SG.freshState(); G.party=[SG.makeMon("emberwolf",30)];
    G.pos={x:8,y:44}; G.defeated=new Set(["7","a"]);   // gym1 입구 아래 + 가드 미리 격파
    SG.setG(G); SG.flow.enterMap(true); });
  const press=async()=>{ await p.keyboard.press("ArrowUp"); await p.waitForTimeout(360); };

  await press(); await p.waitForTimeout(400);           // 입구 G 타일 밟고 체육관 입장
  const g=await p.evaluate(()=>({indoor:window.SG.G().indoor,pos:window.SG.G().pos}));
  ok(g.indoor==="gym1", `체육관 입장 (indoor=${g.indoor}, pos=${g.pos.x},${g.pos.y})`);

  let trainer=null;
  for(let i=0;i<9;i++){ await press(); trainer=await p.evaluate(()=>{ const t=window.SG.G().trainer; return t?t.key:null; }); if(trainer)break; }
  ok(trainer==="1", `관장(1)에게 걸어가니 전투 발동 (trainer=${trainer})`);
  ok(errs.length===0, "런타임 에러 0");

  console.log(process.exitCode?"\n❌ 실패":"\n🎉 체육관 관장 전투 통과");
  await b.close(); process.exit(process.exitCode||0);
})();
