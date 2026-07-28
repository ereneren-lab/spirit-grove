// 전멸 후 필드에 남는 "닫을 수 없는 강제 교체 모달" 회귀.
//
// 무엇을 잡나: `faintMine`은 `await mw(...)` 여러 개를 지나며 도는데, 전멸 처리(healParty→endBattle→blackout)가
// 이미 끝난 뒤 **먼저 시작돼 있던 다른 faintMine 체인이 재개**하면 `alive`를 다시 계산한다. 그땐 blackout이
// 파티를 회복해 놨으므로 `alive.length>0`으로 오판하고 **필드에서 `openSwitch(true)`** 를 연다.
// 강제 교체는 `switchClose`(✕)를 display:none으로 감추므로, 그 모달은 ✕·Escape·x키·B버튼 어느 것으로도
// 닫히지 않는다(`switchOverlay`는 `CANCELABLE_OVERLAYS`에 없다) → 리로드 말곤 벗어날 수 없다.
//
// 실측 경로: `fullrun_test.js` 45분 판이 여기서 죽었다(전투 1회·제자리 45분). 트레이스에 필드에서
// `OV[switchOverlay] btns=["✕","내보내기[x]"]`가 무한 반복으로 찍혔다.
//
// 수정: (1) `faintMine`이 await 뒤 `!G.inBattle`이면 즉시 return · (2) `openSwitch`가 전투 밖이면 열지 않는다.
// ⚠️ [3]은 **과잉 수정 방지 대조군** — 전투 중 정상 강제 교체는 여전히 열려야 한다.
const { chromium } = require("playwright"); const path=require("path");

(async()=>{
  const b=await chromium.launch();
  const p=await b.newPage({viewport:{width:430,height:760}});
  const errs=[]; p.on("pageerror",e=>errs.push(e.message));
  let fail=0; const ok=(c,m)=>{ console.log((c?"  ✅ ":"  ❌ ")+m); if(!c)fail=1; };
  process.on("unhandledRejection",async e=>{ console.log("❌ "+e); await b.close(); process.exit(1); });
  await p.goto("file://"+path.resolve(process.argv[2])); await p.waitForTimeout(900);

  const boot=async(nMons)=>{
    await p.evaluate(n=>{ const S=window.SG; const G=S.freshState();
      G.party=[S.makeMon("foxfire",5)]; for(let i=1;i<n;i++)G.party.push(S.makeMon("shellow",5));
      S.setG(G); S.flow.enterMap(true); }, nMons);
    await p.waitForTimeout(600);
    await p.evaluate(()=>window.SG.flow.startEncounter());
    await p.waitForTimeout(1800);
    return p.evaluate(()=>!!window.SG.G().inBattle);
  };

  /* [1] 전멸 처리가 끝난 뒤 재개된 스테일 faintMine 체인 */
  console.log("\n[1] 전멸 후 스테일 faintMine 체인");
  ok(await boot(1), "전투 진입");
  await p.evaluate(()=>{ const G=window.SG.G(); G.party[0].hp=0;
    window.SG.flow.faintMine();                              // 전멸 처리(healParty→endBattle→blackout)
    setTimeout(()=>window.SG.flow.faintMine(),2600); });     // 그 뒤 재개되는 스테일 체인
  await p.waitForTimeout(5000);
  const s1=await p.evaluate(()=>{ const G=window.SG.G();
    return { inBattle:!!G.inBattle, map:document.getElementById("map").classList.contains("active"),
      ov:document.getElementById("switchOverlay").classList.contains("active") }; });
  ok(!s1.inBattle && s1.map, "전멸 처리 완료(전투 종료·맵 복귀)");
  ok(!s1.ov, "필드에 교체 모달이 남지 않는다");

  /* [2] 전투 밖 openSwitch는 아예 거부 (구조적 관문) */
  console.log("\n[2] 전투 밖 openSwitch 거부");
  await p.evaluate(()=>window.SG.flow.openSwitch(true));
  await p.waitForTimeout(300);
  ok(!(await p.evaluate(()=>document.getElementById("switchOverlay").classList.contains("active"))),
     "전투 밖에서는 강제 교체 모달이 열리지 않는다");
  await p.evaluate(()=>window.SG.flow.openSwitch(false));
  await p.waitForTimeout(300);
  ok(!(await p.evaluate(()=>document.getElementById("switchOverlay").classList.contains("active"))),
     "전투 밖에서는 자발적 교체 모달도 열리지 않는다");

  /* [3] 대조군 — 전투 중 정상 강제 교체는 열려야 한다(과잉 수정 방지) */
  console.log("\n[3] 대조군: 전투 중 정상 강제 교체");
  await p.reload(); await p.waitForTimeout(900);
  ok(await boot(2), "전투 진입(파티 2마리)");
  await p.evaluate(()=>{ const G=window.SG.G(); G.party[G.active].hp=0; window.SG.flow.faintMine(); });
  await p.waitForTimeout(2600);
  const s3=await p.evaluate(()=>{ const G=window.SG.G();
    return { inBattle:!!G.inBattle, ov:document.getElementById("switchOverlay").classList.contains("active"),
      alive:G.party.filter(m=>m.hp>0).length }; });
  ok(s3.inBattle, "전투가 유지된다");
  ok(s3.alive>0 && s3.ov, "남은 정령이 있으면 강제 교체 모달이 열린다");

  ok(errs.length===0, `런타임 에러 0 (${errs.length}${errs.length?": "+errs[0]:""})`);
  console.log(fail?"\n❌ 실패":"\n🎉 전멸 모달 회귀 통과");
  await b.close(); process.exit(fail);
})();
