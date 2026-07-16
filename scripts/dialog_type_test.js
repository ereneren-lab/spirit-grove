// 대화창 타이핑 회귀 테스트: 글자가 한 글자씩 타이핑되고, 완료 시 ▼커서 + 서식(innerHTML) 적용.
// A/탭으로 즉시완성→다음 페이지. <b> 태그는 완료 시 서식으로(타이핑 중엔 평문).
const { chromium } = require("playwright"); const path=require("path");
(async()=>{ const b=await chromium.launch();
  const p=await b.newPage({viewport:{width:430,height:760}});
  const errs=[]; p.on("pageerror",e=>errs.push(e.message));
  await p.goto("file://"+path.resolve(process.argv[2])); await p.waitForTimeout(800);
  const ok=(c,m)=>{ console.log((c?"  ✅ ":"  ❌ ")+m); if(!c)process.exitCode=1; };
  const st=()=>p.evaluate(()=>{ const t=document.getElementById("dlgText"); return { text:t.textContent, html:t.innerHTML,
    cue:getComputedStyle(document.getElementById("dlgNext")).display, active:window.SG.flow.dialogActive() }; });

  await p.evaluate(()=>{ const S=window.SG; const G=S.freshState(); G.party=[S.makeMon("foxfire",5)]; S.setG(G); S.flow.enterMap(true);
    S.CONFIG.reduceMotion=false; S.CONFIG.textSpeed=1;
    S.flow.showDialog([{name:"안내인",text:"어서 와요, <b>여행자</b>여! 정령의 숲에 온 걸 환영해요."}, "다음 페이지입니다."]); });

  await p.waitForTimeout(150); const mid=await st();
  const fullLen=" 어서 와요, 여행자여! 정령의 숲에 온 걸 환영해요.".length;
  ok(mid.active && mid.text.length>0 && mid.text.length<fullLen, `타이핑 진행 중(부분 텍스트: "${mid.text}")`);
  ok(mid.cue==="none", "타이핑 중엔 ▼커서 숨김");

  await p.waitForTimeout(1600); const done=await st();
  ok(done.text.includes("환영해요"), "타이핑 완료(전체 텍스트)");
  ok(done.cue!=="none", "완료 시 ▼커서 표시");
  ok(done.html.includes("<b>"), "완료 시 <b> 서식 적용(태그 안 보임)");

  // 완성된 상태에서 advance → 다음 페이지 타이핑 시작
  await p.evaluate(()=>window.SG.flow.advanceDialog());
  await p.waitForTimeout(120); const pg2=await st();
  ok(pg2.active && pg2.text.length>0 && pg2.text.length<"다음 페이지입니다.".length+1 && pg2.text.length<="다음 페이지입니다.".length, `2페이지로 진행(타이핑 "${pg2.text}")`);

  // 타이핑 중 advance → 즉시완성(다음으로 안 넘어감)
  await p.evaluate(()=>window.SG.flow.advanceDialog());
  await p.waitForTimeout(60); const pg2b=await st();
  ok(pg2b.text==="다음 페이지입니다.", "타이핑 중 A → 즉시완성");
  // 완성 상태 advance → 닫힘
  await p.evaluate(()=>window.SG.flow.advanceDialog());
  await p.waitForTimeout(80); const closed=await p.evaluate(()=>window.SG.flow.dialogActive());
  ok(!closed, "마지막 페이지 후 대화 종료");

  ok(errs.length===0, "런타임 에러 0"+(errs.length?": "+errs.slice(0,3).join(" / "):""));
  console.log(process.exitCode?"\n❌ 실패":"\n🎉 대화 타이핑 통과");
  await b.close(); process.exit(process.exitCode||0);
})();
