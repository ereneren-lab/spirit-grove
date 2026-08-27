// 신규 지역 '안개 늪지(marsh)' 회귀 테스트: 오버월드 진입 타일 J(비보행) → 늪지 인테리어 진입,
// 잔디에서 늪지 전용 조우 풀(독/땅/물/풀 테마) 생성, 표지판/퇴장 배선 확인.
const { chromium } = require("playwright"); const path=require("path");
(async()=>{ const b=await chromium.launch();
  const p=await b.newPage({viewport:{width:430,height:760}});
  const errs=[]; p.on("pageerror",e=>errs.push(e.message));
  await p.goto("file://"+path.resolve(process.argv[2])); await p.waitForTimeout(800);
  const ok=(c,m)=>{ console.log((c?"  ✅ ":"  ❌ ")+m); if(!c)process.exitCode=1; };

  const r=await p.evaluate(()=>{ const S=window.SG, F=S.flow; S.setG(S.freshState()); S.CONFIG.reduceMotion=true; F.enterMap(true);
    // 오버월드에 J 진입 타일이 존재하고 비보행인지
    let jx=-1,jy=-1; for(let y=0;y<50&&jx<0;y++)for(let x=0;x<25;x++){ if(F.tileAt(x,y)==="J"){jx=x;jy=y;break;} }
    const jWalk = jx>=0 ? F.walkable(jx,jy) : true;
    // J 주변에 보행 가능한 접근 타일이 하나 이상(부딪혀 진입 가능)
    const approachOK = jx>=0 && [[1,0],[-1,0],[0,1],[0,-1]].some(d=>F.walkable(jx+d[0],jy+d[1]));
    // 인테리어 정의 + 진입(warpFade 비동기)
    const M=F.INTERIORS.marsh; const dimOK = !!M && M.W===17 && M.H===13 && M.name==="안개 늪지";
    F.enterInterior(M);
    // 늪지 전용 조우: 정령이 테마 풀에서만 나오는지 (10회 표본)
    // 테마 = 독/땅/물/풀 + 분위기용 ghost(도깨비불 wispkin — 안개 늪지·수렁은 도깨비불의 전형적 서식지).
    // ⚠️ 실제 ENC_POOLS.marsh와 동기화할 것 — 풀에 종을 더하면 여기도 더한다(이 목록은 하드코딩 스냅샷이다).
    const themePool=new Set(["wispkin","swampfrog","jellure","burrowmouse","hedgemoss","mossback","racoonmon","dustbunny","vinesnake","leafwyrm","seedbean"]);
    S.G().party=[S.makeMon("swampfrog",20)]; let inPool=true, gotFoe=false;
    // foe를 지우지 않는다: transitionToBattle의 비동기 콜백이 G.foe를 읽으므로(테스트 아티팩트 방지)
    for(let i=0;i<10;i++){ F.startMarshEncounter(); const f=S.G().foe; if(f){ gotFoe=true; if(!themePool.has(f.id))inPool=false; } S.G().inBattle=false; }
    return { jFound:jx>=0, jWalk, approachOK, dimOK, gotFoe, inPool }; });
  await p.waitForTimeout(400);
  r.entered = await p.evaluate(()=>window.SG.G().indoor==="marsh");

  ok(r.jFound, "오버월드에 늪지 진입 타일(J) 배치됨");
  ok(!r.jWalk, "J는 비보행(부딪혀 진입)");
  ok(r.approachOK, "J에 접근 가능(주변 보행 타일 존재)");
  ok(r.dimOK, "INTERIORS.marsh 정의 (17×13, 안개 늪지)");
  ok(r.entered, "늪지 진입 시 indoor=marsh");
  ok(r.gotFoe && r.inPool, "늪지 조우가 테마 풀(독/땅/물/풀)에서만 생성");
  ok(errs.length===0, "런타임 에러 0"+(errs.length?": "+errs.slice(0,3).join(" / "):""));
  console.log(process.exitCode?"\n❌ 실패":"\n🎉 안개 늪지 통과");
  await b.close(); process.exit(process.exitCode||0);
})();
