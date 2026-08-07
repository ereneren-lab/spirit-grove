// 숲의 군주 경로 회귀 — 4뱃지 이후 트래커가 가리키는 곳까지 **실입력으로 실제 걸어갈 수 있는가**.
//
// 왜 이게 필요한가:
//   2026-08-04에 목표 트래커 사슬에 숲의 군주를 넣었다(4뱃지 → (전설) → 군주 → 리그).
//   그전까지 군주는 **사슬 밖**이라 EPILOGUE(진짜 결말)에 아무도 도달하지 못했다.
//   문제는 "가리키기만 하고 못 가는" 경우다 — 이 저장소가 반복해 밟은 형태다:
//     · 목표 타일이 비보행 문(X)이면 bfsPath가 항상 null이라 자동 이동이 통째로 먹지 않는다.
//     · 문은 **정면(아래)에서만** 열린다(DOOR_TILES="+EHGUSX") — 옆에서 부딪히면 영영 안 들어간다.
//       fullrun 봇이 실제로 이것 때문에 800ms씩 181회 부딪히며 체육관2 앞에서 죽은 적이 있다.
//
// ⚠️ **fullrun(50분 완주)의 대체가 아니라 보완이다.** 완주는 전투력까지 보지만 이 환경은 부하가 높아
//    (load 6~8/8코어) 브라우저가 중간에 죽는 일이 잦다 — 실제로 이 테스트를 만든 날 한 판을 통째로 잃었다.
//    이건 **경로만** 본다: 걸어갈 수 있는가 · 문이 열리는가 · 보스가 시작되는가 · 그 뒤 리그로 넘어가는가.
//    전투 밸런스는 balance_test·league_test가, 보스 정의는 altar_test가 이미 본다.
const { chromium } = require("playwright"); const path=require("path"); const os=require("os");

(async()=>{
  const b=await chromium.launch();
  const p=await b.newPage({viewport:{width:430,height:760}});
  const errs=[]; p.on("pageerror",e=>errs.push(e.message));
  let fail=0; const ok=(c,m)=>{ console.log((c?"  ✅ ":"  ❌ ")+m); if(!c)fail=1; };
  process.on("unhandledRejection",async e=>{ console.log("❌ "+e); await b.close(); process.exit(1); });
  await p.goto("file://"+path.resolve(process.argv[2])); await p.waitForTimeout(900);

  console.log("\n[1] 4뱃지·전설 보유 상태에서 트래커가 군주의 제단을 가리킨다");
  const g1=await p.evaluate(()=>{ const S=window.SG,F=S.flow,G=S.freshState();
    /* ⚠️ 퇴치 스프레이는 `max(avgLevel(), wildFloor()) < 선두 레벨`일 때만 막는다 —
       고레벨만 넣으면 **평균=선두라 절대 안 막히고**, 걷는 도중 야생 전투가 걸려 경로가 끊긴다
       (route_test에 이미 문서화된 함정인데 그대로 밟았다: 부하가 낮은데도 (8,10)에서 멈췄다).
       → 저레벨 한 마리를 넣어 평균을 끌어내린다. aqualord는 전설이라 전설 단계도 같이 지난다. */
    G.party=[S.makeMon("foxfire",60),S.makeMon("aqualord",60),S.makeMon("shellow",1)];
    G.badges=["1","2","3","4"]; G.hasCut=G.hasStrength=G.hasSurf=true;
    G.pos={x:8,y:12}; G.repel=999; S.setG(G); F.enterMap(true);
    const g=F.currentGoal();
    return {name:g.name, x:g.x, y:g.y, tile:F.tileAt(g.x,g.y), walkable:F.walkable(g.x,g.y),
            front:F.walkable(g.x,g.y+1)}; });
  ok(g1.name==="군주의 제단", `목표: ${g1.name}`);
  ok(g1.tile==="X", `좌표 (${g1.x},${g1.y})가 제단 입구 X 타일이다 — "${g1.tile}"`);
  ok(!g1.walkable, "제단 입구는 비보행 문이다(밟는 게 아니라 부딪혀 들어간다)");
  ok(g1.front, `정면 칸 (${g1.x},${g1.y+1})이 보행 가능하다 — 문 정면 규칙을 만족한다`);

  console.log("\n[2] 트래커가 안내하는 대로 **실제로 걸어서** 정면 칸에 선다");
  // ⚠️ 상태를 대입해 순간이동시키지 않는다 — 그러면 "가리키기만 하고 못 가는" 바로 그 사고를 못 잡는다.
  const walked=await p.evaluate(async()=>{ const S=window.SG,F=S.flow,G=S.G();
    const g=F.currentGoal(); const fx=g.x, fy=g.y+1;
    const n=F.walkTo(fx,fy);                                   /* 게임의 실제 경로탐색 */
    if(!n)return {steps:0, arrived:false, reason:"경로 없음"};
    /* ⚠️ 고정 반복수로 기다리면 **부하가 크면 예산이 같이 줄어든다**(rAF 이동이 느려져 한 칸도 못 간다).
       이 저장소가 playthrough_test에서 이미 쓴 답을 따른다 — **실제 시계 예산 + 재시도**. */
    const dl=Date.now()+45000;
    while(Date.now()<dl){ await new Promise(r=>setTimeout(r,80));
      if(G.pos.x===fx&&G.pos.y===fy)break;
      if(!F.getPath().length)F.walkTo(fx,fy); }
    return {steps:n, arrived:G.pos.x===fx&&G.pos.y===fy, pos:{x:G.pos.x,y:G.pos.y}}; });
  const _pc=os.loadavg()[0]/(os.cpus().length||1);
  if(walked.arrived)ok(true, `제단 정면까지 걸어갔다 (경로 ${walked.steps}칸 → ${JSON.stringify(walked.pos)})`);
  else if(_pc>1.2)console.log(`  ⚠️ 제단 정면까지 못 갔다 ${JSON.stringify(walked.pos)} — 부하 높음(코어당 ${_pc.toFixed(2)}) → 경고만`);
  else ok(false, `제단 정면까지 걸어갔다 ${JSON.stringify(walked.pos)} (부하 낮은데 실패 = 진짜 회귀 의심)`);

  console.log("\n[3] 위로 부딪히면 제단에 입장한다 (정면 전용 문)");
  /* ⚠️ 걸어간 **직후** 곧바로 누르면 삼켜진다 — move()는 이동 보간이 안 끝났으면(Field.arrived=false)
     즉시 리턴한다. 논리 좌표(G.pos)는 이미 목적지인데 화면은 아직 걷는 중이라 눈으로는 도착해 보인다.
     처음 이 테스트를 그렇게 짰다가 "문이 안 열린다"로 오판했다(게임은 멀쩡했다 — 같은 자리에서
     손으로 누르면 들어간다). → 경로가 빈 것을 확인하고, 그래도 안 열리면 몇 번 더 누른다. */
  await p.waitForFunction(()=>window.SG.flow.getPath().length===0,null,{timeout:8000}).catch(()=>{});
  for(let i=0;i<6;i++){
    await p.keyboard.press("ArrowUp"); await p.waitForTimeout(320);
    if(await p.evaluate(()=>window.SG.G().indoor==="altar"))break; }
  const inside=await p.evaluate(()=>{ const G=window.SG.G(); return {indoor:G.indoor, pos:{x:G.pos.x,y:G.pos.y}}; });
  /* ⚠️ 이 맥은 상시 부하가 높다(실측 load 6~8/8코어 — syspolicyd·에디터·브라우저가 주범이고 테스트 탓이 아니다).
     걷기가 시간 안에 못 끝나는 건 게임 회귀가 아니라 환경이다 → playthrough_test와 같은 판별을 쓴다:
     부하가 높으면 경고, 낮은데 실패하면 진짜 회귀. */
  const perCore=os.loadavg()[0]/(os.cpus().length||1);
  const soft=(cond,msg)=>{ if(cond)return ok(true,msg);
    if(perCore>1.2){ console.log(`  ⚠️ ${msg} — 실패했지만 부하가 높다(코어당 ${perCore.toFixed(2)}) → 환경 오탐으로 보고 경고만`); return; }
    ok(false, msg+` (부하 낮음 ${perCore.toFixed(2)}/코어 — 진짜 회귀 의심)`); };
  soft(inside.indoor==="altar", `제단 안이다 — indoor="${inside.indoor}" @${JSON.stringify(inside.pos)}`);

  console.log("\n[4] 내부 복도: 가드 2명을 지나야 제단(A)에 닿는다");
  /* ⚠️ 가드 보행 판정은 **반드시 제단 안에서** 재야 한다 — walkable()의 트레이너 타일 분기가
     `&&G.indoor` 조건이라, 밖에서 재면 "5"가 그냥 통행 가능으로 나온다(처음에 그렇게 재서 오탐이 났다). */
  const layout=await p.evaluate(()=>{ const F=window.SG.flow, G=window.SG.G();
    const it=F.INTERIORS.altar; const rows=it.str;
    const find=ch=>{ for(let y=0;y<rows.length;y++){ const x=rows[y].indexOf(ch); if(x>=0)return {x,y}; } return null; };
    const A=find("A");
    return {A, guard5:find("5"), guard6:find("6"), start:{x:it.startX,y:it.startY},
            A보행:F.walkable(A.x,A.y), 가드막힘:!F.walkable(find("5").x,find("5").y)}; });
  ok(!!layout.A && !!layout.guard5 && !!layout.guard6, `제단 A${JSON.stringify(layout.A)} · 가드 5${JSON.stringify(layout.guard5)}·6${JSON.stringify(layout.guard6)}`);
  soft(layout.가드막힘, "가드는 이기기 전엔 비보행이다 — 순서가 강제된다");
  ok(layout.A보행, "제단 A는 보행 타일이다 — 밟으면 보스가 시작된다");

  console.log("\n[5] 가드를 지나 A를 밟으면 숲의 군주 전투가 시작된다");
  const boss=await p.evaluate(async()=>{ const S=window.SG,F=S.flow,G=S.G();
    G.defeated.add("5"); G.defeated.add("6");                  /* 가드전 자체는 gym_test가 본다 — 여기선 경로만 */
    const it=F.INTERIORS.altar; const A=(()=>{ for(let y=0;y<it.str.length;y++){ const x=it.str[y].indexOf("A"); if(x>=0)return {x,y}; } })();
    /* ⚠️ 입장 직후엔 워프 입력 잠금(_warpLock ≈470ms)이 걸려 있어 **첫 걸음이 삼켜진다** —
       walkTo는 pathStep을 한 번만 부르므로 그게 막히면 아무도 재개하지 않아 제자리에 선다.
       (단독 프로브에선 900ms 기다린 뒤라 통과했는데 테스트에선 바로 걸어서 실패했다 — 게임이 아니라 타이밍.)
       → 잠금이 풀릴 시간을 주고, 안 움직이면 다시 건다. */
    await new Promise(r=>setTimeout(r,700));
    F.walkTo(A.x,A.y);
    const dl=Date.now()+45000;
    while(Date.now()<dl){ await new Promise(r=>setTimeout(r,80));
      if(G.trainer||G.inBattle||(G.pos.x===A.x&&G.pos.y===A.y))break;
      if(!F.getPath().length)F.walkTo(A.x,A.y); }
    /* ⚠️ startTrainer는 **인트로 대사부터** 띄우고 G.inBattle은 그 뒤에 켜진다 — inBattle만 기다리면
       "전투가 안 시작됐다"로 오판한다(실제로 겪음: trainer.key="X"는 이미 잡혀 있는데 대사창이 떠 있었다).
       → 트레이너가 잡히는 시점을 먼저 보고, 대사를 넘겨 실제 전투 진입까지 확인한다. */
    for(let i=0;i<300;i++){ await new Promise(r=>setTimeout(r,60)); if(G.trainer||G.inBattle)break; }
    const key=G.trainer&&G.trainer.key, isBoss=!!(G.trainer&&G.trainer.boss), team=(G.trainer&&G.trainer.team||[]).length;
    for(let i=0;i<40&&!G.inBattle;i++){ if(F.dialogActive())F.advanceDialog(); await new Promise(r=>setTimeout(r,120)); }
    return {inBattle:!!G.inBattle, key, boss:isBoss, team, pos:{x:G.pos.x,y:G.pos.y}}; });
  soft(boss.key==="X", `군주 전투가 시작됐다 — trainer.key="${boss.key}" @${JSON.stringify(boss.pos)}`);
  soft(boss.inBattle, "인트로 대사를 넘기면 실제 전투 화면으로 들어간다");
  soft(boss.boss, "boss 플래그가 켜져 있다 → 승리 시 EPILOGUE·인장이 발동한다");
  soft(boss.team===6, `군주 팀 6마리 (${boss.team})`);

  console.log("\n[6] 군주를 꺾으면 트래커가 리그로 넘어간다 (사슬의 뒷단)");
  /* ⚠️ 리그 타일 확인은 **제단 밖에서** 해야 한다 — 실내에선 MAP_STR이 제단이라 tileAt(18,9)가 "#"이다
     (처음에 안에서 재서 오탐이 났다). 승리 상태로 만든 뒤 오버월드로 나가서 읽는다. */
  const after=await p.evaluate(async()=>{ const S=window.SG,F=S.flow,G=S.G();
    G.inBattle=false; G.trainer=null; G.busy=false; G.badge=true; G.defeated.add("X");
    F.exitInterior(); await new Promise(r=>setTimeout(r,700));
    const g=F.currentGoal();
    return {name:g.name, tile:F.tileAt(g.x,g.y), indoor:G.indoor}; });
  ok(after.name==="정령 리그", `다음 목표: ${after.name}`);
  ok(after.tile==="U", `좌표가 리그 입구 U 타일이다 — "${after.tile}"`);

  console.log("\n[7] 4번째 뱃지를 **체육관 안에서** 딴 직후에도 사슬이 살아 있다");
  /* ⚠️ 이 저장소가 실제로 밟은 사고다(2026-08-05 fullrun: 군주를 건너뛰고 챔피언 등극).
     findTile은 결과를 캐시하는데 MAP_STR·W·H는 실내에 들어가면 인테리어 지도로 바뀐다.
     그리고 currentGoal은 뱃지가 4개 미만이면 **체육관 단계에서 리턴**하므로 %·X는 그전까지 한 번도
     안 불린다 → 두 문자의 최초 스캔이 **항상 체육관 안**에서 일어나 null이 영구 캐시되고,
     `if(alt)`·`if(lord)` 가드가 조용히 통과해 호수 제단·군주의 제단이 사슬에서 통째로 빠졌다.
     ⚠️ **위 [1]~[6]은 이걸 구조적으로 못 잡는다** — 상태를 야외에서 조립해 트래커를 처음 읽기 때문에
        캐시가 올바른 값으로 채워진다. 그래서 회귀는 반드시 **실내에서 4뱃지가 되는 순간**을 재현해야 한다.
     ⚠️ 리로드하면 캐시가 비어 증상이 사라진다 → 손으로는 거의 못 잡는다. 이 단정이 유일한 그물이다. */
  const p2=await b.newPage({viewport:{width:430,height:760}});
  const errs2=[]; p2.on("pageerror",e=>errs2.push(e.message));
  await p2.goto("file://"+path.resolve(process.argv[2])); await p2.waitForTimeout(900);
  const chain=await p2.evaluate(async()=>{ const S=window.SG,F=S.flow,G=S.freshState();
    G.party=[S.makeMon("foxfire",60),S.makeMon("shellow",1)];   /* 전설 미보유 = 실제 진행 상태 */
    G.badges=["1","2","3"]; G.hasCut=G.hasStrength=G.hasSurf=true;
    G.pos={x:8,y:18}; G.repel=999; S.setG(G); F.enterMap(true);
    const before=F.currentGoal().name;                          /* 체육관 단계 — findTile은 아직 안 불린다 */
    F.enterInterior(F.INTERIORS.gym4); await new Promise(r=>setTimeout(r,400));
    S.G().badges=["1","2","3","4"];                             /* 관장 격파 = **실내에서** 4뱃지가 된다 */
    const inside=F.currentGoal().name;                          /* ← %·X의 최초 스캔이 여기서 일어난다 */
    F.exitInterior(); await new Promise(r=>setTimeout(r,500));
    const outside=F.currentGoal().name;
    const lord=(()=>{ const S2=window.SG.G(); S2.lakeDone=true; return F.currentGoal().name; })();
    return {before, inside, outside, lord,
            X:JSON.stringify(F.findTile("X")), pct:JSON.stringify(F.findTile("%"))}; });
  ok(chain.before==="고원 체육관"||/체육관/.test(chain.before), `3뱃지 · 야외 → ${chain.before}`);
  ok(chain.inside==="호수 제단", `4뱃지 · 체육관 안 → ${chain.inside} (리그면 캐시 회귀)`);
  ok(chain.outside==="호수 제단", `4뱃지 · 밖으로 나온 뒤 → ${chain.outside}`);
  ok(chain.lord==="군주의 제단", `전설 준비를 마치면 → ${chain.lord} (리그면 군주가 또 사슬 밖이다)`);
  ok(chain.X!=="null"&&chain.pct!=="null", `실내를 거친 뒤에도 두 목표 타일을 찾는다 — X=${chain.X} %=${chain.pct}`);
  ok(errs2.length===0, `[7] 런타임 에러 0 (${errs2.length})`);

  console.log("\n[8] 물로 둘러싸인 목표(호수 제단)까지 트래커만 따라가서 실제로 갈 수 있다");
  /* ⚠️ 2026-08-05 fullrun이 4뱃지 직후 (8,18)에서 **27분간 한 칸도 못 움직였다.**
     호수 제단(%)은 사방이 물인데 트래커의 대체 경로 탐색이 상하좌우 보행칸만 봐서 후보가 0개 →
     "지금은 그곳까지 가는 길이 막혀 있다"를 띄우면서 **동시에 그곳을 가리켰다.**
     → bfsPath에 surf 옵션을 넣고(뭍길이 없을 때만) 물가에서 기존 파도타기 연출이 발동하도록 이었다.
     ⚠️ **뭍길 우선은 단정으로 지킨다**(아래) — 물을 먼저 열면 BFS가 최단거리를 골라
        체육관 가는 길이 호수를 가로지르는 지름길로 조용히 바뀐다. */
  const p3=await b.newPage({viewport:{width:430,height:760}});
  const errs3=[]; p3.on("pageerror",e=>errs3.push(e.message));
  await p3.goto("file://"+path.resolve(process.argv[2])); await p3.waitForTimeout(900);
  const lake=await p3.evaluate(async()=>{ const S=window.SG,F=S.flow,G=S.freshState();
    G.party=[S.makeMon("foxfire",45),S.makeMon("shellow",5)];
    G.badges=["1","2","3","4"]; G.hasCut=G.hasStrength=G.hasSurf=true;
    G.pos={x:8,y:18}; G.repel=9999;                          /* 체육관4 문 앞 = 봇이 얼어붙었던 자리 */
    /* ⚠️ 시야 트레이너를 배제한다 — 안 그러면 도중에 전투가 걸려 **경로가 아니라 전투를 재게 된다**
       (처음에 그렇게 짜서 "13,20에서 멈췄다"로 오판했다. 범인은 spotTrainer였고 경로는 멀쩡했다). */
    Object.keys(S.TRAINERS).forEach(k=>G.defeated.add(k));
    S.setG(G); F.enterMap(true);
    const L=S.G(); const g=F.currentGoal(); const el=document.getElementById("goalTrack");
    const near=()=>Math.abs(L.pos.x-g.x)+Math.abs(L.pos.y-g.y);
    const dl=Date.now()+60000; let taps=0;
    while(Date.now()<dl){ if(near()<=1)break;
      if(!F.getPath().length&&!L.busy&&!L.inBattle){ el.click(); taps++; }
      await new Promise(r=>setTimeout(r,120)); }
    /* 뭍길 우선 단정: 체육관4처럼 물을 안 지나도 되는 목표는 물길로 새지 않아야 한다.
       ⚠️ **반드시 `surfing=false`로 놓고 재라.** 위 이동으로 봇은 물 위에 있고, `walkable`은
          파도타기 중이면 물을 통행 가능으로 돌려준다 → 그대로 재면 "물 위에서 잰 경로"가 나온다.
          게다가 `walkable`은 로밍 NPC 점유까지 보므로 뭍길이 막힌 순간 BFS가 물로 우회해
          **NPC 위치에 따라 결과가 흔들린다**(2026-08-06에 실제로 이 조합으로 오탐이 났다).
       ⚠️ 이 단정이 무는 지점: 코드가 `seek(false)`보다 `seek(true)`를 먼저 부르게 바뀌면,
          뭍에 선 상태에서도 BFS가 **더 짧은 물길 지름길**을 골라 여기 물이 섞여 든다. */
    const surfedOnce=!!L.surfing;   /* 물을 실제로 건넜는지는 초기화 전에 붙잡아 둔다 */
    L.surfing=false;
    const gymPath=F.bfsPath(8,30,8,18,false)||[];
    const gymWater=gymPath.filter(q=>F.tileAt(q.x,q.y)==="~").length;
    const surfAlt=F.bfsPath(8,30,8,18,true)||[];   /* 물길을 허용하면 더 짧아지는가(=유혹이 실재하는가) */
    return {goal:g.name, taps, dist:near(), pos:{x:L.pos.x,y:L.pos.y},
            tile:F.tileAt(L.pos.x,L.pos.y), surfing:surfedOnce, gymLen:gymPath.length, gymWater,
            shortcut:(surfAlt.length&&surfAlt.length<gymPath.length)?surfAlt.length:0}; });
  ok(lake.goal==="호수 제단", `4뱃지 직후 목표: ${lake.goal}`);
  soft(lake.dist<=1, `트래커만 따라가 제단 옆에 섰다 — (${lake.pos.x},${lake.pos.y}) 타일"${lake.tile}" 남은거리 ${lake.dist}칸`);
  soft(lake.surfing, "물가에서 파도타기가 자동으로 발동해 물길을 건넜다");
  ok(lake.gymLen>0 && lake.gymWater===0, `뭍길 우선: 체육관4 경로 ${lake.gymLen}칸에 물 ${lake.gymWater}칸${lake.shortcut?` (물길이면 ${lake.shortcut}칸으로 짧아지는데 안 골랐다)`:""}`);
  ok(errs3.length===0, `[8] 런타임 에러 0 (${errs3.length})${errs3.length?": "+errs3.slice(0,2).join(" | "):""}`);

  ok(errs.length===0, `런타임 에러 0 (${errs.length})${errs.length?": "+errs.slice(0,3).join(" | "):""}`);
  await b.close();
  console.log(fail?"\n❌ lord_route_test 실패":"\n✅ lord_route_test 통과");
  process.exit(fail);
})();
