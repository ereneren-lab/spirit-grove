// 회귀 — 듀오(2v2) 배틀 모션 이식: 공격자 런지·타입 임팩트 링·데미지 숫자·기절 낙하가
//  단일 배틀처럼 재생되는가. 예전엔 카드 흔들림(.dbhit)만 있고 공격 모션이 없었다.
const { chromium } = require("playwright"); const path = require("path");
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 430, height: 760 } });
  const errs = []; p.on("pageerror", e => errs.push(e.message));
  const ok = (c, m) => { console.log((c ? "  ✅ " : "  ❌ ") + m); if (!c) process.exitCode = 1; };
  await p.goto("file://" + path.resolve(process.argv[2])); await p.waitForTimeout(800);

  await p.evaluate(() => { const S = window.SG; const G = S.freshState();
    // 아군 강함 + 상대 약함 → 한 방에 쓰러뜨려 기절 낙하까지 관찰
    G.party = [S.makeMon("skydrake", 45), S.makeMon("crystalgon", 45)]; G.active = 0; S.setG(G); S.flow.enterMap(true);
    S.CONFIG.reduceMotion = false; S.CONFIG.textSpeed = 1;
    S.flow.startDouble([["seedbean", 6], ["pebblet", 6]], "쌍둥이", "DUO"); });
  await p.waitForTimeout(250);

  // 관측: 해결 중 나타나는 fx를 폴링으로 모은다(일시적이라 놓치지 않게 촘촘히)
  const seen = { lunge: false, dmg: false, burst: false, faint: false };
  const poll = async () => { const s = await p.evaluate(() => ({
    lunge: !!document.querySelector(".dbmon.dblunge-up,.dbmon.dblunge-down"),
    dmg: !!document.querySelector(".dbdmg"), burst: !!document.querySelector(".dbfxburst"),
    faint: !!document.querySelector(".dbmon.dbfainting") }));
    for (const k in s) if (s[k]) seen[k] = true; };

  // 아군 2명 기술 선택(첫 기술 → 첫 대상), 그 뒤 해결 구간을 촘촘히 폴링
  for (let a = 0; a < 2; a++) {
    const mv = await p.$("#dbMenu .dbmv"); if (mv) { await mv.click(); await p.waitForTimeout(120); }
    const tg = await p.$("#dbMenu .dbtg"); if (tg) { await tg.click(); }
    for (let i = 0; i < 8; i++) { await poll(); await p.waitForTimeout(45); }
  }
  for (let i = 0; i < 60; i++) { await poll(); await p.waitForTimeout(60); }

  const dealt = await p.evaluate(() => ((document.getElementById("dbLog") || {}).innerText || "").includes("데미지"));
  ok(dealt, "듀오 턴 진행(데미지 발생)");
  ok(seen.lunge, "공격자 런지 모션(.dblunge)");
  ok(seen.dmg, "데미지 숫자 떠오름(.dbdmg)");
  ok(seen.burst, "타입 임팩트 링(.dbfxburst)");
  ok(seen.faint, "기절 낙하 애니(.dbfainting)");
  ok(errs.length === 0, "런타임 에러 0" + (errs.length ? ": " + errs.slice(0, 3).join(" / ") : ""));
  console.log(process.exitCode ? "\n❌ 실패" : "\n🎉 듀오 배틀 모션 이식 통과");
  await b.close(); process.exit(process.exitCode || 0);
})();
