// 회귀 — UI/UX 마감: 오버레이 열림 시 mapHint 숨김, A버튼이 오버레이 안 커서 확정, .pick 버튼이 네이티브가 아님.
const { chromium } = require("playwright"); const path=require("path");
(async()=>{ const b=await chromium.launch();
  const p=await b.newPage({viewport:{width:430,height:760}});
  const errs=[]; p.on("pageerror",e=>errs.push(e.message));
  await p.goto("file://"+path.resolve(process.argv[2])); await p.waitForTimeout(700);
  const ok=(c,m)=>{ console.log((c?"  ✅ ":"  ❌ ")+m); if(!c)process.exitCode=1; };
  await p.evaluate(()=>{ const S=window.SG; S.setG(S.freshState()); const G=S.G(); G.party=[S.makeMon("foxfire",10)];
    ["foxfire","emberwolf","sproutcat"].forEach(id=>{G.seen.add(id);G.caught.add(id);});
    document.querySelectorAll(".view").forEach(v=>v.classList.remove("active")); document.getElementById("map").classList.add("active"); });

  // mapHint 숨김/복원
  await p.evaluate(()=>window.SG.flow.openOverlay("setOverlay")); await p.waitForTimeout(120);
  ok(await p.evaluate(()=>getComputedStyle(document.getElementById("mapHint")).visibility)==="hidden","오버레이 열림 시 mapHint 숨김");
  await p.evaluate(()=>window.SG.flow.closeOverlay("setOverlay")); await p.waitForTimeout(80);
  ok(await p.evaluate(()=>getComputedStyle(document.getElementById("mapHint")).visibility)==="visible","오버레이 닫힘 시 mapHint 복원");

  // A버튼: 도감 열면 오버레이에 커서가 생긴다(뒤 필드로 안 샘)
  await p.evaluate(()=>{ window.SG.flow.renderDex(); window.SG.flow.openOverlay("dexOverlay"); });
  await p.waitForTimeout(120);
  await p.evaluate(()=>document.getElementById("actBtn").click()); await p.waitForTimeout(100);
  ok(await p.evaluate(()=>!!document.querySelector("#dexOverlay .kbfocus")),"A버튼: 오버레이에 커서 생김");
  // 상세를 직접 열고, 다음 버튼에 커서를 둔 뒤 A로 확정되는지
  await p.evaluate(()=>window.SG.flow.openDetail("foxfire")); await p.waitForTimeout(150);
  const title1=await p.evaluate(()=>document.getElementById("ddTitle").textContent);
  await p.evaluate(()=>{ document.querySelectorAll(".overlay .kbfocus").forEach(b=>b.classList.remove("kbfocus"));
    const nb=[...document.querySelectorAll("#dexDetailBody .dd-nav .pick")].find(b=>b.textContent.includes("다음")); if(nb)nb.classList.add("kbfocus"); });
  await p.evaluate(()=>document.getElementById("actBtn").click()); await p.waitForTimeout(150);
  const title2=await p.evaluate(()=>document.getElementById("ddTitle").textContent);
  ok(title1!==title2, `A버튼이 커서(다음)를 확정해 이동 (${title1} → ${title2})`);

  // .pick 버튼이 네이티브가 아니다(테마 배경 지정됨)
  const pickBg=await p.evaluate(()=>{ const b=document.querySelector("#dexDetailBody .dd-nav .pick"); if(!b)return null; return getComputedStyle(b).backgroundColor; });
  ok(pickBg && pickBg!=="rgba(0, 0, 0, 0)" && pickBg!=="transparent", `.pick 버튼에 테마 배경 적용(네이티브 아님) (${pickBg})`);

  ok(errs.length===0,"런타임 에러 0"+(errs.length?": "+errs.slice(0,2).join(" / "):""));
  console.log(process.exitCode?"\n❌ 실패":"\n🎉 UI 마감 통과");
  await b.close(); process.exit(process.exitCode||0);
})();
