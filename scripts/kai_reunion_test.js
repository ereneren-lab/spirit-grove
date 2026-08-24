// H5-E 회귀 — 그림자 아크 종결 후 라이벌 카이 재회 NPC.
// ⚠️ 핵심: (1) 재회 카이는 아크를 전부 마친 뒤(챔피언+흑요마+하람 대면)에만 나타나야 한다 —
//   조건이 하나라도 빠지면 안 보이고 그 타일은 걸어서 지날 수 있어야 한다(맵 봉쇄 금지).
//   (2) 반복 대사는 요일 테마를 반영해 변주된다. 이 테스트가 그 경계를 못박는다.
const { chromium } = require("playwright"); const path=require("path");
(async()=>{ const b=await chromium.launch();
  const p=await b.newPage({viewport:{width:430,height:760}});
  const errs=[]; p.on("pageerror",e=>errs.push(e.message));
  await p.goto("file://"+path.resolve(process.argv[2])); await p.waitForTimeout(800);
  const ok=(c,m)=>{ console.log((c?"  ✅ ":"  ❌ ")+m); if(!c)process.exitCode=1; };

  // ── 조건부 등장(cond) + 타일 봉쇄 경계 ──
  const gate=await p.evaluate(()=>{ const S=window.SG,F=S.flow; const kai=S.NPCS.find(n=>n.id==="kai_reunion");
    const out={ found:!!kai, x:kai&&kai.x, y:kai&&kai.y };
    // 아무 조건도 없을 때: 안 보임 + 타일 통행 가능
    S.setG(S.freshState()); let G=S.G();
    out.hiddenFresh=!F.npcAvailable(kai); out.walkFresh=F.walkable(kai.x,kai.y);
    // 챔피언만: 아직 안 보임(부분 조건)
    G.champion=true; out.partial=!F.npcAvailable(kai);
    // 챔피언+흑요마 격파했지만 하람 대면 전: 여전히 안 보임
    G.shadowDone=true; out.noHaram=!F.npcAvailable(kai);
    // 3조건 모두: 등장 + 타일 봉쇄
    G.questFlags={haramScene:1}; out.shown=F.npcAvailable(kai); out.blockAfter=!F.walkable(kai.x,kai.y);
    return out; });
  ok(gate.found, "재회 카이 NPC(kai_reunion)가 존재한다");
  ok(gate.hiddenFresh && gate.walkFresh, "아크 전: 카이는 안 보이고 그 타일은 통행 가능(맵 봉쇄 없음)");
  ok(gate.partial && gate.noHaram, "부분 조건(챔피언·흑요마만)으로는 나타나지 않는다");
  ok(gate.shown, "챔피언+흑요마 격파+하람 대면을 모두 마치면 나타난다");
  ok(gate.blockAfter, "나타난 뒤엔 자기 타일만 차지한다(대화 가능)");

  // ── 첫 대화 = 재회 서사 ──
  const talk=await p.evaluate(async()=>{ const S=window.SG,F=S.flow; const kai=S.NPCS.find(n=>n.id==="kai_reunion");
    S.setG(S.freshState()); const G=S.G(); G.champion=true; G.shadowDone=true; G.questFlags={haramScene:1};
    // talkNPC은 flow에 이미 노출됨
    F.talkNPC(kai); await new Promise(r=>setTimeout(r,30));
    const name=(document.getElementById("dlgName")||{}).textContent;
    const active=F.dialogActive();
    // 페이지 넘겨서 무사히 닫히는지(에러 없이)
    let steps=0; while(F.dialogActive()&&steps<40){ F.advanceDialog(); await new Promise(r=>setTimeout(r,10)); steps++; }
    const closed=!F.dialogActive();
    return { name, active, closed, pages:kai.lines.length, firstLine:kai.lines[0] }; });
  ok(talk.active && talk.name.includes("카이"), "말 걸면 라이벌 카이의 대화가 열린다");
  ok(talk.pages===5 && /여기 있었네/.test(talk.firstLine), "첫 대화는 5쪽짜리 재회 서사다");
  ok(talk.closed, "대화가 에러 없이 끝까지 진행·종료된다");

  // ── 반복 대사(chat 게터)에 요일 테마가 반영된다 ──
  const wk=await p.evaluate(()=>{ const S=window.SG,F=S.flow; const kai=S.NPCS.find(n=>n.id==="kai_reunion");
    S.setG(S.freshState());
    const th=F.dailyTheme(); const chat=kai.chat;
    return { hasThemeLine:chat.some(l=>l.includes(th.name)), n:chat.length, themeName:th.name }; });
  ok(wk.hasThemeLine, `반복 대사에 오늘의 요일 테마('${wk.themeName}')가 들어간다`);
  ok(wk.n>=4, "반복 대사 풀이 충분하다(기본 + 요일 변주)");

  // ── 세이브 왕복이 깨지지 않는다(cond/게터는 직렬화 대상 아님) ──
  const ser=await p.evaluate(()=>{ const S=window.SG,F=S.flow; S.setG(S.freshState()); const G=S.G();
    G.champion=true; G.shadowDone=true; G.questFlags={haramScene:1};
    const j=F.serialize(); F.deserialize(j); const g=S.G();
    return { ok:!!(g.questFlags&&g.questFlags.haramScene) && !!g.champion && !!g.shadowDone }; });
  ok(ser.ok, "세이브 왕복 후에도 아크 종결 플래그가 보존된다");

  ok(errs.length===0, "런타임 에러 0"+(errs.length?": "+errs.slice(0,2).join(" / "):""));
  console.log(process.exitCode?"\n❌ 실패":"\n🎉 카이 재회(H5-E) 통과");
  await b.close(); process.exit(process.exitCode||0);
})();
