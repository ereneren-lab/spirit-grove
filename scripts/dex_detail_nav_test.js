const { chromium } = require("playwright"); const path=require("path");
(async()=>{ const b=await chromium.launch();
  const p=await b.newPage({viewport:{width:430,height:760}});
  const errs=[]; p.on("pageerror",e=>errs.push(e.message));
  await p.goto("file://"+path.resolve(process.argv[2])); await p.waitForTimeout(700);
  const ok=(c,m)=>{ console.log((c?"  ✅ ":"  ❌ ")+m); if(!c)process.exitCode=1; };
  const r=await p.evaluate(()=>{ const S=window.SG,F=S.flow; S.setG(S.freshState()); const G=S.G();
    G.party=[S.makeMon("foxfire",10)];
    ["foxfire","emberwolf","sproutcat","glimmite"].forEach(id=>{G.seen.add(id);G.caught.add(id);});
    F.renderDex(); document.getElementById("dexOverlay").classList.add("active");
    const nav=window.SG.flow; // openDetail 첫 종
    // _dexNav 순서 확인용: 첫 열 수 있는 종 상세 열기
    return {rendered:true};
  });
  // 첫 카드 클릭 대신 openDetail 직접
  await p.evaluate(()=>window.SG.flow.openDetail("foxfire")); await p.waitForTimeout(150);
  const has=await p.evaluate(()=>!!document.querySelector("#dexDetailBody .dd-nav"));
  ok(has,"상세에 이전/다음 네비 행 존재");
  const title1=await p.evaluate(()=>document.getElementById("ddTitle").textContent);
  // 다음 버튼 클릭
  const nextBtn=await p.evaluate(()=>{ const btns=[...document.querySelectorAll("#dexDetailBody .dd-nav button")]; const nb=btns.find(b=>b.textContent.includes("다음")); return nb&&!nb.disabled; });
  ok(nextBtn,"다음 버튼 활성(첫 종)");
  await p.evaluate(()=>{ const btns=[...document.querySelectorAll("#dexDetailBody .dd-nav button")]; const nb=btns.find(b=>b.textContent.includes("다음")); nb&&nb.click(); });
  await p.waitForTimeout(150);
  const title2=await p.evaluate(()=>document.getElementById("ddTitle").textContent);
  ok(title1!==title2, `다음으로 다른 종 상세로 이동 (${title1} → ${title2})`);
  // 이전 버튼으로 돌아오기
  await p.evaluate(()=>{ const btns=[...document.querySelectorAll("#dexDetailBody .dd-nav button")]; const pb=btns.find(b=>b.textContent.includes("이전")); pb&&pb.click(); });
  await p.waitForTimeout(150);
  const title3=await p.evaluate(()=>document.getElementById("ddTitle").textContent);
  ok(title3===title1, `이전으로 원래 종 복귀 (${title3})`);
  ok(errs.length===0,"런타임 에러 0"+(errs.length?": "+errs.slice(0,2).join(" / "):""));
  console.log(process.exitCode?"\n❌ 실패":"\n🎉 도감 상세 이전/다음 통과");
  await b.close(); process.exit(process.exitCode||0);
})();
