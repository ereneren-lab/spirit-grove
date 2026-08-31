// 회귀 — 전투 코치 힌트·듀오 배틀 로그의 한국어 조사(은/는·이/가·을/를)가 자동 해결된다.
//  예전엔 setMsg만 fixJosa를 거쳐, 코치 힌트/듀오 로그에서만 "정령이름은(는)"이 그대로 노출됐다.
const { chromium } = require("playwright"); const path = require("path");
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 430, height: 760 } });
  const errs = []; p.on("pageerror", e => errs.push(e.message));
  await p.goto("file://" + path.resolve(process.argv[2])); await p.waitForTimeout(700);
  const ok = (c, m) => { console.log((c ? "  ✅ " : "  ❌ ") + m); if (!c) process.exitCode = 1; };

  const r = await p.evaluate(() => {
    const F = window.SG.flow; const out = {};
    // 코치 힌트: 받침 있는 이름(파라꼬=받침없음→"는"), 받침 있는 예("가온"→"은")
    F.Coach.tip('<b>파라꼬</b>은(는) 불 정령이야.');
    out.coachA = document.getElementById("coachTip").textContent;
    F.Coach.tip('<b>가온</b>이(가) 나타났다.');
    out.coachB = document.getElementById("coachTip").textContent;
    // 듀오 로그: dbLog가 조사를 해결하는가
    const dl = document.getElementById("dbLog"); if (dl) dl.innerHTML = "";
    F.dbLog('<b>새싹냥</b>이(가) 쓰러졌다!');
    F.dbLog('<b>파라꼬</b>은(는) 방어 태세!');
    out.duo = dl ? dl.textContent : "";
    // fixJosa 단위 동작
    out.j1 = F.fixJosa('파라꼬은(는)');   // 받침없음 → 는
    out.j2 = F.fixJosa('가온은(는)');      // 받침있음 → 은
    out.j3 = F.fixJosa('속도이(가)');      // 받침없음 → 가
    out.j4 = F.fixJosa('공격이(가)');      // 받침있음 → 이
    return out;
  });

  ok(r.coachA.indexOf("파라꼬는") >= 0 && r.coachA.indexOf("(는)") < 0, `코치 힌트 조사 해결: 파라꼬는 (${r.coachA})`);
  ok(r.coachB.indexOf("가온이") >= 0 && r.coachB.indexOf("(가)") < 0, `코치 힌트 받침 처리: 가온이 (${r.coachB})`);
  ok(r.duo.indexOf("새싹냥이") >= 0 && r.duo.indexOf("파라꼬는") >= 0 && r.duo.indexOf("(") < 0, `듀오 로그 조사 해결 (${r.duo})`);
  ok(r.j1 === "파라꼬는" && r.j2 === "가온은" && r.j3 === "속도가" && r.j4 === "공격이", `fixJosa 받침 분기 정확 (${r.j1}/${r.j2}/${r.j3}/${r.j4})`);
  ok(errs.length === 0, "런타임 에러 0" + (errs.length ? ": " + errs.slice(0, 3).join(" / ") : ""));
  console.log(process.exitCode ? "\n❌ 실패" : "\n🎉 전투 텍스트 조사 통과");
  await b.close(); process.exit(process.exitCode || 0);
})();
