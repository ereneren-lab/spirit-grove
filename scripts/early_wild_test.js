// 회귀 — 무배지 초반 야생 완화(실플레이 피드백: "초반 조우 정령이 강해 힘들다").
//  첫 배지 전(스타터 1마리로 팀 꾸리는 구간)엔 야생 레벨 -1 → 스타터와 대등.
//  배지를 얻으면 자동 해제되어 이후 난이도엔 영향 없음. 뉴게임+ 상향과는 독립(무완화).
const { chromium } = require("playwright"); const path = require("path");
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 430, height: 760 } });
  const errs = []; p.on("pageerror", e => errs.push(e.message));
  const ok = (c, m) => { console.log((c ? "  ✅ " : "  ❌ ") + m); if (!c) process.exitCode = 1; };
  await p.goto("file://" + path.resolve(process.argv[2])); await p.waitForTimeout(800);

  const sample = (badges, ngPlus) => p.evaluate((args) => {
    const S = window.SG, F = S.flow; const lv = [];
    for (let i = 0; i < 400; i++) {
      S.setG(S.freshState()); const G = S.G();
      G.party = [S.makeMon("foxfire", 5)]; G.pos = { x: 8, y: 43 }; G.badges = args.badges; G.ngPlus = args.ng || 0;
      F.enterMap(true); F.startEncounter(0); lv.push(G.foe.level);
    }
    return lv.reduce((a, c) => a + c, 0) / lv.length;
  }, { badges, ng: ngPlus });

  const noBadge = await sample([], 0);
  const oneBadge = await sample(["1"], 0);
  const ngNoBadge = await sample([], 1);   // 뉴게임+ 회차엔 완화 없음(상향과 독립)

  ok(noBadge <= 5.3, `무배지 초반 야생 평균 Lv ${noBadge.toFixed(2)} ≤ 5.3 (스타터 Lv5와 대등)`);
  ok(oneBadge >= 5.7, `첫 배지 후 야생 평균 Lv ${oneBadge.toFixed(2)} ≥ 5.7 (정상 복귀)`);
  ok(oneBadge - noBadge >= 0.7, `배지 전후 차이 ${(oneBadge - noBadge).toFixed(2)} ≈ 1레벨(완화가 실제로 작동)`);
  ok(ngNoBadge >= 5.7, `뉴게임+ 초반은 완화 없음(평균 Lv ${ngNoBadge.toFixed(2)} — 상향과 독립)`);

  ok(errs.length === 0, "런타임 에러 0" + (errs.length ? ": " + errs.slice(0, 3).join(" / ") : ""));
  console.log(process.exitCode ? "\n❌ 실패" : "\n🎉 무배지 초반 야생 완화 통과");
  await b.close(); process.exit(process.exitCode || 0);
})();
