// 회귀 — 긴 세션 메모리 누수 감시. 반복되는 UI 흐름(오버레이 열고닫기·전투 진입/종료)이
//  DOM 노드를 정상상태에서 계속 쌓지 않는가.
//
// ⚠️ 측정 방법론(중요):
//   1) 워밍업 — 각 흐름을 먼저 몇 번 돌려 "1회성 DOM 생성"(도감 그리드 등)을 배제한 뒤 기준을 잰다.
//   2) 정리 대기 — 전투 등장 연출(파티클·볼·라벨)은 타이머로 자기 제거된다. 실제 플레이는 연출이
//      끝나야 다음 전투가 시작되지만 테스트는 동기로 몰아치므로, 마지막에 넉넉히 기다려 타이머를 비운다.
//   이 둘을 안 하면 일시적 노드를 "누수"로 오판한다(실제로 그렇게 오판할 뻔했다).
const { chromium } = require("playwright"); const path = require("path");
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 430, height: 760 } });
  const errs = []; p.on("pageerror", e => errs.push(e.message));
  const ok = (c, m) => { console.log((c ? "  ✅ " : "  ❌ ") + m); if (!c) process.exitCode = 1; };
  await p.goto("file://" + path.resolve(process.argv[2])); await p.waitForTimeout(900);
  await p.evaluate(() => { const S = window.SG; S.setG(S.freshState()); const G = S.G();
    G.party = [S.makeMon("foxfire", 15), S.makeMon("shellow", 12)];
    ["foxfire", "shellow", "racoonmon", "sprigfawn"].forEach(id => { G.seen.add(id); G.caught.add(id); });
    G.box = [S.makeMon("sprigfawn", 6)]; G.money = 5000; G.items = { ball: 9, potion: 9, greatball: 5 };
    document.querySelectorAll(".view").forEach(v => v.classList.remove("active")); document.getElementById("map").classList.add("active"); });

  const overlayCycle = () => p.evaluate(() => { const F = window.SG.flow;
    F.renderDex(); F.openOverlay("dexOverlay"); F.closeOverlay("dexOverlay");
    F.openShop(); F.closeOverlay("shopOverlay");
    (F.openPC ? F.openPC() : F.openOverlay("pcOverlay")); F.closeOverlay("pcOverlay");
    F.openOverlay("setOverlay"); F.closeOverlay("setOverlay"); });
  const battleCycle = () => p.evaluate(() => { const S = window.SG, G = S.G();
    G.foe = S.makeMon("racoonmon", 10); G.trainer = null; G.inBattle = true; G.busy = false;
    S.flow.renderCombatants && S.flow.renderCombatants(); S.flow.setupBattleUI && S.flow.setupBattleUI();
    G.inBattle = false; G.foe = null; if (S.flow.showMain) S.flow.showMain(); });
  const nodes = () => p.evaluate(() => document.getElementsByTagName("*").length);

  // 워밍업
  for (let i = 0; i < 3; i++) { await overlayCycle(); await battleCycle(); }
  await p.waitForTimeout(2500);   // 연출 타이머 정리
  const before = await nodes();

  const N = 30;
  for (let i = 0; i < N; i++) { await overlayCycle(); await battleCycle(); }
  await p.waitForTimeout(3000);   // 연출 타이머 정리(전투 N회분)
  const after = await nodes();

  const grew = after - before;
  console.log(`  정상상태 DOM 노드: ${before} → ${after}  (${N}회 반복 후 Δ${grew >= 0 ? "+" : ""}${grew})`);
  // 임계 20 — 소소한 변동은 허용하되 회당 1노드 이상 새면(30회면 30+) 잡는다.
  ok(grew <= 20, `반복 UI 흐름(오버레이 4종·전투) ${N}회에 노드 정상상태 유지 (Δ${grew} ≤ 20)`);
  ok(errs.length === 0, `런타임 에러 0 (${errs.length}${errs.length ? ": " + errs[0].slice(0, 50) : ""})`);
  console.log(process.exitCode ? "\n❌ 실패" : "\n🎉 메모리 누수 없음 통과");
  await b.close(); process.exit(process.exitCode || 0);
})();
