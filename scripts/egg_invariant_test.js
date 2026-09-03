// 회귀 — 알(isEgg) 처리 통합 방어. recalc 근본 가드가 여러 순회를 한 번에 지킨다.
//  · healParty(센터 회복)가 알을 recalc로 손상시키지 않는다.
//  · 전투 교체 목록(renderSwitch)에 알이 안 뜬다(예전엔 성체 카드+활성 버튼).
const { chromium } = require("playwright"); const path = require("path");
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 430, height: 760 } });
  const errs = []; p.on("pageerror", e => errs.push(e.message));
  const ok = (c, m) => { console.log((c ? "  ✅ " : "  ❌ ") + m); if (!c) process.exitCode = 1; };
  await p.goto("file://" + path.resolve(process.argv[2])); await p.waitForTimeout(800);

  // ── healParty가 알을 손상시키지 않는다 ──
  const heal = await p.evaluate(() => {
    const S = window.SG, F = S.flow; S.setG(S.freshState()); const G = S.G();
    const lead = S.makeMon("emberwolf", 40); lead.hp = 5; lead.status = "psn";
    const egg = S.makeMon("racoonmon", 1); egg.isEgg = true; egg.name = "알"; egg.em = "🥚"; egg.hp = 1; egg.maxHp = 1;
    G.party = [lead, egg];
    F.healParty(true);
    return { leadFull: lead.hp === lead.maxHp, leadCured: lead.status === null, eggMax: G.party[1].maxHp, eggHp: G.party[1].hp };
  });
  ok(heal.leadFull && heal.leadCured, "회복은 정상 정령에 적용된다(HP 만땅·상태 치유)");
  ok(heal.eggMax === 1 && heal.eggHp === 1, `회복이 알을 손상시키지 않는다 (maxHp=${heal.eggMax})`);

  // ── 전투 교체 목록에서 알 제외 ──
  const sw = await p.evaluate(() => {
    const S = window.SG, F = S.flow; S.setG(S.freshState()); const G = S.G();
    const b1 = S.makeMon("skydrake", 40), b2 = S.makeMon("crystalgon", 40);
    const egg = S.makeMon("racoonmon", 1); egg.isEgg = true; egg.name = "알"; egg.em = "🥚"; egg.hp = 1; egg.maxHp = 1;
    G.party = [b1, b2, egg]; G.active = 0; G.inBattle = true; G.foe = S.makeMon("seedbean", 20);
    F.openSwitch(false);
    const cards = [...document.querySelectorAll("#switchBody .mon-card")];
    const hasEgg = cards.some(c => /🥚/.test(c.textContent) || /알(?![a-z가-힣])/.test((c.querySelector(".nm") || {}).textContent || ""));
    return { cardCount: cards.length, hasEgg };
  });
  ok(sw.cardCount === 2, `교체 목록에 전투 정령만(알 제외, ${sw.cardCount}장)`);
  ok(!sw.hasEgg, "교체 목록에 알 카드가 없다");

  ok(errs.length === 0, "런타임 에러 0" + (errs.length ? ": " + errs.slice(0, 3).join(" / ") : ""));
  console.log(process.exitCode ? "\n❌ 실패" : "\n🎉 알 처리 통합 방어 통과");
  await b.close(); process.exit(process.exitCode || 0);
})();
