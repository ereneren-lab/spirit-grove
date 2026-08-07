// 정령센터 회귀 테스트:
//  - 오버월드 '+' 타일이 지역마다 배치되고 비보행(부딪혀 진입)이며 접근 가능
//  - INTERIORS.center 진입 → indoor=center
//  - 카운터 뒤 간호사 N에 도달 가능(중앙 통로가 막히면 소프트락)
//  - nurseHeal()이 HP/상태이상/PP를 완전 회복하고 세이브까지 한다
const { chromium } = require("playwright"); const path=require("path");
(async()=>{ const b=await chromium.launch();
  const p=await b.newPage({viewport:{width:430,height:760}});
  const errs=[]; p.on("pageerror",e=>errs.push(e.message));
  await p.goto("file://"+path.resolve(process.argv[2])); await p.waitForTimeout(800);
  const ok=(c,m)=>{ console.log((c?"  ✅ ":"  ❌ ")+m); if(!c)process.exitCode=1; };

  const r=await p.evaluate(()=>{
    const S=window.SG, F=S.flow; S.setG(S.freshState()); S.CONFIG.reduceMotion=true; F.enterMap(true);
    const band=y=> y>=47?0:y>=41?1:y>=34?2:y>=27?3:y>=20?4:y>=12?5:6;
    // 오버월드의 모든 '+' 수집
    const spots=[]; for(let y=0;y<50;y++)for(let x=0;x<25;x++){ if(F.tileAt(x,y)==="+")spots.push({x,y,r:band(y)}); }
    const regions=[...new Set(spots.map(s=>s.r))].sort();
    const allBlocked=spots.every(s=>!F.walkable(s.x,s.y));
    const allReachable=spots.every(s=>[[1,0],[-1,0],[0,1],[0,-1]].some(d=>F.walkable(s.x+d[0],s.y+d[1])));
    // 인테리어 정의
    const C=F.INTERIORS.center;
    const dimOK=!!C && C.W===11 && C.H===9 && C.name==="정령센터";
    return { n:spots.length, regions, allBlocked, allReachable, dimOK, str:C?C.str:null };
  });

  // 인테리어 진입 + 간호사 도달 가능성(카운터 중앙 통로) 확인
  const inside=await p.evaluate(async()=>{
    const S=window.SG, F=S.flow; F.enterInterior(F.INTERIORS.center);
    await new Promise(r=>setTimeout(r,400));
    const G=S.G(); const C=F.INTERIORS.center;
    // 간호사 N 좌표
    let nx=-1,ny=-1; for(let y=0;y<C.H;y++)for(let x=0;x<C.W;x++){ if(C.str[y][x]==="N"){nx=x;ny=y;} }
    // 입장 위치 → 간호사 바로 아래칸까지 경로가 있는지 (카운터가 완전히 막혔으면 실패)
    const pathLen=F.bfsPath(C.startX,C.startY,nx,ny+1);
    return { indoor:G.indoor, nx, ny, nurseBlocked:!F.walkable(nx,ny), reach:!!(pathLen&&pathLen.length) };
  });

  // 회복 동작
  const heal=await p.evaluate(async()=>{
    const S=window.SG, F=S.flow; const G=S.G();
    const a=S.makeMon("foxfire",20), c=S.makeMon("racoonmon",18);
    a.hp=3; a.status="psn"; a.pp[a.moves[0]]=0; c.hp=1; c.status="brn";
    G.party=[a,c];
    try{ localStorage.removeItem("spiritGroveSave_v4"); }catch(e){}
    F.nurseHeal();
    // 대화 2페이지 → 회복 → 마무리 대화. reduceMotion이라 즉시 진행되지만 A를 눌러 넘긴다.
    for(let i=0;i<8;i++){ if(F.dialogActive&&F.dialogActive())F.advanceDialog(); await new Promise(r=>setTimeout(r,120)); }
    let has=false; try{ has=!!localStorage.getItem("spiritGroveSave_v4"); }catch(e){}
    return { hpFull:a.hp===a.maxHp&&c.hp===c.maxHp, statusCleared:!a.status&&!c.status,
             ppFull:a.pp[a.moves[0]]===S.MOVES[a.moves[0]].pp, saved:has, friend:a.friendship };
  });

  ok(r.dimOK, "INTERIORS.center 정의 (11×9, 정령센터)");
  ok(r.n>=6, `오버월드에 정령센터 ${r.n}곳 배치`);
  ok(r.regions.length>=6, `지역 ${r.regions.length}개 대에 걸쳐 분산 (밴드 ${r.regions.join(",")})`);
  ok(r.allBlocked, "'+' 는 비보행 — 부딪혀 진입");
  ok(r.allReachable, "모든 정령센터에 인접 보행 타일 존재");
  ok(inside.indoor==="center", `진입 시 indoor=center (${inside.indoor})`);
  ok(inside.nurseBlocked, "간호사 N은 비보행(카운터 너머)");
  ok(inside.reach, "입구→간호사 앞까지 경로 존재 (카운터 소프트락 없음)");
  ok(heal.hpFull, "회복: HP 전원 풀");
  ok(heal.statusCleared, "회복: 상태이상 해제");
  ok(heal.ppFull, "회복: PP 복구");
  ok(heal.friend>0, `회복: 친밀도 상승 (+${heal.friend})`);
  ok(heal.saved, "회복 후 자동 세이브 (센터가 세이브 포인트)");
  ok(errs.length===0, "런타임 에러 0"+(errs.length?": "+errs.slice(0,3).join(" / "):""));
  console.log(process.exitCode?"\n❌ 실패":"\n🎉 정령센터 통과");
  await b.close(); process.exit(process.exitCode||0);
})();
