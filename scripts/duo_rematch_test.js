// 회귀 — 듀오 재대전(VS 시커). 격파한 듀오 트레이너가 VS 시커로 재대결 대상이 되고,
//  재대전에서 이기면 재대전 플래그가 '소진'돼 무한 재대전이 되지 않는지(단일 트레이너와 동일).
const { chromium } = require("playwright"); const path = require("path");
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 430, height: 760 } });
  const errs = []; p.on("pageerror", e => errs.push(e.message));
  const ok = (c, m) => { console.log((c ? "  ✅ " : "  ❌ ") + m); if (!c) process.exitCode = 1; };
  await p.goto("file://" + path.resolve(process.argv[2])); await p.waitForTimeout(800);

  // 세팅: duo2를 이미 격파한 상태로 두고 맵 진입
  const setup = await p.evaluate(() => {
    const S = window.SG, F = S.flow; S.setG(S.freshState()); const G = S.G();
    S.CONFIG.reduceMotion = true; S.CONFIG.textSpeed = 0.02;
    G.indoor = null; G.defeated.add("DUO2");
    G.party = [S.makeMon("emberwolf", 60), S.makeMon("skydrake", 60)]; G.active = 0; G.pos = { x: 13, y: 37 };
    F.enterMap(true); S.G().pos = { x: 13, y: 37 };
    const duo2 = F.NPCS.find(n => n.id === "duo2");
    const availBefore = F.npcAvailable(duo2);   // 격파 상태 → 재대전 전엔 안 보여야
    return { availBefore };
  });
  ok(setup.availBefore === false, "격파한 듀오는 재대전 전엔 안 나타남");

  // VS 시커 사용 → 재대전 대상 등록
  const afterSeeker = await p.evaluate(() => {
    const S = window.SG, F = S.flow;
    F.applyItemEffect({ use: "vsseeker" });
    const duo2 = F.NPCS.find(n => n.id === "duo2");
    return { wanted: S.G().rematchWanted.has("DUO2"), avail: F.npcAvailable(duo2) };
  });
  ok(afterSeeker.wanted, "VS 시커가 듀오를 재대전 대상으로 등록(rematchWanted)");
  ok(afterSeeker.avail, "재대전 등록 후 듀오가 다시 시야에 나타남(npcAvailable)");

  // 재대전 개전(약한 상대로 빠른 승리) → dbWin 도달
  await p.evaluate(() => {
    const S = window.SG, F = S.flow; S.G().pos = { x: 13, y: 37 };
    F.startDouble([["seedbean", 5], ["pebblet", 5]], "숲의 쌍둥이 리코·리아", "DUO2");
  });
  await p.waitForTimeout(300);
  // 지진(스프레드)로 한 방에 정리 — 아군 2슬롯 모두 첫 기술 선택
  let won = false;
  for (let r = 0; r < 6 && !won; r++) {
    for (let s = 0; s < 2; s++) { const mv = await p.$("#dbMenu .dbmv"); if (!mv) break; await mv.click(); await p.waitForTimeout(130);
      const tg = await p.$("#dbMenu .dbtg"); if (tg) { await tg.click(); await p.waitForTimeout(130); } }
    for (let i = 0; i < 70; i++) { const st = await p.evaluate(() => { const t = (document.getElementById("dbLog") || {}).innerText || "";
      return { over: t.includes("승리!") || t.includes("패배…"), menu: !!document.querySelector("#dbMenu .dbmv") }; });
      if (st.over) { won = true; break; } if (st.menu) break; await p.waitForTimeout(90); }
  }
  // dbClose(계속) 눌러 종료 처리까지
  const cont = await p.$("#dbClose"); if (cont) { await cont.click(); await p.waitForTimeout(300); }

  const afterWin = await p.evaluate(() => {
    const S = window.SG, F = S.flow; const duo2 = F.NPCS.find(n => n.id === "duo2");
    return { won: true, wanted: S.G().rematchWanted.has("DUO2"), avail: F.npcAvailable(duo2), defeated: S.G().defeated.has("DUO2") };
  });
  ok(won, "듀오 재대전에서 승리");
  ok(afterWin.defeated, "재대전 후에도 격파 기록 유지");
  ok(afterWin.wanted === false, "⭐ 재대전 승리 시 재대전 플래그 소진(무한 재대전 방지)");
  ok(afterWin.avail === false, "소진 후 듀오가 다시 사라짐(VS 시커 재사용 필요)");

  ok(errs.length === 0, "런타임 에러 0" + (errs.length ? ": " + errs.slice(0, 3).join(" / ") : ""));
  console.log(process.exitCode ? "\n❌ 실패" : "\n🎉 듀오 재대전(VS 시커) 통과");
  await b.close(); process.exit(process.exitCode || 0);
})();
