// 회귀 — 메타 시스템 블라인드 스팟 수정 3건.
//  (1) 알엔 아이템을 못 쓴다(대상 목록에서 제외) — 사탕/비타민이 소모되고 알이 손상되던 버그.
//  (2) TM은 실제로 배웠을 때만 소모(기술 4개일 때 '안 배우기' 시 환불).
//  (3) 뉴게임+가 육아방에 맡긴 부모를 보관함으로 보존(소멸 방지).
const { chromium } = require("playwright"); const path = require("path");
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 430, height: 760 } });
  const errs = []; p.on("pageerror", e => errs.push(e.message));
  p.on("dialog", d => d.accept());   // 뉴게임+ confirm 수락
  const ok = (c, m) => { console.log((c ? "  ✅ " : "  ❌ ") + m); if (!c) process.exitCode = 1; };
  await p.goto("file://" + path.resolve(process.argv[2])); await p.waitForTimeout(800);

  // ── (1) 알은 아이템 대상 목록에서 제외 ──
  const r1 = await p.evaluate(() => {
    const S = window.SG, F = S.flow; S.setG(S.freshState()); const G = S.G();
    const lead = S.makeMon("emberwolf", 40);
    const egg = S.makeMon("racoonmon", 1); egg.isEgg = true; egg.name = "알"; egg.em = "🥚"; egg.hp = 1; egg.maxHp = 1;
    G.party = [lead, egg];
    F.renderItemTarget({ key: "candy", em: "🍬", nm: "정령 사탕", use: "candy", where: "map" });
    const rows = [...document.querySelectorAll("#bagBody .bag-item")];
    const names = rows.map(x => (x.querySelector(".nm") || {}).textContent || "");
    const eggMax = G.party[1].maxHp;   // recalc가 알 maxHp를 안 덮었는지
    return { rowCount: rows.length, hasEgg: names.some(n => n.includes("알")), eggMax };
  });
  ok(r1.rowCount === 1, `아이템 대상에 알 제외(행 ${r1.rowCount}, 선두만)`);
  ok(!r1.hasEgg, "대상 목록에 알이 없음");
  ok(r1.eggMax === 1, `알 maxHp 보존(recalc 미적용, maxHp=${r1.eggMax})`);

  // ── (2) TM 환불: 기술 4개일 때 '안 배우기' 시 미소모 ──
  await p.evaluate(() => {
    const S = window.SG; S.setG(S.freshState()); const G = S.G();
    const m = S.makeMon("emberwolf", 40); m.moves = ["tackle", "ember", "quake", "leechseed"]; m.pp = { tackle: 30, ember: 20, quake: 8, leechseed: 10 };
    G.party = [m]; G.active = 0; G.items = G.items || {}; G.items.tm_confuse = 1;
    S.flow.applyItemEffect({ key: "tm_confuse", nm: "기술머신: 혼란파", use: "tm", move: "confuse", universal: true }, m);
  });
  await p.waitForTimeout(200);
  // 학습 오버레이에서 '안 배우기' 클릭
  const skipped = await p.evaluate(() => {
    const btns = [...document.querySelectorAll("#learnBody button")];
    const skip = btns.find(x => /안 배우기/.test(x.textContent)); if (skip) { skip.click(); return true; } return false;
  });
  await p.waitForTimeout(200);
  const tmAfterSkip = await p.evaluate(() => window.SG.G().items.tm_confuse);
  ok(skipped, "학습 오버레이 '안 배우기' 노출");
  ok(tmAfterSkip === 1, `기술 4개일 때 '안 배우기' 시 TM 미소모(환불, 남은 ${tmAfterSkip})`);

  // 기술 <4 → 실제 습득 시 소모
  await p.evaluate(() => {
    const S = window.SG; const G = S.G();
    const m = S.makeMon("skydrake", 40); m.moves = ["tackle"]; m.pp = { tackle: 30 };
    G.party = [m]; G.active = 0; G.items.tm_confuse = 1;
    S.flow.applyItemEffect({ key: "tm_confuse", nm: "기술머신: 혼란파", use: "tm", move: "confuse", universal: true }, m);
  });
  await p.waitForTimeout(250);
  const learn = await p.evaluate(() => { const m = window.SG.G().party[0]; return { known: m.moves.includes("confuse"), tm: window.SG.G().items.tm_confuse }; });
  ok(learn.known, "기술 여유 있으면 즉시 습득");
  ok(learn.tm === 0, `실제 습득 시 TM 소모(남은 ${learn.tm})`);

  // ── (3) 뉴게임+가 육아방 부모를 보관함으로 보존 ──
  const r3 = await p.evaluate(() => {
    const S = window.SG, F = S.flow; S.setG(S.freshState()); const G = S.G();
    G.champion = true; G.party = [S.makeMon("emberwolf", 50)]; G.box = [];
    const pa = S.makeMon("seedbean", 25), pb = S.makeMon("riverine", 25);
    G.daycare = { a: pa, b: pb, steps: 0, eggReady: false };
    const paId = pa.id, pbId = pb.id;
    F.startNewGamePlus();
    const g = S.G();
    const boxIds = (g.box || []).map(m => m && m.id);
    return { paId, pbId, ng: g.ngPlus, boxHasA: boxIds.includes(paId), boxHasB: boxIds.includes(pbId), boxLen: (g.box || []).length };
  });
  ok(r3.ng === 1, `뉴게임+ 진입(${r3.ng}회차)`);
  ok(r3.boxHasA && r3.boxHasB, `육아방 부모 2마리가 보관함으로 보존(box ${r3.boxLen})`);

  ok(errs.length === 0, "런타임 에러 0" + (errs.length ? ": " + errs.slice(0, 3).join(" / ") : ""));
  console.log(process.exitCode ? "\n❌ 실패" : "\n🎉 메타 시스템 블라인드 스팟 수정 통과");
  await b.close(); process.exit(process.exitCode || 0);
})();
