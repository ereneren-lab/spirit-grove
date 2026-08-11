// 목표 트래커 도달성 감사 — **트래커가 가리키는 모든 종착점에 실제로 갈 수 있는가**.
//
// 왜 있나
//   이 저장소가 반복해 밟은 버그 종류가 "정의는 있는데 플레이에서 닿지 않는다"인데,
//   그중에서도 **트래커가 가리키면서 동시에 못 가는** 형태를 두 번 연달아 밟았다(2026-08-05):
//     · findTile이 실내에서 null을 영구 캐시해 호수 제단·군주의 제단이 사슬에서 통째로 빠졌다
//       → 4뱃지 → 곧장 리그. 진짜 결말(EPILOGUE)에 **모든 플레이어가** 도달 불가였다.
//     · 그걸 고치자 호수 제단(%)이 사방이 물이라 자동 이동이 아예 안 됐다
//       → 트래커가 "지금은 그곳까지 가는 길이 막혀 있다"를 띄우면서 **동시에 그곳을 가리켰다**.
//         fullrun 봇이 그 자리에서 27분을 서 있었다.
//   lord_route_test는 이 중 **군주 한 지점**만 본다. 이건 사슬이 만들어내는 **모든 목표**를 훑는다.
//
// 무엇을 단정하나 (게임의 실제 클릭 핸들러를 그대로 쓴다 — 병렬 로직을 만들지 않는다)
//   ① 각 진행 단계에서 트래커가 **기대한 목표**를 가리킨다(사슬이 끊기지 않았다)
//   ② 목표 타일이 비보행이면 **부딪혀 들어갈 정면 칸**이 있다
//   ③ 트래커를 누르면 **실제 경로가 나온다**(= "길이 막혀 있다"로 끝나지 않는다)
//
// ⚠️ 걷지 않고 **경로가 나오는지만** 본다 → 부하에 둔감하고 몇 초면 끝난다.
//    실제로 걸어가는 검증은 lord_route_test(군주 경로)와 fullrun(전 구간)이 한다.
const { chromium } = require("playwright"); const path=require("path");

// 진행 사슬이 만들어내는 목표 전부. 출발 위치는 "직전 단계를 막 끝낸 자리"로 둔다(실제 플레이 흐름).
const STAGES=[
  {label:"뱃지 0 → 체육관1", badges:[],                    from:null,        expect:"초원",   tile:"G"},
  {label:"뱃지 1 → 체육관2", badges:["1"],                 from:{x:8,y:44},  expect:"숲",     tile:"G"},
  {label:"뱃지 2 → 체육관3", badges:["1","2"],             from:{x:8,y:36},  expect:"수정",   tile:"G"},
  {label:"뱃지 3 → 체육관4", badges:["1","2","3"],         from:{x:8,y:27},  expect:"고원",   tile:"G"},
  {label:"뱃지 4 → 호수 제단(전설 준비)", badges:["1","2","3","4"], from:{x:8,y:18}, expect:"호수 제단", tile:"%"},
  {label:"전설 준비 후 → 군주의 제단", badges:["1","2","3","4"], from:{x:8,y:18}, lakeDone:true, expect:"군주의 제단", tile:"X"},
  {label:"군주 격파 후 → 정령 리그", badges:["1","2","3","4"], from:{x:8,y:9}, lakeDone:true, lord:true, expect:"정령 리그", tile:"U"},
];

(async()=>{
  const b=await chromium.launch();
  const p=await b.newPage({viewport:{width:430,height:760}});
  const errs=[]; p.on("pageerror",e=>errs.push(e.message));
  let fail=0; const ok=(c,m)=>{ console.log((c?"  ✅ ":"  ❌ ")+m); if(!c)fail=1; };
  process.on("unhandledRejection",async e=>{ console.log("❌ "+e); await b.close(); process.exit(1); });
  await p.goto("file://"+path.resolve(process.argv[2])); await p.waitForTimeout(900);

  console.log("\n[1] 사슬의 각 단계에서 목표를 가리키고, 그 목표까지 경로가 나온다");
  for(const st of STAGES){
    const r=await p.evaluate(async(st)=>{ const S=window.SG,F=S.flow,G=S.freshState();
      /* ⚠️ 비전 기술은 뱃지 수에 따라 주어진다 — 없으면 길이 막혀 "게임이 아니라 픽스처" 때문에 실패한다. */
      const n=st.badges.length;
      G.party=[S.makeMon("foxfire",40),S.makeMon("shellow",5)];
      /* ⚠️ 시야 트레이너를 배제한다 — 안 그러면 클릭 직후 spotTrainer가 걸려 stopPath로 경로가 지워지고
         "경로가 안 나온다"로 오판한다(2026-08-06에 체육관4에서 실제로 그렇게 읽혔다. 게임은 멀쩡했다).
         여기서 보는 건 **경로가 나오는가**이지 전투가 아니다. */
      /* ⚠️ **"X"(숲의 군주)는 빼야 한다** — G.defeated에 들어가면 `!G.defeated.has("X")` 조건 때문에
         군주 단계가 사슬에서 사라져 트래커가 리그를 가리킨다. 픽스처가 검사 대상을 지워버리는 전형이다
         (2026-08-06에 실제로 이 줄 때문에 "군주 → 리그"로 읽혔다). 진행을 가르는 키는 배제한다. */
      Object.keys(S.TRAINERS).filter(k=>k!=="X").forEach(k=>G.defeated.add(k));
      G.badges=st.badges.slice();
      G.hasCut=n>=1; G.hasStrength=n>=2; G.hasSurf=n>=3;
      if(st.lakeDone)G.lakeDone=true;
      if(st.lord){ G.badge=true; G.defeated.add("X"); }
      if(st.from)G.pos={x:st.from.x,y:st.from.y};
      G.repel=9999; S.setG(G); F.enterMap(true); F.updateGoal();
      await new Promise(r=>setTimeout(r,120));

      const g=F.currentGoal();
      if(!g||g.x==null)return {name:g&&g.name, coords:false};
      const L=S.G();
      const tile=F.tileAt(g.x,g.y), walk=F.walkable(g.x,g.y);
      /* ② 비보행 목표는 정면(아래) 칸으로 부딪혀 들어간다 — 문 규칙(DOOR_TILES). 물 목표는 물길로 닿는다. */
      const front=F.walkable(g.x,g.y+1);
      const adjWater=[[0,1],[0,-1],[1,0],[-1,0]].some(d=>F.tileAt(g.x+d[0],g.y+d[1])==="~");

      /* ③ 게임의 실제 트래커 클릭을 그대로 부른다(병렬 로직 금지) */
      F.stopPath();
      const el=document.getElementById("goalTrack");
      const before={x:L.pos.x,y:L.pos.y};
      el.click();
      /* ⚠️ **기다리지 않고 즉시 읽는다.** 핸들러는 gamePath를 동기로 세운 뒤 pathStep을 부르므로
         조금이라도 기다리면 이미 걷기 시작해 길이가 줄고 좌표도 밀린다(그러면 재현이 안 된다). */
      const pathLen=F.getPath().length;
      const hint=(document.getElementById("mapHint")||{}).textContent||"";
      const dist=Math.abs(g.x-before.x)+Math.abs(g.y-before.y);
      return {name:g.name, coords:true, x:g.x, y:g.y, tile, walk, front, adjWater,
              pathLen, blocked:hint.indexOf("막혀")>=0, dist, pos:before};
    }, st);

    console.log(`\n  ── ${st.label}`);
    ok(r.coords && String(r.name).indexOf(st.expect)>=0, `목표: ${r.name} (기대: …${st.expect}…)`);
    if(!r.coords)continue;
    ok(r.tile===st.tile, `목표 좌표 (${r.x},${r.y})의 타일이 "${st.tile}" — 실제 "${r.tile}"`);
    // 비보행 목표는 "정면 칸"이나 "물길"이라는 진입 수단이 있어야 한다. 둘 다 없으면 영영 못 들어간다.
    ok(r.walk || r.front || r.adjWater,
       `진입 수단이 있다 (보행=${r.walk} · 정면칸=${r.front} · 물길=${r.adjWater})`);
    ok(!r.blocked, `트래커가 "길이 막혀 있다"로 끝나지 않는다`);
    ok(r.pathLen>0 || r.dist<=1,
       `트래커를 누르면 경로가 나온다 — ${r.pathLen}칸 (출발 ${r.pos.x},${r.pos.y} · 목표까지 ${r.dist}칸)`);
  }

  console.log("\n[2] 챔피언 이후엔 좌표 없는 '도감 완성'으로 끝난다 (사슬의 종점)");
  const done=await p.evaluate(async()=>{ const S=window.SG,F=S.flow,G=S.freshState();
    G.party=[S.makeMon("foxfire",50)]; G.badges=["1","2","3","4"];
    G.lakeDone=true; G.badge=true; G.defeated.add("X"); G.champion=true;
    S.setG(G); F.enterMap(true); F.updateGoal();
    const g=F.currentGoal(); return {name:g&&g.name, x:g&&g.x, done:!!(g&&g.done)}; });
  ok(done.done===true && done.x==null, `종점: ${done.name} (좌표 없음 · done=${done.done})`);

  console.log("\n[3] 사슬에 구멍이 없다 — 파티가 있으면 목표는 항상 존재한다");
  /* ⚠️ 목표가 null이면 트래커가 사라져 플레이어가 "다음에 뭘 하지"를 잃는다.
     findTile 사고 때는 목표가 **사라진 게 아니라 엉뚱한 곳(리그)을 가리켜서** 더 안 보였다. */
  const holes=await p.evaluate(async()=>{ const S=window.SG,F=S.flow;
    const combos=[]; const out=[];
    for(const nb of [0,1,2,3,4]) for(const lake of [false,true]) for(const lord of [false,true])
      combos.push({nb,lake,lord});
    for(const c of combos){ const G=S.freshState();
      G.party=[S.makeMon("foxfire",40)];
      G.badges=["1","2","3","4"].slice(0,c.nb);
      G.hasCut=G.hasStrength=G.hasSurf=true;
      if(c.lake)G.lakeDone=true; if(c.lord){ G.badge=true; G.defeated.add("X"); }
      S.setG(G); F.enterMap(true);
      const g=F.currentGoal();
      if(!g)out.push(`뱃지${c.nb}·호수${c.lake?1:0}·군주${c.lord?1:0} → 목표 없음`);
      else if(g.x!=null && !F.walkable(g.x,g.y) && !F.walkable(g.x,g.y+1)
              && ![[0,1],[0,-1],[1,0],[-1,0]].some(d=>F.tileAt(g.x+d[0],g.y+d[1])==="~"))
        out.push(`뱃지${c.nb}·호수${c.lake?1:0}·군주${c.lord?1:0} → "${g.name}" 진입 수단 없음`);
    }
    return {n:combos.length, out}; });
  ok(holes.out.length===0, `진행 상태 ${holes.n}가지 전부 목표가 있고 진입 수단이 있다 (${holes.out.slice(0,3).join(" · ")||"이상 없음"})`);

  console.log("\n[4] 목표 타일 조회가 **실내에서 처음** 일어나도 사슬이 살아남는다");
  /* ⚠️ 이게 이 감사의 존재 이유다. 위 [1]~[3]은 상태를 **야외에서** 조립하므로 findTile 캐시가
     올바른 값으로 채워진다 → 2026-08-05 사고를 **구조적으로 못 잡는다**(어제 lord_route_test가
     정확히 그 맹점으로 초록이었고, 그걸 믿고 "게임 쪽 경로는 확정"이라 적었다가 틀렸다).
     실제 플레이 순서는 이렇다: currentGoal은 뱃지<4면 체육관 단계에서 리턴하므로 %·X는
     **4번째 뱃지를 따는 순간 = 체육관 안에서** 처음 조회된다. 그 순간을 재현한다.
     ⚠️ 좌표를 findTile로 찾는 목표가 늘어나면 여기 함께 추가할 것. */
  /* ⚠️ **반드시 새 페이지에서** — _tileCache는 페이지 수명이라, 위 구간이 이미 야외에서 올바른 값을
     채워놨다. 같은 페이지에서 재면 무엇을 해도 통과한다(처음에 그렇게 짜서 버그 빌드가 초록으로 나왔다). */
  for(const cs of [{lake:false, expect:"호수 제단"}, {lake:true, expect:"군주의 제단"}]){
    const p4=await b.newPage({viewport:{width:430,height:760}});
    p4.on("pageerror",e=>errs.push(e.message));
    await p4.goto("file://"+path.resolve(process.argv[2])); await p4.waitForTimeout(800);
    const r=await p4.evaluate(async(cs)=>{ const S=window.SG,F=S.flow,G=S.freshState();
      G.party=[S.makeMon("foxfire",40)];
      G.badges=["1","2","3"];                       /* 아직 3뱃지 — findTile은 한 번도 안 불렸다 */
      G.hasCut=G.hasStrength=G.hasSurf=true; G.pos={x:8,y:18}; G.repel=9999;
      if(cs.lake)G.lakeDone=true;
      S.setG(G); F.enterMap(true);
      F.enterInterior(F.INTERIORS.gym4); await new Promise(r=>setTimeout(r,350));
      S.G().badges=["1","2","3","4"];               /* 관장 격파 = 실내에서 4뱃지가 된다 */
      const inside=F.currentGoal();                 /* ← %·X의 최초 스캔이 여기서 일어난다 */
      F.exitInterior(); await new Promise(r=>setTimeout(r,400));
      const outside=F.currentGoal();
      return {inside:inside&&inside.name, outside:outside&&outside.name,
              x:outside&&outside.x, tile:(outside&&outside.x!=null)?F.tileAt(outside.x,outside.y):null};
    }, cs);
    await p4.close();
    ok(r.inside===cs.expect && r.outside===cs.expect,
       `체육관 안에서 4뱃지가 돼도 "${cs.expect}"를 가리킨다 — 실내 "${r.inside}" · 밖 "${r.outside}"`);
  }

  ok(errs.length===0, `런타임 에러 0 (${errs.length})${errs.length?": "+errs.slice(0,2).join(" | "):""}`);
  await b.close();
  console.log(fail?"\n❌ goal_reach_test 실패":"\n🎉 목표 트래커 도달성 감사 통과");
  process.exit(fail);
})();
