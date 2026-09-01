// 회귀 — 방향키를 누른 채 창 포커스를 잃으면 눌림(heldDir)이 해제된다(스턱키 방지).
//  버그: keydown이 heldDir를 세팅하고 keyup이 푸는데, 포커스를 잃으면(알트탭·앱 전환·알림)
//  keyup이 안 와서 heldDir가 남아 돌아왔을 때 캐릭터가 저절로 계속 걸어간다.
//  → window blur / document visibilitychange(hidden)에서 heldDir를 푼다.
//  ⚠️ heldDir 자체를 SG.flow._heldDir()로 관측한다(연속 걷기 런웨이에 의존하지 않아 견고).
const { chromium } = require("playwright"); const path = require("path");
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 430, height: 760 } });
  const errs = []; p.on("pageerror", e => errs.push(e.message));
  const ok = (c, m) => { console.log((c ? "  ✅ " : "  ❌ ") + m); if (!c) process.exitCode = 1; };
  await p.goto("file://" + path.resolve(process.argv[2])); await p.waitForTimeout(900);
  await p.click("#newGameBtn").catch(() => {}); await p.waitForTimeout(350);
  await p.locator("#charRow .pick-card").nth(0).click().catch(() => {}); await p.waitForTimeout(200);
  await p.click("#confirmChar").catch(() => {}); await p.waitForTimeout(350);
  await p.locator("#starterRow .pick-card").first().click().catch(() => {}); await p.waitForTimeout(200);
  await p.click("#confirmStarter").catch(() => {}); await p.waitForTimeout(600);
  for (let k = 0; k < 16; k++) { if (await p.locator("#storySkip").isVisible().catch(() => false)) { await p.click("#storySkip").catch(() => {}); break; } await p.click("#storyNext").catch(() => {}); await p.waitForTimeout(110); }
  await p.waitForTimeout(900);
  if (await p.evaluate(() => window.SG.G().indoor)) { await p.evaluate(() => window.SG.flow.exitInterior()); await p.waitForTimeout(800); }
  // 대사 닫고 맵이 활성인지 확인
  await p.evaluate(() => { const bx = document.getElementById("dialogBox"); if (bx) bx.classList.remove("show"); });
  await p.waitForTimeout(300);

  const hasGetter = await p.evaluate(() => typeof window.SG.flow._heldDir === "function");
  ok(hasGetter, "SG.flow._heldDir 관측자 노출됨");

  const mapActive = await p.evaluate(() => document.getElementById("map").classList.contains("active"));
  // 방향키 누름(실제 keydown) → heldDir 세팅
  await p.keyboard.down("ArrowUp");
  await p.waitForTimeout(120);
  const held = await p.evaluate(() => window.SG.flow._heldDir());
  ok(held === "up", `방향키 누르면 heldDir 세팅됨 (map활성=${mapActive}, heldDir=${held})`);

  // 포커스 상실(알트탭·앱 전환) — keyup 없이 blur만
  await p.evaluate(() => window.dispatchEvent(new Event("blur")));
  await p.waitForTimeout(120);
  const afterBlur = await p.evaluate(() => window.SG.flow._heldDir());
  ok(!afterBlur, `blur 후 heldDir 해제됨 (heldDir=${afterBlur === null ? "null" : afterBlur})`);

  await p.keyboard.up("ArrowUp");

  // visibilitychange(hidden) 경로도 — 다시 누르고 탭 숨김
  await p.keyboard.down("ArrowDown"); await p.waitForTimeout(120);
  const held2 = await p.evaluate(() => window.SG.flow._heldDir());
  await p.evaluate(() => { Object.defineProperty(document, "hidden", { configurable: true, get: () => true }); document.dispatchEvent(new Event("visibilitychange")); });
  await p.waitForTimeout(120);
  const afterHide = await p.evaluate(() => window.SG.flow._heldDir());
  await p.keyboard.up("ArrowDown");
  ok(held2 === "down" && !afterHide, `탭 숨김(visibilitychange)에도 해제됨 (숨김전=${held2}, 숨김후=${afterHide === null ? "null" : afterHide})`);

  ok(errs.length === 0, `런타임 에러 0 (${errs.length}${errs.length ? ": " + errs[0].slice(0, 50) : ""})`);
  console.log(process.exitCode ? "\n❌ 실패" : "\n🎉 스턱키 방지 통과");
  await b.close(); process.exit(process.exitCode || 0);
})();
