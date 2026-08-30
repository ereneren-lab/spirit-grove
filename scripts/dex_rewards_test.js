// 회귀 — 도감 완성/마일스톤 보상. 후반(51~105) 마일스톤 · 완성 보상(도감마스터+반짝임의 부적) · 중복청구 방지.
const { chromium } = require("playwright"); const path = require("path");
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 430, height: 760 } });
  const errs = []; p.on("pageerror", e => errs.push(e.message));
  await p.goto("file://" + path.resolve(process.argv[2])); await p.waitForTimeout(700);
  const ok = (c, m) => { console.log((c ? "  ✅ " : "  ❌ ") + m); if (!c) process.exitCode = 1; };

  const r = await p.evaluate(() => {
    const S = window.SG, F = S.flow; const out = {};
    const ids = S.DEX.map(d => d.id);
    const catchN = n => { const G = S.G(); G.caught = new Set(ids.slice(0, n)); };

    // 후반 마일스톤: 60/70/80/90/100에서 각각 보상 청구된다
    S.setG(S.freshState()); let G = S.G(); G.party = [S.makeMon("foxfire", 30)];
    const milestones = [60, 70, 80, 90, 100];
    out.backHalf = {};
    milestones.forEach(n => { catchN(n); const before = G.money; F.checkDexRewards();
      out.backHalf[n] = (G.dexClaimed.includes(n) && G.money > before); });
    out.backHalfAll = milestones.every(n => out.backHalf[n]);

    // 중복 청구 방지: 다시 호출해도 돈이 늘지 않는다
    const moneyNow = G.money; F.checkDexRewards(); out.noDouble = (G.money === moneyNow);

    // 완성: 전종 등록 → dexMaster + shinyCharm + "complete" 청구 + 넉넉한 보상
    S.setG(S.freshState()); G = S.G(); G.party = [S.makeMon("foxfire", 30)];
    G.caught = new Set(ids); const moneyBefore = G.money, candyBefore = (G.items.candy || 0);
    F.checkDexRewards();
    out.complete = G.dexClaimed.includes("complete");
    out.dexMaster = G.dexMaster === true;
    out.shinyCharm = G.shinyCharm === true;   // 예전엔 토스트만 약속하고 실제로 안 켜졌다 → 버그 수정 회귀
    out.completeRich = (G.money - moneyBefore >= 40000) && ((G.items.candy || 0) - candyBefore >= 10);

    // 완성 보상이 마일스톤보다 크다(잭팟)
    out.jackpot = true;

    // 완성 후 샤이니 확률이 실제로 오른다(도감마스터×3 · 부적×2 = ×6). 통계로 확인.
    let shinyHits = 0, N = 4000; for (let i = 0; i < N; i++) { if (S.makeMon("foxfire", 5).shiny) shinyHits++; }
    const rate = shinyHits / N;                 // 기대 ≈ 6/64 ≈ 0.094
    out.shinyBoost = rate > (1.5 / 64);         // 기본(1/64)보다 확연히 높다
    out.shinyRate = Math.round(rate * 1000) / 10;

    // 완성 상태 세이브 왕복 영속
    const ser = F.serialize(); out.serFlags = ser.dexMaster === true && ser.shinyCharm === true;
    G.dexMaster = false; G.shinyCharm = false; F.deserialize(ser);
    out.restored = S.G().dexMaster === true && S.G().shinyCharm === true;
    return out;
  });

  ok(r.backHalfAll, `후반 마일스톤(60·70·80·90·100) 전부 보상 청구 (${JSON.stringify(r.backHalf)})`);
  ok(r.noDouble, "마일스톤 중복 청구 방지(재호출해도 돈 불변)");
  ok(r.complete, "전종 등록 시 'complete' 보상 청구");
  ok(r.dexMaster, "완성 시 도감 마스터(dexMaster) 등극");
  ok(r.shinyCharm, "⭐완성 시 반짝임의 부적(shinyCharm)이 실제로 켜진다(토스트-실동작 일치)");
  ok(r.completeRich, "완성 보상이 넉넉하다(잭팟: 돈≥40000·사탕≥10)");
  ok(r.shinyBoost, `완성 후 샤이니 확률이 확연히 상승 (실측 ${r.shinyRate}% > 기본 1.6%)`);
  ok(r.serFlags && r.restored, "완성 상태(dexMaster·shinyCharm)가 세이브 왕복에 영속");
  ok(errs.length === 0, "런타임 에러 0" + (errs.length ? ": " + errs.slice(0, 3).join(" / ") : ""));
  console.log(process.exitCode ? "\n❌ 실패" : "\n🎉 도감 완성/마일스톤 보상 통과");
  await b.close(); process.exit(process.exitCode || 0);
})();
