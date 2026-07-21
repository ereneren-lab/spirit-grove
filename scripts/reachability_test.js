// 도달성 증명: 실제 walkable()로 시작 지점부터 BFS해서 모든 콘텐츠에 정말 닿는지 확인한다.
// 시뮬레이션이 아니라 게임이 쓰는 바로 그 함수로 지도를 걸어본다.
//
// 비전기술(파도타기/자르기/괴력)은 진행에 따라 열리므로 단계별로 검사한다:
//   stage0 = 아무 것도 없음 → stage1 = 자르기 → stage2 = 파도타기 → stage3 = 괴력
// 각 콘텐츠가 "어느 단계에서 닿는가"를 뽑고, 끝내 못 닿는 것이 있으면 실패.
const { chromium } = require("playwright"); const path=require("path");
(async()=>{
  // ⚠️ 예외로 죽으면 headless 브라우저가 그대로 남아 자원을 먹는다 → 어떤 경로로든 닫는다.
  let b=null;
  const bail=async(e)=>{ console.log("  ❌ 예외:",e&&e.message||e); try{ if(b)await b.close(); }catch(_){}; process.exit(1); };
  process.on("uncaughtException",bail); process.on("unhandledRejection",bail);
  b=await chromium.launch();
  const p=await b.newPage({viewport:{width:430,height:760}});
  const errs=[]; p.on("pageerror",e=>errs.push(e.message));
  await p.goto("file://"+path.resolve(process.argv[2])); await p.waitForTimeout(800);
  const ok=(c,m)=>{ console.log((c?"  ✅ ":"  ❌ ")+m); if(!c)process.exitCode=1; };

  const R=await p.evaluate(async()=>{
    const S=window.SG, F=S.flow;
    const STAGES=[
      {n:"기본",   set:g=>{ g.hasCut=false; g.hasSurf=false; g.hasStrength=false; g.surfing=false; }},
      {n:"자르기", set:g=>{ g.hasCut=true;  g.hasSurf=false; g.hasStrength=false; }},
      {n:"파도타기",set:g=>{ g.hasCut=true;  g.hasSurf=true;  g.hasStrength=false; }},
      {n:"괴력",   set:g=>{ g.hasCut=true;  g.hasSurf=true;  g.hasStrength=true;  }},
    ];
    // 오버월드 BFS. walkable()이 막는 칸이라도, "부딪혀 상호작용하는" 칸(문·NPC·팻말)은
    // 인접까지만 닿으면 되므로 따로 모은다.
    function sweep(){
      const G=S.G(); const start={x:G.pos.x,y:G.pos.y};
      const seen=new Set([start.x+","+start.y]);
      const adj=new Set();
      const q=[start];
      // ⚠️ walkable()만으로는 비전기술을 볼 수 없다:
      //    파도타기는 물에 부딪혀야 G.surfing이 켜지고, 자르기·괴력은 지형을 실제로 바꾼다.
      //    그래서 보유 플래그에 따라 통행 가능 여부를 직접 모델링한다.
      const g0=S.G();
      const passable=(x,y)=>{
        if(F.walkable(x,y))return true;
        const t=F.tileAt(x,y);
        if(t==="~" && g0.hasSurf)return true;     // 파도타기
        if(t==="x" && g0.hasCut)return true;      // 자르기(덤불 제거)
        if(t==="o" && g0.hasStrength)return true; // 괴력(바위 밀기)
        return false;
      };
      while(q.length){
        const c=q.shift();
        for(const d of [[1,0],[-1,0],[0,1],[0,-1]]){
          const nx=c.x+d[0], ny=c.y+d[1], k=nx+","+ny;
          if(nx<0||ny<0||nx>=25||ny>=50)continue;
          if(seen.has(k))continue;
          if(passable(nx,ny)){ seen.add(k); q.push({x:nx,y:ny}); }
          else adj.add(k);   // 걸어들어갈 수 있는 벽 = 상호작용 대상
        }
      }
      return {walk:seen, bump:adj};
    }
    const out={stages:[],targets:{}};
    const reachedAt={};   // key -> 최초로 닿은 stage index
    const note=(key,si)=>{ if(reachedAt[key]==null)reachedAt[key]=si; };

    for(let si=0; si<STAGES.length; si++){
      S.setG(S.freshState());
      const G=S.G();
      G.party=[S.makeMon("foxfire",30)];
      G.pos={x:8,y:48};              // 마을 시작점
      STAGES[si].set(G);
      F.enterMap(true);
      const {walk,bump}=sweep();
      out.stages.push({name:STAGES[si].n, walkable:walk.size, bumpable:bump.size});

      const canGet=(x,y)=>walk.has(x+","+y)||bump.has(x+","+y);
      // 체육관 4곳
      for(const k in F.GYM_AT){ const [x,y]=k.split(",").map(Number); if(canGet(x,y))note("gym:"+F.GYM_AT[k],si); }
      // 타일 기반 시설
      for(let y=0;y<50;y++)for(let x=0;x<25;x++){
        const t=F.tileAt(x,y);
        if(!canGet(x,y))continue;
        if(t==="+")note("center:"+x+","+y,si);
        if(t==="E")note("hall:"+x+","+y,si);
        if(t==="S")note("shop:"+x+","+y,si);
        if(t==="U")note("league",si);
        if(t==="X")note("altar",si);
        if(t==="D")note("cave",si);
        if(t==="V")note("lavacave",si);
        if(t==="M")note("snowfield",si);
        if(t==="J")note("marsh",si);
        if(t==="O")note("skyridge",si);
        if(t==="W")note("coast",si);
        if(t==="P")note("sign:"+x+","+y,si);
      }
      // 필드 도구(실외)
      (S.GROUND_ITEMS||[]).forEach(g=>{ if(!g.in && walk.has(g.x+","+g.y))note("item:"+g.k,si); });
      // 숨겨진 도구도 밟아야 하므로 walkable이어야 한다
      // NPC/트레이너 (부딪혀 대화)
      (S.NPCS||[]).forEach(n=>{ if(n.x==null)return; if(canGet(n.x,n.y))note("npc:"+n.id,si); });
    }
    out.reachedAt=reachedAt;

    // 전체 목록(닿았든 아니든)을 만들어 미도달을 계산
    S.setG(S.freshState()); S.G().party=[S.makeMon("foxfire",30)];
    S.G().pos={x:8,y:48}; S.G().hasCut=S.G().hasSurf=S.G().hasStrength=true; F.enterMap(true);
    const all=[];
    for(const k in F.GYM_AT)all.push("gym:"+F.GYM_AT[k]);
    for(let y=0;y<50;y++)for(let x=0;x<25;x++){ const t=F.tileAt(x,y);
      if(t==="+")all.push("center:"+x+","+y); if(t==="E")all.push("hall:"+x+","+y);
      if(t==="S")all.push("shop:"+x+","+y);   if(t==="P")all.push("sign:"+x+","+y);
      if(t==="U")all.push("league"); if(t==="X")all.push("altar"); if(t==="D")all.push("cave");
      if(t==="V")all.push("lavacave"); if(t==="M")all.push("snowfield"); if(t==="J")all.push("marsh"); if(t==="O")all.push("skyridge"); if(t==="W")all.push("coast"); }
    (S.GROUND_ITEMS||[]).forEach(g=>{ if(!g.in)all.push("item:"+g.k); });
    (S.NPCS||[]).forEach(n=>{ if(n.x!=null)all.push("npc:"+n.id); });
    out.all=[...new Set(all)];
    out.unreached=out.all.filter(k=>reachedAt[k]==null);
    return out;
  });

  /* ===== 인테리어 내부 도달성 ===== */
  const IN=await p.evaluate(async()=>{
    const S=window.SG, F=S.flow;
    const out={};
    for(const id in F.INTERIORS){
      const I=F.INTERIORS[id];
      S.setG(S.freshState()); const G=S.G();
      G.party=[S.makeMon("foxfire",30)];
      // 모든 가드를 격파한 상태 = 최대 개방
      "0123456789abcdefijklqruvyXANS".split("").forEach(c=>G.defeated.add(c));
      F.enterInterior(I);
      // ⚠️ enterInterior는 warpFade로 150ms 지연 스왑이다. 덜 기다리면
      //    walkable()이 아직 오버월드를 보고 있어 전부 미도달로 잡힌다.
      for(let w=0; w<40 && S.G().indoor!==id; w++) await new Promise(r=>setTimeout(r,50));
      await new Promise(r=>setTimeout(r,80));
      const start={x:I.startX,y:I.startY};
      const seen=new Set([start.x+","+start.y]); const bump=new Set(); const q=[start];
      while(q.length){ const c=q.shift();
        for(const d of [[1,0],[-1,0],[0,1],[0,-1]]){
          const nx=c.x+d[0], ny=c.y+d[1], k=nx+","+ny;
          if(nx<0||ny<0||nx>=I.W||ny>=I.H||seen.has(k))continue;
          if(F.walkable(nx,ny)){ seen.add(k); q.push({x:nx,y:ny}); } else bump.add(k); } }
      // 이 인테리어의 아이템/NPC/가드가 전부 닿는가
      const miss=[];
      (S.GROUND_ITEMS||[]).forEach(g=>{ if(g.in===id && !seen.has(g.x+","+g.y))miss.push("item:"+g.k); });
      for(let y=0;y<I.H;y++)for(let x=0;x<I.W;x++){
        const ch=I.str[y][x];
        if("NpnsBKHLZY@&AQ".indexOf(ch)>=0 && ch!=="." && !seen.has(x+","+y) && !bump.has(x+","+y))
          miss.push("tile:"+ch+"@"+x+","+y);
        if(F.GUARD_TILES.indexOf(ch)>=0 && ch!=="" && !seen.has(x+","+y) && !bump.has(x+","+y))
          miss.push("guard:"+ch+"@"+x+","+y);
      }
      out[id]={walk:seen.size, miss};
      F.exitInterior();
      for(let w=0; w<40 && S.G().indoor; w++) await new Promise(r=>setTimeout(r,50));
      await new Promise(r=>setTimeout(r,120));
    }
    return out;
  });

  console.log("\n  [단계별 도달 범위]");
  R.stages.forEach(s=>console.log(`    ${s.name.padEnd(5)} 보행 ${String(s.walkable).padStart(4)}칸 · 상호작용 ${s.bumpable}칸`));

  const byStage={};
  for(const k in R.reachedAt){ const s=R.reachedAt[k]; (byStage[s]=byStage[s]||[]).push(k); }
  console.log("\n  [비전기술 단계별로 새로 열리는 것]");
  ["기본","자르기","파도타기","괴력"].forEach((nm,i)=>{
    const list=byStage[i]||[];
    const gates=list.filter(k=>!k.startsWith("item:")&&!k.startsWith("npc:")&&!k.startsWith("sign:"));
    console.log(`    ${nm.padEnd(5)} +${String(list.length).padStart(3)}개  ${gates.slice(0,8).join(", ")||"(도구·NPC만)"}`);
  });

  console.log("");
  ok(R.unreached.length===0, `오버월드 콘텐츠 ${R.all.length}개 전부 도달 가능 (미도달 ${R.unreached.length}${R.unreached.length?": "+R.unreached.slice(0,8).join(", "):""})`);
  ok((byStage[0]||[]).some(k=>k==="gym:gym1"), "체육관1은 비전기술 없이 도달 가능");
  ok(R.reachedAt["league"]!=null, "정령 리그 도달 가능");
  ok(R.reachedAt["altar"]!=null, "군주의 제단 도달 가능");
  const centers=R.all.filter(k=>k.startsWith("center:"));
  ok(centers.every(k=>R.reachedAt[k]!=null), `정령센터 ${centers.length}곳 전부 도달 가능`);
  const halls=R.all.filter(k=>k.startsWith("hall:"));
  ok(halls.every(k=>R.reachedAt[k]!=null), `정령 회관 ${halls.length}곳 전부 도달 가능`);
  const items=R.all.filter(k=>k.startsWith("item:"));
  ok(items.every(k=>R.reachedAt[k]!=null), `실외 필드 도구 ${items.length}개 전부 도달 가능`);
  const npcs=R.all.filter(k=>k.startsWith("npc:"));
  ok(npcs.every(k=>R.reachedAt[k]!=null), `NPC ${npcs.length}명 전부 도달 가능`);

  console.log("\n  [인테리어 내부]");
  let inBad=0;
  for(const id in IN){ const v=IN[id];
    if(v.miss.length){ inBad++; console.log(`    ❌ ${id}: ${v.miss.join(", ")}`); }
  }
  ok(inBad===0, `인테리어 ${Object.keys(IN).length}곳 내부 콘텐츠 전부 도달 가능`);
  ok(errs.length===0, "런타임 에러 0"+(errs.length?": "+errs.slice(0,3).join(" / "):""));
  console.log(process.exitCode?"\n❌ 실패":"\n🎉 도달성 통과");
  await b.close(); process.exit(process.exitCode||0);
})();
