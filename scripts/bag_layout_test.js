// UX 회귀 — 세로모드 가방에서 '안 가진 것도 보기' 토글이 세로로 늘어나지 않는다.
// ⚠️ 버그: .bag-tab이 flex:1이라 세로 flex 컨테이너(세로모드 #bagBody)의 직계일 때 토글 버튼이
//   425px로 부풀어 큰 빈 상자를 만들고 아이템을 화면 밑으로 밀어냈다(QA 실측). flex:0 0 auto로 고정.
const { chromium } = require("playwright"); const path=require("path");
(async()=>{ const b=await chromium.launch();
  const ok=(c,m)=>{ console.log((c?"  ✅ ":"  ❌ ")+m); if(!c)process.exitCode=1; };
  const p=await b.newPage({viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true});
  const errs=[]; p.on("pageerror",e=>errs.push(e.message));
  await p.goto("file://"+path.resolve(process.argv[2])); await p.waitForTimeout(450);
  await p.evaluate(()=>document.getElementById("newGameBtn").click()); await p.waitForTimeout(150);
  await p.evaluate(()=>document.querySelector("#charRow .pick-card").click()); await p.waitForTimeout(80);
  await p.evaluate(()=>document.getElementById("confirmChar").click()); await p.waitForTimeout(150);
  await p.evaluate(()=>document.querySelector("#starterRow .pick-card").click()); await p.waitForTimeout(80);
  await p.evaluate(()=>document.getElementById("confirmStarter").click()); await p.waitForTimeout(250);
  await p.evaluate(()=>{ const S=window.SG,G=S.G(); G.party=[S.makeMon("blazelion",30)]; G.items={ball:20,greatball:10}; G.champion=true; S.flow.enterMap(true); const e=document.getElementById("storyOverlay"); if(e)e.classList.remove("active","show"); G.busy=false; });
  await p.waitForTimeout(250);
  const r=await p.evaluate(()=>{ window.SG.flow.renderBag(); document.getElementById("bagOverlay").classList.add("active");
    const body=document.getElementById("bagBody");
    const toggle=[...body.children].find(c=>/안 가진/.test(c.textContent));
    const items=[...body.querySelectorAll(".bag-item")];
    const toggleH=toggle?Math.round(toggle.getBoundingClientRect().height):null;
    // 토글과 첫 아이템 사이 간격(큰 빈 상자면 수백 px)
    let gap=null; if(toggle&&items.length){ gap=Math.round(items[0].getBoundingClientRect().top - toggle.getBoundingClientRect().bottom); }
    return { toggleH, itemN:items.length, gap, firstItem:(items[0]||{}).textContent?.slice(0,6) }; });
  ok(r.toggleH!=null && r.toggleH<60, `'안 가진 것도 보기' 토글이 정상 높이(${r.toggleH}px, <60) — 425px 부풀림 없음`);
  ok(r.itemN>=2, `아이템이 렌더된다 (${r.itemN})`);
  ok(r.gap!=null && r.gap<40, `토글 바로 아래 아이템이 붙는다(빈 상자 없음, gap ${r.gap}px)`);
  ok(errs.length===0, "런타임 에러 0"+(errs.length?": "+errs.slice(0,2).join(" / "):""));
  console.log(process.exitCode?"\n❌ 실패":"\n🎉 세로모드 가방 레이아웃 통과");
  await b.close(); process.exit(process.exitCode||0);
})();
