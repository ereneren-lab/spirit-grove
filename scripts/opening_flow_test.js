// 회귀 — 초반 동선: 시작 마을은 트레이너-프리(포켓몬식). 미나 집을 좌측(8,44)으로 옮겨
//  네 캐릭터 모두 첫 트레이너를 초원(첫 route)에서 만나도록 재튜닝했다. t19(코너 게이트키퍼)만 예외.
const { chromium } = require("playwright"); const path=require("path");
(async()=>{ const b=await chromium.launch();
  const p=await b.newPage({viewport:{width:430,height:760}});
  const errs=[]; p.on("pageerror",e=>errs.push(e.message));
  await p.goto("file://"+path.resolve(process.argv[2])); await p.waitForTimeout(700);
  const ok=(c,m)=>{ console.log((c?"  ✅ ":"  ❌ ")+m); if(!c)process.exitCode=1; };
  const r=await p.evaluate(()=>{ const S=window.SG,F=S.flow; S.setG(S.freshState()); const G=S.G(); G.party=[S.makeMon("foxfire",8)]; F.enterMap(true);
    const N=S.NPCS||[]; const sight=N.filter(n=>/^t\d+$/.test(n.id||""));
    const townSight=sight.filter(n=>n.y>=47);
    const homeExits=(F.HOME_POS||[]).map(h=>[h.x,h.y]);
    const nearHome=sight.filter(n=>homeExits.some(([hx,hy])=>Math.abs(n.x-hx)+Math.abs(n.y-hy)<3));
    const DIR={up:[0,-1],down:[0,1],left:[-1,0],right:[1,0]};
    const sightHitsTown=(n)=>{ const d=DIR[n.dir||"down"],rng=n.range||2; for(let s=1;s<=rng;s++){ const cy=n.y+d[1]*s; if(!F.terrainWalkable(n.x+d[0]*s,cy))break; if(cy>=47)return true; } return false; };
    const t1=sight.find(n=>n.id==="t1"), t15=sight.find(n=>n.id==="t15");
    return {
      t1:t1&&{x:t1.x,y:t1.y}, t15:t15&&{x:t15.x,y:t15.y},
      t1Meadow: !!t1&&t1.y>=41&&t1.y<47, t15Meadow: !!t15&&t15.y>=41&&t15.y<47,
      townSightOnlyCorner: townSight.every(n=>n.id==="t19"&&n.x>=20),
      townSight: townSight.map(n=>n.id),
      nearHome: nearHome.map(n=>n.id),
      anyTownSightLeak: sight.filter(n=>n.id!=="t19").some(n=>sightHitsTown(n)),
    };
  });
  ok(r.t1Meadow && r.t15Meadow, `t1·t15가 초원(첫 route)에 있다 (t1=${JSON.stringify(r.t1)} t15=${JSON.stringify(r.t15)})`);
  ok(r.townSightOnlyCorner, `마을 시야 트레이너는 코너 게이트키퍼(t19)만 (${r.townSight.join(",")||"없음"})`);
  ok(r.nearHome.length===0, `어느 집 출구든 3칸 내 시야 트레이너 0명 (${r.nearHome.join(",")||"없음"})`);
  ok(!r.anyTownSightLeak, "t19 외 어떤 시야 트레이너도 시야가 마을(y≥47)에 닿지 않는다");
  ok(errs.length===0,"런타임 에러 0"+(errs.length?": "+errs.slice(0,2).join(" / "):""));
  console.log(process.exitCode?"\n❌ 실패":"\n🎉 초반 동선(마을 트레이너-프리) 통과");
  await b.close(); process.exit(process.exitCode||0);
})();
