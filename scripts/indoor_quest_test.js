// 실내 트레이너 + 퀘스트 확대 회귀 테스트
const { chromium } = require("playwright"); const path=require("path");
(async()=>{ const b=await chromium.launch();
  const p=await b.newPage({viewport:{width:430,height:760}});
  const errs=[]; p.on("pageerror",e=>errs.push(e.message));
  await p.goto("file://"+path.resolve(process.argv[2])); await p.waitForTimeout(800);
  const ok=(c,m)=>{ console.log((c?"  ✅ ":"  ❌ ")+m); if(!c)process.exitCode=1; };

  /* ===== 실내 트레이너 ===== */
  const tr=await p.evaluate(async()=>{
    const S=window.SG, F=S.flow; S.setG(S.freshState()); S.CONFIG.reduceMotion=true;
    const G=S.G(); G.party=[S.makeMon("foxfire",30)]; F.enterMap(true);
    const want={cave:"r",lavacave:"u",marsh:"v"};
    const out={};
    for(const id in want){
      const ch=want[id]; const I=F.INTERIORS[id];
      let pos=null;
      for(let y=0;y<I.H;y++)for(let x=0;x<I.W;x++) if(I.str[y][x]===ch) pos={x,y};
      F.enterInterior(I); await new Promise(r=>setTimeout(r,220));
      const def=S.TRAINERS[ch];
      const blocked = pos ? !F.walkable(pos.x,pos.y) : null;
      // 이기면 통과할 수 있어야 한다
      S.G().defeated.add(ch);
      const opensAfterWin = pos ? F.walkable(pos.x,pos.y) : null;
      S.G().defeated.delete(ch);
      // 소프트락 방지: 막혀 있어도 입구에서 지도의 다른 곳으로 갈 수 있어야 한다(우회로 존재)
      let detour=false;
      if(pos){ const nb=[[1,0],[-1,0],[0,1],[0,-1]].filter(d=>F.walkable(pos.x+d[0],pos.y+d[1])).length; detour=nb>=2; }
      out[id]={ ch, pos, blocked, opensAfterWin, detour,
                hasDef:!!def, team:def?def.team.length:0, name:def?def.name:null };
      F.exitInterior(); await new Promise(r=>setTimeout(r,320));
    }
    return out;
  });

  /* ===== 트레이너 타일 등록 ===== */
  const tiles=await p.evaluate(()=>{
    const S=window.SG;
    const G=S.GUARD_TILES||"";
    return { guard:G, hasNew:["r","u","v"].every(c=>G.indexOf(c)>=0),
             dupe:[...G].length!==new Set([...G]).size };
  });

  /* ===== 퀘스트 ===== */
  const q=await p.evaluate(()=>{
    const S=window.SG; S.setG(S.freshState());
    const Q=S.QUESTS||[];
    const givers=new Set((S.NPCS||[]).map(n=>n.id));
    const ghost=Q.filter(x=>!givers.has(x.giver)).map(x=>x.id+"→"+x.giver);
    const noReward=Q.filter(x=>!x.reward||!Object.keys(x.reward).length).map(x=>x.id);
    const badText=Q.filter(x=>!x.offer||!x.active||!x.done||!x.title||!x.desc).map(x=>x.id);
    const ids=Q.map(x=>x.id);
    return { n:Q.length, ids, ghost, noReward, badText, dupe:ids.length!==new Set(ids).size };
  });

  // 각 퀘스트의 check/prog가 실제로 동작하는지 (초기엔 미완료, 조건 채우면 완료)
  const qflow=await p.evaluate(()=>{
    const S=window.SG; S.setG(S.freshState());
    const Q=S.QUESTS; const G=S.G();
    G.party=[S.makeMon("foxfire",20)];
    const before={}, after={}, progOk={};
    Q.forEach(x=>{ before[x.id]=!!x.check(); progOk[x.id]=typeof x.prog()==="string" && x.prog().length>0; });
    // 조건 충족
    for(let i=0;i<10;i++)G.caught.add(S.DEX[i].id);
    G.questFlags={waterCaught:true,caveCatch:true,nightCaught:true};
    G.found=["a","b","c","d","e","f"];
    G.party[0].friendship=200;
    ["7","8","9","0","a","b","c","d","e","f"].forEach(k=>G.defeated.add(k));   // q_gauntlet: 견습 전원 격파
    G.berries={};
    // ⚠️ 새 퀘스트를 추가하면 **여기 조건 충족 블록도 같이 채워야 한다** — 안 채우면
    //    "조건을 채우면 완료된다"가 거짓으로 실패한다(게임이 아니라 픽스처 문제).
    G.party.push(S.makeMon("shellow",18), S.makeMon("dustbunny",16));           // q_firstteam: 3마리
    G.caught.add("glowfly");                                                    // q_firefly: 반딧불이 포획
    Q.forEach(x=>{ after[x.id]=!!x.check(); });
    return { before, after, progOk };
  });

  for(const id in tr){
    const t=tr[id];
    ok(t.hasDef && t.team>=2, `${id} 트레이너 정의 (${t.name}, ${t.team}마리)`);
    ok(!!t.pos, `${id} 맵에 배치됨 (${t.pos?t.pos.x+","+t.pos.y:"없음"})`);
    ok(t.blocked===true, `${id} 미격파 시 벽처럼 막는다`);
    ok(t.opensAfterWin===true, `${id} 이기면 통과 가능`);
    ok(t.detour===true, `${id} 우회 가능 — 소프트락 없음`);
  }
  ok(tiles.hasNew, `GUARD_TILES에 r/u/v 등록 (${tiles.guard})`);
  ok(!tiles.dupe, "GUARD_TILES 문자 중복 없음");
  ok(q.n>=6, `퀘스트 ${q.n}개 (예전 3개)`);
  ok(q.ghost.length===0, `퀘스트 의뢰인이 전부 실존 NPC (유령 ${q.ghost.length}${q.ghost.length?": "+q.ghost:""})`);
  ok(q.noReward.length===0, `모든 퀘스트에 보상 (${q.noReward.length})`);
  ok(q.badText.length===0, `모든 퀘스트에 제목·설명·대사 3종 (${q.badText.length})`);
  ok(!q.dupe, "퀘스트 id 중복 없음");
  ok(Object.values(qflow.before).every(v=>v===false), "새 게임에선 전부 미완료");
  ok(Object.values(qflow.after).every(v=>v===true), `조건을 채우면 전부 완료 판정 (${Object.entries(qflow.after).filter(([,v])=>!v).map(([k])=>k)})`);
  ok(Object.values(qflow.progOk).every(Boolean), "모든 퀘스트가 진행도 문자열을 낸다");
  /* ===== q_bond: trade+quest 겸직 NPC에서 퀘스트가 trade에 가려지지 않는가 (감사가 잡은 버그) =====
     trade1은 trade:"tr_forest"와 q_bond 제공자를 겸한다. talkNPC에서 trade 분기가 먼저 return하면
     q_bond가 영영 안 떴다 → 퀘스트 분기를 trade보다 앞에 둬 수정. */
  const bond=await p.evaluate(()=>{
    const S=window.SG, F=S.flow; S.setG(S.freshState()); S.CONFIG.reduceMotion=true;
    const G=S.G(); G.party=[S.makeMon("foxfire",30)]; F.enterMap(true);
    const npc=F.NPCS.find(n=>n.id==="trade1"); G.pos={x:npc.x,y:npc.y+1};
    F.talkNPC(npc);   // 퀘스트가 먼저 떠야 한다(트레이드에 가려지면 X)
    for(let i=0;i<12 && F.dialogActive();i++)F.advanceDialog();   // 대사 진행 = 수락 → cb가 active로
    return { hasTrade:!!npc.trade, active:(S.G().quests&&S.G().quests.q_bond)||null };
  });
  ok(bond.hasTrade, "trade1은 trade와 q_bond를 겸한다(회귀 조건)");
  ok(bond.active==="active", `q_bond가 trade에 가려지지 않고 제공된다 (${bond.active})`);

  ok(errs.length===0, "런타임 에러 0"+(errs.length?": "+errs.slice(0,3).join(" / "):""));
  console.log(process.exitCode?"\n❌ 실패":"\n🎉 실내 트레이너/퀘스트 통과");
  await b.close(); process.exit(process.exitCode||0);
})();
