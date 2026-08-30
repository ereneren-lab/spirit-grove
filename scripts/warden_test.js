// 회귀 — 비경의 파수꾼 4인(신규 지역 도전 트레이너) + 서브퀘스트 q_wildwarden.
const { chromium } = require("playwright"); const path = require("path");
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 430, height: 760 } });
  const errs = []; p.on("pageerror", e => errs.push(e.message));
  await p.goto("file://" + path.resolve(process.argv[2])); await p.waitForTimeout(700);
  const ok = (c, m) => { console.log((c ? "  ✅ " : "  ❌ ") + m); if (!c) process.exitCode = 1; };

  const r = await p.evaluate(async () => {
    const S = window.SG, F = S.flow; const out = {};
    const KEYS = ["MOON", "CRYS", "DESR", "WYVN"];
    // 트레이너 정의: 실존 종·팀 크기·에이스 레벨 상승 순서
    out.trainers = KEYS.map(k => {
      const t = S.TRAINERS[k];
      return { k, exists: !!t, size: t ? t.team.length : 0,
        allExist: t ? t.team.every(m => !!S.byId(m[0])) : false,
        ace: t ? Math.max(...t.team.map(m => m[1])) : 0 };
    });
    // 각 파수꾼이 오버월드 NPC(battleKey)로 배치돼 있다
    out.npcs = KEYS.map(k => {
      const n = (S.NPCS || []).find(x => x.battleKey === k);
      return { k, placed: !!n, hasLines: !!(n && n.lines && n.lines.length), hasAfter: !!(n && n.linesAfter) };
    });
    // 난이도 램프: MOON < CRYS < DESR < WYVN (에이스 레벨)
    const ace = k => Math.max(...S.TRAINERS[k].team.map(m => m[1]));
    out.ramp = ace("MOON") < ace("CRYS") && ace("CRYS") < ace("DESR") && ace("DESR") < ace("WYVN");
    // startTrainer가 파수꾼 보스전을 연다(대표로 WYVN)
    S.setG(S.freshState()); let G = S.G(); G.party = [S.makeMon("foxfire", 45)];
    F.startTrainer("WYVN");
    out.battleOpens = !!(G.trainer && G.trainer.key === "WYVN" && G.trainer.team.length === 4 && G.foe);

    // 서브퀘스트 q_wildwarden: 존재·giver 실존·4인 격파로 완료
    const q = (F.QUESTS || []).find(x => x.id === "q_wildwarden");
    out.questExists = !!q;
    out.giverExists = !!(q && (S.NPCS || []).some(n => n.id === q.giver));
    S.setG(S.freshState()); G = S.G(); G.party = [S.makeMon("foxfire", 45)];
    out.checkBefore = q ? q.check() === false : false;
    KEYS.forEach(k => G.defeated.add(k));
    out.checkAfter = q ? q.check() === true : false;
    out.progStr = q ? (typeof q.prog() === "string" && /4\/4/.test(q.prog())) : false;
    // 부분 진행: 3인만 격파하면 미완
    S.setG(S.freshState()); G = S.G(); ["MOON", "CRYS", "DESR"].forEach(k => G.defeated.add(k));
    out.checkPartial = q ? q.check() === false : false;

    // 격파 시 defeated에 키가 남아 영속(직렬화 왕복)
    S.setG(S.freshState()); G = S.G(); G.party = [S.makeMon("foxfire", 45)];
    KEYS.forEach(k => G.defeated.add(k));
    const ser = F.serialize(); const restored = KEYS.every(k => (ser.defeated || []).includes(k));
    out.serDefeated = restored;
    return out;
  });

  out_check: {
    r.trainers.forEach(t => ok(t.exists && t.size >= 3 && t.allExist, `TRAINERS.${t.k}: ${t.size}마리·전 종 실존`));
    r.npcs.forEach(n => ok(n.placed && n.hasLines && n.hasAfter, `파수꾼 ${n.k} NPC 배치(대사·격파후 대사)`));
    ok(r.ramp, "난이도 램프: 달그림자<수정굴<사막<협곡(에이스 레벨)");
    ok(r.battleOpens, "startTrainer(WYVN)가 4마리 보스전을 연다");
    ok(r.questExists && r.giverExists, "서브퀘스트 q_wildwarden 존재·giver(학자) 실존");
    ok(r.checkBefore && r.checkAfter, "q_wildwarden: 4인 격파 전 미완 → 후 완료");
    ok(r.checkPartial, "q_wildwarden: 3인만 격파하면 미완(전원 필요)");
    ok(r.progStr, "q_wildwarden: 진행도 문자열 4/4");
    ok(r.serDefeated, "파수꾼 격파 상태가 세이브에 영속");
  }
  ok(errs.length === 0, "런타임 에러 0" + (errs.length ? ": " + errs.slice(0, 3).join(" / ") : ""));
  console.log(process.exitCode ? "\n❌ 실패" : "\n🎉 비경의 파수꾼 4인 + 서브퀘스트 통과");
  await b.close(); process.exit(process.exitCode || 0);
})();
