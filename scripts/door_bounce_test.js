// 문 튕김 버그 회귀 테스트: 위에서 아래키를 누른 채 상점/체육관 문에 들어가면,
// 입장 직후 heldDir 관성으로 출구 타일을 밟아 바로 튕겨나오던 버그. 워프 시 heldDir 정리+입력잠금으로 방지.
// (구코드: 입장→continueMovement가 아래로 이동→출구→퇴장, indoor=null. 신코드: shop 유지.)
const { chromium } = require("playwright"); const path=require("path");
(async()=>{ const b=await chromium.launch();
  const p=await b.newPage({viewport:{width:430,height:760}});
  const errs=[]; p.on("pageerror",e=>errs.push(e.message));
  await p.goto("file://"+path.resolve(process.argv[2])); await p.waitForTimeout(900);
  const ok=(c,m)=>{ console.log((c?"  ✅ ":"  ❌ ")+m); if(!c)process.exitCode=1; };

  // 상점 문 S(4,26) 바로 위(4,25)에 배치. 인카운터 방지 위해 repel.
  await p.evaluate(()=>{ const SG=window.SG,G=SG.freshState(); G.party=[SG.makeMon("emberwolf",20)];
    G.pos={x:4,y:25}; G.repel=999; SG.setG(G); SG.flow.enterMap(true); });
  await p.waitForTimeout(300);

  // 아래키를 누른 채로 문으로 입장 (heldDir="down" 유지). Playwright keydown은 자동 리핏 없음.
  await p.keyboard.down("ArrowDown");
  // 입장 중 문 페이드(#warpFade) opacity 피크 관측
  let fadePeak=0;
  for(let i=0;i<16;i++){ const o=await p.evaluate(()=>{ const e=document.getElementById("warpFade"); return e?parseFloat(getComputedStyle(e).opacity):0; }); if(o>fadePeak)fadePeak=o; await p.waitForTimeout(45); }
  await p.waitForTimeout(700);   // 입장 + (버그라면) 튕김이 일어날 충분한 시간
  await p.keyboard.up("ArrowDown");
  await p.waitForTimeout(200);
  ok(fadePeak>0.5, `문 진입 시 검정 페이드 재생 (peak opacity=${fadePeak.toFixed(2)})`);

  const st=await p.evaluate(()=>({indoor:window.SG.G().indoor, pos:window.SG.G().pos}));
  ok(st.indoor==="shop", `아래키 홀드로 상점 입장 유지 — 튕겨나오지 않음 (indoor=${st.indoor})`);
  ok(!(st.pos.x===4&&st.pos.y===6), `출구 타일(4,6)로 걸어나가지 않음 (pos=${st.pos.x},${st.pos.y})`);

  ok(errs.length===0, "런타임 에러 0"+(errs.length?": "+errs.slice(0,3).join(" / "):""));
  console.log(process.exitCode?"\n❌ 실패":"\n🎉 문 튕김 방지 통과");
  await b.close(); process.exit(process.exitCode||0);
})();
