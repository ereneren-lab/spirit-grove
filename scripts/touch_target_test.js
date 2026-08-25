// UX 회귀 — 상단 아이콘 버튼 터치 타깃(히트영역)이 이웃과 겹치지 않는다.
// ⚠️ 배경: .iconbtn::after가 44x44 히트영역을 주는데, 상단 두 버튼(runBtn·muteBtn)이 4px 간격이라
//   44px면 히트영역이 12~14px 겹쳐 '어느 버튼을 눌렀는지' 모호했다(오탭). ::after 폭을 34로 좁혀
//   겹침을 없앴다(세로 44는 유지). 이 테스트가 그 비겹침 + 최소 시각크기를 못박는다.
const { chromium } = require("playwright"); const path=require("path");
(async()=>{ const b=await chromium.launch();
  const ok=(c,m)=>{ console.log((c?"  ✅ ":"  ❌ ")+m); if(!c)process.exitCode=1; };
  const DIST=path.resolve(process.argv[2]);
  for(const W of [360,390,414,768]){
    const ctx=await b.newContext({viewport:{width:W,height:760},deviceScaleFactor:2,isMobile:W<600,hasTouch:W<600});
    const p=await ctx.newPage(); const errs=[]; p.on("pageerror",e=>errs.push(e.message));
    await p.goto("file://"+DIST); await p.waitForTimeout(450);
    const r=await p.evaluate(()=>{ const btns=[...document.querySelectorAll(".iconbtn")].filter(e=>e.offsetParent!==null);
      // ::after 실제 폭/높이 읽기
      const cs=getComputedStyle(document.querySelector(".iconbtn"), "::after");
      const HW=parseFloat(cs.width)/2||17, HH=parseFloat(cs.height)/2||22;
      const info=btns.map(e=>{ const rc=e.getBoundingClientRect(); return {id:e.id, vw:Math.round(rc.width), vh:Math.round(rc.height), cx:rc.left+rc.width/2, cy:rc.top+rc.height/2}; });
      let maxOverlap=0, pair=null;
      for(let i=0;i<info.length;i++)for(let j=i+1;j<info.length;j++){ const dx=Math.abs(info[i].cx-info[j].cx),dy=Math.abs(info[i].cy-info[j].cy);
        const ox=2*HW-dx, oy=2*HH-dy; if(ox>0&&oy>0&&ox>maxOverlap){ maxOverlap=ox; pair=info[i].id+"/"+info[j].id; } }
      return { n:info.length, minVis:Math.min(...info.map(x=>Math.min(x.vw,x.vh))), hitW:HW*2, hitH:HH*2, maxOverlap:Math.round(maxOverlap), pair }; });
    ok(r.hitH>=44, `[${W}] 히트영역 세로 ≥44px (${r.hitH})`);
    ok(r.maxOverlap<6, `[${W}] 이웃 히트영역 겹침 <6px (${r.maxOverlap}px${r.pair?" "+r.pair:""}) — 예전 12~14px에서 개선`);
    ok(r.minVis>=26, `[${W}] 아이콘 버튼 최소 시각크기 ≥26px (${r.minVis})`);
    ok(errs.length===0, `[${W}] 런타임 에러 0`);
    await ctx.close();
  }
  console.log(process.exitCode?"\n❌ 실패":"\n🎉 터치 타깃(히트영역 비겹침) 통과");
  await b.close(); process.exit(process.exitCode||0);
})();
