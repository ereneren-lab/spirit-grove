// H5-A-3 회귀 — 보스 재대전(시련).
// ⚠️ 핵심 위험: 시련은 "이미 꺾은 보스"를 연습·보상용으로 다시 부르는 것 —
//   (1) 포획되면 안 되고 (2) 승·패 어느 쪽도 소지금 패널티·워프가 없어야 하며
//   (3) 원본 격파 플래그/서사를 재생하면 안 되고 (4) 시련 상태는 세이브에 새면 안 된다.
//   이 테스트가 그 네 경계를 못박는다.
const { chromium } = require("playwright"); const path=require("path");
(async()=>{ const b=await chromium.launch();
  const p=await b.newPage({viewport:{width:430,height:760}});
  const errs=[]; p.on("pageerror",e=>errs.push(e.message));
  await p.goto("file://"+path.resolve(process.argv[2])); await p.waitForTimeout(800);
  await p.evaluate(()=>{ window.confirm=()=>true; });
  const ok=(c,m)=>{ console.log((c?"  ✅ ":"  ❌ ")+m); if(!c)process.exitCode=1; };

  // ── 레지스트리: 8종 + 잠금/해제 ──
  const reg=await p.evaluate(()=>{ const S=window.SG,F=S.flow; S.setG(S.freshState()); const G=S.G();
    G.champion=true; G.shadowDone=true; G.seaBossDone=true;   // 둘만 해제
    F.bossTrialMenu();
    const rows=[...document.querySelectorAll("#towerBody .bt-row")];
    const unlocked=rows.filter(r=>!r.disabled).map(r=>r.dataset.k);
    const locked=rows.filter(r=>r.disabled).map(r=>r.dataset.k);
    return { n:F.BOSS_TRIALS.length, rows:rows.length, unlocked, locked }; });
  ok(reg.n===8 && reg.rows===8, `보스 재대전 8종 (${reg.n}/${reg.rows})`);
  ok(reg.unlocked.sort().join()==="sea,shadow", `격파한 보스만 선택 가능 (${reg.unlocked})`);
  ok(reg.locked.length===6, "미격파 보스는 잠긴다");

  // ── 미격파 보스는 시작할 수 없다 ──
  const guard=await p.evaluate(()=>{ const S=window.SG,F=S.flow; S.setG(S.freshState()); const G=S.G();
    G.champion=true; G.party=[S.makeMon("foxfire",30)];   // dawnDone 없음
    const t=F.BOSS_TRIALS.find(x=>x.k==="dawn"); F.bossTrialStart(t);
    return { started:!!G._bossTrial, inBattle:!!G.inBattle }; });
  ok(!guard.started && !guard.inBattle, "미격파 보스는 시련을 시작할 수 없다");

  // ── 시작 → 실제 보스 조우 + 포획 차단 ──
  const start=await p.evaluate(async()=>{ const S=window.SG,F=S.flow; S.setG(S.freshState()); const G=S.G();
    G.champion=true; G.snowDone=true; G.party=[S.makeMon("foxfire",30)]; G.money=1000;
    const t=F.BOSS_TRIALS.find(x=>x.k==="snow"); F.bossTrialStart(t);
    await new Promise(r=>setTimeout(r,60));
    const trial=G._bossTrial, foeId=G.foe&&G.foe.id, noTrainer=!G.trainer;
    G.items={ball:5}; await F.tryCatch("ball");   // 시련 중 포획 시도
    return { trial, foeId, noTrainer, ballsLeft:(G.items.ball), caught:(G.caught||new Set()).has("glaciarch") }; });
  ok(start.trial==="snow" && start.foeId==="glaciarch" && start.noTrainer, "시련: 야생 보스(트레이너 아님)로 조우");
  ok(start.ballsLeft===5 && !start.caught, "⭐시련 중엔 포획이 막힌다(볼 소모·포획 없음)");

  // ── 승리: 보상 + 상태 정리 + 원본 플래그 재설정/서사 없음 ──
  const win=await p.evaluate(async()=>{ const S=window.SG,F=S.flow; S.setG(S.freshState()); const G=S.G();
    G.champion=true; G.seaBossDone=true; G.money=1000; G.items={}; G.party=[S.makeMon("foxfire",30)];
    G._bossTrial="sea"; G.foe=S.makeMon("tidalore",50); G.inBattle=true;
    await F.bossTrialWin(); await new Promise(r=>setTimeout(r,40));
    return { cleared:!G._bossTrial, money:G.money, candy:G.items.candy||0,
      partyKept:G.party.length===1 && G.party[0].id==="foxfire", healed:G.party[0].hp===G.party[0].maxHp,
      seaStill:!!G.seaBossDone }; });
  ok(win.cleared, "승리 후 시련 상태가 해제된다");
  ok(win.money>=1800 && win.candy===1, `승리 보상 지급(💰+800·사탕 ×1) (money ${win.money})`);
  ok(win.partyKept && win.healed, "⭐승리 후 내 파티는 그대로·회복된다(정령 손실 X)");
  ok(win.seaStill, "이미 격파한 원본 플래그는 유지(재대전이 되돌리지 않음)");

  // ── 패배(faintMine): 소지금 패널티·워프 없음 ──
  const lose=await p.evaluate(async()=>{ const S=window.SG,F=S.flow; S.setG(S.freshState()); const G=S.G();
    G.champion=true; G.snowDone=true; G.money=1000; G.party=[S.makeMon("foxfire",30)]; G.active=0;
    G._bossTrial="snow"; G.foe=S.makeMon("glaciarch",55); G.inBattle=true; G.party[0].hp=0;
    const posBefore=JSON.stringify(G.pos);
    await F.faintMine(); await new Promise(r=>setTimeout(r,60));
    return { cleared:!G._bossTrial, money:G.money, samePos:JSON.stringify(G.pos)===posBefore,
      partyKept:G.party.length===1 && G.party[0].id==="foxfire", healed:G.party[0].hp>0 }; });
  ok(lose.cleared, "패배 후 시련 상태가 해제된다");
  ok(lose.money===1000, "⭐패배해도 소지금 패널티가 없다");
  ok(lose.samePos && lose.partyKept, "패배해도 워프·정령 손실이 없다");
  ok(lose.healed, "패배 후 파티가 회복된다");

  // ── 시련 상태는 세이브에 새지 않는다(휘발) ──
  const ser=await p.evaluate(()=>{ const S=window.SG,F=S.flow; S.setG(S.freshState()); const G=S.G();
    G._bossTrial="shadow"; const j=JSON.stringify(F.serialize()); return j.indexOf("bossTrial")<0 && j.indexOf("_bossTrial")<0; });
  ok(ser, "G._bossTrial은 세이브에 직렬화되지 않는다(휘발 상태)");

  ok(errs.length===0, "런타임 에러 0"+(errs.length?": "+errs.slice(0,2).join(" / "):""));
  console.log(process.exitCode?"\n❌ 실패":"\n🎉 보스 재대전(시련) 통과");
  await b.close(); process.exit(process.exitCode||0);
})();
