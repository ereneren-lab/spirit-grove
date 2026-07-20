// 지역 콘텐츠 회귀 테스트: 바닥 아이템 · 정령 회관(감정/이름/마사지) · 표지판 · 지역별 NPC
const { chromium } = require("playwright"); const path=require("path");
(async()=>{ const b=await chromium.launch();
  const p=await b.newPage({viewport:{width:430,height:760}});
  const errs=[]; p.on("pageerror",e=>errs.push(e.message));
  await p.goto("file://"+path.resolve(process.argv[2])); await p.waitForTimeout(800);
  const ok=(c,m)=>{ console.log((c?"  ✅ ":"  ❌ ")+m); if(!c)process.exitCode=1; };
  const band=`(y)=> y>=47?0:y>=41?1:y>=34?2:y>=27?3:y>=20?4:y>=12?5:6`;

  /* ===== 바닥 아이템 ===== */
  const ground=await p.evaluate((bandSrc)=>{
    const S=window.SG, F=S.flow; S.setG(S.freshState()); F.enterMap(true);
    const bd=eval(bandSrc);
    const gi=S.GROUND_ITEMS||[];
    const regs={}; gi.forEach(g=>{ const r=bd(g.y); regs[r]=(regs[r]||0)+1; });
    // 전부 보행 가능한 타일 위에 있어야 줍는다(벽 위에 두면 영영 못 줍는다)
    const unreachable=gi.filter(g=>!F.walkable(g.x,g.y)).map(g=>g.k);
    // 숨겨진 아이템과 좌표가 겹치면 하나가 묻힌다
    const dup=[]; const seen={};
    gi.forEach(g=>{ const k=g.x+","+g.y; if(seen[k])dup.push(k); seen[k]=1; });
    return { n:gi.length, regs, unreachable, dup, kinds:[...new Set(gi.map(g=>g.item))].length };
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
    const g=S.GROUND_ITEMS.find(x=>{ F.enterMap(true); return F.walkable(x.x,x.y); });
    G.pos={x:g.x,y:g.y+1}; F.enterMap(true);
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

  ok(ground.n>=15, `바닥 아이템 ${ground.n}개 배치`);
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
  ok(world.signTotal>=6, `표지판 ${world.signTotal}개`);
  ok(world.emptyNpc.length===0, `NPC 없는 지역 0곳 (지역별 ${JSON.stringify(world.npcs)})`);
  ok(errs.length===0, "런타임 에러 0"+(errs.length?": "+errs.slice(0,3).join(" / "):""));
  console.log(process.exitCode?"\n❌ 실패":"\n🎉 지역 콘텐츠 통과");
  await b.close(); process.exit(process.exitCode||0);
})();
