// 초반 완급 · 공간 활용 감사 — **지도의 폭을 실제로 쓰는가, 그리고 나오자마자 다 끝나지 않는가.**
//
// 왜 있나
//   유저: "게임 초반에 너무 나오자마자 배틀하는거 좀 별로야. 포켓몬처럼 차근차근 가는 맛이 있으면
//         좋겠어." / "더 다듬고 더 공간을 잘 활용하도록 해. **너무 나오자마자 모든게 진행돼.**"
//
//   실측해보니 원인이 느낌이 아니라 배치였다. 지도는 가로 25칸인데
//   **체육관 4개가 전부 x=8 한 줄**에 세로로 늘어서 있었고(사이 10~11보),
//   토리는 집에서 **3보**면 첫 체육관 문 앞이었다.
//
//   ⚠️ 이건 눈으로는 절대 안 잡힌다 — 지도를 열어봐도 "체육관이 네 개 있네"로 보인다.
//      숫자로 재야만 보이는 종류라서 회귀로 박는다. 앞으로 누가 타일 하나를 옮겨
//      간격이 다시 무너지면 여기서 걸린다.
//
// 재는 것
//   [1] 네 출신지 → 첫 체육관 도보거리 (나오자마자 도착하면 안 된다)
//   [2] 체육관 사이 도보거리 (한 줄에 몰리면 짧아진다)
//   [3] 체육관 x좌표가 가로로 흩어져 있는가 (폭을 쓰는가)
//   [4] 첫 체육관에 **풀숲을 안 밟고** 들어갈 수 없는가 (야생 한 번은 만나고 들어가야 한다)
//   [5] 그 길에 **트레이너가 실제로 서 있는가**, 그리고 **너무 일찍 걸지 않는가**
//
//   ⚠️ [5]는 체육관을 동쪽으로 옮기고 나서 생긴 구멍이다. 거리는 늘렸는데 트레이너는
//      옛 체육관 자리(서쪽)에 그대로 있어서, 미나·토리는 **0명**을 만나고 도착했다.
//      거리만 늘리면 "차근차근"이 아니라 그냥 빈 들판이 길어진 것이다.
//   ⚠️ 트레이너 전투는 **시야(dir + range 2)** 로 걸린다 → 재야 하는 건 트레이너가 선 칸이 아니라
//      **그가 보고 있는 칸**이다. onboarding_test가 트레이너 칸만 보다가
//      "리오가 2보째에 전투"를 놓쳤다(준의 시야가 리오 출구 1칸 앞까지 닿았다).
//
// ⚠️ 좌표를 이 파일에 적지 않는다 — 전부 GYM_AT / HOME_POS에서 가져온다.
//    (goal_test가 좌표를 박아뒀다가 체육관을 옮기자 테스트만 빨개진 적이 있다. 그것도 병렬 테이블이다.)
const { chromium } = require("playwright"); const path=require("path");

const MIN_TO_GYM1  = 7;    // 출신지 → 첫 체육관 최소 도보
const MIN_GYM_GAP  = 15;   // 체육관 사이 최소 도보
const MIN_X_SPREAD = 12;   // 체육관 x좌표 최대-최소 (지도 폭 25 중 절반 가까이)
const MIN_TRAINERS = 2;    // 첫 체육관까지 길목에서 만나는 트레이너 수
const MIN_FIRST_FIGHT = 5; // 첫 전투는 최소 이 보 이후 (나오자마자 배틀 금지)

(async()=>{
  const b=await chromium.launch();
  const p=await b.newPage({viewport:{width:430,height:760}});
  const errs=[]; p.on("pageerror",e=>errs.push(e.message));
  let fail=0; const ok=(c,m)=>{ console.log((c?"  ✅ ":"  ❌ ")+m); if(!c)fail=1; };
  process.on("unhandledRejection",async e=>{ console.log("❌ "+e); await b.close(); process.exit(1); });
  await p.goto("file://"+path.resolve(process.argv[2])); await p.waitForTimeout(900);

  const r=await p.evaluate(()=>{
    const S=window.SG,F=S.flow;
    S.setG(S.freshState());
    /* 뱃지를 다 주고 잰다 — 지역 게이트에 막혀 "도달 불가"가 나오면 배치가 아니라
       게이트를 재는 꼴이 된다. 여기서 보고 싶은 건 순수 도보거리다. */
    S.G().badges=["1","2","3","4"];
    F.enterMap(true);
    const W=25,H=50;
    const bfs=(sx,sy,noGrass)=>{ const d={},q=[[sx,sy]]; d[sx+","+sy]=0;
      while(q.length){ const [x,y]=q.shift(), c=d[x+","+y];
        [[1,0],[-1,0],[0,1],[0,-1]].forEach(([dx,dy])=>{ const nx=x+dx,ny=y+dy,k=nx+","+ny;
          if(nx<0||ny<0||nx>=W||ny>=H||d[k]!=null||!F.terrainWalkable(nx,ny))return;
          if(noGrass&&F.tileAt(nx,ny)==="T")return;
          d[k]=c+1; q.push([nx,ny]); }); }
      return d; };
    /* 체육관 타일은 비보행(문)이다. 게임 규칙상 **아래 칸(정면)에서만** 들어간다
       → 인접 아무 칸이 아니라 "문 앞 칸"까지의 거리를 재야 한다. */
    const front=(x,y)=>({x, y:y+1});
    const gyms=Object.entries(S.GYM_AT||{})
      .map(([xy,id])=>{ const [x,y]=xy.split(",").map(Number);
                        return {n:Number(String(id).replace(/^gym/,"")), x, y, f:front(x,y)}; })
      .sort((a,b)=>a.n-b.n);
    const g1=gyms[0];
    const nm=["리오","미나","토리","엘"];
    /* 시야 전투 트레이너 → 그가 **보고 있는 칸**들. 벽에 막히면 거기서 끊긴다(게임과 같은 규칙). */
    const DIR={up:[0,-1],down:[0,1],left:[-1,0],right:[1,0]};
    const seers=(F.NPCS||[]).filter(n=>n.battleKey&&n.dir&&n.x!=null).map(n=>{
      const d=DIR[n.dir]||[0,1], cells=[];
      for(let s=1;s<=(n.range||2);s++){ const cx=n.x+d[0]*s, cy=n.y+d[1]*s;
        if(!F.terrainWalkable(cx,cy))break; cells.push([cx,cy]); }
      return {name:n.name, cells};
    });
    const toGym=bfs(g1.f.x,g1.f.y,false);
    const homes=(F.HOME_POS||S.HOME_POS||[]).map((h,i)=>{
      const d=bfs(h.x,h.y,false), dg=bfs(h.x,h.y,true);
      const direct=d[g1.f.x+","+g1.f.y];
      /* 길목 판정: 출신지→시야칸→체육관1 이 최단보다 2보 이내로 더 드는가.
         (트레이너가 선 칸이 아니라 시야 칸으로 재는 게 핵심이다) */
      const fights=[];
      seers.forEach(t=>{ let best=null;
        t.cells.forEach(([cx,cy])=>{ const a=d[cx+","+cy], c=toGym[cx+","+cy];
          if(a==null||c==null||direct==null)return;
          const det=a+c-direct; if(best==null||det<best.det)best={det,step:a}; });
        if(best&&best.det<=2)fights.push({name:t.name, step:best.step, det:best.det}); });
      return { name:nm[i]||("#"+i), x:h.x, y:h.y, toG1:direct,
               toG1NoGrass:dg[g1.f.x+","+g1.f.y], fights };
    });
    const gaps=[];
    for(let i=0;i+1<gyms.length;i++){
      const d=bfs(gyms[i].f.x,gyms[i].f.y,false);
      gaps.push({a:gyms[i].n, b:gyms[i+1].n, d:d[gyms[i+1].f.x+","+gyms[i+1].f.y]});
    }
    const xs=gyms.map(g=>g.x);
    return { gyms, homes, gaps, spread:Math.max(...xs)-Math.min(...xs),
             g1FrontTile:F.tileAt(g1.f.x,g1.f.y), g1FrontWalkable:F.terrainWalkable(g1.f.x,g1.f.y) };
  });

  console.log("\n[0] 표본 확인");
  ok(r.gyms.length===4, `체육관 ${r.gyms.length}곳을 쟀다 (기대 4) — ${r.gyms.map(g=>`${g.n}(${g.x},${g.y})`).join(" ")}`);
  ok(r.homes.length===4, `출신지 ${r.homes.length}곳을 쟀다 (기대 4)`);

  console.log("\n[1] 집에서 나오자마자 첫 체육관이 아니다");
  r.homes.forEach(h=>ok(h.toG1!=null && h.toG1>=MIN_TO_GYM1,
    `${h.name} (${h.x},${h.y}) → 첫 체육관 ${h.toG1==null?"도달 불가":h.toG1+"보"} (기준 ${MIN_TO_GYM1}보 이상)`));

  console.log("\n[2] 체육관 사이가 충분히 멀다");
  r.gaps.forEach(g=>ok(g.d!=null && g.d>=MIN_GYM_GAP,
    `체육관${g.a} → 체육관${g.b} : ${g.d==null?"도달 불가":g.d+"보"} (기준 ${MIN_GYM_GAP}보 이상)`));

  console.log("\n[3] 지도의 가로 폭을 쓴다 (한 줄에 몰려 있지 않다)");
  ok(r.spread>=MIN_X_SPREAD,
    `체육관 x좌표 폭 ${r.spread}칸 — ${r.gyms.map(g=>g.x).join(" → ")} (기준 ${MIN_X_SPREAD}칸 이상)`);

  console.log("\n[4] 첫 체육관은 풀숲을 지나야 들어갈 수 있다");
  /* 문 앞 칸이 풀숲이면, 어느 경로로 오든 마지막 한 칸에서 반드시 야생을 만날 수 있다.
     "스타터 Lv5로 곧장 관장에게 걸어 들어가는" 흐름을 구조적으로 막는다. */
  ok(r.g1FrontWalkable, `첫 체육관 문 앞 칸에 설 수 있다 (타일 "${r.g1FrontTile}")`);
  ok(r.g1FrontTile==="T", `문 앞 칸이 풀숲이다 — 실제 "${r.g1FrontTile}"`);
  r.homes.forEach(h=>ok(h.toG1NoGrass==null || h.toG1NoGrass>h.toG1,
    `${h.name} — 풀숲을 피하면 더 멀어진다 (${h.toG1}보 → ${h.toG1NoGrass==null?"불가":h.toG1NoGrass+"보"})`));

  console.log("\n[5] 그 길에 트레이너가 있고, 너무 일찍 걸지 않는다");
  r.homes.forEach(h=>{
    ok(h.fights.length>=MIN_TRAINERS,
      `${h.name} — 길목 트레이너 ${h.fights.length}명 (기준 ${MIN_TRAINERS}명 이상): ${h.fights.map(f=>`${f.name}@${f.step}보`).join(" · ")||"없음"}`);
    /* ⚠️ 트레이너가 0명일 때 "첫 전투 없음"을 초록으로 넘기면 **공허한 통과**다
       (이 저장소에서 이미 두 번 겪었다 — 빈 배열을 돌며 전부 초록이 뜬 적이 있다).
       0명은 여기서도 실패로 친다. */
    const first=h.fights.length?Math.min(...h.fights.map(f=>f.step)):null;
    ok(first!=null && first>=MIN_FIRST_FIGHT,
      `  첫 전투가 ${first==null?"없음(트레이너 0명 — 공허한 통과 방지로 실패 처리)":first+"보째"} (기준 ${MIN_FIRST_FIGHT}보 이후)`);
  });

  ok(errs.length===0, `런타임 에러 0 (${errs.length})${errs.length?": "+errs[0].slice(0,70):""}`);
  await b.close();
  console.log(fail?"\n❌ pace_test 실패":"\n🎉 초반 완급·공간 활용 통과");
  process.exit(fail);
})();
