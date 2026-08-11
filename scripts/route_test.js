// 지선 루트 회귀 (유저: "맵이 가로 넓이가 같은 일차원적인 구성" · "오버월드에 분기를 만드는 것이 좋을 것 같아").
//
// 오버월드가 25×50 세로 복도 하나라 일차원적이었다. **입구가 둘인 통과형 루트**를 놓아 지도에 순환을 만든다:
//   · 버려진 갱도(mine)   : 숲(3,38)   ↔ 깊은 숲(20,29)  — 서→동 수평, 지하
//   · 바람 언덕길(hillpath): 초원(6,42) ↔ 숲(21,36)      — 대각선, 야외
//
// ⚠️ 이 설계에서 반드시 지켜야 하는 것 3가지를 회귀로 고정한다:
//   1) **통과형이다** — 한쪽으로 들어가 **반대쪽 오버월드 좌표로** 나온다(단순 막다른 방이 아니다).
//   2) **게이팅 불변** — 두 입구 모두 원래 비전기술 없이 걸어서 갈 수 있던 곳이어야 한다.
//      (한쪽만 도달 가능하면 루트가 "새 지역을 여는 열쇠"가 되어 난이도 곡선이 흔들린다.)
//   3) **들어온 쪽에서 시작** — 반대편 끝에서 시작하면 통과형으로 안 읽힌다.
// ⚠️ 음악 트랙 이름은 Audio.tracks에 실제로 있는 것만 — 없는 이름이면 매 프레임 터진다(실측 108건).
const { chromium } = require("playwright"); const path=require("path");

(async()=>{
  const b=await chromium.launch();
  const p=await b.newPage({viewport:{width:430,height:760}});
  const errs=[]; p.on("pageerror",e=>errs.push(e.message));
  let fail=0; const ok=(c,m)=>{ console.log((c?"  ✅ ":"  ❌ ")+m); if(!c)fail=1; };
  process.on("unhandledRejection",async e=>{ console.log("❌ "+e); await b.close(); process.exit(1); });
  await p.goto("file://"+path.resolve(process.argv[2])); await p.waitForTimeout(900);

  // ⚠️ 퇴치 스프레이는 `max(avgLevel(), wildFloor()) < 선두 레벨`일 때만 막는다.
  //    **1마리 파티는 평균=선두라 절대 안 막힌다** → 루트 안에서 조우가 걸려 이동이 멈추고
  //    통과 검증이 간헐 실패한다(실제로 겪음). 저레벨 2번째를 넣어 평균을 낮춘다.
  const boot=async(x,y)=>{
    await p.evaluate(([px,py])=>{ const S=window.SG,G=S.freshState();
      G.party=[S.makeMon("foxfire",50), S.makeMon("shellow",1)];
      G.pos={x:px,y:py}; G.repel=999; S.setG(G); S.flow.enterMap(true); },[x,y]);
    await p.waitForTimeout(500); };

  console.log("\n[1] 입구가 둘이고, 둘 다 비전기술 없이 도달 가능하다(게이팅 불변)");
  await boot(8,44);
  const gate=await p.evaluate(()=>{ const F=window.SG.flow, G=window.SG.G();
    const seen=new Set([G.pos.x+","+G.pos.y]); const q=[[G.pos.x,G.pos.y]];
    while(q.length){ const [x,y]=q.shift();
      for(const [dx,dy] of [[0,1],[0,-1],[1,0],[-1,0]]){ const nx=x+dx,ny=y+dy,k=nx+","+ny;
        if(seen.has(k)||!F.walkable(nx,ny))continue; seen.add(k); q.push([nx,ny]); } }
    const routes={};
    Object.keys(F.ROUTE_AT).forEach(k=>{ const r=F.ROUTE_AT[k]; const [x,y]=k.split(",").map(Number);
      const near=[[0,1],[0,-1],[1,0],[-1,0]].some(([dx,dy])=>seen.has((x+dx)+","+(y+dy)));
      (routes[r.id]=routes[r.id]||[]).push({k,near,tile:F.tileAt(x,y)}); });
    return routes; });
  const ids=Object.keys(gate);
  ok(ids.length>=2, `지선 루트가 2개 이상이다 (${ids.join(", ")})`);
  ids.forEach(id=>{
    ok(gate[id].length===2, `${id}: 입구가 둘이다 (${gate[id].map(e=>e.k).join(" ↔ ")})`);
    ok(gate[id].every(e=>e.tile==="$"), `${id}: 입구 타일이 전부 $ (좌표 스코프)`);
    ok(gate[id].every(e=>e.near), `${id}: **두 입구 모두 비전기술 없이 접근 가능** — 게이팅 불변`);
  });

  /* [1-c] 지선은 **서로 다른 지역**을 이어야 한다.
     ⚠️ 실제로 겪은 사고: 출신지를 넣으면서 반딧불 오솔길 입구를 마을(3,47)에서 초원(21,44)으로 옮겼는데,
        반대편도 초원(23,42)이라 **양쪽이 같은 지역**이 됐다 — 지역을 잇는 지름길이 아니라 초원 안에서
        도는 통로가 됐다. 각 입구만 따로 보면 멀쩡해서(둘 다 도달 가능·타일 $) 기존 단정은 다 통과했다.
        → 두 입구의 `region()`을 **대조**한다. */
  const spans=await p.evaluate(()=>{ const F=window.SG.flow; const out={};
    Object.keys(F.ROUTE_AT).forEach(k=>{ const r=F.ROUTE_AT[k]; const y=Number(k.split(",")[1]);
      (out[r.id]=out[r.id]||[]).push({k, reg:F.region(y)}); });
    return out; });
  /* ⚠️ `pier`(호숫가 잔교)는 **의도적으로 한 지역 안**이다 — 물 위 판자길이라 호수 안에서만 돈다
     (WORKLOG의 지선 목록: 언덕길 1↔2 · 갱도 2↔3 · 골짜기 3↔4 · **잔교 4 내부** · 벼랑길 4↔5 · 고갯길 5↔6).
     임계값이 아니라 **예외 집합을 고정**한다 — 새 지선이 실수로 한 지역 안에 갇히면 걸린다. */
  const INTRA_OK=["pier"];
  Object.keys(spans).forEach(id=>{
    const e=spans[id], same=(e.length===2 && e[0].reg===e[1].reg);
    const label=e.map(x=>x.k+"=지역"+x.reg).join(" ↔ ");
    if(INTRA_OK.includes(id)) ok(same, `${id}: 한 지역 안이다(의도) — ${label}`);
    else ok(e.length===2 && !same, `${id}: 서로 다른 지역을 잇는다 — ${label}`);
  });

  console.log("\n[1-b] 시작 칸이 출구 칸과 겹치지 않는다");
  // ⚠️ 겹치면 들어가자마자 출구를 밟아 **도로 튕겨 나온다**(실제로 겪음 — pier·frostpass 둘 다).
  const startOk=await p.evaluate(()=>{ const F=window.SG.flow; const bad=[];
    Object.keys(F.ROUTE_AT).forEach(k=>{ const r=F.ROUTE_AT[k]; const I=F.INTERIORS[r.id]; if(!I)return;
      const hit=(I.exits||[]).some(e=>e.x===r.sx&&e.y===r.sy);
      if(hit||(I.exitX===r.sx&&I.exitY===r.sy))bad.push(r.id+" @"+k+" → ("+r.sx+","+r.sy+")"); });
    return bad; });
  ok(startOk.length===0, `시작 칸이 출구와 겹치는 입구 0곳 ${startOk.length?JSON.stringify(startOk):""}`);

  console.log("\n[2] 통과형 — 한쪽으로 들어가 반대쪽으로 나온다");
  const walkThrough=async(id)=>{
    const pair=await p.evaluate(rid=>{ const F=window.SG.flow;
      const ks=Object.keys(F.ROUTE_AT).filter(k=>F.ROUTE_AT[k].id===rid);
      return ks.map(k=>({k, ...F.ROUTE_AT[k]})); }, id);
    // 첫 번째 입구로 들어간다(입구 아래 칸에서 위로 부딪히거나, walkable 이웃에서 접근)
    const a=pair[0], b2=pair[1];
    const [ax,ay]=a.k.split(",").map(Number);
    await boot(ax,ay+1);
    await p.keyboard.press("ArrowUp"); await p.waitForTimeout(1200);
    const inside=await p.evaluate(()=>({indoor:window.SG.G().indoor,pos:{...window.SG.G().pos}}));
    // 반대쪽 출구 칸으로 이동해 밟는다
    const out=await p.evaluate(rid=>{ const S=window.SG,F=S.flow,I=F.INTERIORS[rid];
      return (I.exits||[]).map(e=>({...e})); }, id);
    const far=out.find(e=>!(e.x===(a.sx===2?1:17)&&false)) && out[out.length-1];
    await p.evaluate(([ex,ey])=>{ const S=window.SG,G=S.G(); G.pos={x:ex,y:ey-0}; S.setG(G); }, [far.x, far.y]);
    await p.waitForTimeout(200);
    // 출구 타일 위에 서면 onArrived가 처리하므로 한 칸 옆에서 밟아 들어간다
    await p.evaluate(([ex,ey])=>{ const S=window.SG,G=S.G(); G.pos={x:ex-1,y:ey}; S.setG(G); if(S.Field.placeImmediate)S.Field.placeImmediate(); },[far.x,far.y]);
    // ⚠️ 워프 직후 _warpLock(320ms)이 입력을 막는다 — 대기가 짧으면 키가 씹혀 간헐 실패한다(실제로 겪음).
    await p.waitForTimeout(700);
    await p.keyboard.press("ArrowRight"); await p.waitForTimeout(1500);
    const after=await p.evaluate(()=>({indoor:window.SG.G().indoor,pos:{...window.SG.G().pos}}));
    return {a,b2,inside,far,after};
  };
  for(const id of ids){
    const r=await walkThrough(id);
    ok(r.inside.indoor===id, `${id}: 입구로 들어가진다 (indoor=${r.inside.indoor})`);
    ok(r.inside.pos.x===r.a.sx && r.inside.pos.y===r.a.sy,
       `${id}: **들어온 쪽 끝에서 시작** (${r.inside.pos.x},${r.inside.pos.y})`);
    ok(!r.after.indoor, `${id}: 반대편 출구로 오버월드에 나온다`);
    ok(r.after.pos.x===r.far.ox && r.after.pos.y===r.far.oy,
       `${id}: **들어온 곳이 아닌 반대편 좌표**로 나온다 (${r.after.pos.x},${r.after.pos.y})`);
    const back=await p.evaluate(([x,y])=>{ const F=window.SG.flow;
      return { entryHere:!!F.ROUTE_AT[x+","+y], tile:F.tileAt(x,y) }; },[r.a.k.split(",")[0]*1, r.a.k.split(",")[1]*1]);
    ok(back.entryHere, `${id}: 들어온 입구는 그대로 남아 있다(왕복 가능)`);
  }

  console.log("\n[3] 루트 안에 조우·도구가 실제로 있다");
  const content=await p.evaluate(ids=>{ const S=window.SG;
    return ids.map(id=>({ id,
      pool:(S.flow.ENC_POOLS[id]||[]).length,
      poolOk:(S.flow.ENC_POOLS[id]||[]).every(x=>!!S.byId(x)),
      items:(S.GROUND_ITEMS||[]).filter(g=>g.in===id).length,
      habitat:!!(S.flow.HABITAT_KO||{})[id] })); }, ids);
  content.forEach(c=>{
    ok(c.pool>=5, `${c.id}: 조우 풀 ${c.pool}종`);
    ok(c.poolOk, `${c.id}: 조우 풀이 전부 실존 종이다`);
    ok(c.items>=2, `${c.id}: 바닥 도구 ${c.items}개`);
    ok(c.habitat, `${c.id}: 도감 서식지 표기가 있다`);
  });

  console.log("\n[3-b] 이끼 골짜기 모닥불 야영지 — 루트 최초의 회복 지점");
  // ⚠️ `R`(모닥불)은 원래 **실외 블록에만** 있었다(실내 블록이 먼저 return) → 인테리어에 R을 놓아도
  //    그냥 밟히는 장식이었다. "타일을 놨다"와 "밟으면 회복된다"는 다르다 → 실제로 밟아서 확인한다.
  const camp=await p.evaluate(async()=>{ const S=window.SG,F=S.flow;
    S.setG(S.freshState()); const G=S.G();
    G.party=[S.makeMon("foxfire",30), S.makeMon("shellow",28)];
    F.enterMap(true); F.enterInterior(F.INTERIORS.mosshollow);
    await new Promise(r=>setTimeout(r,700));
    // 모닥불 좌표를 지도에서 찾는다(하드코딩하면 맵을 고칠 때 조용히 어긋난다)
    const I=F.INTERIORS.mosshollow; let R=null;
    for(let y=0;y<I.H;y++)for(let x=0;x<I.W;x++)if(F.tileAt(x,y)==="R")R={x,y};
    if(!R)return {err:"모닥불 타일이 없다"};
    const g=S.G(); g.party.forEach(m=>{ m.hp=1; m.status="psn"; });
    // 모닥불 **바로 옆**에 서서 걸어 들어간다(밟는 동작이 onArrived를 태운다)
    g.pos={x:R.x-1,y:R.y}; S.Field.player={x:R.x-1,y:R.y}; S.Field.target={x:R.x-1,y:R.y}; S.Field.arrived=true;
    return {R, before:g.party.map(m=>m.hp+"/"+m.maxHp+(m.status||""))};
  });
  if(camp.err)ok(false, camp.err);
  else {
    await p.keyboard.press("ArrowRight"); await p.waitForTimeout(900);
    const after=await p.evaluate(()=>{ const G=window.SG.G();
      return { pos:{...G.pos}, full:G.party.every(m=>m.hp===m.maxHp), noStatus:G.party.every(m=>!m.status),
        fly:(G.flySpots?[...G.flySpots]:[]).length, heal:G.lastHeal?{...G.lastHeal}:null }; });
    ok(after.pos.x===camp.R.x && after.pos.y===camp.R.y, `모닥불 칸에 도착했다 (${after.pos.x},${after.pos.y})`);
    ok(after.full, "파티가 전부 회복됐다");
    ok(after.noStatus, "상태이상도 낫는다");
    // ⚠️ 실내 회복 지점은 `_owBackup.pos`(들어온 오버월드 입구)를 기록해야 한다 — 실내 좌표를 기록하면 부활이 깨진다
    ok(after.heal && after.heal.indoor===null, `부활 지점이 오버월드 기준이다 (${JSON.stringify(after.heal)})`);
    ok(after.fly>0, `공중날기 지점으로 등록됐다 (${after.fly}곳)`);
  }

  console.log("\n[4] 음악 트랙 이름이 실존한다 (없는 이름이면 매 프레임 터진다)");
  const music=await p.evaluate(ids=>{ const S=window.SG;
    const names=Object.keys(S.Audio&&S.Audio.tracks?S.Audio.tracks:{});
    return ids.map(id=>{ const G=S.G(); const old=G.indoor; G.indoor=id;
      const t=S.flow.fieldMusic(); G.indoor=old; return {id,t,ok:names.indexOf(t)>=0}; }); }, ids);
  music.forEach(m=>ok(m.ok, `${m.id}: fieldMusic "${m.t}" 가 실존 트랙이다`));

  ok(errs.length===0, `런타임 에러 0 (${errs.length}${errs.length?": "+errs[0]:""})`);
  console.log(fail?"\n❌ 실패":"\n🎉 지선 루트 통과");
  await b.close(); process.exit(fail);
})();
