// 회귀 — 도감·보관함 검색이 "목록만" 다시 그려 입력창(같은 DOM 노드)이 유지된다.
//  예전엔 한 글자마다 body를 통째로 재생성해 입력창이 파괴 → 한글 IME 조합(ㅂ→부→불)이 매 글자 끊겼다.
const { chromium } = require("playwright"); const path = require("path");
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 430, height: 760 } });
  const errs = []; p.on("pageerror", e => errs.push(e.message));
  await p.goto("file://" + path.resolve(process.argv[2])); await p.waitForTimeout(700);
  const ok = (c, m) => { console.log((c ? "  ✅ " : "  ❌ ") + m); if (!c) process.exitCode = 1; };

  // ── 도감 ──
  await p.evaluate(() => {
    const S = window.SG; S.setG(S.freshState()); const G = S.G();
    G.party = [S.makeMon("foxfire", 10)]; ["foxfire", "sproutcat", "emberwolf"].forEach(id => { G.seen.add(id); G.caught.add(id); });
    S.flow.renderDex(); document.getElementById("dexOverlay").classList.add("active");
    const el = document.getElementById("dexSearchInput"); if (el) el.__id = "PERSIST_DEX";   // 같은 노드면 이 표식이 유지된다
  });
  await p.click("#dexSearchInput");
  await p.keyboard.type("불꽃", { delay: 20 });   // 두 글자 연속
  await p.waitForTimeout(120);
  const dex = await p.evaluate(() => { const el = document.getElementById("dexSearchInput");
    return { same: el && el.__id === "PERSIST_DEX", val: el ? el.value : null, focused: document.activeElement === el }; });
  ok(dex.same, "도감: 타이핑 내내 검색 입력창이 같은 노드로 유지(IME 안 끊김)");
  ok(dex.val === "불꽃" && dex.focused, `도감: 값 누적·포커스 유지 (${dex.val})`);

  // ── 보관함 ── (실제 UI 흐름: PC 열기 → 보관함 탭 클릭)
  await p.evaluate(() => {
    const S = window.SG; const G = S.G();
    G.box = [S.makeMon("sproutcat", 8), S.makeMon("emberwolf", 9), S.makeMon("foxfire", 7)];
    document.getElementById("dexOverlay").classList.remove("active");
    S.flow.openPC ? S.flow.openPC() : (document.getElementById("pcOverlay").classList.add("active"));
  });
  await p.click("#pcTabBox"); await p.waitForTimeout(150);
  await p.evaluate(() => { const el = document.getElementById("boxSearchInput"); if (el) el.__id = "PERSIST_BOX"; });
  const hasBox = await p.evaluate(() => !!document.getElementById("boxSearchInput"));
  ok(hasBox, "보관함 검색창 존재(box 탭)");
  if (hasBox) {
    await p.click("#boxSearchInput");
    await p.keyboard.type("불꽃", { delay: 20 });
    await p.waitForTimeout(120);
    const box = await p.evaluate(() => { const el = document.getElementById("boxSearchInput");
      return { same: el && el.__id === "PERSIST_BOX", val: el ? el.value : null, focused: document.activeElement === el }; });
    ok(box.same, "보관함: 타이핑 내내 검색 입력창이 같은 노드로 유지(IME 안 끊김)");
    ok(box.val === "불꽃" && box.focused, `보관함: 값 누적·포커스 유지 (${box.val})`);
  }

  ok(errs.length === 0, "런타임 에러 0" + (errs.length ? ": " + errs.slice(0, 3).join(" / ") : ""));
  console.log(process.exitCode ? "\n❌ 실패" : "\n🎉 도감·보관함 검색 IME 유지 통과");
  await b.close(); process.exit(process.exitCode || 0);
})();
