// 상단바 맞춤 회귀 — 진행 중반(칩 6개: 돈·설정·달리기·소리·도감·뱃지)에 좁은 폰에서도 안 잘린다.
//
// 왜 있나: 상단바 우측 그룹이 space-between 한 줄이라, 칩이 늘어나는 중반부에
//   360px 폰에서 뱃지 칩이 40px 잘렸다(390px iPhone도 중반엔 10px). 스크린샷 검수로 발견.
//   좁을수록 간격·패딩 축소 + 줄바꿈 안전장치로 고쳤고, 이 테스트가 재발을 막는다.
const { chromium } = require("playwright"); const path=require("path");
(async()=>{ const b=await chromium.launch();
  const errs=[];
  process.on("uncaughtException", async e=>{ console.log("❌ 예외:",e.message); await b.close(); process.exit(1); });
  const ok=(c,m)=>{ console.log((c?"  ✅ ":"  ❌ ")+m); if(!c)process.exitCode=1; };

  // 실기기 폭 대표값. 360=구형 안드로이드(가장 좁음), 390=iPhone, 414=큰 폰.
  for(const w of [360, 375, 390, 414]){
    const ctx=await b.newContext({viewport:{width:w,height:720}, deviceScaleFactor:2, hasTouch:true, isMobile:true});
    const p=await ctx.newPage(); p.on("pageerror",e=>errs.push(e.message));
    await p.goto("file://"+path.resolve(process.argv[2])); await p.waitForTimeout(700);
    // 진행 중반 상태: 칩 6개 전부 표시
    await p.evaluate(()=>{ const S=window.SG,F=S.flow; S.setG(S.freshState()); const G=S.G();
      G.party=[S.makeMon("foxfire",8)]; G.badges=["1","2"]; G.money=48000; F.enterMap(true);
      ["badgePill","moneyPill","settingsBtn"].forEach(id=>{ const el=document.getElementById(id); if(el)el.style.display=""; });
      F.updateBadgePill&&F.updateBadgePill(); });
    await p.waitForTimeout(300);
    const r=await p.evaluate(()=>{ const st=document.querySelector(".stage").getBoundingClientRect();
      const items=[...document.querySelectorAll(".top-right > *")].filter(el=>el.offsetParent!==null);
      let maxRight=0, minLeft=1e9;
      for(const el of items){ const b=el.getBoundingClientRect(); maxRight=Math.max(maxRight,b.right); minLeft=Math.min(minLeft,b.left); }
      const brandEl=document.querySelector(".brand h1");
      const brand=brandEl.getBoundingClientRect();
      const brandHidden=getComputedStyle(brandEl).display==="none";
      /* ⚠️ 같은 줄 판정은 top이 아니라 **세로 중심**으로 한다 — 칩(알약 24px)과 아이콘 버튼(30px)의
         높이가 달라 같은 줄이어도 top이 갈린다(그래서 예전 측정이 "4줄"로 보였다). */
      const rows=[...new Set(items.map(e=>{ const b=e.getBoundingClientRect(); return Math.round((b.top+b.bottom)/2); }))];
      return { shown:items.length, overflowR:Math.round(maxRight-st.right), overflowL:Math.round(st.left-minLeft),
               brandTwoLine: !brandHidden && brand.height>24,
               rows:rows.length, barH:Math.round(document.querySelector(".topbar").getBoundingClientRect().height) }; });
    ok(r.shown>=6, `w=${w}: 칩 6개 표시됨 (${r.shown})`);
    ok(r.overflowR<=0, `w=${w}: 우측 안 잘림 (여유 ${-r.overflowR}px)`);
    ok(r.overflowL<=0, `w=${w}: 좌측 안 잘림 (여유 ${-r.overflowL}px)`);
    ok(!r.brandTwoLine, `w=${w}: 브랜드 제목 한 줄 유지`);
    /* ⚠️ 단정을 "안 잘림"에서 **"세로에서도 1줄"** 로 올린다 — flex-wrap이 안전장치로 깔려 있어
       예전엔 모든 세로 폭에서 2줄로 접혀 상단바가 75~94px(스테이지 높이의 10~13%)를 먹는데도
       이 테스트는 초록이었다(전체 감사 F-11). 이제 그 부류가 조용히 통과하지 못한다. */
    ok(r.rows===1, `w=${w}: 칩이 한 줄에 들어간다 (${r.rows}줄 · 상단바 ${r.barH}px)`);
    await ctx.close();
  }
  ok(errs.length===0, "런타임 에러 0"+(errs.length?": "+errs.slice(0,2).join(" / "):""));
  console.log(process.exitCode?"\n❌ 실패":"\n🎉 상단바 맞춤 통과");
  await b.close(); process.exit(process.exitCode||0);
})();
