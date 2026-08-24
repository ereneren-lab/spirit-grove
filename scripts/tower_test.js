// 연전 도장(Battle Tower) 회귀 — 챔피언 후 무한 연승 포스트게임.
// 검증: (1) 풀이 DEX tier3에서 파생·전설 제외 (2) 챔피언 게이트 (3) 승리 체이닝(연승·보상)
//       (4) 전멸=도장 종료(워프·소지금 패널티 없음, 번 돈 유지) (5) towerBest 세이브 왕복 (6) NPC 보행 타일.
const { chromium } = require("playwright"); const path=require("path");
let FAIL=false; const ok=(c,m)=>{ console.log((c?"  ✅ ":"  ❌ ")+m); if(!c)FAIL=true; };
(async()=>{ const b=await chromium.launch();
  const p=await b.newPage({viewport:{width:430,height:760}});
  const errs=[]; p.on("pageerror",e=>errs.push(e.message));
  // confirm은 항상 수락(도전 시작)
  p.on("dialog",d=>d.accept());
  await p.goto("file://"+path.resolve(process.argv[2])); await p.waitForTimeout(800);

  const setup=()=>p.evaluate(()=>{ const S=window.SG,F=S.flow; S.setG(S.freshState()); const G=S.G();
    G.party=[S.makeMon("blazelion",52),S.makeMon("tidalore",52),S.makeMon("titanoak",52)];
    G.pos={x:16,y:10}; F.enterMap(true); });

  console.log("[1] 풀 파생 — tier3 27종, 전설 제외");
  await setup();
  const pool=await p.evaluate(()=>{ const F=window.SG.flow; const pl=F.towerPool();
    return { n:pl.length, hasLegend:["dawnwyrm","glaciarch","aqualord","shadowlord","dawnguard"].some(x=>pl.includes(x)),
             sample:pl.includes("blazelion")&&pl.includes("crystalgon") }; });
  ok(pool.n>=20, `풀 ${pool.n}종 (tier3)`);
  ok(!pool.hasLegend, "전설(tier4) 미포함");
  ok(pool.sample, "tier3 최종진화 포함(blazelion·crystalgon)");

  console.log("[2] 챔피언 게이트");
  await setup();
  const gate=await p.evaluate(async()=>{ const S=window.SG,F=S.flow,G=S.G();
    G.champion=false; F.openTower();   // confirm 안 뜸(게이트에서 막힘)
    await new Promise(r=>setTimeout(r,200));
    return { run:!!G.towerRun, inBattle:!!G.inBattle }; });
  ok(!gate.run && !gate.inBattle, "챔피언 아니면 도전 시작 안 됨");

  console.log("[3] 도전 시작 — 회복·연승0·전투 진입");
  const start=await p.evaluate(async()=>{ const S=window.SG,F=S.flow,G=S.G();
    G.champion=true; G.party.forEach(m=>m.hp=Math.floor(m.maxHp*0.3));   // 다친 상태로 시작
    F.towerBegin("party");   // H5-A: 파티 모드 도전 시작(healParty + startTowerBattle)
    await new Promise(r=>setTimeout(r,600));   // transitionToBattle 스왑 대기
    return { run:!!G.towerRun, streak:G.towerStreak, inBattle:!!G.inBattle,
             isTower:!!(G.trainer&&G.trainer.tower), teamN:G.trainer?G.trainer.team.length:0,
             healed:G.party.every(m=>m.hp===m.maxHp), foeLv:G.foe?G.foe.level:0 }; });
  ok(start.run && start.inBattle && start.isTower, "도전 시작 → 도장 전투 진입");
  ok(start.streak===0 && start.teamN===3, `연승 0, 상대 3마리`);
  ok(start.healed, "시작 시 파티 완전 회복");
  ok(start.foeLv===50, `첫 상대 Lv50 (실제 ${start.foeLv})`);

  console.log("[4] 승리 체이닝 — 연승·보상·레벨 램프");
  const win=await p.evaluate(async()=>{ const S=window.SG,F=S.flow,G=S.G();
    G.towerStreak=6; G.towerBest=3; G.money=1000;
    await F.towerWin();   // 7연승째 → 이정표 보너스 + 다음 상대
    await new Promise(r=>setTimeout(r,600));
    return { streak:G.towerStreak, best:G.towerBest, money:G.money,
             candy:G.items.candy||0, nextTower:!!(G.trainer&&G.trainer.tower),
             nextLv:G.foe?G.foe.level:0, inBattle:!!G.inBattle }; });
  ok(win.streak===7, `연승 6→7`);
  ok(win.best===7, `최고 기록 갱신 3→7`);
  ok(win.money===1000+120+7*30, `보상 적립 (${win.money})`);   // 120+7*30=330
  ok(win.candy>=1, "7연승 이정표 보너스(사탕)");
  ok(win.nextTower && win.inBattle, "다음 상대로 이어짐");
  ok(win.nextLv===51, `7연승 후 상대 Lv51 (램프, 실제 ${win.nextLv})`);

  console.log("[5] 전멸 = 도장 종료 (패널티·워프 없음)");
  const loss=await p.evaluate(async()=>{ const S=window.SG,F=S.flow,G=S.G();
    G.money=2000; G.towerStreak=9; G.towerBest=12; G.active=0;
    G.party.forEach(m=>m.hp=0);   // 전멸
    await F.faintMine();   // tower 분기 → endTowerRun
    await new Promise(r=>setTimeout(r,400));
    return { run:!!G.towerRun, inBattle:!!G.inBattle, money:G.money,
             best:G.towerBest, healed:G.party.some(m=>m.hp>0), indoor:G.indoor }; });
  ok(!loss.run && !loss.inBattle, "전멸 → 런 종료·전투 밖");
  ok(loss.money===2000, `소지금 패널티 없음 (${loss.money} 유지)`);   // blackout이면 절반이었을 것
  ok(loss.best===12, "기존 최고 기록 유지(9<12이라 갱신 안 함)");
  ok(loss.healed, "종료 후 파티 회복(제자리)");

  console.log("[6] towerBest 세이브 왕복");
  const save=await p.evaluate(()=>{ const S=window.SG,F=S.flow,G=S.G();
    G.towerBest=15; const blob=F.serialize();
    S.setG(S.freshState()); S.G().party=[S.makeMon("foxfire",5)];
    const okd=F.deserialize(blob);
    return { okd, best:S.G().towerBest }; });
  ok(save.okd && save.best===15, `towerBest 15 보존 (${save.best})`);

  console.log("[7] NPC 배치 — 접근 가능(부딪혀 대화)");
  // NPC가 선 타일 자체는 walkable=false(부딪혀 진입)가 정상 → 바닥이 지형이고 인접칸으로 접근 가능한지 본다.
  const npc=await p.evaluate(()=>{ const S=window.SG,F=S.flow;
    const n=(F.NPCS||[]).find(x=>x.tower); if(!n)return null;
    const base=F.tileAt(n.x,n.y);
    const adj=[[0,1],[0,-1],[1,0],[-1,0]].some(([dx,dy])=>F.walkable(n.x+dx,n.y+dy));
    return {x:n.x,y:n.y,base,ground:base==="g",adj,name:n.name}; });
  ok(npc && npc.ground && npc.adj, `도장 관장 (${npc&&npc.x},${npc&&npc.y}) 지형 '${npc&&npc.base}'·인접 접근 가능 — ${npc&&npc.name}`);

  ok(errs.length===0, "런타임 에러 0"+(errs.length?": "+errs[0]:""));
  console.log(FAIL?"\n❌ 실패":"\n🎉 연전 도장 통과");
  await b.close(); process.exit(FAIL?1:0); })();
