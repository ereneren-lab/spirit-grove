// 회귀 — 감사 3라운드 수정 2건.
//  (1) q_firefly(반딧불) 퀘스트가 영영 안 뜨던 문제: 육아방 서비스 분기가 퀘스트보다 먼저 return해서
//      제공자 daycare의 퀘스트가 죽어 있었다 → 퀘스트 분기를 서비스 분기보다 앞으로.
//  (2) dewdrop(이스리) 진화 표시가 사문화된 evolveLv:34를 보여주던 문제 → 실제 분기 Lv 24 표시.
const { chromium } = require("playwright"); const path = require("path");
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 430, height: 760 } });
  const errs = []; p.on("pageerror", e => errs.push(e.message));
  const ok = (c, m) => { console.log((c ? "  ✅ " : "  ❌ ") + m); if (!c) process.exitCode = 1; };
  await p.goto("file://" + path.resolve(process.argv[2])); await p.waitForTimeout(800);

  // ── (1a) q_firefly 완료(done) 상태 → 육아방이 열린다(퀘스트가 서비스 막지 않음) ──
  const done = await p.evaluate(() => {
    const S = window.SG, F = S.flow; S.setG(S.freshState()); const G = S.G();
    G.quests = { q_firefly: "done" }; G.pos = { x: 13, y: 48 };
    const npc = F.NPCS.find(n => n.id === "daycare");
    F.talkNPC(npc);
    const dc = document.getElementById("daycareOverlay");
    return { daycareOpen: !!(dc && dc.classList.contains("active")) };
  });
  ok(done.daycareOpen, "q_firefly 완료 후엔 육아방이 정상적으로 열린다");

  // ── (1b) q_firefly 미수락(pending) 상태 → 퀘스트를 먼저 제안(육아방 X) ──
  const pending = await p.evaluate(() => {
    const S = window.SG, F = S.flow;
    try { F.closeOverlay && F.closeOverlay("daycareOverlay"); } catch (_) {}
    S.setG(S.freshState()); const G = S.G(); G.pos = { x: 13, y: 48 };   // quests 비움 → q_firefly 미수락
    const npc = F.NPCS.find(n => n.id === "daycare");
    const q = F.questForGiver ? F.questForGiver("daycare") : null;
    F.talkNPC(npc);
    const dlg = document.getElementById("dialogBox");
    const dc = document.getElementById("daycareOverlay");
    return { qOffered: !!(q && q.id === "q_firefly"),
      dialogShown: !!(dlg && dlg.classList.contains("show")),
      daycareOpen: !!(dc && dc.classList.contains("active")),
      text: dlg ? dlg.textContent : "" };
  });
  ok(pending.qOffered, "육아방 제공자에 q_firefly가 대기(questForGiver)");
  ok(pending.dialogShown && !pending.daycareOpen, "미수락 시 육아방 대신 퀘스트 대화를 먼저 띄운다(육아방이 퀘스트를 막지 않음)");

  // ── (2) dewdrop 진화 표시: Lv 24(분기) — Lv 34(사문화) 아님 ──
  const evo = await p.evaluate(() => {
    const S = window.SG, F = S.flow; S.setG(S.freshState());
    const m = S.makeMon("dewdrop", 20);
    F.showMonSummary(m);
    // 진화 줄(🔀로 시작하는 말단 div)만 정확히 집는다 — 요약 전체가 아니라
    const nodes = [...document.querySelectorAll("#summaryOverlay *, #summaryBody *")];
    const line = nodes.map(n => (n.textContent || "").trim()).filter(t => t.startsWith("🔀"))
      .sort((a, b) => a.length - b.length)[0] || "";   // 가장 짧은 = 말단 진화 div
    return { line };
  });
  ok(/Lv\s*24/.test(evo.line), `dewdrop 진화 Lv 24 표시 (${evo.line.trim().slice(0, 60)})`);
  ok(!/Lv\s*34/.test(evo.line), "사문화된 Lv 34를 더는 표시하지 않음");

  ok(errs.length === 0, "런타임 에러 0" + (errs.length ? ": " + errs.slice(0, 3).join(" / ") : ""));
  console.log(process.exitCode ? "\n❌ 실패" : "\n🎉 감사 3라운드 수정 통과");
  await b.close(); process.exit(process.exitCode || 0);
})();
