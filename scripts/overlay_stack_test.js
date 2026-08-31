// 회귀 — 오버레이를 겹쳐 열었을 때 취소(Esc/B)가 "가장 최근에 연 최상단"만 닫는다.
//  유저 관점: PC(정령 관리) 위에 요약창을 겹쳐 열고 뒤로가기를 누르면, 예전엔 뒤의 PC가 먼저 닫혀
//  화면상 아무 변화가 없어 "버튼 먹통"으로 보였고, 키보드 Esc는 한 번에 둘 다 닫혀 맵으로 튀었다.
const { chromium } = require("playwright"); const path = require("path");
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 430, height: 760 } });
  const errs = []; p.on("pageerror", e => errs.push(e.message));
  await p.goto("file://" + path.resolve(process.argv[2])); await p.waitForTimeout(700);
  const ok = (c, m) => { console.log((c ? "  ✅ " : "  ❌ ") + m); if (!c) process.exitCode = 1; };

  const active = id => p.evaluate(i => document.getElementById(i).classList.contains("active"), id);

  // 스택으로 겹쳐 열기: pcOverlay(뒤) → summaryOverlay(위)
  const top = await p.evaluate(() => {
    const F = window.SG.flow; window.SG.setG(window.SG.freshState());
    F.openOverlay("pcOverlay"); F.openOverlay("summaryOverlay");
    return { any: F.anyOverlayOpen(), block: F.inputBlockingOverlay() };
  });
  ok(top.any === "summaryOverlay", `최상단 취소 대상 = 최근 연 것(summaryOverlay) (${top.any})`);
  ok(top.block === "summaryOverlay", `입력 차단 대상도 최상단 (${top.block})`);
  ok(await active("pcOverlay") && await active("summaryOverlay"), "둘 다 열려 있다(겹침)");

  // Esc 1회 → 최상단(summary)만 닫히고 PC는 남는다
  await p.keyboard.press("Escape"); await p.waitForTimeout(80);
  ok(!(await active("summaryOverlay")), "Esc 1회 → 요약창만 닫힘");
  ok(await active("pcOverlay"), "Esc 1회 → 뒤의 PC는 그대로 남아 있다(이중 닫힘 없음)");

  // Esc 2회째 → PC 닫힘
  await p.keyboard.press("Escape"); await p.waitForTimeout(80);
  ok(!(await active("pcOverlay")), "Esc 2회 → PC도 닫힘");

  // endingOverlay가 Esc/B로 닫힌다(닫기 일관성)
  const endClosed = await p.evaluate(async () => {
    const F = window.SG.flow; F.openOverlay("endingOverlay");
    const before = document.getElementById("endingOverlay").classList.contains("active");
    return { before };
  });
  ok(endClosed.before, "endingOverlay 열림");
  await p.keyboard.press("Escape"); await p.waitForTimeout(80);
  ok(!(await active("endingOverlay")), "endingOverlay가 Esc로 닫힌다(다른 ✕형과 일관)");

  // 배경(시트 바깥) 탭으로 닫힌다 — 단, 시트 내용 탭은 안 닫힌다
  const back = await p.evaluate(() => {
    const F = window.SG.flow; F.openOverlay("bagOverlay");
    const ov = document.getElementById("bagOverlay");
    const sheet = ov.querySelector(".sheet, .ov-head, #bagBody") || ov.firstElementChild;
    if (sheet) sheet.click();   // 시트 내용 탭 → 안 닫힘
    const afterSheet = ov.classList.contains("active");
    ov.click();   // 배경 자신 탭 → 닫힘
    const afterBack = ov.classList.contains("active");
    return { afterSheet, afterBack };
  });
  ok(back.afterSheet, "시트 내용 탭으로는 안 닫힌다");
  ok(!back.afterBack, "모달 배경(바깥) 탭으로 닫힌다");

  // mxOverlay·daycareOverlay에 헤더 ✕(data-close) 존재
  const heads = await p.evaluate(() => ({
    mx: !!document.querySelector('#mxOverlay .closex[data-close="mxOverlay"]'),
    dc: !!document.querySelector('#daycareOverlay .closex[data-close="daycareOverlay"]')
  }));
  ok(heads.mx && heads.dc, "기술 전문가·육아방에도 고정 헤더 ✕ 추가(닫기 일관)");

  ok(errs.length === 0, "런타임 에러 0" + (errs.length ? ": " + errs.slice(0, 3).join(" / ") : ""));
  console.log(process.exitCode ? "\n❌ 실패" : "\n🎉 오버레이 스택 취소 통과");
  await b.close(); process.exit(process.exitCode || 0);
})();
