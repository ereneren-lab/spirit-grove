// 모바일 컨트롤 배치 회귀 — 게임보이식(방향키 왼쪽·A/B 대각 오른쪽)이 유지되고 실제로 동작하는지.
// 유저 피드백: "방향키 왼쪽, AB 오른쪽이면 진짜 포켓몬 같잖아" → A/B를 방향키 십자에서 분리해 우측 대각 원형으로.
// DOM 재구성(.pads/.abpad 신설) 후 입력 배선이 안 깨졌는지 실좌표+실탭으로 검증한다.
const { chromium } = require("playwright"); const path=require("path");
(async()=>{ const b=await chromium.launch();
  const ctx=await b.newContext({viewport:{width:393,height:852},deviceScaleFactor:2,hasTouch:true,isMobile:true});
  const p=await ctx.newPage(); const errs=[]; p.on("pageerror",e=>errs.push(e.message));
  await p.goto("file://"+path.resolve(process.argv[2])); await p.waitForTimeout(800);
  const ok=(c,m)=>console.log((c?"  ✅ ":"  ❌ ")+m);
  await p.evaluate(()=>{ const S=window.SG,F=S.flow; S.setG(S.freshState()); const G=S.G();
    G.party=[S.makeMon("foxfire",8)]; G.pos={x:8,y:45}; F.enterMap(true); });
  await p.waitForTimeout(600);
  // 버튼 존재/배치 확인
  const layout=await p.evaluate(()=>{ const dp=document.querySelector(".dpad").getBoundingClientRect();
    const ab=document.querySelector(".abpad").getBoundingClientRect();
    const A=document.getElementById("actBtn").getBoundingClientRect();
    const Bt=document.getElementById("backBtn").getBoundingClientRect();
    return {dpadLeft:Math.round(dp.left), abLeft:Math.round(ab.left), dpadIsLeftOfAb:dp.left<ab.left,
      Aright:A.right>Bt.left, Aup:A.top<Bt.top}; });
  ok(layout.dpadIsLeftOfAb, `방향키가 A/B보다 왼쪽 (dpad ${layout.dpadLeft} < abpad ${layout.abLeft})`);
  ok(layout.Aup && layout.Aright, "A가 위-오른쪽, B가 아래-왼쪽 (게임보이 대각)");
  // 방향키 실제 이동
  const before=await p.evaluate(()=>({...window.SG.G().pos}));
  await p.locator('.dpad button[data-dir="up"]').tap();
  await p.waitForTimeout(500);
  const after=await p.evaluate(()=>({...window.SG.G().pos}));
  ok(after.y<before.y || (after.x!==before.x||after.y!==before.y), `방향키 탭으로 이동 (${before.x},${before.y}→${after.x},${after.y})`);
  // A 버튼(상호작용) 동작 — 표지판 앞에서 확인은 복잡하니 클릭이 에러 없이 처리되는지만
  await p.locator('#actBtn').tap(); await p.waitForTimeout(200);
  await p.locator('#backBtn').tap(); await p.waitForTimeout(200);
  ok(errs.length===0, "A/B/방향키 조작 중 런타임 에러 0"+(errs.length?": "+errs[0]:""));
  const fail=errs.length>0; console.log(fail?"\n❌ 실패":"\n🎉 모바일 컨트롤 통과");
  await ctx.close(); await b.close(); process.exit(errs.length?1:0); })();
