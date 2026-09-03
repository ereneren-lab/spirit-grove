// 회귀 — 눈뜨는 칸이 그 집 침대(B) 옆 바닥이어야 한다.
//  예전엔 (2,2) 하드코딩이라 기본 캐릭터(리오)가 벽 기둥 위에서 눈떴다(첫 조작 순간의 시각 버그).
const { chromium } = require("playwright"); const path = require("path");
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 430, height: 760 } });
  const errs = []; p.on("pageerror", e => errs.push(e.message));
  const ok = (c, m) => { console.log((c ? "  ✅ " : "  ❌ ") + m); if (!c) process.exitCode = 1; };
  await p.goto("file://" + path.resolve(process.argv[2])); await p.waitForTimeout(800);

  const r = await p.evaluate(() => {
    const S = window.SG, F = S.flow; const homes = ["home_rio", "home_mina", "home_tori", "home_el"];
    // 게임과 같은 규칙: 침대 B 인접(하좌우상) 첫 바닥('.') 칸
    const wake = (str) => { let bx = -1, by = -1;
      for (let y = 0; y < str.length; y++) { const c = str[y].indexOf("B"); if (c >= 0) { bx = c; by = y; break; } }
      for (const [dx, dy] of [[0, 1], [-1, 0], [1, 0], [0, -1]]) { const nx = bx + dx, ny = by + dy; const row = str[ny]; if (row && row[nx] === ".") return { x: nx, y: ny, bx, by }; }
      return { x: -1, y: -1, bx, by }; };
    return homes.map(h => { const str = F.INTERIORS[h].str; const w = wake(str);
      return { h, wake: [w.x, w.y], tile: (str[w.y] && str[w.y][w.x]) || "?", adjBed: Math.abs(w.x - w.bx) + Math.abs(w.y - w.by) === 1,
        oldTile22: (str[2] && str[2][2]) || "?" }; });
  });

  r.forEach(o => {
    ok(o.tile === ".", `${o.h}: 눈뜨는 칸 (${o.wake[0]},${o.wake[1]})이 바닥('${o.tile}')`);
    ok(o.adjBed, `${o.h}: 눈뜨는 칸이 침대 바로 옆`);
  });
  const rio = r.find(o => o.h === "home_rio");
  ok(rio.oldTile22 === "#", "리오 집 (2,2)는 원래 벽 — 하드코딩이 실제 버그였음을 확인(이제 우회)");

  ok(errs.length === 0, "런타임 에러 0" + (errs.length ? ": " + errs.slice(0, 3).join(" / ") : ""));
  console.log(process.exitCode ? "\n❌ 실패" : "\n🎉 눈뜨는 칸(침대 옆 바닥) 통과");
  await b.close(); process.exit(process.exitCode || 0);
})();
