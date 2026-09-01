// 회귀 — 듀오 전용 보상. 첫 승리엔 소지금 + 고급 정령구 ×2, 재대전(이미 격파)엔 소지금 절반·아이템 없음.
//  예전엔 듀오 승리가 XP만 줬다(단일 트레이너는 소지금·아이템을 준다).
const { chromium } = require("playwright"); const path = require("path");
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 430, height: 760 } });
  const errs = []; p.on("pageerror", e => errs.push(e.message));
  const ok = (c, m) => { console.log((c ? "  ✅ " : "  ❌ ") + m); if (!c) process.exitCode = 1; };
  await p.goto("file://" + path.resolve(process.argv[2])); await p.waitForTimeout(800);

  const startFight = (key, pre) => p.evaluate((args) => {
    const S = window.SG, F = S.flow; const G = S.freshState();
    G.money = 1000; G.items = {}; if (args.pre) G.defeated.add(args.key);
    G.party = [S.makeMon("emberwolf", 60), S.makeMon("skydrake", 60)]; G.active = 0; G.pos = { x: 12, y: 37 };
    S.setG(G); F.enterMap(true); S.G().pos = { x: 12, y: 37 };
    F.startDouble([["seedbean", 5], ["pebblet", 5]], "테스트 듀오", args.key);
    return { money0: S.G().money };
  }, { key, pre });

  async function playToWin() {
    let won = false;
    for (let r = 0; r < 8 && !won; r++) {
      for (let s = 0; s < 2; s++) { const mv = await p.$("#dbMenu .dbmv"); if (!mv) break;
        const isClose = await p.evaluate(() => { const el = document.querySelector("#dbMenu .dbmv"); return el && el.id === "dbClose"; });
        if (isClose) break;   // 이미 승리(계속 버튼) — 이걸 기술로 누르지 않는다
        await mv.click().catch(() => {}); await p.waitForTimeout(130);
        const tg = await p.$("#dbMenu .dbtg"); if (tg) { await tg.click().catch(() => {}); await p.waitForTimeout(130); } }
      for (let i = 0; i < 70; i++) { const st = await p.evaluate(() => ({ over: ((document.getElementById("dbLog") || {}).innerText || "").includes("승리!"),
        menu: !!document.querySelector("#dbMenu .dbmv") })); if (st.over) { won = true; break; } if (st.menu) break; await p.waitForTimeout(90); }
    }
    // 계속 버튼으로 종료 처리
    for (let i = 0; i < 30; i++) { const c = await p.$("#dbClose"); if (c) { await c.click().catch(() => {}); break; } await p.waitForTimeout(80); }
    await p.waitForTimeout(250);
    return won;
  }

  // 첫 승리
  const b0 = await startFight("DUOR", false); await p.waitForTimeout(300);
  const won1 = await playToWin();
  const win1 = await p.evaluate(() => ({ money: window.SG.G().money, gb: (window.SG.G().items.greatball || 0),
    log: ((document.getElementById("dbLog") || {}).innerText || "") }));
  ok(won1, "첫 듀오전 승리");
  ok(win1.money > b0.money0, `첫 승리 소지금 증가 (${b0.money0}→${win1.money})`);
  ok(win1.gb >= 2, `첫 승리 고급 정령구 ×2 지급 (${win1.gb})`);
  ok(/보상:/.test(win1.log), "보상 로그 노출");

  // 재대전(이미 격파)
  const b1 = await startFight("DUOR", true); await p.waitForTimeout(300);
  const won2 = await playToWin();
  const win2 = await p.evaluate(() => ({ money: window.SG.G().money, gb: (window.SG.G().items.greatball || 0) }));
  const gain1 = win1.money - b0.money0, gain2 = win2.money - b1.money0;
  ok(won2, "재대전 승리");
  ok(gain2 > 0 && gain2 < gain1, `재대전 소지금은 절반 수준 (첫 +${gain1}, 재대전 +${gain2})`);
  ok(win2.gb === 0, `재대전엔 아이템 보너스 없음 (${win2.gb})`);

  ok(errs.length === 0, "런타임 에러 0" + (errs.length ? ": " + errs.slice(0, 3).join(" / ") : ""));
  console.log(process.exitCode ? "\n❌ 실패" : "\n🎉 듀오 전용 보상 통과");
  await b.close(); process.exit(process.exitCode || 0);
})();
