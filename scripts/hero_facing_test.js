// 주인공 좌우 방향 회귀 — 진행방향을 보고 서야 한다(유저 제보: 좌우 이동 시 반대로 봄).
// ⚠️ 주인공 아트 원본은 **우향**(돋보기가 우측)이다. 따라서 **왼쪽 이동 시에만** 좌우반전해야
//    진행방향을 본다. 예전엔 '오른쪽 이동 시 반전'이라 정반대로 서 있었다(스크린샷으로 확인).
// 판정: 빌드된 dist의 주인공 그리기 코드에서 반전 조건이 left인지(right가 아닌지) + 런타임 무결성.
const { chromium } = require("playwright"); const path=require("path"); const fs=require("fs");
(async()=>{
  const src=fs.readFileSync(process.argv[2],"utf8");
  const ok=(c,m)=>{ console.log((c?"  ✅ ":"  ❌ ")+m); if(!c)process.exitCode=1; };
  // 주인공 빌보드: !_back && dir==="left"일 때만 scale(-1,1)
  const flipLeft = /!_back&&\(this\.dir\|\|"down"\)==="left"\)\{ ctx\.translate\(hx,0\); ctx\.scale\(-1,1\)/.test(src);
  const flipRight = /!_back&&\(this\.dir\|\|"down"\)==="right"\)\{ ctx\.translate\(hx,0\); ctx\.scale\(-1,1\)/.test(src);
  ok(flipLeft && !flipRight, `주인공은 왼쪽 이동 시에만 반전(우향 아트) — left:${flipLeft} right:${flipRight}`);
  // 팔로워는 반대(크리처 아트는 좌향) — facing>0(오른쪽)일 때 반전. 같이 확인해 회귀 방지.
  const folRight = /if\(fol\.facing>0\)\{ ctx\.translate\(fsx,0\); ctx\.scale\(-1,1\)/.test(src);
  ok(folRight, `팔로워는 오른쪽 이동 시 반전(좌향 크리처 아트) — ${folRight}`);

  const b=await chromium.launch();
  const p=await b.newPage({viewport:{width:430,height:760}});
  const errs=[]; p.on("pageerror",e=>errs.push(e.message));
  await p.goto("file://"+path.resolve(process.argv[2])); await p.waitForTimeout(800);
  await p.evaluate(()=>{ const S=window.SG,F=S.flow; S.setG(S.freshState()); const G=S.G();
    G.party=[S.makeMon("foxfire",8)]; G.pos={x:12,y:44}; F.enterMap(true); });
  await p.waitForTimeout(400);
  ok(errs.length===0, "런타임 에러 0"+(errs.length?": "+errs[0]:""));
  console.log(process.exitCode?"\n❌ 실패":"\n🎉 주인공 방향 통과");
  await b.close(); process.exit(process.exitCode||0);
})();
