// 회귀 — 듀오(2v2) 배틀 라운드 종료 처리 이식: 단일 배틀의 endTurnItems/endTurnAbility 가
//  듀오에서도 돌아야 한다. 먹다남은음식(1/16 회복)·가속(속도 +1)이 라운드 끝에 적용되는지 검증.
//  이식 전엔 dbAfterRound가 독/화상 잔뎀만 처리하고 지닌아이템·특성은 조용히 무시됐다.
const { chromium } = require("playwright"); const path = require("path");
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 430, height: 760 } });
  const errs = []; p.on("pageerror", e => errs.push(e.message));
  const ok = (c, m) => { console.log((c ? "  ✅ " : "  ❌ ") + m); if (!c) process.exitCode = 1; };
  await p.goto("file://" + path.resolve(process.argv[2])); await p.waitForTimeout(800);

  // 먹다남은음식(leftovers) 회복: hp를 절반으로 깎아두고 라운드 종료 시 회복 확인.
  //  가속(speedboost) 속도 상승도 같은 라운드에서 관찰.
  const r = await p.evaluate(async () => {
    const S = window.SG; const G = S.freshState();
    const a = S.makeMon("emberwolf", 40); a.moves = ["tackle"]; a.pp = { tackle: 30 };
    a.held = "leftovers"; a.hp = Math.floor(a.maxHp / 2); const hp0 = a.hp;
    const c = S.makeMon("shellow", 40); c.moves = ["tackle"]; c.pp = { tackle: 30 };
    c.ability = "speedboost"; c.stages = { atk:0,def:0,spa:0,spd:0,spe:0,acc:0,eva:0 };
    G.party = [a, c]; G.active = 0; G.pos = { x: 12, y: 37 };
    S.setG(G); S.flow.enterMap(true); S.G().pos = { x: 12, y: 37 };
    S.flow.startDouble([["racoonmon", 8], ["cindercat", 8]], "쌍둥이", "DUO");
    return { hp0, maxHp: a.maxHp };
  });
  await p.waitForTimeout(300);

  // 두 아군 기술 선택 → 라운드 해결 후 leftovers 회복 + speedboost 상승 관찰
  for (let a = 0; a < 2; a++) {
    const mv = await p.$("#dbMenu .dbmv"); if (mv) { await mv.click(); await p.waitForTimeout(140); }
    const tg = await p.$("#dbMenu .dbtg"); if (tg) { await tg.click(); await p.waitForTimeout(140); }
  }
  let leftHeal = false, spdUp = false, sawHealLog = false, sawBoostLog = false;
  for (let i = 0; i < 120; i++) {
    const s = await p.evaluate(() => {
      const S = window.SG; const DB = window.__DB || null;
      const log = ((document.getElementById("dbLog") || {}).innerText || "");
      // DB는 전역이 아닐 수 있어 파티에서 직접 읽는다
      const g = S.G(); const a = g.party[0], c = g.party[1];
      return { log, aHp: a ? a.hp : 0, aMax: a ? a.maxHp : 1,
        cSpd: (c && c.stages) ? (c.stages.spd || 0) : 0 };
    });
    if (s.log.includes("먹다남은음식으로 회복")) sawHealLog = true;
    if (s.log.includes("가속")) sawBoostLog = true;
    if (s.aHp > Math.floor(s.aMax / 2)) leftHeal = true;   // 절반 이상으로 회복
    if (s.cSpd >= 1) spdUp = true;
    if (await p.$("#dbMenu .dbmv") && (sawHealLog || leftHeal)) break;
    await p.waitForTimeout(80);
  }
  ok(sawHealLog, "먹다남은음식 회복 로그(라운드 종료 처리 이식)");
  ok(leftHeal, "먹다남은음식으로 실제 HP 회복");
  ok(sawBoostLog || spdUp, "가속(speedboost) 속도 상승");
  ok(errs.length === 0, "런타임 에러 0" + (errs.length ? ": " + errs.slice(0, 3).join(" / ") : ""));
  console.log(process.exitCode ? "\n❌ 실패" : "\n🎉 듀오 라운드 종료 처리(지닌아이템·특성) 통과");
  await b.close(); process.exit(process.exitCode || 0);
})();
