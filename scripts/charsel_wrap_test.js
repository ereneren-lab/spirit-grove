// UX 회귀 — 캐릭터 선택(4장) 캐러셀이 좁은 화면에서 잘리지 않는다.
// ⚠️ 유저 제보: "캐릭터 4개인데 3개만 보이고 옆으로 밀리지도 않는다." 원인: .pick-row가 flex:1 단일 행이라
//   4번째(숲의 아이 엘)가 뷰포트 밖으로 잘리고 스크롤도 안 됐다. 이 테스트가 4장 전부 보이고 클릭 가능함을 못박는다.
const { chromium } = require("playwright"); const path=require("path");
(async()=>{ const b=await chromium.launch();
  const ok=(c,m)=>{ console.log((c?"  ✅ ":"  ❌ ")+m); if(!c)process.exitCode=1; };
  const DIST=path.resolve(process.argv[2]);
  // 여러 좁은 폭에서 검사
  for(const W of [320,360,390,430]){
    const ctx=await b.newContext({viewport:{width:W,height:760},deviceScaleFactor:2,isMobile:true,hasTouch:true});
    const p=await ctx.newPage(); const errs=[]; p.on("pageerror",e=>errs.push(e.message));
    await p.goto("file://"+DIST); await p.waitForTimeout(500);
    await p.evaluate(()=>document.getElementById("newGameBtn").click()); await p.waitForTimeout(300);
    const r=await p.evaluate((vw)=>{ const cards=[...document.querySelectorAll("#charRow .pick-card")];
      const data=cards.map(el=>{ const rc=el.getBoundingClientRect(); const cx=rc.left+rc.width/2, cy=rc.top+rc.height/2;
        const top=document.elementFromPoint(cx,cy); return { inView:rc.left>=-1&&rc.right<=vw+1, reachable: top&&(el===top||el.contains(top)) }; });
      return { n:cards.length, clipped:data.filter(d=>!d.inView).length, unreachable:data.filter(d=>!d.reachable).length }; }, W);
    ok(r.n===4, `[${W}px] 캐릭터 카드 4장 렌더 (${r.n})`);
    ok(r.clipped===0, `[${W}px] 잘린 카드 0 (숲의 아이 엘 포함 전부 보임)`);
    ok(r.unreachable===0, `[${W}px] 클릭 도달 불가 카드 0`);
    ok(errs.length===0, `[${W}px] 런타임 에러 0`);
    await ctx.close();
  }
  // 스타터(3장)는 한 줄 유지되는지(넓은 폭 기준)
  const ctx=await b.newContext({viewport:{width:430,height:820},deviceScaleFactor:2,isMobile:true,hasTouch:true});
  const p=await ctx.newPage();
  await p.goto("file://"+DIST); await p.waitForTimeout(400);
  await p.evaluate(()=>document.getElementById("newGameBtn").click()); await p.waitForTimeout(250);
  await p.evaluate(()=>document.querySelector("#charRow .pick-card").click()); await p.waitForTimeout(120);
  await p.evaluate(()=>document.getElementById("confirmChar").click()); await p.waitForTimeout(400);
  const st=await p.evaluate((vw)=>{ const cs=[...document.querySelectorAll("#starterRow .pick-card")];
    return { n:cs.length, rows:[...new Set(cs.map(e=>Math.round(e.getBoundingClientRect().top)))].length,
      clipped:cs.filter(e=>{const r=e.getBoundingClientRect();return r.left<-1||r.right>vw+1;}).length }; }, 430);
  ok(st.n===3 && st.rows===1, `스타터 3장은 넓은 화면에서 한 줄 유지 (rows ${st.rows})`);
  ok(st.clipped===0, "스타터 카드도 잘리지 않는다");
  await ctx.close();

  console.log(process.exitCode?"\n❌ 실패":"\n🎉 캐릭터 선택 캐러셀 통과");
  await b.close(); process.exit(process.exitCode||0);
})();
