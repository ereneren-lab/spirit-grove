// 전멸(화이트아웃) 회귀 테스트 — 포켓몬식 부활 지점:
//  - 예전엔 어디서 전멸하든 항상 STARTPOS(시작 마을)로 돌려보냈다. 센터를 지역마다 7곳 깔아둔 의미가 없었다.
//  - 이제 markHeal()이 회복 지점(정령센터·침대·모닥불·오두막)을 기록하고 blackout이 거기로 되돌린다.
//  - 정령센터/집/설원 오두막은 그 '안'에서 눈뜬다(본가와 동일). 배로만 가는 곳은 문 앞에서 눈뜬다.
//  - 소지금 페널티는 본가 1세대와 같이 절반.
//  - 구세이브(lastHeal 없음)는 STARTPOS로 폴백해야 한다.
const { chromium } = require("playwright"); const path=require("path");
(async()=>{ const b=await chromium.launch();
  process.on("uncaughtException",async e=>{ console.error(e); try{await b.close();}catch{} process.exit(1); });
  process.on("unhandledRejection",async e=>{ console.error(e); try{await b.close();}catch{} process.exit(1); });
  const p=await b.newPage({viewport:{width:430,height:760}});
  const errs=[]; p.on("pageerror",e=>errs.push(e.message));
  await p.goto("file://"+path.resolve(process.argv[2])); await p.waitForTimeout(800);
  const ok=(c,m)=>{ console.log((c?"  ✅ ":"  ❌ ")+m); if(!c)process.exitCode=1; };

  /* 1) 폴백: 한 번도 회복한 적 없으면 **자기 출신지 앞**으로.
     ⚠️ 2026-08-07부터 캐릭터마다 출신지가 다르다(유저 결정). 예전엔 넷 다 STARTPOS(마을) 한 곳이었는데
        그러면 엘·토리는 전멸할 때마다 낯선 곳에서 깨어난다 → HOME_POS[styleIdx]로 바뀌었다.
     ⚠️ 좌표를 박아 두지 않고 **게임이 들고 있는 HOME_POS와 대조**한다 — 출신지를 옮겨도 안 깨진다. */
  const fresh=await p.evaluate(async()=>{
    const S=window.SG, F=S.flow; S.setG(S.freshState()); S.CONFIG.reduceMotion=true; F.enterMap(true);
    const G=S.G(); G.styleIdx=2;                 // 토리(언덕 농가) — 마을이 아닌 출신지로 확인
    G.pos={x:9,y:22};                           // 수정 호수 부근 — 출신지에서 멀리
    F.blackout(); await new Promise(r=>setTimeout(r,300));
    const g=S.G(), hp=F.HOME_POS?F.HOME_POS[2]:null;
    return { x:g.pos.x, y:g.pos.y, hx:hp&&hp.x, hy:hp&&hp.y, indoor:g.indoor };
  });
  ok(fresh.hx!=null && fresh.x===fresh.hx && fresh.y===fresh.hy,
     `회복 기록이 없으면 자기 출신지 앞으로 (${fresh.x},${fresh.y} · 기대 ${fresh.hx},${fresh.hy})`);

  // 2) 정령센터에서 회복 → 먼 곳에서 전멸 → 그 센터 '안'에서 눈뜬다
  const center=await p.evaluate(async()=>{
    const S=window.SG, F=S.flow; S.setG(S.freshState()); S.CONFIG.reduceMotion=true; F.enterMap(true);
    const G=S.G();
    // 오버월드 '+' 중 가장 북쪽(리그 앞) 센터를 고른다 — 시작 마을에서 가장 먼 곳
    let best=null; for(let y=0;y<50;y++)for(let x=0;x<25;x++){ if(F.tileAt(x,y)==="+"&&(!best||y<best.y))best={x,y}; }
    // 센터 입구 앞 보행 칸에 서서 진입
    const adj=[[1,0],[-1,0],[0,1],[0,-1]].map(d=>({x:best.x+d[0],y:best.y+d[1]})).find(q=>F.walkable(q.x,q.y));
    G.pos={x:adj.x,y:adj.y};
    F.enterInterior(F.INTERIORS.center); await new Promise(r=>setTimeout(r,400));
    F.markHeal();                                  // 간호사 회복과 동일 효과
    const lh=Object.assign({},S.G().lastHeal);
    F.exitInterior(); await new Promise(r=>setTimeout(r,400));
    // 멀리 이동한 뒤 전멸
    S.G().pos={x:8,y:48};
    F.blackout(); await new Promise(r=>setTimeout(r,400));
    const g=S.G();
    return { lh, indoor:g.indoor, x:g.pos.x, y:g.pos.y, entry:adj, centerY:best.y };
  });
  ok(center.lh&&center.lh.indoor==="center", `센터 회복이 부활 지점으로 기록된다 (${JSON.stringify(center.lh)})`);
  ok(center.lh.x===center.entry.x&&center.lh.y===center.entry.y, "기록 좌표는 오버월드 기준(실내 좌표 아님)");
  ok(center.indoor==="center", `전멸 후 정령센터 '안'에서 눈뜬다 (indoor=${center.indoor})`);
  ok(center.centerY<20, "가장 먼 센터로 검증했다(시작 마을 폴백과 구분됨)");

  // 3) 센터에서 나오면 원래 입구 앞으로 — _owBackup이 꼬이지 않았는지
  const exited=await p.evaluate(async()=>{
    const S=window.SG, F=S.flow; F.exitInterior(); await new Promise(r=>setTimeout(r,400));
    const g=S.G(); return { x:g.pos.x, y:g.pos.y, indoor:g.indoor };
  });
  ok(exited.indoor===null&&exited.x===center.entry.x&&exited.y===center.entry.y,
     `부활한 센터에서 나오면 그 입구 앞 (${exited.x},${exited.y})`);

  // 4) 모닥불(오버월드 회복)은 실내 재진입 없이 그 자리에서
  const camp=await p.evaluate(async()=>{
    const S=window.SG, F=S.flow; S.setG(S.freshState()); S.CONFIG.reduceMotion=true; F.enterMap(true);
    const G=S.G(); G.indoor=null; G.pos={x:12,y:40};
    F.markHeal(); const lh=Object.assign({},S.G().lastHeal);
    S.G().pos={x:8,y:48}; F.blackout(); await new Promise(r=>setTimeout(r,300));
    const g=S.G(); return { lh, x:g.pos.x, y:g.pos.y, indoor:g.indoor };
  });
  ok(camp.lh.indoor===null, "오버월드 회복은 indoor 없이 기록");
  ok(camp.x===12&&camp.y===40&&camp.indoor===null, `전멸 후 그 자리로 (${camp.x},${camp.y})`);

  // 5) 소지금 절반 (본가 1세대)
  const money=await p.evaluate(async()=>{
    const S=window.SG; S.setG(S.freshState()); const G=S.G(); G.money=1000;
    const pen=Math.floor(G.money*0.5); return { pen, after:Math.max(0,G.money-pen) };
  });
  ok(money.pen===500&&money.after===500, `소지금 절반 페널티 (1000 → ${money.after})`);

  // 6) 세이브/불러오기 왕복으로 부활 지점이 보존되는가 + 구세이브 폴백
  const save=await p.evaluate(async()=>{
    const S=window.SG, F=S.flow; S.setG(S.freshState()); F.enterMap(true);
    // ⚠️ deserialize는 파티가 비면 false로 조기 반환한다 — 안 채우면 G가 그대로 남아
    //    "보존됐다"는 거짓 양성이 난다(실제로 겪었다).
    S.G().party=[S.makeMon(S.DEX[0].id,5)];
    S.G().lastHeal={x:20,y:45,indoor:"center"};
    const ser=F.serialize(); const hasKey=!!ser.lh;
    F.deserialize(JSON.parse(JSON.stringify(ser)));
    const round=S.G().lastHeal;
    // 구세이브: lh 키가 없는 경우
    const old=JSON.parse(JSON.stringify(ser)); delete old.lh;
    const okRound=F.deserialize(JSON.parse(JSON.stringify(ser)));
    const okLegacy=F.deserialize(old); const legacy=S.G().lastHeal;
    return { hasKey, round, legacy, v:ser.v, okRound, okLegacy };
  });
  ok(save.okRound&&save.okLegacy, "deserialize가 실제로 성공했다(거짓 양성 방지)");
  ok(save.hasKey&&save.round&&save.round.x===20&&save.round.indoor==="center",
     `세이브 왕복에서 부활 지점 보존 (${JSON.stringify(save.round)})`);
  ok(save.legacy===null, "구세이브(lh 없음)는 null → STARTPOS 폴백");
  ok(save.v===4, "세이브 버전은 4 유지 — 구세이브를 무효화하지 않는다");

  ok(errs.length===0, `런타임 에러 0 (${errs.length}${errs[0]?": "+errs[0]:""})`);
  await b.close();
  console.log(process.exitCode?"\n❌ 실패":"\n🎉 전멸 부활 지점 통과");
})();
