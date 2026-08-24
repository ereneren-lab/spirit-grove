// H5-D 회귀 — 접근성(글자 크기 · 색약 보정).
// ⚠️ 핵심: 설정은 <html> 클래스 토글로만 적용되어야 하고(전투/입력 로직 불변),
//   세이브 왕복에서 정확히 복원돼야 한다. 또 색약/글자크기 CSS 규칙이 실재해야 한다(공허한 통과 방지).
const { chromium } = require("playwright"); const path=require("path");
(async()=>{ const b=await chromium.launch();
  const p=await b.newPage({viewport:{width:430,height:760}});
  const errs=[]; p.on("pageerror",e=>errs.push(e.message));
  await p.goto("file://"+path.resolve(process.argv[2])); await p.waitForTimeout(800);
  const ok=(c,m)=>{ console.log((c?"  ✅ ":"  ❌ ")+m); if(!c)process.exitCode=1; };

  // ── 세그 컨트롤이 실재하고 applyA11y가 <html> 클래스를 토글한다 ──
  const seg=await p.evaluate(()=>{ const F=window.SG.flow;
    const fontSeg=document.querySelectorAll("#segFont button").length;
    const cbSeg=document.querySelectorAll("#segColorblind button").length;
    const r=document.documentElement;
    return { fontSeg, cbSeg,
      hasApply:typeof F.applyA11y==="function" };
  });
  ok(seg.fontSeg===3 && seg.cbSeg===2, `설정에 글자 크기(3)·색약(2) 세그가 있다 (${seg.fontSeg}/${seg.cbSeg})`);
  ok(seg.hasApply, "applyA11y가 노출된다");

  // ── 클릭 → CONFIG 반영 + <html> 클래스 적용 + 저장 ──
  const apply=await p.evaluate(()=>{ const F=window.SG.flow; const r=document.documentElement;
    const clickSeg=(id,v)=>{ const b=[...document.querySelectorAll("#"+id+" button")].find(x=>x.dataset.v===v); if(b)b.click(); };
    clickSeg("segFont","xl"); clickSeg("segColorblind","1");
    const afterXl={ xl:r.classList.contains("fs-xl"), cb:r.classList.contains("cb"), l:r.classList.contains("fs-l") };
    clickSeg("segFont","l");
    const afterL={ l:r.classList.contains("fs-l"), xl:r.classList.contains("fs-xl") };
    clickSeg("segFont","m"); clickSeg("segColorblind","0");
    const afterReset={ l:r.classList.contains("fs-l"), xl:r.classList.contains("fs-xl"), cb:r.classList.contains("cb") };
    return { afterXl, afterL, afterReset };
  });
  ok(apply.afterXl.xl && !apply.afterXl.l && apply.afterXl.cb, "더 크게+색약 켜면 html.fs-xl·html.cb 적용");
  ok(apply.afterL.l && !apply.afterL.xl, "크게로 바꾸면 fs-l만 남는다(상호 배타)");
  ok(!apply.afterReset.l && !apply.afterReset.xl && !apply.afterReset.cb, "보통·끔이면 접근성 클래스가 모두 사라진다");

  // ── 세이브 왕복 복원 ──
  const round=await p.evaluate(()=>{ const S=window.SG,F=S.flow; const r=document.documentElement;
    S.setG(S.freshState()); S.G().party=[S.makeMon("foxfire",5)];   // deserialize는 빈 파티면 조기 반환 → 실제 세이브처럼 파티를 채운다
    // 접근성 켜고 직렬화
    [...document.querySelectorAll("#segFont button")].find(x=>x.dataset.v==="xl").click();
    [...document.querySelectorAll("#segColorblind button")].find(x=>x.dataset.v==="1").click();
    const ser=F.serialize();
    // 초기화 후(클래스 제거) 복원
    [...document.querySelectorAll("#segFont button")].find(x=>x.dataset.v==="m").click();
    [...document.querySelectorAll("#segColorblind button")].find(x=>x.dataset.v==="0").click();
    const clearedXl=!r.classList.contains("fs-xl") && !r.classList.contains("cb");
    F.deserialize(ser);
    return { clearedXl, restoredXl:r.classList.contains("fs-xl"), restoredCb:r.classList.contains("cb"),
      hasCfg:!!(ser.cfg && ser.cfg.uf==="xl" && ser.cfg.cb===1) };
  });
  ok(round.clearedXl, "초기화하면 클래스가 지워진다(왕복 검증 준비)");
  ok(round.hasCfg, "직렬화 cfg에 uf/cb가 담긴다");
  ok(round.restoredXl && round.restoredCb, "⭐세이브 왕복 후 글자 크기·색약이 정확히 복원된다");

  // ── CSS 규칙 실재(공허한 통과 방지) ──
  const css=await p.evaluate(()=>{ const html=document.documentElement.outerHTML; return null; });
  const fs=require("fs"); const src=fs.readFileSync(process.argv[2],"utf8");
  ok(/html\.fs-xl\s+\.dlg-text/.test(src), "글자 크기 CSS(html.fs-xl .dlg-text)가 실재한다");
  ok(/html\.cb\s+\.hpfill\.hpcrit/.test(src) || /html\.cb .*hpcrit/.test(src), "색약 HP 줄무늬 CSS(html.cb …hpcrit)가 실재한다");
  ok(/html\.cb\s+\.type-tag/.test(src), "색약 타입 태그 외곽선 CSS가 실재한다");

  ok(errs.length===0, "런타임 에러 0"+(errs.length?": "+errs.slice(0,2).join(" / "):""));
  console.log(process.exitCode?"\n❌ 실패":"\n🎉 접근성(글자 크기·색약) 통과");
  await b.close(); process.exit(process.exitCode||0);
})();
