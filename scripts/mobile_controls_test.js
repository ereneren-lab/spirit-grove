// 모바일 컨트롤 배치 회귀 — 게임보이식(방향키 왼쪽·A/B 대각 오른쪽)이 유지되고 실제로 동작하는지.
// 유저 피드백: "방향키 왼쪽, AB 오른쪽이면 진짜 포켓몬 같잖아" → A/B를 방향키 십자에서 분리해 우측 대각 원형으로.
// DOM 재구성(.pads/.abpad 신설) 후 입력 배선이 안 깨졌는지 실좌표+실탭으로 검증한다.
const { chromium } = require("playwright"); const path=require("path");
let FAIL=false;
const ok=(c,m)=>{ console.log((c?"  ✅ ":"  ❌ ")+m); if(!c)FAIL=true; };
(async()=>{ const b=await chromium.launch();
  const errs=[];
  const setup=async(p)=>{ p.on("pageerror",e=>errs.push(e.message));
    await p.goto("file://"+path.resolve(process.argv[2])); await p.waitForTimeout(700);
    await p.evaluate(()=>{ const S=window.SG,F=S.flow; S.setG(S.freshState()); const G=S.G();
      G.party=[S.makeMon("foxfire",8)]; G.pos={x:8,y:45}; F.enterMap(true); });
    await p.waitForTimeout(500); };

  console.log("[세로] 게임보이 배치 + 실제 조작");
  const ctx=await b.newContext({viewport:{width:393,height:852},deviceScaleFactor:2,hasTouch:true,isMobile:true});
  const p=await ctx.newPage(); await setup(p);
  const layout=await p.evaluate(()=>{ const dp=document.querySelector(".dpad").getBoundingClientRect();
    const ab=document.querySelector(".abpad").getBoundingClientRect();
    const A=document.getElementById("actBtn").getBoundingClientRect();
    const Bt=document.getElementById("backBtn").getBoundingClientRect();
    return {dpadLeft:Math.round(dp.left), abLeft:Math.round(ab.left), dpadIsLeftOfAb:dp.left<ab.left,
      Aright:A.right>Bt.left, Aup:A.top<Bt.top}; });
  ok(layout.dpadIsLeftOfAb, `방향키가 A/B보다 왼쪽 (dpad ${layout.dpadLeft} < abpad ${layout.abLeft})`);
  ok(layout.Aup && layout.Aright, "A가 위-오른쪽, B가 아래-왼쪽 (게임보이 대각)");
  const before=await p.evaluate(()=>({...window.SG.G().pos}));
  await p.locator('.dpad button[data-dir="up"]').tap(); await p.waitForTimeout(500);
  const after=await p.evaluate(()=>({...window.SG.G().pos}));
  ok(after.x!==before.x||after.y!==before.y, `방향키 탭으로 이동 (${before.x},${before.y}→${after.x},${after.y})`);
  await p.locator('#actBtn').tap(); await p.waitForTimeout(200);
  await p.locator('#backBtn').tap(); await p.waitForTimeout(200);
  await ctx.close();

  console.log("[가로] 화면 꽉 채움 + 컨트롤 거터(맵을 안 가림)");
  // ⚠️ 이걸 안 봤다가 놓쳤다: 가로 미디어쿼리가 안 먹어 세로 그대로 centered였다.
  const lc=await b.newContext({viewport:{width:852,height:393},deviceScaleFactor:2,hasTouch:true,isMobile:true});
  const lp=await lc.newPage(); await setup(lp);
  const L=await lp.evaluate(()=>{ const vw=window.innerWidth;
    const r=s=>{const el=document.querySelector(s);const b=el.getBoundingClientRect();return {l:Math.round(b.left),r:Math.round(b.right),t:Math.round(b.top),b:Math.round(b.bottom),w:Math.round(b.width)};};
    return { vw, topbar:r('.topbar'), canvas:r('.canvas-wrap'), dpad:r('.dpad'), abpad:r('.abpad') }; });
  // 1) 스테이지가 가로폭을 꽉 채운다(세로처럼 430 centered면 실패)
  ok(L.topbar.w > L.vw*0.85, `가로에서 화면을 꽉 채운다 (상단바 폭 ${L.topbar.w} / 뷰 ${L.vw})`);
  // 2) 맵은 가운데 밴드 — 왼쪽 거터(방향키)와 오른쪽 거터(A/B)만큼 안쪽
  ok(L.canvas.l >= L.dpad.r - 4, `맵이 방향키 거터를 안 침범 (맵좌 ${L.canvas.l} ≥ 방향키우 ${L.dpad.r})`);
  ok(L.canvas.r <= L.abpad.l + 4, `맵이 A/B 거터를 안 침범 (맵우 ${L.canvas.r} ≤ A/B좌 ${L.abpad.l})`);
  ok(L.dpad.l < L.abpad.l, "가로에서도 방향키 왼쪽·A/B 오른쪽");
  // 3) 가로에서 실제 이동
  const lb=await lp.evaluate(()=>({...window.SG.G().pos}));
  await lp.locator('.dpad button[data-dir="up"]').tap(); await lp.waitForTimeout(500);
  const la=await lp.evaluate(()=>({...window.SG.G().pos}));
  ok(la.x!==lb.x||la.y!==lb.y, `가로에서 방향키 이동 (${lb.x},${lb.y}→${la.x},${la.y})`);

  // ⚠️ 실제 버그였다: 가로 전투에서 메뉴(공격/포획/도망)가 화면 밖으로 밀려 "까만 화면"처럼 보였다.
  //    전투 뷰 세로스택(아레나340+메뉴184)이 가로 높이(~357)에 안 맞았다 → 아레나 왼쪽·메뉴 오른쪽으로.
  await lp.evaluate(()=>{ window.SG.flow.startEncounter(0.3); });
  await lp.waitForTimeout(2600);
  const battle=await lp.evaluate(()=>{ const vh=window.innerHeight, vw=window.innerWidth;
    const btns=[...document.querySelectorAll("#mainMenu .mbtn")];
    const rects=btns.map(b=>b.getBoundingClientRect());
    const allInView=rects.every(r=>r.bottom<=vh+1 && r.top>=-1 && r.right<=vw+1 && r.width>0);
    const fight=document.querySelector('#mainMenu [data-act="fight"]').getBoundingClientRect();
    return { n:btns.length, allInView, vh, fightBottom:Math.round(fight.bottom), fightRight:Math.round(fight.right) }; });
  ok(battle.n>=5 && battle.allInView, `가로 전투에서 메뉴 ${battle.n}개가 전부 화면 안 (공격 하단 ${battle.fightBottom} ≤ 뷰 ${battle.vh})`);
  // 공격 버튼 실제 탭 → 기술 메뉴 뜨는지(조작 가능 증명)
  await lp.locator('#mainMenu [data-act="fight"]').tap(); await lp.waitForTimeout(400);
  const moveShown=await lp.evaluate(()=>{ const mv=document.getElementById("moveMenu");
    return mv && getComputedStyle(mv).display!=="none" && mv.querySelectorAll(".mbtn,.move-btn").length>0; });
  ok(moveShown, "가로 전투에서 공격 탭 → 기술 메뉴 열림(조작 가능)");
  await lc.close();

  ok(errs.length===0, "런타임 에러 0"+(errs.length?": "+errs[0]:""));
  console.log(FAIL?"\n❌ 실패":"\n🎉 모바일 컨트롤 통과");
  await b.close(); process.exit(FAIL?1:0); })();
