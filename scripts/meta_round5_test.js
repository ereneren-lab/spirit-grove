// 회귀 — 감사 5라운드 수정.
//  (1) 실내에서 지도(미니맵)를 못 열게 — 실내는 G.pos가 인테리어 좌표라 drawTopo의 mmReveal이
//      오버월드 안개(seenTiles)를 오염시켰다(저장까지).
//  (2) 정령센터 공중날기 라벨: 센터는 문(+) 앞 칸에 등록돼 '쉬어간 곳'으로 잘못 표기됐다 → '정령센터'.
//  (3) startGardenEncounter 빈 풀 가드(형제 함수 정합).
const { chromium } = require("playwright"); const path = require("path");
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 430, height: 760 } });
  const errs = []; p.on("pageerror", e => errs.push(e.message));
  const ok = (c, m) => { console.log((c ? "  ✅ " : "  ❌ ") + m); if (!c) process.exitCode = 1; };
  await p.goto("file://" + path.resolve(process.argv[2])); await p.waitForTimeout(800);

  // ── (1) 실내 미니맵 차단 + 안개 무오염 ──
  const mini = await p.evaluate(async () => {
    const S = window.SG, F = S.flow; S.setG(S.freshState()); const G = S.G(); F.enterMap(true);
    // 실내 진입 흉내: indoor 세팅 + 인테리어 좌표
    G.indoor = "center"; G.pos = { x: 6, y: 9 };
    const seen0 = G.seenTiles ? G.seenTiles.size : 0;
    document.getElementById("openMinimap").click();
    await new Promise(r => setTimeout(r, 200));
    const mm = document.getElementById("minimap");
    const openedIndoor = !!(mm && mm.classList.contains("active"));
    const seen1 = G.seenTiles ? G.seenTiles.size : 0;
    // 밖에선 정상적으로 열려야
    G.indoor = null; G.pos = { x: 8, y: 45 };
    document.getElementById("openMinimap").click();
    await new Promise(r => setTimeout(r, 200));
    const openedOutdoor = !!(mm && mm.classList.contains("active"));
    try { F.closeOverlay("minimap"); } catch (_) {}
    return { openedIndoor, seenSame: seen1 === seen0, openedOutdoor };
  });
  ok(!mini.openedIndoor, "실내에선 미니맵이 열리지 않는다");
  ok(mini.seenSame, "실내 미니맵 시도가 오버월드 안개(seenTiles)를 오염시키지 않는다");
  ok(mini.openedOutdoor, "밖에선 미니맵이 정상적으로 열린다");

  // ── (2) 정령센터 공중날기 라벨 ──
  const label = await p.evaluate(() => {
    const S = window.SG, F = S.flow; S.setG(S.freshState()); F.enterMap(true);
    // 오버월드에서 '+'(센터 문)를 tileAt로 찾아, 인접 walkable 칸의 flySpotLabel을 본다(센터 앞 칸에 fly가 등록되므로)
    let doorFound = 0, centerLabel = 0, frontSpot = null;
    for (let y = 0; y < 52; y++) for (let x = 0; x < 26; x++) {
      if (F.tileAt(x, y) !== "+") continue; doorFound++;
      for (const [dx, dy] of [[0, 1], [0, -1], [-1, 0], [1, 0]]) {
        const nx = x + dx, ny = y + dy;
        if (F.walkable && F.walkable(nx, ny)) { const lab = F.flySpotLabel(nx, ny); if (lab.nm === "정령센터") { centerLabel++; if (!frontSpot) frontSpot = { nx, ny }; } }
      }
    }
    return { doorFound, centerLabel, frontSpot };
  });
  ok(label.doorFound > 0, `오버월드에 센터 문(+) 존재 (${label.doorFound}곳)`);
  ok(label.centerLabel > 0, "센터 문(+) 앞 칸이 '정령센터' 🏥로 라벨링된다" + (label.frontSpot ? ` (${label.frontSpot.nx},${label.frontSpot.ny})` : ""));

  // ── (3) startGardenEncounter 정상 동작(빈 풀 가드 추가 후 크래시 없음) ──
  const garden = await p.evaluate(() => {
    const S = window.SG, F = S.flow; S.setG(S.freshState()); const G = S.G();
    G.party = [S.makeMon("emberwolf", 30)]; G.pos = { x: 8, y: 45 }; F.enterMap(true);
    try { F.startGardenEncounter(); return { ok: true, foe: G.foe ? G.foe.id : null }; } catch (e) { return { ok: false, err: e.message }; }
  });
  ok(garden.ok && !!garden.foe, `startGardenEncounter 정상 조우 (${garden.foe || garden.err})`);

  ok(errs.length === 0, "런타임 에러 0" + (errs.length ? ": " + errs.slice(0, 3).join(" / ") : ""));
  console.log(process.exitCode ? "\n❌ 실패" : "\n🎉 감사 5라운드 수정 통과");
  await b.close(); process.exit(process.exitCode || 0);
})();
