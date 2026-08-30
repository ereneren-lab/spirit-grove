// 회귀 — 특성 획득 경로 감사. 엔진이 구현한 모든 특성이 (a)캡슐 또는 (b)포획 가능 종으로 닿아야 한다.
// 왜: 특성을 추가하면서 종·캡슐 어느 경로도 안 열면 '죽은 특성'이 된다. dead_content가 잡지 못하는 축이라 여기서 단정.
const { chromium } = require("playwright"); const path = require("path");
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 430, height: 760 } });
  const errs = []; p.on("pageerror", e => errs.push(e.message));
  await p.goto("file://" + path.resolve(process.argv[2])); await p.waitForTimeout(700);
  const ok = (c, m) => { console.log((c ? "  ✅ " : "  ❌ ") + m); if (!c) process.exitCode = 1; };

  const r = await p.evaluate(() => {
    const S = window.SG, F = S.flow; S.setG(S.freshState());
    const AB = Object.keys(S.ABILITY_KO || {});
    const BAG = S.BAG_ITEMS || F.BAG_ITEMS || [];
    const caps = BAG.filter(x => x.use === "abilitycap");
    const capAbil = new Set(caps.map(c => c.ability));
    // 포획 가능 종 = 모든 ENC_POOL 종 + 그 진화형(키우면 도달)
    const reach = new Set(); Object.values(F.ENC_POOLS || {}).forEach(pool => pool.forEach(id => reach.add(id)));
    let ch = true; while (ch) { ch = false; S.DEX.forEach(d => { if (reach.has(d.id)) { if (d.evolveTo && !reach.has(d.evolveTo)) { reach.add(d.evolveTo); ch = true; } if (d.evolveBranch) d.evolveBranch.forEach(bb => { if (bb && bb.to && !reach.has(bb.to)) { reach.add(bb.to); ch = true; } }); } }); }
    const speciesAbil = {}; S.DEX.forEach(d => { if (!reach.has(d.id)) return; const a = S.makeMon(d.id, 5).ability; (speciesAbil[a] = speciesAbil[a] || []).push(d.id); });
    // (1) 모든 특성 obtainable
    const unobtainable = AB.filter(a => !capAbil.has(a) && !(speciesAbil[a] && speciesAbil[a].length));
    // (2) 최신 9종 특성이 캡슐로 열렸다
    const MODERN = ["moxie", "speedboost", "regenerator", "adaptability", "technician", "filter", "sandforce", "slushrush", "toughclaws"];
    const modernCapsMissing = MODERN.filter(a => !capAbil.has(a));
    // (3) 신규 특성도 포획 종이 존재(캡슐 없이도 닿는다 — 이중 안전망)
    const NEW3 = ["sandforce", "slushrush", "toughclaws"];
    const newSpeciesMissing = NEW3.filter(a => !(speciesAbil[a] && speciesAbil[a].length));
    // (4) 신규 캡슐이 전부 유효/명명/판매
    const KO = F.ITEM_KO || {}, PREM = F.PREMIUM || [];
    const newCaps = caps.filter(c => MODERN.includes(c.ability));
    const capsWellFormed = newCaps.every(c => S.ABILITY_KO[c.ability] && KO[c.key] && PREM.some(x => x.key === c.key));
    // (5) 신규 캡슐 적용이 실제로 특성을 바꾼다(대표: 억센발톱)
    const G = S.G(); const m = S.makeMon("foxfire", 20); G.party = [m]; G.items = {};
    const tc = caps.find(c => c.ability === "toughclaws"); G.items[tc.key] = 1;
    const applied = F.applyItemEffect(tc, m); const nowTough = m.ability === "toughclaws";
    return { total: AB.length, capCount: caps.length, unobtainable, modernCapsMissing, newSpeciesMissing, capsWellFormed, applied, nowTough };
  });

  ok(r.unobtainable.length === 0, `모든 특성 ${r.total}종이 획득 가능(캡슐 또는 포획 종) — 불가: ${r.unobtainable.join(",") || "없음"}`);
  ok(r.modernCapsMissing.length === 0, `최신 특성 9종 전부 캡슐로 열림 — 누락: ${r.modernCapsMissing.join(",") || "없음"}`);
  ok(r.newSpeciesMissing.length === 0, `신규 특성 3종은 포획 종으로도 닿는다(이중 안전망) — 누락: ${r.newSpeciesMissing.join(",") || "없음"}`);
  ok(r.capsWellFormed, "신규 캡슐이 전부 실재 특성·ITEM_KO·교환소 판매를 갖춘다");
  ok(r.applied && r.nowTough, "신규 캡슐 적용 시 특성이 바뀐다(억센발톱)");
  ok(r.capCount >= 15, `특성 캡슐 총 ${r.capCount}종(기존 6 + 최신 9)`);
  ok(errs.length === 0, "런타임 에러 0" + (errs.length ? ": " + errs.slice(0, 3).join(" / ") : ""));
  console.log(process.exitCode ? "\n❌ 실패" : "\n🎉 특성 획득 경로 감사 통과");
  await b.close(); process.exit(process.exitCode || 0);
})();
