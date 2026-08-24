// H5-D 회귀 — 대사 자동 진행(손 안 대고 읽기).
// ⚠️ 핵심: 켰을 때만 스스로 넘어가고(끄면 사용자 입력을 기다린다), 끝 페이지의 콜백이 정확히 한 번
//   호출되며(중복/누락 없음), 세이브 왕복에 영속돼야 한다. 이 테스트가 그 경계를 못박는다.
const { chromium } = require("playwright"); const path=require("path");
(async()=>{ const b=await chromium.launch();
  const p=await b.newPage({viewport:{width:430,height:760}});
  const errs=[]; p.on("pageerror",e=>errs.push(e.message));
  await p.goto("file://"+path.resolve(process.argv[2])); await p.waitForTimeout(800);
  const ok=(c,m)=>{ console.log((c?"  ✅ ":"  ❌ ")+m); if(!c)process.exitCode=1; };

  // ── 세그 존재 ──
  const seg=await p.evaluate(()=>document.querySelectorAll("#segAutoAdv button").length);
  ok(seg===2, `설정에 대사 자동 진행 세그가 있다 (${seg})`);

  // ── 끔: 스스로 넘어가지 않는다 ──
  const off=await p.evaluate(async()=>{ const S=window.SG,F=S.flow; S.setG(S.freshState());
    S.CONFIG.reduceMotion=true; S.CONFIG.autoAdvance=false;
    F.showDialog([{name:"",text:"첫째 줄"},{name:"",text:"둘째 줄"},{name:"",text:"셋째 줄"}]);
    await new Promise(r=>setTimeout(r,1600));
    return { active:F.dialogActive(), text:(document.getElementById("dlgText")||{}).textContent }; });
  ok(off.active && /첫째/.test(off.text||""), "끄면 자동으로 넘어가지 않고 첫 장에 머문다");

  // 정리
  await p.evaluate(async()=>{ const F=window.SG.flow; while(F.dialogActive())F.advanceDialog(); });

  // ── 켬: 입력 없이 끝까지 진행 + 콜백 정확히 1회 ──
  const on=await p.evaluate(async()=>{ const S=window.SG,F=S.flow; S.setG(S.freshState());
    S.CONFIG.reduceMotion=true; S.CONFIG.autoAdvance=true; S.CONFIG.textSpeed=0.6;
    window.__cb=0;
    F.showDialog([{name:"",text:"가"},{name:"",text:"나"},{name:"",text:"다"}], ()=>{ window.__cb++; });
    // 클릭·키 입력 전혀 없이 대기
    const t0=Date.now(); while(F.dialogActive() && Date.now()-t0<8000){ await new Promise(r=>setTimeout(r,120)); }
    return { closed:!F.dialogActive(), cb:window.__cb, ms:Date.now()-t0 }; });
  ok(on.closed, `켜면 입력 없이 스스로 끝까지 진행·종료된다 (${on.ms}ms)`);
  ok(on.cb===1, `종료 콜백이 정확히 한 번 호출된다 (${on.cb})`);

  // ── 켬 상태에서도 수동 탭이 깨지지 않는다(조기 진행 가능) ──
  const manual=await p.evaluate(async()=>{ const S=window.SG,F=S.flow; S.setG(S.freshState());
    S.CONFIG.reduceMotion=true; S.CONFIG.autoAdvance=true; window.__cb2=0;
    F.showDialog([{name:"",text:"하나"},{name:"",text:"둘"}], ()=>{ window.__cb2++; });
    F.advanceDialog(); F.advanceDialog();   // 즉시 두 번 → 바로 닫힘
    await new Promise(r=>setTimeout(r,60));
    return { closed:!F.dialogActive(), cb:window.__cb2 }; });
  ok(manual.closed && manual.cb===1, "자동 진행 중에도 수동 탭으로 즉시 넘길 수 있고 콜백 중복 없음");

  // ── 세이브 왕복 ──
  const round=await p.evaluate(()=>{ const S=window.SG,F=S.flow; S.setG(S.freshState()); S.G().party=[S.makeMon("foxfire",5)];
    S.CONFIG.autoAdvance=true; const ser=F.serialize(); S.CONFIG.autoAdvance=false; F.deserialize(ser);
    return { aaSer:ser.cfg&&ser.cfg.aa, restored:S.CONFIG.autoAdvance }; });
  ok(round.aaSer===1 && round.restored===true, "대사 자동 진행이 세이브 왕복에 영속된다");

  ok(errs.length===0, "런타임 에러 0"+(errs.length?": "+errs.slice(0,2).join(" / "):""));
  console.log(process.exitCode?"\n❌ 실패":"\n🎉 대사 자동 진행 통과");
  await b.close(); process.exit(process.exitCode||0);
})();
