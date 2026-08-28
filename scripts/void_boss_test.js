// 회귀 — 포스트게임 슈퍼보스 '각성한 그림자(VOID)' 아크.
const { chromium } = require("playwright"); const path = require("path");
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 430, height: 760 } });
  const errs = []; p.on("pageerror", e => errs.push(e.message));
  await p.goto("file://" + path.resolve(process.argv[2])); await p.waitForTimeout(700);
  const ok = (c, m) => { console.log((c ? "  ✅ " : "  ❌ ") + m); if (!c) process.exitCode = 1; };

  const r = await p.evaluate(async () => {
    const S = window.SG, F = S.flow; const out = {};
    const T = S.TRAINERS.VOID;
    out.exists = !!T;
    out.teamSize = T ? T.team.length : 0;
    out.boss = T ? !!T.boss : false;
    out.maxLv = T ? Math.max(...T.team.map(m => m[1])) : 0;
    out.aceIsShadow = T ? T.team[T.team.length - 1][0] === "shadowlord" : false;
    out.allSpeciesExist = T ? T.team.every(m => !!S.byId(m[0])) : false;

    // NPC cond 게이팅
    const npc = S.NPCS.find(n => n.id === "void_avatar");
    out.npcExists = !!npc && npc.voidBoss === true && typeof npc.cond === "function";
    S.setG(S.freshState()); let G = S.G();
    out.availPreArc = F.npcAvailable(npc);                         // 아크 전 → 숨김
    G.champion = true; G.shadowDone = true; G.questFlags = { haramScene: 1 };
    out.availPostArc = F.npcAvailable(npc);                        // 아크 후 → 출현

    // voidDone 영속
    G.party = [S.makeMon("foxfire", 50)]; G.voidDone = true;
    const ser = F.serialize(); out.serHasVd = ser.voidDone === true;
    G.voidDone = false; F.deserialize(ser); out.restored = S.G().voidDone === true;

    // startTrainer("VOID") 팀 구성
    S.setG(S.freshState()); G = S.G(); G.party = [S.makeMon("foxfire", 55)];
    F.startTrainer("VOID");
    out.battleTeam = G.trainer && G.trainer.team.length;
    out.trainerIsVoid = G.trainer && G.trainer.key === "VOID";
    out.foeSet = !!G.foe;
    // 다이얼로그(인트로) 닫기
    for (let i = 0; i < 4 && F.dialogActive(); i++) F.advanceDialog();

    // 승리 훅: VOID 격파 → voidDone=true, '숲의 인장'(badge) 오발 없음
    S.setG(S.freshState()); G = S.G(); G.party = [S.makeMon("blazelion", 60)];
    G.badge = false; G.voidDone = false; G.money = 1000;
    G.trainer = { key: "VOID", name: "각성한 그림자", em: "🕳️", team: S.TRAINERS.VOID.team, idx: 5, reward: S.TRAINERS.VOID.reward, money: 15000, boss: true, rematch: false, mons: [], fainted: new Set(), switches: 0 };
    G.inBattle = true; G.foe = S.makeMon("shadowlord", 58); G.foe.hp = 0;
    let werr = null; try { await F.trainerDefeated(); } catch (e) { werr = String(e); }
    const g = S.G();
    out.winErr = werr;
    out.voidDoneSet = g.voidDone === true;
    out.noSealMisfire = g.badge === false;   // boss 훅이 오발해 숲의 인장 주면 badge=true가 됨
    out.candyRewarded = (g.items && g.items.candy || 0) >= 3;

    // 발견성: 목표 트래커가 아크 종결 후 슈퍼보스로 안내, 클리어 후 폴백
    const va = S.NPCS.find(n => n.id === "void_avatar");
    const champ = () => { S.setG(S.freshState()); const G = S.G(); G.party = [S.makeMon("foxfire", 55)]; G.badges = ["1", "2", "3", "4"]; G.badge = true; G.lakeDone = true; G.champion = true; G.shadowDone = true; G.questFlags = { haramScene: 1 }; return G; };
    let Gc = champ(); Gc.voidDone = false; const g1 = F.currentGoal();
    out.goalToBoss = !!(g1 && g1.name === "각성한 그림자" && g1.x === va.x && g1.y === va.y);
    Gc = champ(); Gc.voidDone = true; const g2 = F.currentGoal();
    out.goalAfter = g2 && g2.name === "도감 완성";
    Gc = champ(); Gc.shadowDone = false; Gc.voidDone = false; const g3 = F.currentGoal();
    out.goalPreArc = g3 && g3.name === "도감 완성";   // 아크 미완 → 슈퍼보스 안내 안 함
    // 도전과제: void 항목이 voidDone을 검사
    const ACH = window.SG.flow.ACHIEVEMENTS || (typeof ACHIEVEMENTS !== "undefined" ? ACHIEVEMENTS : []);
    const va2 = ACH.find(a => a.id === "void");
    S.setG(S.freshState()); S.G().voidDone = true;
    out.voidAch = !!va2 && va2.check() === true;
    S.G().voidDone = false; out.voidAchOff = va2 ? va2.check() === false : false;
    return out;
  });

  ok(r.exists && r.teamSize === 6 && r.boss, `VOID 트레이너: 6마리·boss (${r.teamSize})`);
  ok(r.maxLv >= 55 && r.aceIsShadow, `챔피언(45) 초과 레벨·에이스 흑요마 (최고 Lv${r.maxLv})`);
  ok(r.allSpeciesExist, "VOID 팀 전 종 실존");
  ok(r.npcExists, "제단 아바타 NPC(void_avatar)가 voidBoss·cond 게이팅");
  ok(r.availPreArc === false && r.availPostArc === true, "아바타는 아크 종결(챔피언+흑요마+하람) 후에만 출현");
  ok(r.serHasVd && r.restored, "voidDone이 저장/복원에 영속");
  ok(r.battleTeam === 6 && r.trainerIsVoid && r.foeSet, "startTrainer(VOID)가 6마리 보스전을 연다");
  ok(!r.winErr && r.voidDoneSet, "VOID 격파 시 voidDone이 세워진다" + (r.winErr ? ": " + r.winErr : ""));
  ok(r.noSealMisfire, "boss 훅 오발 없음(숲의 인장·메인 엔딩 안 뜸)");
  ok(r.candyRewarded, "첫 격파 보상(레어 사탕 등) 지급");
  ok(r.goalToBoss, "발견성: 목표 트래커가 아크 종결 후 슈퍼보스(제단 아바타)로 안내");
  ok(r.goalAfter && r.goalPreArc, "발견성: 클리어 후·아크 미완엔 슈퍼보스 안내 안 함");
  ok(r.voidAch && r.voidAchOff, "도전과제 '근원을 끊다'가 voidDone을 검사한다");
  ok(errs.length === 0, "런타임 에러 0" + (errs.length ? ": " + errs.slice(0, 3).join(" / ") : ""));
  console.log(process.exitCode ? "\n❌ 실패" : "\n🎉 포스트게임 슈퍼보스(각성한 그림자) 통과");
  await b.close(); process.exit(process.exitCode || 0);
})();
