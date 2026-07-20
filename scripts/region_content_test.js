// 지역 콘텐츠 회귀 테스트: 바닥 아이템 · 정령 회관(감정/이름/마사지) · 표지판 · 지역별 NPC
const { chromium } = require("playwright"); const path=require("path");
(async()=>{ const b=await chromium.launch();
  const p=await b.newPage({viewport:{width:430,height:760}});
  const errs=[]; p.on("pageerror",e=>errs.push(e.message));
  await p.goto("file://"+path.resolve(process.argv[2])); await p.waitForTimeout(800);
  const ok=(c,m)=>{ console.log((c?"  ✅ ":"  ❌ ")+m); if(!c)process.exitCode=1; };
  const band=`(y)=> y>=47?0:y>=41?1:y>=34?2:y>=27?3:y>=20?4:y>=12?5:6`;

  /* ===== 바닥 아이템 ===== */
  const ground=await p.evaluate(async(bandSrc)=>{
    const S=window.SG, F=S.flow; S.setG(S.freshState());
    S.CONFIG.reduceMotion=true; S.G().party=[S.makeMon("foxfire",20)]; F.enterMap(true);
    const bd=eval(bandSrc);
    const gi=S.GROUND_ITEMS||[];
    const outdoor=gi.filter(g=>!g.in), indoor=gi.filter(g=>g.in);
    const regs={}; outdoor.forEach(g=>{ const r=bd(g.y); regs[r]=(regs[r]||0)+1; });
    // 보행 가능한 타일 위에 있어야 줍는다. ⚠️ 실내는 좌표계가 달라 해당 인테리어에 들어가서 확인해야 한다.
    const unreachable=outdoor.filter(g=>!F.walkable(g.x,g.y)).map(g=>g.k);
    for(const g of indoor){
      F.enterInterior(F.INTERIORS[g.in]);
      await new Promise(r=>setTimeout(r,50));
      if(!F.walkable(g.x,g.y))unreachable.push(g.k+"@"+g.in);
    }
    // 좌표 중복은 같은 스코프(실외끼리 / 같은 인테리어끼리)에서만 문제다
    const dup=[]; const seen={};
    gi.forEach(g=>{ const k=(g.in||"")+"|"+g.x+","+g.y; if(seen[k])dup.push(k); seen[k]=1; });
    // ⚠️ 인테리어에 들어간 채로 블록을 끝내면 다음 블록의 오버월드 동작이 어긋난다. 반드시 나온다.
    F.exitInterior && F.exitInterior();
    await new Promise(r=>setTimeout(r,500));
    return { n:gi.length, nIn:indoor.length, regs, unreachable, dup,
             kinds:[...new Set(gi.map(g=>g.item))].length,
             inScopes:[...new Set(indoor.map(g=>g.in))], leftIndoor:S.G().indoor };
  }, band);

  const pickup=await p.evaluate(()=>{
    const S=window.SG, F=S.flow; S.setG(S.freshState()); S.CONFIG.reduceMotion=true;
    const G=S.G(); G.party=[S.makeMon("foxfire",10)]; F.enterMap(true);
    const g=S.GROUND_ITEMS[0];
    const before=G.items[g.item]||0;
    const visibleBefore=!!F.groundItemAt(g.x,g.y);
    // 그 칸으로 이동 → onArrived가 줍는다
    G.pos={x:g.x,y:g.y}; F.walkTo(g.x,g.y);
    // walkTo가 같은 칸이면 즉시라 onArrived를 직접 태운다
    if((G.items[g.item]||0)===before){ G.pos={x:g.x,y:g.y}; F.enterMap(false); }
    return { before, g, visibleBefore };
  });

  // 실제 걸어가서 줍기 (한 칸 옆에서 이동)
  const walkPick=await p.evaluate(async()=>{
    const S=window.SG, F=S.flow; S.setG(S.freshState()); S.CONFIG.reduceMotion=true;
    const G=S.G(); G.party=[S.makeMon("foxfire",10)];
    F.enterMap(true);
    // ⚠️ 실외 아이템만, 그리고 "보행 가능한 이웃 칸"이 실제로 있는 것을 골라야 한다.
    //    무턱대고 y+1에 세우면 지도 경계(벽) 위에 서서 이동이 시작조차 안 된다.
    let g=null, from=null;
    for(const cand of S.GROUND_ITEMS){
      if(cand.in||!F.walkable(cand.x,cand.y))continue;
      const nb=[[0,1],[0,-1],[1,0],[-1,0]].map(d=>({x:cand.x+d[0],y:cand.y+d[1]}))
                .find(q=>F.walkable(q.x,q.y));
      if(nb){ g=cand; from=nb; break; }
    }
    // ⚠️ 앞 블록에서 시작된 이동(walkTo)이 아직 살아 있으면 새 상태의 위치를 멋대로 옮긴다.
    //    좌표를 세팅하기 전에 반드시 경로를 끊고 한 박자 쉰다.
    F.stopPath(); await new Promise(r=>setTimeout(r,250));
    G.pos={x:from.x,y:from.y};
    const before=G.items[g.item]||0;
    F.walkTo(g.x,g.y);
    for(let i=0;i<40 && (S.G().items[g.item]||0)===before;i++) await new Promise(r=>setTimeout(r,80));
    const after=S.G().items[g.item]||0;
    const gone=!F.groundItemAt(g.x,g.y);
    const found=(S.G().found||[]).includes(g.k);
    // 두 번 줍히지 않는다
    S.G().pos={x:g.x,y:g.y};
    const again=S.G().items[g.item]||0;
    return { item:g.item, qty:g.qty, before, after, gone, found, again };
  });

  /* ===== 정령 회관 ===== */
  const hall=await p.evaluate(async()=>{
    const S=window.SG, F=S.flow; S.setG(S.freshState()); S.CONFIG.reduceMotion=true;
    const G=S.G(); G.party=[S.makeMon("foxfire",20)]; F.enterMap(true);
    // 오버월드 진입 타일 E
    const spots=[]; for(let y=0;y<50;y++)for(let x=0;x<25;x++){ if(F.tileAt(x,y)==="E")spots.push({x,y}); }
    const blocked=spots.every(s=>!F.walkable(s.x,s.y));
    const reachable=spots.every(s=>[[1,0],[-1,0],[0,1],[0,-1]].some(d=>F.walkable(s.x+d[0],s.y+d[1])));
    const HL=F.INTERIORS.hall;
    F.enterInterior(HL);
    await new Promise(r=>setTimeout(r,400));
    // 세 NPC 좌표 + 접근 가능성
    const npc={}; for(let y=0;y<HL.H;y++)for(let x=0;x<HL.W;x++){ const c=HL.str[y][x]; if("pns".indexOf(c)>=0&&c!==".")npc[c]={x,y}; }
    const walkOk={}, reach={};
    for(const k in npc){ walkOk[k]=!F.walkable(npc[k].x,npc[k].y);
      const pth=F.bfsPath(HL.startX,HL.startY,npc[k].x,npc[k].y+1); reach[k]=!!(pth&&pth.length); }
    return { n:spots.length, blocked, reachable, indoor:S.G().indoor, npc, walkOk, reach,
             W:HL.W, H:HL.H, name:HL.name };
  });

  /* ===== 회관 서비스 ===== */
  const judge=await p.evaluate(()=>{
    const S=window.SG, F=S.flow; S.setG(S.freshState());
    const G=S.G(); const m=S.makeMon("foxfire",20);
    m.ivs={hp:31,atk:31,def:31,spa:31,spDef:31,spd:31}; G.party=[m]; G.active=0;
    const perfect={ tot:F.ivTotal(m), best:F.ivBest(m) };
    const m2=S.makeMon("foxfire",20); m2.ivs={hp:0,atk:0,def:0,spa:0,spDef:0,spd:0}; G.party=[m2];
    const worst={ tot:F.ivTotal(m2), best:F.ivBest(m2) };
    // 감정 대사가 자질에 따라 달라야 한다
    G.party=[m]; F.hallService("p");
    const hi=document.getElementById("dlgText")?document.getElementById("dlgText").textContent:"";
    return { perfect, worst, hiHasText:hi.length>0 };
  });

  const massage=await p.evaluate(async()=>{
    const S=window.SG, F=S.flow; S.setG(S.freshState()); S.CONFIG.reduceMotion=true;
    const G=S.G(); const m=S.makeMon("foxfire",20); m.friendship=40; G.party=[m]; G.active=0;
    F.hallService("s");
    for(let i=0;i<10;i++){ if(F.dialogActive&&F.dialogActive())F.advanceDialog(); await new Promise(r=>setTimeout(r,100)); }
    return { before:40, after:m.friendship };
  });

  /* ===== 인게임 교환 ===== */
  const trade=await p.evaluate(async()=>{
    const S=window.SG, F=S.flow;
    const npc=(S.NPCS||[]).find(n=>n.trade);
    const T=(S.TRADES||S.flow.TRADES)[npc.trade];
    // 원하는 종이 없으면 교환 안 된다
    S.setG(S.freshState()); S.CONFIG.reduceMotion=true;
    let G=S.G(); G.party=[S.makeMon("foxfire",20),S.makeMon("dewdrop",20)];
    F.tradeNPC(npc);
    for(let i=0;i<6;i++){ if(F.dialogActive&&F.dialogActive())F.advanceDialog(); await new Promise(r=>setTimeout(r,80)); }
    const noSwap=S.G().party.some(m=>m.id===T.give);
    // 마지막 한 마리는 못 준다
    S.setG(S.freshState()); G=S.G(); G.party=[S.makeMon(T.want,20)];
    F.tradeNPC(npc);
    for(let i=0;i<6;i++){ if(F.dialogActive&&F.dialogActive())F.advanceDialog(); await new Promise(r=>setTimeout(r,80)); }
    const lastGuard=S.G().party.length===1 && S.G().party[0].id===T.want;
    // 정상 교환
    S.setG(S.freshState()); G=S.G(); G.party=[S.makeMon(T.want,20),S.makeMon("foxfire",20)];
    F.tradeNPC(npc);
    for(let i=0;i<8;i++){ if(F.dialogActive&&F.dialogActive())F.advanceDialog(); await new Promise(r=>setTimeout(r,90)); }
    const got=S.G().party.find(m=>m.id===T.give);
    const gaveAway=!S.G().party.some(m=>m.id===T.want);
    const once=!!(S.G().trades||{})[npc.trade];
    // 두 번째 시도는 거절
    const partyLen=S.G().party.length;
    F.tradeNPC(npc);
    for(let i=0;i<6;i++){ if(F.dialogActive&&F.dialogActive())F.advanceDialog(); await new Promise(r=>setTimeout(r,80)); }
    return { n:(S.NPCS||[]).filter(x=>x.trade).length, want:T.want, give:T.give,
             noSwap:!noSwap, lastGuard, got:!!got, nick:got&&got.nick, friend:got&&got.friendship,
             gaveAway, once, dexed:S.G().caught.has(T.give), stable:S.G().party.length===partyLen };
  });

  /* ===== 표지판 / 지역 NPC ===== */
  const world=await p.evaluate((bandSrc)=>{
    const S=window.SG, F=S.flow; S.setG(S.freshState()); F.enterMap(true);
    const bd=eval(bandSrc);
    const signs={}, npcs={};
    for(let y=0;y<50;y++)for(let x=0;x<25;x++){ if(F.tileAt(x,y)==="P")signs[bd(y)]=(signs[bd(y)]||0)+1; }
    (S.NPCS||[]).forEach(n=>{ if(n.y!=null)npcs[bd(n.y)]=(npcs[bd(n.y)]||0)+1; });
    const emptyNpc=[]; for(let r=0;r<7;r++) if(!npcs[r])emptyNpc.push(r);
    return { signs, npcs, emptyNpc, signTotal:Object.values(signs).reduce((a,b)=>a+b,0) };
  }, band);

  ok(ground.n>=25, `바닥 아이템 ${ground.n}개 (실내 ${ground.nIn}개 포함)`);
  ok(ground.inScopes.length>=4, `실내에도 배치 (${ground.inScopes.join(",")})`);
  ok(Object.keys(ground.regs).length===7, `7개 지역 전부에 배치 (${Object.keys(ground.regs).sort().join(",")})`);
  ok(ground.unreachable.length===0, `전부 보행 가능한 칸 위 (불가 ${ground.unreachable.length}${ground.unreachable.length?": "+ground.unreachable:""})`);
  ok(ground.dup.length===0, `좌표 중복 없음 (${ground.dup.length})`);
  ok(ground.kinds>=8, `도구 종류 ${ground.kinds}가지`);
  ok(pickup.visibleBefore, "줍기 전에는 필드에 보인다");
  ok(walkPick.after===walkPick.before+walkPick.qty, `걸어가면 줍는다 (${walkPick.item} ${walkPick.before}→${walkPick.after})`);
  ok(walkPick.gone, "주운 뒤에는 필드에서 사라진다");
  ok(walkPick.found, "G.found에 기록되어 세이브에 남는다");
  ok(walkPick.again===walkPick.after, "같은 자리를 다시 밟아도 중복으로 안 준다");
  ok(hall.name==="정령 회관" && hall.W<=11, `INTERIORS.hall 정의 (${hall.W}×${hall.H}) — 폭 11 이하라야 화면에 다 들어온다`);
  ok(hall.n>=3, `오버월드에 회관 ${hall.n}곳`);
  ok(hall.blocked && hall.reachable, "회관 입구는 비보행 + 접근 가능");
  ok(hall.indoor==="hall", `진입 시 indoor=hall (${hall.indoor})`);
  ok(Object.keys(hall.npc).length===3, `회관에 서비스 NPC 3인 (${Object.keys(hall.npc).join(",")})`);
  ok(Object.values(hall.walkOk).every(Boolean), "세 NPC 모두 비보행(부딪혀 대화)");
  ok(Object.values(hall.reach).every(Boolean), "세 NPC 모두 앞칸까지 경로 존재 (카운터 소프트락 없음)");
  ok(judge.perfect.tot===186 && judge.worst.tot===0, `IV 합계 계산 (${judge.worst.tot} ~ ${judge.perfect.tot})`);
  ok(judge.perfect.best.v===31 && judge.perfect.best.grade==="완벽해요", `최고 자질 판정 (${judge.perfect.best.k} ${judge.perfect.best.grade})`);
  ok(judge.hiHasText, "감정사 대화가 표시된다");
  ok(massage.after===70, `마사지사가 친밀도 +30 (${massage.before}→${massage.after})`);
  ok(trade.n>=2, `교환 NPC ${trade.n}명`);
  ok(trade.noSwap, "원하는 종이 없으면 교환되지 않는다");
  ok(trade.lastGuard, "마지막 한 마리는 넘겨주지 않는다");
  ok(trade.got && trade.gaveAway, `교환 성립 (${trade.want} → ${trade.give})`);
  ok(trade.nick && trade.friend>=100, `받은 정령은 닉네임·높은 친밀도 (${trade.nick}, ${trade.friend})`);
  ok(trade.dexed, "받은 정령이 도감에 등록된다");
  ok(trade.once && trade.stable, "교환은 1회성 — 두 번째는 거절");
  ok(world.signTotal>=6, `표지판 ${world.signTotal}개`);
  ok(world.emptyNpc.length===0, `NPC 없는 지역 0곳 (지역별 ${JSON.stringify(world.npcs)})`);
  ok(errs.length===0, "런타임 에러 0"+(errs.length?": "+errs.slice(0,3).join(" / "):""));
  console.log(process.exitCode?"\n❌ 실패":"\n🎉 지역 콘텐츠 통과");
  await b.close(); process.exit(process.exitCode||0);
})();
