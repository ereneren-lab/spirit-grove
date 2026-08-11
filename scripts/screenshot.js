// 정령의 숲을 실제 Chromium으로 띄워 주요 화면을 스크린샷으로 캡처한다.
//   node shoot.js <dist.html> <outdir>
const { chromium } = require("playwright");
const path = require("path");

(async () => {
  const file = "file://" + path.resolve(process.argv[2]);
  const out = process.argv[3];
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 430, height: 760 }, deviceScaleFactor: 2 });
  const errors = [];
  page.on("pageerror", e => errors.push(e.message));
  await page.goto(file);
  await page.waitForTimeout(1200);

  const shot = name => page.screenshot({ path: path.join(out, name + ".png") });
  const tap = async sel => { await page.click(sel).catch(() => {}); await page.waitForTimeout(500); };

  // 타이틀
  await shot("01-title");

  // 새 게임 → 캐릭터 선택
  await tap("#newGameBtn");
  await shot("02-charsel");
  // 첫 캐릭터 카드 선택 후 다음
  await page.locator("#charRow .pick-card").first().click().catch(() => {});
  await page.waitForTimeout(300);
  await tap("#confirmChar");
  await shot("03-starter");
  // 스타터 선택 후 확정
  await page.locator("#starterRow .pick-card").first().click().catch(() => {});
  await page.waitForTimeout(300);
  await tap("#confirmStarter");
  await page.waitForTimeout(800);
  await shot("04-story");

  // 스토리 건너뛰기
  for (let i = 0; i < 10; i++) {
    const skip = await page.locator("#storySkip").isVisible().catch(() => false);
    if (skip) { await page.click("#storySkip").catch(() => {}); break; }
    await page.click("#storyNext").catch(() => {});
    await page.waitForTimeout(200);
  }
  await page.waitForTimeout(1500);
  await shot("05-house-or-map");

  // 집에서 나오기: 아래로 걸어 문(=출구)으로. 대화가 있으면 넘기기.
  for (let i = 0; i < 6; i++) { await page.click("#dlgText").catch(() => {}); await page.click("#dialogBox").catch(() => {}); await page.waitForTimeout(250); }
  await shot("06-after-dialog");

  // 강제로 첫 전투 진입: 콘솔에서 startEncounter 호출
  await page.evaluate(() => { try { if (window.SG && window.SG.G && window.SG.G()) { window.SG.flow.startEncounter(0.1); } } catch (e) {} });
  await page.waitForTimeout(1400);
  await shot("07-battle");

  // 기술 메뉴 (코치 하이라이트 확인)
  await page.click('#mainMenu [data-act="fight"]').catch(() => {});
  await page.waitForTimeout(700);
  await shot("08-moves-coach");

  console.log(errors.length ? "⚠️ 페이지 에러 " + errors.length + "건:\n  " + errors.slice(0, 3).join("\n  ") : "✅ 런타임 에러 0건");
  await browser.close();
})();
