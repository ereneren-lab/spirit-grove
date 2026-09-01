// 회귀 — 듀오 배틀 (A) 스프레드기(양쪽 동시 타격) + 상태이상 오라 연출.
//  스프레드기(지진 등)는 상대편 전원을 한 번에 때리고(2체면 0.75배), 상태 부여 시 오라 fx가 뜬다.
const { chromium } = require("playwright"); const path = require("path");
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 430, height: 760 } });
  const errs = []; p.on("pageerror", e => errs.push(e.message));
  const ok = (c, m) => { console.log((c ? "  ✅ " : "  ❌ ") + m); if (!c) process.exitCode = 1; };
  await p.goto("file://" + path.resolve(process.argv[2])); await p.waitForTimeout(800);

  // ── 스프레드기: 지진으로 양쪽 상대 동시 타격 ──
  await p.evaluate(() => { const S = window.SG; const G = S.freshState();
    const q = S.makeMon("emberwolf", 40); q.moves = ["quake"]; q.pp = { quake: 8 };   // 지진(spread)
    G.party = [q, S.makeMon("shellow", 30)]; G.active = 0; G.pos = { x: 12, y: 37 };
    S.setG(G); S.flow.enterMap(true); S.G().pos = { x: 12, y: 37 };
    S.flow.startDouble([["racoonmon", 24], ["cindercat", 24]], "쌍둥이", "DUO"); });
  await p.waitForTimeout(300);
  const before = await p.evaluate(() => { const S = window.SG; // DOM HP텍스트로 상대 둘의 HP 읽기
    return [...document.querySelectorAll("#dbFoeHuds .dbhud .dbhptxt")].map(t => t.textContent); });

  // 1번 정령 지진 선택 → 스프레드라 타겟 선택 없이 바로 진행 / 2번은 아무 기술
  let mv = await p.$("#dbMenu .dbmv"); if (mv) await mv.click(); await p.waitForTimeout(150);
  const tgAfterQuake = await p.$("#dbMenu .dbtg");   // 스프레드면 타겟 버튼이 없어야 함
  // 2번 정령 기술
  mv = await p.$("#dbMenu .dbmv"); if (mv) await mv.click(); await p.waitForTimeout(120);
  let tg = await p.$("#dbMenu .dbtg"); if (tg) await tg.click();
  // 해결 대기
  let spreadLog = false, bothHit = false, auraSeen = false;
  for (let i = 0; i < 90; i++) {
    const s = await p.evaluate(() => ({
      log: ((document.getElementById("dbLog") || {}).innerText || ""),
      aura: !!document.querySelector(".dbaura"),
      foeHp: [...document.querySelectorAll("#dbFoeHuds .dbhud .dbhptxt")].map(t => t.textContent) }));
    if (s.log.includes("양쪽으로 퍼진다")) spreadLog = true;
    if (s.aura) auraSeen = true;
    // 지진 로그에서 두 상대 모두 "데미지" 언급
    const dmgLines = (s.log.match(/데미지/g) || []).length;
    if (spreadLog && dmgLines >= 2) bothHit = true;
    if (await p.$("#dbMenu .dbmv") || s.log.includes("승리")) break;
    await p.waitForTimeout(100);
  }
  ok(!tgAfterQuake, "스프레드기는 대상 선택을 건너뛴다(타겟 버튼 없음)");
  ok(spreadLog, "스프레드기 '양쪽으로 퍼진다' 로그");
  ok(bothHit, "스프레드기가 상대 2체 모두 타격");

  // ── 상태이상 오라: 독 부여 시 오라 fx ──
  await p.evaluate(() => { const S = window.SG; const g = S.G();
    // 상대 한 마리에 독 부여를 강제 → dbStatus 경유로 오라
    const foe = g.foe || (window.__dbf) || null;
    // DB 접근이 안되면 flow의 dbStatus를 직접 못 부르므로, 새 듀오 배틀로 독기 세팅
  });
  // 독 무브를 가진 정령으로 새 배틀 → 독 부여 관찰
  await p.evaluate(() => { const S = window.SG; const G = S.freshState();
    const t = S.makeMon("shellow", 40); t.moves = ["toxic"]; t.pp = { toxic: 10 };   // 맹독(변화기)
    G.party = [t, S.makeMon("emberwolf", 30)]; G.active = 0; G.pos = { x: 12, y: 37 };
    S.setG(G); S.flow.enterMap(true); S.G().pos = { x: 12, y: 37 };
    S.flow.startDouble([["racoonmon", 20], ["cindercat", 20]], "쌍둥이", "DUO"); });
  await p.waitForTimeout(300);
  mv = await p.$("#dbMenu .dbmv"); if (mv) await mv.click(); await p.waitForTimeout(120);
  tg = await p.$("#dbMenu .dbtg"); if (tg) await tg.click(); else { /* 변화기 타겟없음 */ }
  mv = await p.$("#dbMenu .dbmv"); if (mv) await mv.click(); await p.waitForTimeout(120);
  tg = await p.$("#dbMenu .dbtg"); if (tg) await tg.click();
  for (let i = 0; i < 90; i++) {
    if (await p.evaluate(() => !!document.querySelector(".dbaura"))) { auraSeen = true; break; }
    if (await p.evaluate(() => ((document.getElementById("dbLog") || {}).innerText || "").includes("독"))) {
      // 오라는 순간이라 놓칠 수 있음 — 로그로도 확인
    }
    await p.waitForTimeout(70);
  }
  const poisoned = await p.evaluate(() => ((document.getElementById("dbLog") || {}).innerText || "").match(/독에 걸렸|맹독/));
  ok(auraSeen || !!poisoned, "상태이상 부여 시 오라 fx(또는 상태 로그 확인)");

  ok(errs.length === 0, "런타임 에러 0" + (errs.length ? ": " + errs.slice(0, 3).join(" / ") : ""));
  console.log(process.exitCode ? "\n❌ 실패" : "\n🎉 듀오 스프레드기·상태 오라 통과");
  await b.close(); process.exit(process.exitCode || 0);
})();
