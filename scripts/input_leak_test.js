// 회귀 — 모달(오버레이)이 열려 있을 때 방향키가 뒤(전투 메뉴·오버월드 이동)로 새지 않고 모달 안에서 돈다.
//  유저 제보: 전투 중 가방을 열면 방향키가 뒤 전투 메뉴 커서를 움직였다("여기서도 방향키가 먹혀야되는데, 밖에서 도네").
const { chromium } = require("playwright"); const path = require("path");
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 430, height: 760 } });
  const errs = []; p.on("pageerror", e => errs.push(e.message));
  await p.goto("file://" + path.resolve(process.argv[2])); await p.waitForTimeout(800);
  const ok = (c, m) => { console.log((c ? "  ✅ " : "  ❌ ") + m); if (!c) process.exitCode = 1; };

  /* ── 1. 전투 위 가방: 방향키가 전투 메뉴로 새지 않는다 ── */
  await p.evaluate(() => {
    const S = window.SG; const G = S.freshState(); G.party = [S.makeMon("foxfire", 20)]; G.active = 0;
    G.inBattle = true; G.busy = false; G.trainer = null; G.foe = S.makeMon("bunnyhop", 12); G.foe.hp = G.foe.maxHp; S.setG(G);
    S.CONFIG.reduceMotion = true;
    document.querySelectorAll(".view").forEach(v => v.classList.remove("active")); document.getElementById("battle").classList.add("active");
    S.flow.setupBattleUI(false); window.SG.G().busy = false; S.flow.showMain();
  });
  const battleCursor = () => p.evaluate(() => { const f = document.querySelector("#mainMenu .mbtn.kbfocus"); return f ? (f.dataset.act || "?") : null; });
  ok(await battleCursor() === "fight", `초기 전투 커서 = 공격 (${await battleCursor()})`);

  await p.evaluate(() => window.SG.flow.openBattleBag()); await p.waitForTimeout(150);
  const bagActive = () => p.evaluate(() => { const el = document.getElementById("bagOverlay"); return !!(el && el.classList.contains("active")); });
  ok(await bagActive(), "가방 오버레이가 전투 위에 열렸다");

  const before = await battleCursor();
  await p.keyboard.press("ArrowRight"); await p.keyboard.press("ArrowDown"); await p.waitForTimeout(80);
  ok(await battleCursor() === before, `방향키가 전투 메뉴 커서를 바꾸지 않는다 (여전히 ${await battleCursor()})`);
  const ovFocus = () => p.evaluate(() => { const f = document.querySelector("#bagOverlay .kbfocus"); return !!f; });
  ok(await ovFocus(), "방향키가 가방 모달 안 커서를 움직인다(모달 내부에서 돈다)");

  // Esc로 전투 위 모달이 닫힌다(맵 핸들러는 map 비활성이라 손 못 대던 경로)
  await p.keyboard.press("Escape"); await p.waitForTimeout(120);
  ok(!(await bagActive()), "Esc로 전투 위 가방이 닫힌다");

  /* ── 2. 오버월드: 모달이 열려 있으면 방향키로 캐릭터가 움직이지 않는다 ── */
  const leak = await p.evaluate(async () => {
    const S = window.SG, F = S.flow; S.setG(S.freshState()); const G = S.G(); G.party = [S.makeMon("foxfire", 10)];
    F.enterMap(true); G.inBattle = false; G.busy = false;
    // 걷기 가능한 열린 칸으로 이동
    let placed = null;
    for (let y = 46; y >= 40 && !placed; y--) for (let x = 2; x < 22; x++) { if (F.walkable(x, y) && F.walkable(x + 1, y)) { placed = { x, y }; break; } }
    G.pos = { x: placed.x, y: placed.y }; if (window.Field && Field.setTarget) Field.setTarget(G.pos.x, G.pos.y, "down");
    F.renderBag(); document.getElementById("bagOverlay").classList.add("active");
    return { pos0: { x: G.pos.x, y: G.pos.y }, open: document.getElementById("bagOverlay").classList.contains("active") };
  });
  ok(leak.open, "오버월드에서 가방 오버레이 열림");
  await p.keyboard.press("ArrowRight"); await p.keyboard.press("ArrowDown"); await p.waitForTimeout(120);
  const pos1 = await p.evaluate(() => ({ x: window.SG.G().pos.x, y: window.SG.G().pos.y }));
  ok(pos1.x === leak.pos0.x && pos1.y === leak.pos0.y, `방향키로 캐릭터가 움직이지 않는다 (${leak.pos0.x},${leak.pos0.y} → ${pos1.x},${pos1.y})`);
  ok(await p.evaluate(() => !!document.querySelector("#bagOverlay .kbfocus")), "오버월드 모달에서도 방향키가 내부 커서를 움직인다");

  /* ── 3. 화면 D패드(터치): 모달이 열려 있으면 D패드로도 캐릭터가 움직이지 않는다 ── */
  const pos2a = await p.evaluate(() => ({ x: window.SG.G().pos.x, y: window.SG.G().pos.y }));
  await p.dispatchEvent('.dpad button[data-dir="right"]', "pointerdown");
  await p.dispatchEvent('.dpad button[data-dir="down"]', "pointerdown"); await p.waitForTimeout(120);
  const pos2b = await p.evaluate(() => ({ x: window.SG.G().pos.x, y: window.SG.G().pos.y }));
  ok(pos2a.x === pos2b.x && pos2a.y === pos2b.y, `모달 중 D패드로도 캐릭터가 안 움직인다 (${pos2a.x},${pos2a.y} → ${pos2b.x},${pos2b.y})`);
  await p.evaluate(() => document.getElementById("bagOverlay").classList.remove("active"));

  /* ── 4. CANCELABLE에 없는 강제성 모달(교체창)도 입력을 막는다 ── */
  const swk = await p.evaluate(() => {
    const S = window.SG; const G = S.G(); G.busy = false;
    document.getElementById("switchOverlay").classList.add("active");   // 강제성 모달(교체창)을 직접 띄워 입력 차단 검증
    return { open: document.getElementById("switchOverlay").classList.contains("active"), pos0: { x: G.pos.x, y: G.pos.y } };
  });
  ok(swk.open, "교체창(비-CANCELABLE 모달) 활성화");
  await p.keyboard.press("ArrowRight");
  await p.dispatchEvent('.dpad button[data-dir="right"]', "pointerdown"); await p.waitForTimeout(100);
  const pos3 = await p.evaluate(() => ({ x: window.SG.G().pos.x, y: window.SG.G().pos.y }));
  ok(pos3.x === swk.pos0.x && pos3.y === swk.pos0.y, "교체창(CANCELABLE 아님)에서도 방향키·D패드가 안 샌다(입력 차단 집합)");
  await p.evaluate(() => document.getElementById("switchOverlay").classList.remove("active"));

  ok(errs.length === 0, "런타임 에러 0" + (errs.length ? ": " + errs.slice(0, 3).join(" / ") : ""));
  console.log(process.exitCode ? "\n❌ 실패" : "\n🎉 모달 방향키 누수 방지 통과");
  await b.close(); process.exit(process.exitCode || 0);
})();
