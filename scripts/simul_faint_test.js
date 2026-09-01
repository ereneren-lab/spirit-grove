// 회귀 — 동시 기절(트레이너전): 이번 턴에 상대와 내 선두가 함께 쓰러졌을 때,
//  상대는 다음 정령을 내보내고 나는 **즉시 강제 교체**로 넘어가야 한다.
//  버그였던 것: winBattle이 상대만 교체하고 내 죽은 선두로 배틀 메뉴를 열어, "기술을 골랐는데
//  아무 일도 안 일어나는" 한 턴을 허비한 뒤에야 교체가 걸렸다.
const { chromium } = require("playwright"); const path = require("path");
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 430, height: 760 } });
  const errs = []; p.on("pageerror", e => errs.push(e.message));
  const ok = (c, m) => { console.log((c ? "  ✅ " : "  ❌ ") + m); if (!c) process.exitCode = 1; };
  await p.goto("file://" + path.resolve(process.argv[2])); await p.waitForTimeout(800);

  const setup = await p.evaluate(() => {
    const S = window.SG, F = S.flow; S.setG(S.freshState()); const G = S.G();
    S.CONFIG.reduceMotion = true; S.CONFIG.textSpeed = 0.02;
    G.party = [S.makeMon("emberwolf", 30), S.makeMon("shellow", 20)]; G.active = 0;
    F.startTrainer("1");   // G.trainer·G.foe를 동기적으로 세팅(인트로 애니는 비동기라 무시)
    const g = S.G();
    // 동시 기절 상태 재현: 이번 턴 상대 선두와 내 선두가 함께 쓰러졌다고 두고 winBattle 진입
    g.busy = false; g.inBattle = true;
    g.foe.hp = 0;                          // 상대 선두 기절(내 반동기가 막 쓰러뜨림)
    g.party[g.active].hp = 0;              // 내 선두도 반동으로 기절
    return { teamLen: g.trainer ? g.trainer.team.length : 0, foe0: g.foe.id };
  });
  ok(setup.teamLen >= 2, `트레이너가 2마리 이상 (${setup.teamLen})`);

  // winBattle 진입 — 상대는 2번째 정령을 내보내고, 내 죽은 선두는 즉시 강제 교체돼야 한다
  await p.evaluate(() => window.SG.flow.winBattle());
  // 결과 안정화 대기(강제 교체 오버레이 or 메뉴)
  let st = null;
  for (let i = 0; i < 60; i++) {
    st = await p.evaluate(() => { const G = window.SG.G();
      const sw = document.getElementById("switchOverlay");
      return { busy: !!G.busy, meHp: G.party[0] ? G.party[0].hp : null,
        foeId: G.foe ? G.foe.id : null, foeHp: G.foe ? G.foe.hp : null,
        switchOpen: !!(sw && sw.classList.contains("active")),
        inBattle: !!G.inBattle }; });
    if (st.switchOpen || (!st.busy && st.inBattle)) break;
    await p.waitForTimeout(120);
  }

  ok(st.meHp !== null && st.meHp <= 0, `내 선두가 반동으로 기절함 (hp=${st.meHp})`);
  ok(st.foeId && st.foeHp > 0, `상대는 다음 정령을 내보냄 (${st.foeId}, hp ${st.foeHp})`);
  ok(st.switchOpen, `⭐ 죽은 선두로 메뉴가 열리지 않고 즉시 강제 교체 오버레이가 뜸 (switchOpen=${st.switchOpen})`);
  ok(errs.length === 0, `런타임 에러 0 (${errs.length}${errs.length ? ": " + errs[0].slice(0, 60) : ""})`);
  console.log(process.exitCode ? "\n❌ 실패" : "\n🎉 동시 기절(트레이너전) 강제 교체 통과");
  await b.close(); process.exit(process.exitCode || 0);
})();
