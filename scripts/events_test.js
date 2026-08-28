// 이벤트 회귀 — 밤의 방랑자(시간 게이팅 NPC + 1회 선물) · 날씨 특별 조우(omen).
const { chromium } = require("playwright"); const path = require("path");
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 430, height: 760 } });
  const errs = []; p.on("pageerror", e => errs.push(e.message));
  await p.goto("file://" + path.resolve(process.argv[2])); await p.waitForTimeout(700);
  const ok = (c, m) => { console.log((c ? "  ✅ " : "  ❌ ") + m); if (!c) process.exitCode = 1; };

  // ── 밤의 방랑자 ──
  const nw = await p.evaluate(async () => {
    const S = window.SG, F = S.flow; S.setG(S.freshState()); const G = S.G(); F.enterMap(true);
    const n = S.NPCS.find(x => x.id === "night_wanderer");
    const out = { exists: !!n, condFn: typeof (n && n.cond) === "function", em: n && n.em };
    // cond 게이팅: npcAvailable가 cond 결과를 따른다 (밤이면 보이고 낮이면 숨는다)
    const orig = n.cond;
    n.cond = () => true;  out.availNight = F.npcAvailable(n);
    n.cond = () => false; out.availDay = F.npcAvailable(n);
    n.cond = orig;
    // 선물: 1회만
    G.pos = { x: n.x, y: n.y + 1 };
    const cB = (G.items.candy || 0), bB = (G.items.greatball || 0);
    F.talkNPC(n); for (let i = 0; i < 8 && F.dialogActive(); i++) F.advanceDialog();
    out.flag1 = !!(G.questFlags && G.questFlags.moonGift);
    out.candy1 = (G.items.candy || 0) - cB; out.ball1 = (G.items.greatball || 0) - bB;
    // 재로드 후에도 재지급 안 됨 + chat 순환 크래시 없음
    let err = null;
    try { const s = F.serialize(); F.deserialize(s);
      for (let k = 0; k < 4; k++) { F.talkNPC(n); for (let i = 0; i < 6 && F.dialogActive(); i++) F.advanceDialog(); } }
    catch (e) { err = String(e); }
    out.candyAfter = (S.G().items.candy || 0) - cB; out.talkErr = err;
    return out;
  });
  ok(nw.exists && nw.condFn, "밤의 방랑자 NPC가 존재하고 cond(시간) 게이팅을 쓴다");
  ok(nw.availNight === true && nw.availDay === false, "cond가 참이면 출현·거짓이면 숨는다(밤 전용)");
  ok(nw.flag1 && nw.candy1 === 1 && nw.ball1 === 2, "첫 대화에 선물 1회 지급(레어사탕·고급볼)");
  ok(nw.candyAfter === 1, "재로드 후에도 선물은 재지급되지 않는다(1회 한정)");
  ok(!nw.talkErr, "선물 후 반복 대화가 크래시하지 않는다" + (nw.talkErr ? ": " + nw.talkErr : ""));

  // ── 날씨 특별 조우 ──
  const om = await p.evaluate(() => {
    const S = window.SG, F = S.flow; S.setG(S.freshState()); const G = S.G(); F.enterMap(true);
    G.party = [S.makeMon("foxfire", 20)];
    F.setOwWeather("rain"); const wr = F.weatherOmen();
    F.setOwWeather("clear"); const wc = F.weatherOmen();
    // 지닌물건 비율: 궂은 날씨(omen)에서 더 높아야 한다. transitionToBattle은 비동기 콜백이라
    // startEncounter 직후 G.foe.held는 이미 동기적으로 결정돼 있다.
    const sample = (wx, n) => { F.setOwWeather(wx); let held = 0; for (let i = 0; i < n; i++) { F.startEncounter(0); if (S.G().foe && S.G().foe.held) held++; } return held / n; };
    const N = 300;
    const rainHeld = sample("rain", N);
    const clearHeld = sample("clear", N);
    F.setOwWeather(null);
    return { wr, wc, rainHeld, clearHeld };
  });
  ok(om.wr === "rain" && om.wc === null, "weatherOmen: 궂은 날씨엔 날씨키·맑으면 null");
  ok(om.rainHeld > om.clearHeld + 0.05, `omen: 궂은 날씨에서 지닌물건 보유율↑ (비 ${(om.rainHeld*100|0)}% > 맑음 ${(om.clearHeld*100|0)}%)`);

  ok(errs.length === 0, "런타임 에러 0" + (errs.length ? ": " + errs.slice(0, 3).join(" / ") : ""));
  console.log(process.exitCode ? "\n❌ 실패" : "\n🎉 이벤트(밤 방랑자·날씨 조우) 통과");
  await b.close(); process.exit(process.exitCode || 0);
})();
