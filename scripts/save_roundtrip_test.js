// 회귀 — 저장/로드 왕복 충실도. 특히 정령의 **특성(ability)** 이 살아남는가.
//  버그였던 것: serMon이 m.ability를 안 담아, 특성 캡슐로 바꾸거나 알에서 물려받은 특성이
//  리로드 때 makeMon 기본값으로 되돌아갔다(플레이어가 쓴 캡슐이 조용히 사라짐).
const { chromium } = require("playwright"); const path = require("path");
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 430, height: 760 } });
  const errs = []; p.on("pageerror", e => errs.push(e.message));
  const ok = (c, m) => { console.log((c ? "  ✅ " : "  ❌ ") + m); if (!c) process.exitCode = 1; };
  await p.goto("file://" + path.resolve(process.argv[2])); await p.waitForTimeout(800);

  const R = await p.evaluate(() => {
    const S = window.SG, F = S.flow;
    S.setG(S.freshState()); const G = S.G();
    // 커스텀 정령 하나 구성 — 종 기본과 "다른" 특성으로 바꾼다(특성 캡슐 시나리오)
    const m = S.makeMon("foxfire", 22);
    const def = m.ability;                       // 종 기본 특성
    const ABK = S.ABILITY_KO || {};
    const alt = Object.keys(ABK).find(a => a !== def) || "guts";
    m.ability = alt; m.nick = "불꽃이"; m.shiny = true; m.held = "leftovers";
    m.ivs = { hp: 31, atk: 30, def: 12, spa: 7, spDef: 20, spd: 5 };
    m.evs = { hp: 4, atk: 8, def: 0, spa: 0, spDef: 0, spd: 2 };
    m.gender = "F"; m.status = "psn"; m._tox = 3; m.hp = 11;
    m.moves = ["ember", "growl"]; m.pp = { ember: 12, growl: 40 };
    G.party = [m]; G.box = [S.makeMon("shellow", 9)];
    G.money = 4242; G.badges = ["1", "2"]; G.caught.add("foxfire"); G.hasSurf = true;

    const snap = { def, alt, ability: m.ability, nick: m.nick, shiny: m.shiny, held: m.held,
      iv: JSON.stringify(m.ivs), ev: JSON.stringify(m.evs), gen: m.gender, status: m.status,
      tox: m._tox, hp: m.hp, lv: m.level, moves: m.moves.join(","), pp: JSON.stringify(m.pp),
      money: G.money, badges: G.badges.join(""), hasSurf: G.hasSurf, box: G.box.length };

    // 직렬화 → 완전 초기화 → 역직렬화
    const ser = F.serialize();
    S.setG(S.freshState());
    const okDe = F.deserialize(JSON.parse(JSON.stringify(ser)));
    const g2 = S.G(); const r = g2.party[0];
    return { okDe, snap, got: r && {
      ability: r.ability, nick: r.nick, shiny: r.shiny, held: r.held,
      iv: JSON.stringify(r.ivs), ev: JSON.stringify(r.evs), gen: r.gender, status: r.status,
      tox: r._tox, hp: r.hp, lv: r.level, moves: (r.moves || []).join(","), pp: JSON.stringify(r.pp),
      money: g2.money, badges: (g2.badges || []).join(""), hasSurf: g2.hasSurf, box: g2.box.length } };
  });

  ok(R.okDe, "deserialize 성공");
  const s = R.snap, g = R.got || {};
  ok(s.alt !== s.def, `테스트 전제: 바꾼 특성이 기본과 다름 (기본=${s.def} → 변경=${s.alt})`);
  ok(g.ability === s.ability, `⭐ 특성 왕복 보존 (저장 ${s.ability} → 복원 ${g.ability})`);
  ok(g.nick === s.nick, `닉네임 보존 (${g.nick})`);
  ok(g.shiny === s.shiny, `이로치 보존 (${g.shiny})`);
  ok(g.held === s.held, `지닌물건 보존 (${g.held})`);
  ok(g.iv === s.iv, `개체값 보존`);
  ok(g.ev === s.ev, `노력치 보존`);
  ok(g.gen === s.gen && g.status === s.status && g.tox === s.tox, `성별·상태·맹독카운터 보존`);
  ok(g.hp === s.hp && g.lv === s.lv, `HP·레벨 보존 (hp ${g.hp}, lv ${g.lv})`);
  ok(g.moves === s.moves && g.pp === s.pp, `기술·PP 보존 (${g.moves})`);
  ok(g.money === s.money && g.badges === s.badges && g.hasSurf === s.hasSurf && g.box === s.box, `진행상태(돈·배지·비전기술·박스) 보존`);
  ok(errs.length === 0, `런타임 에러 0 (${errs.length}${errs.length ? ": " + errs[0].slice(0, 50) : ""})`);
  console.log(process.exitCode ? "\n❌ 실패" : "\n🎉 저장/로드 왕복 충실도 통과");
  await b.close(); process.exit(process.exitCode || 0);
})();
