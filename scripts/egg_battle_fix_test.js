// 회귀 — 알(egg)이 전투 정령으로 오인되던 3버그 + 분기진화 교배 익스플로잇.
//  (1) firstAliveIdx가 알을 전투 선두로 뽑음 → 스탯 없어 NaN
//  (2) faintMine이 알을 '살아있는 정령'으로 세어 알만 남으면 강제교체 소프트락
//  (3) 예치 가드가 마지막 전투 정령을 알만 남기고 예치 허용 → (1)로 이어짐
//  (4) PRE_EVO가 evolveBranch 대상을 누락 → 분기 최종체 교배 시 최종체 알(베이스폼 우회)
const { chromium } = require("playwright"); const path = require("path");
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 430, height: 760 } });
  const errs = []; p.on("pageerror", e => errs.push(e.message));
  await p.goto("file://" + path.resolve(process.argv[2])); await p.waitForTimeout(700);
  const ok = (c, m) => { console.log((c ? "  ✅ " : "  ❌ ") + m); if (!c) process.exitCode = 1; };

  const r = await p.evaluate(async () => {
    const S = window.SG, F = S.flow; const out = {};
    const mkEgg = () => F.reviveMon({ egg: 1, sp: "foxfire", hatch: 10 });

    // (1) 알이 선두로 뽑히지 않는다 — [egg, fighter]에서 전투 선두 = fighter
    S.setG(S.freshState()); let G = S.G();
    G.party = [mkEgg(), S.makeMon("foxfire", 10)]; G.active = 0;
    F.startEncounter(0);
    out.leadNotEgg = !S.G().party[S.G().active].isEgg;   // 선두가 알이 아니어야
    // 그리고 그 선두로 계산한 데미지가 NaN이 아님
    const lead = S.G().party[S.G().active];
    out.leadDmgOk = !Number.isNaN(S.damage(lead, S.makeMon("mossback", 10), S.MOVES.tackle).dmg);

    // (2) faintMine: 알만 남으면 강제교체(switchOverlay) 대신 화이트아웃 — 오버레이 안 뜬다
    S.setG(S.freshState()); G = S.G();
    const f2 = S.makeMon("foxfire", 10); f2.hp = 0; const egg2 = mkEgg();
    G.party = [f2, egg2]; G.active = 0; G.foe = S.makeMon("mossback", 10); G.inBattle = true; G.busy = false; G.money = 100;
    let ferr = null;
    try { await F.faintMine(); } catch (e) { ferr = String(e); }
    const sw = document.getElementById("switchOverlay");
    out.noForceSwitch = !(sw && sw.classList.contains("active"));
    out.faintErr = ferr;

    // (3) 예치 가드: [fighter, egg]에서 fighter(비-알) 예치 차단 → 파티에 fighter 유지
    S.setG(S.freshState()); G = S.G();
    G.party = [S.makeMon("foxfire", 10), mkEgg()]; G.box = [];
    G.pos = { x: 0, y: 0 };
    // pcAction의 dep 분기를 직접 호출 (pcTab=party, i=0=fighter)
    if (F.setPcTab) try { F.setPcTab("party"); } catch (e) {}
    let derr = null;
    try { F.pcAction && F.pcAction("dep", 0); } catch (e) { derr = String(e); }
    out.fighterStayed = S.G().party.some(m => !m.isEgg);   // 전투 정령이 파티에 남아야
    out.depErr = derr;

    // (4) 분기진화 교배: baseForm + 알 종
    out.baseGlimmertide = S.baseForm("glimmertide");   // dewdrop 기대
    out.baseMoonytide = S.baseForm("moonytide");       // dewdrop 기대
    const fem = Object.assign(S.makeMon("glimmertide", 40), { gender: "F" });
    const mal = Object.assign(S.makeMon("glimmertide", 40), { gender: "M" });
    out.eggBaby = S.hatchEgg(S.makeEgg(fem, mal)).id;  // dewdrop 기대

    // (보너스) 전 종 획득 가능성 — 야생·트레이너·진화·분기·보스 폐포
    const wild = new Set(); for (const k in (F.ENC_POOLS || {})) (F.ENC_POOLS[k] || []).forEach(id => wild.add(id));
    const inTr = new Set(); Object.values(S.TRAINERS || {}).forEach(t => (t.team || []).forEach(m => inTr.add(m[0])));
    const evoT = new Set(); S.DEX.forEach(d => { if (d.evolveTo) evoT.add(d.evolveTo); if (d.evolveBranch) d.evolveBranch.forEach(b => evoT.add(b.to)); });
    const bosses = ["glaciarch", "aqualord", "shadowlord", "dawnguard", "dawnwyrm", "grovespirit", "blazelion", "krakentide"];
    const bset = new Set(bosses);
    const starters = new Set(["foxfire", "aquapup", "sprigil", "leafcub", "embercub", "tidepup"]);
    const unobtain = S.DEX.map(d => d.id).filter(id => !wild.has(id) && !inTr.has(id) && !evoT.has(id) && !bset.has(id) && !starters.has(id));
    out.unobtain = unobtain;

    return out;
  });

  ok(r.leadNotEgg && r.leadDmgOk, "전투 선두로 알이 뽑히지 않는다(NaN 방지)");
  ok(r.noForceSwitch && !r.faintErr, "알만 남으면 강제교체 소프트락 없이 화이트아웃" + (r.faintErr ? ": " + r.faintErr : ""));
  ok(r.fighterStayed && !r.depErr, "마지막 전투 정령은 알만 남기고 예치되지 않는다" + (r.depErr ? ": " + r.depErr : ""));
  ok(r.baseGlimmertide === "dewdrop" && r.baseMoonytide === "dewdrop", `분기진화 종의 베이스폼이 하위폼이다 (윤슬정→${r.baseGlimmertide})`);
  ok(r.eggBaby === "dewdrop", `분기 최종체 교배가 하위폼 알을 낳는다 (${r.eggBaby})`);
  ok(r.unobtain.length === 0, `전 종 획득 가능(진화·분기·보스 폐포 포함) — 미획득: ${r.unobtain.length ? r.unobtain.join(",") : "없음"}`);
  ok(errs.length === 0, "런타임 에러 0" + (errs.length ? ": " + errs.slice(0, 3).join(" / ") : ""));
  console.log(process.exitCode ? "\n❌ 실패" : "\n🎉 알-전투 버그 + 분기교배 수정 통과");
  await b.close(); process.exit(process.exitCode || 0);
})();
