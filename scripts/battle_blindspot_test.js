// 회귀 — 단일 배틀 블라인드 스팟 수정 2건.
//  (1) 알(isEgg)은 hp:1이라 승리 시 공유 경험치를 먹고 레벨업·진화까지 돌아 손상됐다 → 알 제외.
//  (2) 묶기(_trapped)·헤롱헤롱(_attract)은 걸었던 상대가 기절해 교체되면 풀려야 한다(본가 규칙).
const { chromium } = require("playwright"); const path = require("path");
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 430, height: 760 } });
  const errs = []; p.on("pageerror", e => errs.push(e.message));
  const ok = (c, m) => { console.log((c ? "  ✅ " : "  ❌ ") + m); if (!c) process.exitCode = 1; };
  await p.goto("file://" + path.resolve(process.argv[2])); await p.waitForTimeout(800);

  // ── (1) 알 공유 경험치 제외 ──
  const before = await p.evaluate(() => {
    const S = window.SG, F = S.flow; S.setG(S.freshState()); const G = S.G();
    S.CONFIG.reduceMotion = true; S.CONFIG.textSpeed = 0.02;
    const lead = S.makeMon("emberwolf", 40);
    const egg = S.makeMon("racoonmon", 1); egg.isEgg = true; egg.name = "알"; egg.em = "🥚"; egg.hp = 1; egg.maxHp = 1; egg.xp = 0; egg.level = 1;
    G.party = [lead, egg]; G.active = 0; G.trainer = null;
    G.inBattle = true; G.busy = false;
    G.foe = S.makeMon("seedbean", 6); G.foe.hp = 0;   // 야생 상대 기절 상태로 winBattle 진입
    return { eggLv: egg.level, eggXp: egg.xp, eggId: egg.id, eggIsEgg: egg.isEgg, leadXp: lead.xp, leadLv: lead.level };
  });
  await p.evaluate(() => window.SG.flow.winBattle());
  for (let i = 0; i < 40; i++) { if (!(await p.evaluate(() => window.SG.G().busy))) break; await p.waitForTimeout(120); }
  const after = await p.evaluate(() => { const g = window.SG.G(); const e = g.party[1], l = g.party[0];
    return { eggLv: e.level, eggXp: e.xp, eggId: e.id, eggIsEgg: e.isEgg, eggName: e.name, leadXp: l.xp, leadLv: l.level }; });
  ok(after.eggLv === 1 && after.eggXp === 0, `알은 공유 경험치를 받지 않는다 (Lv${after.eggLv} xp${after.eggXp})`);
  ok(after.eggIsEgg === true && after.eggId === before.eggId && after.eggName === "알", "알 정체성 보존(진화·리캘크 없음)");
  ok(after.leadXp !== before.leadXp || after.leadLv > before.leadLv, "선두는 정상적으로 경험치를 받음(경로 정상)");

  // ── (2) 묶기·헤롱헤롱: 상대 기절 교체 시 해제 ──
  await p.evaluate(() => {
    const S = window.SG, F = S.flow; S.setG(S.freshState()); const G = S.G();
    S.CONFIG.reduceMotion = true; S.CONFIG.textSpeed = 0.02;
    G.party = [S.makeMon("emberwolf", 45)]; G.active = 0;   // 내 선두 튼튼(살아서 교체 브랜치로)
    F.startTrainer("1");   // 2마리 트레이너
    const g = S.G(); g.busy = false; g.inBattle = true;
    const me = g.party[g.active]; me._trapped = 5; me._attract = true;   // 묶임·헤롱헤롱 상태
    g.foe.hp = 0;   // 현재 상대(묶은 장본인) 기절 → 다음 정령 교체 유발
  });
  const trapBefore = await p.evaluate(() => { const me = window.SG.G().party[0]; return { trapped: me._trapped, attract: me._attract }; });
  await p.evaluate(() => window.SG.flow.winBattle());
  let st = null;
  for (let i = 0; i < 60; i++) {
    st = await p.evaluate(() => { const g = window.SG.G(); const me = g.party[0];
      return { busy: !!g.busy, trapped: me._trapped, attract: me._attract, foeHp: g.foe ? g.foe.hp : null, inBattle: !!g.inBattle }; });
    if (!st.busy && st.inBattle && st.foeHp > 0) break;
    await p.waitForTimeout(120);
  }
  ok(trapBefore.trapped === 5, `사전조건: 묶임 상태(_trapped=${trapBefore.trapped})`);
  ok(st.foeHp > 0, `상대가 다음 정령을 내보냄(교체 발생, hp ${st.foeHp})`);
  ok(st.trapped === 0, `상대 기절·교체 시 묶임 해제(_trapped=${st.trapped})`);
  ok(st.attract === false, `상대 기절·교체 시 헤롱헤롱 해제(_attract=${st.attract})`);

  ok(errs.length === 0, "런타임 에러 0" + (errs.length ? ": " + errs.slice(0, 3).join(" / ") : ""));
  console.log(process.exitCode ? "\n❌ 실패" : "\n🎉 단일 배틀 블라인드 스팟 수정 통과");
  await b.close(); process.exit(process.exitCode || 0);
})();
