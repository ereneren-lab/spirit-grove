// 회귀 — 진행/입력 견고성 3건:
//  (1) 트레이드 코드 입력 위생(조작·손상 코드가 비정상 정령을 주입해 전투 소프트락시키지 못함)
//  (2) 누즐록: 알/기절 정령만 든 보관함은 대체 요원이 아니다(마지막 정령 보호 우회 차단)
//  (3) 뉴게임+가 이로치 도감을 유지한다(약속대로)
const { chromium } = require("playwright"); const path = require("path");
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 430, height: 760 } });
  p.on("dialog", d => d.accept());   // confirm() 자동 수락(뉴게임+)
  const errs = []; p.on("pageerror", e => errs.push(e.message));
  await p.goto("file://" + path.resolve(process.argv[2])); await p.waitForTimeout(700);
  const ok = (c, m) => { console.log((c ? "  ✅ " : "  ❌ ") + m); if (!c) process.exitCode = 1; };

  // (1) 트레이드 코드 위생
  const trade = await p.evaluate(() => {
    const S = window.SG, F = S.flow;
    const bad = { id: "foxfire", level: 30000, xp: 0, hp: 99, nature: "brave", shiny: true, held: null, friendship: 0,
      ivs: { hp: 9999, atk: NaN, def: 31, spa: 31, spDef: 31, spd: 31 }, evs: { hp: 9999, atk: 0, def: 0, spa: 0, spDef: 0, spd: 0 },
      gender: "M", moves: ["tackle", "FAKEMOVE", "ember", "___"], pp: {}, uid: 1 };
    const res = F.parseTradeCode(F.tradeCodeFor(bad));
    if (res.err) return { err: res.err };
    const m = res.mon;
    const good = F.parseTradeCode(F.tradeCodeFor(S.makeMon("blazelion", 40)));
    return { lv: m.level, ivHp: m.ivs.hp, evHp: m.evs.hp, movesValid: m.moves.every(k => !!S.MOVES[k]),
      hasMoves: m.moves.length > 0, statsFinite: [m.maxHp, m.atk, m.spa].every(Number.isFinite),
      goodOk: good.mon && good.mon.id === "blazelion" && good.mon.level === 40 };
  });
  ok(trade.lv <= 100 && trade.ivHp <= 31 && trade.evHp <= 252, `조작 코드: 레벨·개체값·노력치 정상 범위로 강제 (lv${trade.lv})`);
  ok(trade.movesValid && trade.hasMoves, "조작 코드: 실존하지 않는 기술 제거(전투 소프트락 방지)");
  ok(trade.statsFinite, "조작 코드: 스탯이 NaN이 아니다");
  ok(trade.goodOk, "정상 코드 왕복은 그대로 동작한다");

  // (2) 누즐록 마지막 정령 보호 — 보관함에 알만 있으면 대체 요원 없음 → 방생 안 됨
  const nuz = await p.evaluate(async () => {
    const S = window.SG, F = S.flow; S.setG(S.freshState()); const G = S.G();
    G.rules = { hardcore: false, nuzlocke: true };
    const last = S.makeMon("foxfire", 20); last.hp = 0;   // 마지막 전투 정령이 방금 기절
    const egg = F.reviveMon({ egg: 1, sp: "aquapup", hatch: 10 });
    G.party = [last]; G.box = [egg]; G.active = 0; G.foe = S.makeMon("mossback", 20); G.inBattle = true; G.busy = false; G.money = 100;
    const graveBefore = (G.graveyard || []).length;
    let err = null; try { await F.faintMine(); } catch (e) { err = String(e); }
    const g = S.G();
    return { err, graveGrew: (g.graveyard || []).length > graveBefore, partyStillHasFoxfire: (g.party || []).some(m => m && m.id === "foxfire") };
  });
  ok(!nuz.err, "누즐록 화이트아웃이 크래시하지 않는다" + (nuz.err ? ": " + nuz.err : ""));
  ok(!nuz.graveGrew && nuz.partyStillHasFoxfire, "누즐록: 알만 남은 보관함에선 마지막 정령이 방생되지 않는다(보호)");

  // (3) 뉴게임+ 이로치 도감 유지
  const ngp = await p.evaluate(async () => {
    const S = window.SG, F = S.flow; S.setG(S.freshState()); const G = S.G();
    G.champion = true; G.party = [S.makeMon("foxfire", 40)];
    G.caught = new Set(["foxfire", "blazelion"]); G.shinyDex = new Set(["blazelion"]);
    if (!F.startNewGamePlus) return { noFn: true };
    try { F.startNewGamePlus(); } catch (e) { return { err: String(e) }; }
    const g = S.G();
    return { ngp: g.ngPlus, shinyKept: g.shinyDex && g.shinyDex.has("blazelion"), caughtKept: g.caught && g.caught.has("blazelion") };
  });
  ok(!ngp.err && !ngp.noFn, "뉴게임+ 실행" + (ngp.err ? " 에러: " + ngp.err : ""));
  ok(ngp.shinyKept && ngp.caughtKept, `뉴게임+가 이로치 도감을 유지한다(회차 ${ngp.ngp})`);

  ok(errs.length === 0, "런타임 에러 0" + (errs.length ? ": " + errs.slice(0, 3).join(" / ") : ""));
  console.log(process.exitCode ? "\n❌ 실패" : "\n🎉 진행/입력 견고성 수정 통과");
  await b.close(); process.exit(process.exitCode || 0);
})();
