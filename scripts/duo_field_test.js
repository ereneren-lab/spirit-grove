// 회귀 — 듀오(2v2) 배틀 필드 규칙 이식 + AI 개선.
//  단일 배틀엔 있었지만 듀오엔 빠져 있던 규칙: 씨앗 흡수·조이기 잔뎀·날씨 잔뎀·수면 행동불가.
//  그리고 상대 AI가 마무리(KO) 가능한 대상에 화력을 집중하는지.
const { chromium } = require("playwright"); const path = require("path");
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 430, height: 760 } });
  const errs = []; p.on("pageerror", e => errs.push(e.message));
  const ok = (c, m) => { console.log((c ? "  ✅ " : "  ❌ ") + m); if (!c) process.exitCode = 1; };
  await p.goto("file://" + path.resolve(process.argv[2])); await p.waitForTimeout(800);

  const log = () => p.evaluate(() => (document.getElementById("dbLog") || {}).innerText || "");
  // 한 라운드: 살아있는 아군 슬롯마다 첫 기술(필요하면 첫 대상) 선택 → 해결 대기
  async function round() {
    for (let s = 0; s < 2; s++) {
      const mv = await p.$("#dbMenu .dbmv"); if (!mv) break; await mv.click(); await p.waitForTimeout(140);
      const tg = await p.$("#dbMenu .dbtg"); if (tg) { await tg.click(); await p.waitForTimeout(140); }
    }
    for (let i = 0; i < 90; i++) {
      const done = await p.evaluate(() => {
        const t = (document.getElementById("dbLog") || {}).innerText || "";
        return !!document.querySelector("#dbMenu .dbmv") || t.includes("승리!") || t.includes("패배…");
      });
      if (done) break; await p.waitForTimeout(80);
    }
  }

  // ── A) 씨앗 흡수 + 조이기 잔뎀 (한 라운드에 부여+잔뎀 모두 관찰) ──
  await p.evaluate(() => { const S = window.SG; const G = S.freshState();
    const a0 = S.makeMon("emberwolf", 50); a0.moves = ["leechseed"]; a0.pp = { leechseed: 10 };
    const a1 = S.makeMon("skydrake", 50); a1.moves = ["bind"]; a1.pp = { bind: 20 };
    G.party = [a0, a1, S.makeMon("crystalgon", 50)]; G.active = 0; G.pos = { x: 12, y: 37 };
    S.setG(G); S.flow.enterMap(true); S.G().pos = { x: 12, y: 37 };
    S.flow.startDouble([["shellow", 40], ["pebblet", 40]], "쌍둥이", "DUOA"); });
  await p.waitForTimeout(300);
  // 씨뿌리기(acc90)·조이기(acc90)가 빗나갈 수 있어 네 현상이 모두 로그에 남을 때까지 최대 6라운드.
  let t = "";
  const seedSet = () => /씨앗이 심어졌다/.test(t), seedTick = () => /씨앗에 빨렸다/.test(t),
        trapSet = () => /조여져 움직임이 봉쇄/.test(t), trapTick = () => /조이기에 시달린다/.test(t);
  for (let r = 0; r < 6; r++) { await round(); t = await log();
    if (seedSet() && seedTick() && trapSet() && trapTick()) break;
    if (/승리!|패배…/.test(t)) break; }
  ok(seedSet(), "씨뿌리기로 씨앗 부여");
  ok(seedTick(), "씨앗 흡수 잔뎀(라운드 종료)");
  ok(trapSet(), "조이기 부여");
  ok(trapTick(), "조이기 잔뎀(라운드 종료)");

  // ── B) 날씨(싸라기눈) 잔뎀 ──
  await p.evaluate(() => { const S = window.SG; const G = S.freshState();
    const a0 = S.makeMon("emberwolf", 50); a0.moves = ["hailstorm"]; a0.pp = { hailstorm: 5 };   // 불 타입=얼음 아님 → 잔뎀 대상
    const a1 = S.makeMon("racoonmon", 50); a1.moves = ["tackle"]; a1.pp = { tackle: 30 };
    G.party = [a0, a1]; G.active = 0; G.pos = { x: 12, y: 37 };
    S.setG(G); S.flow.enterMap(true); S.G().pos = { x: 12, y: 37 };
    S.flow.startDouble([["shellow", 30], ["pebblet", 30]], "쌍둥이", "DUOB"); });
  await p.waitForTimeout(300); await round();
  t = await log();
  ok(/싸라기눈이 (흩날린다|휘몰아)|싸라기눈/.test(t), "싸라기눈 날씨 발동");
  ok(/싸라기눈에 시달린다/.test(t), "날씨(싸라기눈) 잔뎀 적용");

  // ── C) 수면 = 행동 불가 (dbCanAct) : 양쪽 아군이 수면가루만 사용 → 잠든 상대가 턴을 건너뜀 ──
  await p.evaluate(() => { const S = window.SG; const G = S.freshState();
    const a0 = S.makeMon("skydrake", 55); a0.moves = ["spore"]; a0.pp = { spore: 12 };
    const a1 = S.makeMon("crystalgon", 55); a1.moves = ["spore"]; a1.pp = { spore: 12 };
    G.party = [a0, a1]; G.active = 0; G.pos = { x: 12, y: 37 };
    S.setG(G); S.flow.enterMap(true); S.G().pos = { x: 12, y: 37 };
    S.flow.startDouble([["racoonmon", 16], ["pebblet", 16]], "쌍둥이", "DUOC"); });
  await p.waitForTimeout(300);
  let slept = false;
  for (let r = 0; r < 14 && !slept; r++) { await round(); slept = /새근새근 잠들어/.test(await log()); }
  ok(slept, "수면 상태 상대가 행동을 건너뜀(새근새근)");

  // ── D) AI 화력 집중: 마무리(KO) 가능한 아군에게 몰아친다 ──
  const dRes = await p.evaluate(async () => { const S = window.SG; const G = S.freshState();
    const low = S.makeMon("racoonmon", 40); low.hp = 1;                 // 빈사 → KO 대상
    const hi = S.makeMon("crystalgon", 40);                            // 튼튼 → 비-KO
    low.moves = ["leechseed"]; low.pp = { leechseed: 10 };             // 아군은 상대를 잡지 않게(전투 유지)
    hi.moves = ["leechseed"]; hi.pp = { leechseed: 10 };
    G.party = [low, hi, S.makeMon("emberwolf", 40)]; G.active = 0; G.pos = { x: 12, y: 37 };
    S.setG(G); S.flow.enterMap(true); S.G().pos = { x: 12, y: 37 };
    S.flow.startDouble([["voltsnake", 38], ["sharkfin", 38]], "쌍둥이", "DUOD");
    return { lowMax: low.maxHp, hiMax: hi.maxHp }; });
  await p.waitForTimeout(300);
  // 상대 기술이 빗나가 low가 한 라운드 버틸 수 있으니 KO될 때까지 최대 4라운드(그동안 hi는 살아있는 low에 화력이 쏠려 온전).
  const hpAt = () => p.evaluate(() => { const g = window.SG.G(); return { low: g.party[0].hp, hi: g.party[1].hp, hiMax: g.party[1].maxHp }; });
  let hp = await hpAt();
  for (let r = 0; r < 4 && hp.low > 0; r++) { await round(); hp = await hpAt(); }
  ok(hp.low === 0, "AI가 빈사 아군을 마무리(KO 집중)");
  // low가 죽은 뒤 남은 상대 하나가 유일한 생존자(hi)로 타겟을 옮기는 건 정상. 화력이 hi에 몰리지 않았음(과반 생존)을 확인.
  ok(hp.hi > 0 && hp.hi >= hp.hiMax * 0.5, `KO 불가 아군엔 화력이 몰리지 않음(hi ${hp.hi}/${hp.hiMax})`);

  ok(errs.length === 0, "런타임 에러 0" + (errs.length ? ": " + errs.slice(0, 3).join(" / ") : ""));
  console.log(process.exitCode ? "\n❌ 실패" : "\n🎉 듀오 필드 규칙·AI 통과");
  await b.close(); process.exit(process.exitCode || 0);
})();
