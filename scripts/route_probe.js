// 지선 루트 입구 후보 탐색 — 게임이 쓰는 **실제 `walkable()`** 로 BFS해서
// "도달 가능한 칸에 붙어 있는 벽(#) 타일"을 지역 밴드별로 뽑는다(일회성 도구).
// ⚠️ 수동 BFS 근사로 좌표를 찍으면 고립 포켓을 못 걸러낸다(CLAUDE.md에 기록된 함정).
const { chromium } = require("playwright"); const path=require("path");
(async()=>{
  const b=await chromium.launch(); const p=await b.newPage({viewport:{width:430,height:760}});
  await p.goto("file://"+path.resolve(process.argv[2])); await p.waitForTimeout(900);
  await p.evaluate(()=>{ const S=window.SG,G=S.freshState();
    G.party=[S.makeMon("foxfire",50)]; S.setG(G); S.flow.enterMap(true); });
  await p.waitForTimeout(500);
  const out=await p.evaluate(()=>{ const F=window.SG.flow,G=window.SG.G();
    const seen=new Set([G.pos.x+","+G.pos.y]), q=[[G.pos.x,G.pos.y]];
    while(q.length){ const [x,y]=q.shift();
      for(const [dx,dy] of [[0,1],[0,-1],[1,0],[-1,0]]){ const nx=x+dx,ny=y+dy,k=nx+","+ny;
        if(seen.has(k)||!F.walkable(nx,ny))continue; seen.add(k); q.push([nx,ny]); } }
    const taken=new Set(Object.keys(F.ROUTE_AT));
    (window.SG.GROUND_ITEMS||[]).forEach(g=>{ if(!g.in)taken.add(g.x+","+g.y); });
    (F.HIDDEN||[]).forEach(h=>{ if(!h.in)taken.add(h.x+","+h.y); });
    const band=y=>y>=47?0:y>=41?1:y>=34?2:y>=27?3:y>=20?4:y>=12?5:6;
    const cand={};
    for(let y=1;y<49;y++)for(let x=1;x<24;x++){
      const k=x+","+y; if(taken.has(k))continue;
      if(F.tileAt(x,y)!=="#")continue;                       // 벽만(→ $ 로 바꿔도 통행성 불변)
      const nb=[[0,1],[0,-1],[1,0],[-1,0]].filter(([dx,dy])=>seen.has((x+dx)+","+(y+dy)));
      if(!nb.length)continue;                                 // 도달 가능한 칸에 붙어 있어야 부딪힐 수 있다
      const front=seen.has(x+","+(y+1));                      // 아래에서 접근 가능하면 제일 자연스럽다
      (cand[band(y)]=cand[band(y)]||[]).push({k,front,nb:nb.length});
    }
    const cur={}; Object.keys(F.ROUTE_AT).forEach(k=>{ const [x,y]=k.split(",").map(Number);
      (cur[F.ROUTE_AT[k].id]=cur[F.ROUTE_AT[k].id]||[]).push(k+" (밴드"+band(y)+", 타일 "+F.tileAt(x,y)+")"); });
    return {cand,cur,reach:seen.size};
  });
  console.log("도달 칸 "+out.reach+"개");
  console.log("\n현재 루트:"); Object.keys(out.cur).forEach(id=>console.log("  "+id.padEnd(10)+out.cur[id].join("  ↔  ")));
  console.log("\n밴드별 입구 후보(벽 타일 · 도달칸 인접 · front=아래에서 접근 가능):");
  [3,4,5].forEach(band=>{ const c=(out.cand[band]||[]).filter(e=>e.front);
    console.log(`  밴드${band}: ${c.length}곳 — ${c.slice(0,14).map(e=>e.k).join(" ")}`); });

  // ⚠️ **지름길인지 재본다** — 두 입구의 착지 칸(입구 바로 아래) 사이 실제 도보 거리가 짧으면 루트를 팔 이유가 없다.
  const PAIRS=JSON.parse(process.argv[3]||"[]");
  if(PAIRS.length){
    console.log("\n후보쌍 도보 거리(착지 칸 기준 — 클수록 지름길 값어치가 크다):");
    const d=await p.evaluate(pairs=>{ const F=window.SG.flow;
      const bfs=(sx,sy)=>{ const dist={[sx+","+sy]:0}, q=[[sx,sy]];
        while(q.length){ const [x,y]=q.shift(); const dd=dist[x+","+y];
          for(const [dx,dy] of [[0,1],[0,-1],[1,0],[-1,0]]){ const nx=x+dx,ny=y+dy,k=nx+","+ny;
            if(dist[k]!==undefined||!F.walkable(nx,ny))continue; dist[k]=dd+1; q.push([nx,ny]); } }
        return dist; };
      return pairs.map(([a,bb])=>{ const [ax,ay]=a.split(",").map(Number), [bx,by]=bb.split(",").map(Number);
        const dist=bfs(ax,ay+1); return {a,b:bb,walk:dist[bx+","+(by+1)]}; });
    }, PAIRS);
    d.forEach(r=>console.log(`  ${r.a} ↔ ${r.b}   도보 ${r.walk===undefined?"도달불가":r.walk+"칸"}`));
  }
  await b.close();
})();
