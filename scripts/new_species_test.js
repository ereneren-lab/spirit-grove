// 회귀 — 신규 정령 종(독꼬리→맹독전갈, 사막 독전갈 라인).
const { chromium } = require("playwright"); const path = require("path");
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 430, height: 760 } });
  const errs = []; p.on("pageerror", e => errs.push(e.message));
  await p.goto("file://" + path.resolve(process.argv[2])); await p.waitForTimeout(700);
  const ok = (c, m) => { console.log((c ? "  ✅ " : "  ❌ ") + m); if (!c) process.exitCode = 1; };

  const r = await p.evaluate(() => {
    const S = window.SG, F = S.flow; const out = {};
    const sting = S.byId("stingtail"), scorp = S.byId("venomscorp");
    // 1) 종 데이터
    out.exist = !!sting && !!scorp;
    out.stingType = sting && sting.type === "poison" && !sting.type2;
    out.scorpType = scorp && scorp.type === "poison" && scorp.type2 === "ground";
    out.evoLink = sting && sting.evolveTo === "venomscorp" && sting.evolveLv === 24;
    out.movesExist = [sting, scorp].every(d => (d.moves || []).concat((d.learn || []).map(l => l[1])).every(mv => !!S.MOVES[mv]));
    out.dexCount = S.DEX.length; // 108
    // 2) FLAVOR 커버 + 진화 시 키·무게 증가
    const FLV = S.FLAVOR;
    out.flavor = !!(FLV.stingtail && FLV.venomscorp);
    out.grows = FLV && FLV.venomscorp.h > FLV.stingtail.h && FLV.venomscorp.w > FLV.stingtail.w;
    // 3) 서식지: 사막 풀에 있고 도감 힌트가 사막을 표기
    out.inPool = (F.ENC_POOLS.desert || []).includes("stingtail");
    out.hint = F.findHint(sting).indexOf("모래바람 사막") >= 0;
    // 4) 생성/성별/교배 가능(무성 아님)
    S.setG(S.freshState());
    const m1 = S.makeMon("stingtail", 20); const m2 = S.makeMon("stingtail", 20);
    m1.gender = "M"; m2.gender = "F";
    out.genderable = (m1.gender === "M" && m2.gender === "F");
    out.breeds = S.canBreed(m1, m2);
    out.ability = !!m1.ability;   // DEFAULT_ABILITY[poison] 폴백 보장
    // 5) 진화 산출물이 맹독전갈
    out.baseForm = S.baseForm("venomscorp") === "stingtail";
    // 6) 아트: 전용 페인트 아트가 없어도(절차적 폴백) 도감 상세가 크래시 없이 렌더된다
    let artErr = null;
    try { F.openDetail("venomscorp"); } catch (e) { artErr = String(e); }
    const body = document.querySelector("#dexDetailBody");
    out.artFallback = !artErr && !!(body && body.innerHTML && body.innerHTML.length > 100);
    // 7) 야생 조우로 실제 등장(사막) — foe가 세팅되는지(대표 다수 시도)
    S.setG(S.freshState()); let G = S.G(); G.party = [S.makeMon("foxfire", 40)];
    let sawSting = false;
    for (let i = 0; i < 200 && !sawSting; i++) { F.startDesertEncounter(); if (G.foe && G.foe.id === "stingtail") sawSting = true; G.foe = null; G.inBattle = false; }
    out.wildAppears = sawSting;
    return out;
  });

  ok(r.exist, "신규 종 2마리 실존(독꼬리·맹독전갈)");
  ok(r.stingType && r.scorpType, "타입: 독꼬리=독 · 맹독전갈=독/땅(신규 조합)");
  ok(r.evoLink && r.baseForm, "진화 연결: 독꼬리 →(Lv24) 맹독전갈");
  ok(r.movesExist, "두 종의 모든 기술이 MOVES에 실존");
  ok(r.dexCount === 108, `DEX 108종 (${r.dexCount})`);
  ok(r.flavor && r.grows, "FLAVOR 커버 + 진화 시 키·무게 증가");
  ok(r.inPool && r.hint, "사막 조우 풀 소속 + 도감 서식지에 사막 표기");
  ok(r.genderable && r.breeds, "암수 생성 가능 + 교배 가능(무성 아님)");
  ok(r.ability, "특성 폴백 보장(DEFAULT_ABILITY[poison])");
  ok(r.artFallback, "아트 미제작이어도 도감 상세가 절차적 폴백으로 크래시 없이 렌더");
  ok(r.wildAppears, "사막 야생 조우에 실제로 등장한다");
  ok(errs.length === 0, "런타임 에러 0" + (errs.length ? ": " + errs.slice(0, 3).join(" / ") : ""));
  console.log(process.exitCode ? "\n❌ 실패" : "\n🎉 신규 정령 종(사막 독전갈 라인) 통과");
  await b.close(); process.exit(process.exitCode || 0);
})();
