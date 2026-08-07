// 출신지 감사 — **캐릭터 넷이 서로 다른 곳에서 시작해 서로 다른 자리로 나오는가.**
//
// 왜 있나
//   유저 결정으로 "캐릭터마다 다른 시작"을 넣었다. 지금까지 넷은 같은 집에서 시작했다.
//   ⚠️ 오버월드 지역을 나누는 방식은 **불가능**했다 — 난이도가 y 하나로 결정되는데
//      (마을 Lv5 · 초원 Lv7 · 숲 Lv13) 스타터가 Lv5라 숲 이상에서 출발하면 즉사한다.
//      → 출신지를 각자의 인테리어로 주고 **오버월드의 서로 다른 지점**으로 내보낸다.
//   이 구조는 좌표 3곳(HOME_AT · HOME_POS · 인테리어 exits)이 **서로 맞아야** 성립한다.
//   하나만 어긋나도 "엉뚱한 데서 시작"하거나 "나왔다가 못 돌아가는" 상태가 되는데,
//   화면을 안 보면 조용히 지나간다 → 넷 전부를 실제로 굴려서 잰다.
//
// ⚠️ 캐릭터 선택 카드 순서 = styleIdx 순서다. 카드가 재정렬되면 이 테스트가 먼저 걸린다.
const { chromium } = require("playwright"); const path=require("path");
(async()=>{
  const b=await chromium.launch();
  let fail=0; const ok=(c,m)=>{ console.log((c?"  ✅ ":"  ❌ ")+m); if(!c)fail=1; };
  const WANT=[{home:"home_rio",name:"정령 연구소",pos:"5,48"},
              {home:"home_mina",name:"길가 야영지",pos:"17,44"},
              {home:"home_tori",name:"언덕 농가",pos:"10,42"},
              {home:"home_el",name:"숲가 빈터",pos:"3,45"}];
  for(let i=0;i<4;i++){
    const p=await b.newPage({viewport:{width:430,height:760}});
    const errs=[]; p.on("pageerror",e=>errs.push(e.message));
    await p.goto("file://"+path.resolve(process.argv[2])); await p.waitForTimeout(900);
    await p.click("#newGameBtn").catch(()=>{}); await p.waitForTimeout(400);
    await p.locator("#charRow .pick-card").nth(i).click().catch(()=>{}); await p.waitForTimeout(250);
    await p.click("#confirmChar").catch(()=>{}); await p.waitForTimeout(400);
    await p.locator("#starterRow .pick-card").first().click().catch(()=>{}); await p.waitForTimeout(250);
    await p.click("#confirmStarter").catch(()=>{}); await p.waitForTimeout(800);
    for(let k=0;k<12;k++){ if(await p.locator("#storySkip").isVisible().catch(()=>false)){ await p.click("#storySkip").catch(()=>{}); break; } await p.click("#storyNext").catch(()=>{}); await p.waitForTimeout(150); }
    await p.waitForTimeout(1100);
    const w=WANT[i];
    console.log(`\n[${i}] ${w.name}`);
    // 도입 대사를 모아본다
    const seen=[];
    for(let k=0;k<40;k++){ const st=await p.evaluate(()=>{ const G=window.SG.G(); const box=document.getElementById("dialogBox");
        const on=box&&box.classList.contains("show");
        const t=on?(document.getElementById("dlgName").textContent+"|"+document.getElementById("dlgText").textContent.slice(0,24)):null;
        if(on)window.SG.flow.advanceDialog();
        return {busy:!!G.busy,dlg:!!on,t,indoor:G.indoor}; });
      if(st.t)seen.push(st.t);
      if(!st.busy&&!st.dlg)break; await p.waitForTimeout(160); }
    const st=await p.evaluate(()=>({indoor:window.SG.G().indoor}));
    ok(st.indoor===w.home, `출신지에서 시작한다 (indoor=${st.indoor})`);
    const names=[...new Set(seen.map(x=>x.split("|")[0]).filter(Boolean))];
    ok(names.length>0, `도입 대사 화자: ${names.join(" / ")||"(없음)"}`);
    // 밖으로
    await p.evaluate(()=>{ window.SG.flow.exitInterior(); }); await p.waitForTimeout(900);
    const out=await p.evaluate(()=>{ const G=window.SG.G(); return {pos:G.pos.x+","+G.pos.y, indoor:G.indoor}; });
    ok(!out.indoor && out.pos===w.pos, `오버월드 ${w.pos} 로 나온다 (실제 ${out.pos})`);
    // 다시 들어가진다
    const back=await p.evaluate(()=>{ const G=window.SG.G(),F=window.SG.flow;
      F.walkTo(G.pos.x,G.pos.y); return null; });
    await p.keyboard.press("ArrowUp"); await p.waitForTimeout(1100);
    const re=await p.evaluate(()=>window.SG.G().indoor);
    ok(re===w.home, `위로 부딪히면 다시 들어가진다 (indoor=${re})`);
    ok(errs.length===0, `런타임 에러 0 (${errs.length}${errs.length?": "+errs[0].slice(0,60):""})`);
    await p.close();
  }
  await b.close();
  console.log(fail?"\n❌ 실패":"\n🎉 네 출신지 전부 통과");
  process.exit(fail);
})();
