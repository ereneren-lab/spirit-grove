// 회귀 — 감사 4라운드 수정 2건.
//  (1) 보관함(PC)이 알(isEgg)을 부화 후 성체로 렌더하던 문제: recalc가 알 maxHp를 덮고, 성체 스프라이트·
//      요약(스포일러)·지닌물건 버튼까지 노출했다 → 알 전용 카드(🥚·부화 안내)로만, recalc/요약 없이.
//  (2) 진화 장면에서 X/Esc 취소가 먹히지 않던 문제: 전역 캡처 핸들러가 취소키를 소비하고 cancelBtn을
//      불렀는데 evoOverlay는 CANCELABLE이 아니라 무시됐다 → 전용 취소 훅으로 전달.
const { chromium } = require("playwright"); const path = require("path");
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 430, height: 760 } });
  const errs = []; p.on("pageerror", e => errs.push(e.message));
  const ok = (c, m) => { console.log((c ? "  ✅ " : "  ❌ ") + m); if (!c) process.exitCode = 1; };
  await p.goto("file://" + path.resolve(process.argv[2])); await p.waitForTimeout(800);

  // ── (1) 보관함 알 렌더 ──
  const r1 = await p.evaluate(() => {
    const S = window.SG, F = S.flow; S.setG(S.freshState()); const G = S.G();
    const lead = S.makeMon("emberwolf", 30);
    const egg = S.makeMon("racoonmon", 1); egg.isEgg = true; egg.name = "알"; egg.em = "🥚"; egg.hp = 1; egg.maxHp = 1; egg.hatch = 15; delete egg.type;
    G.party = [lead, egg]; G.active = 0;
    F.openPC();
    const cards = [...document.querySelectorAll("#pcOverlay .mon-card, .overlay.active .mon-card")];
    // 알 카드 = 🥚 이모지 + '미부화' 텍스트
    const eggCard = cards.find(c => /🥚/.test(c.querySelector(".em") ? c.querySelector(".em").textContent : "") && /미부화|부화/.test(c.textContent));
    const eggHasSummary = eggCard ? !!eggCard.querySelector('[data-a="sum"],[data-a="held"]') : true;
    const babySprite = cards.some(c => /🥚/.test((c.querySelector(".em") || {}).textContent || "") ? false : false);
    return { cardCount: cards.length, eggCardFound: !!eggCard, eggHasSummary,
      eggMax: G.party[1].maxHp, eggType: G.party[1].type,
      undefinedTag: cards.some(c => /undefined/.test(c.textContent)) };
  });
  ok(r1.eggCardFound, "보관함에서 알이 🥚 전용 카드로 렌더(부화 안내)");
  ok(!r1.eggHasSummary, "알 카드엔 요약·지닌물건 버튼 없음(스포일러/유령상태 방지)");
  ok(r1.eggMax === 1, `알 maxHp 보존(recalc 미적용, ${r1.eggMax})`);
  ok(!r1.undefinedTag, "타입 없는 알에서 'undefined' 태그가 안 뜬다");

  // ── (2) 진화 장면 Esc 취소 ──
  await p.evaluate(() => { const S = window.SG, F = S.flow; S.setG(S.freshState()); const G = S.G();
    try { F.closeOverlay && F.closeOverlay("pcOverlay"); } catch (_) {}
    const m = S.makeMon("foxfire", 20); G.party = [m]; G.active = 0; S.CONFIG.reduceMotion = true;
    window.__m = m; window.__evoP = F.evolveScene(m, S.byId("emberwolf")); });
  await p.waitForTimeout(280);
  const evoOpen = await p.evaluate(() => { const o = document.getElementById("evoOverlay"); return !!(o && o.classList.contains("active")); });
  ok(evoOpen, "진화 장면 오버레이 열림");
  await p.keyboard.press("Escape");
  const res = await p.evaluate(async () => { const r = await window.__evoP; return { r, id: window.__m.id, name: window.__m.name }; });
  ok(res.r === false, "Esc 취소 시 진화가 취소됨(반환 false)");
  ok(res.id === "foxfire", `취소 후 정령이 진화하지 않음 (${res.id})`);

  ok(errs.length === 0, "런타임 에러 0" + (errs.length ? ": " + errs.slice(0, 3).join(" / ") : ""));
  console.log(process.exitCode ? "\n❌ 실패" : "\n🎉 감사 4라운드 수정 통과");
  await b.close(); process.exit(process.exitCode || 0);
})();
