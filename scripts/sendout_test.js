// 정령 등장 애니 회귀 테스트: 예전엔 setupBattleUI가 .enter CSS 애니와 sendOutAnim JS를 이중으로 걸어
// transform 충돌 + 순차 인트로 시 me opacity:0을 덮어 깜빡임을 유발했다. .enter 제거로 단일 등장 애니.
const { chromium } = require("playwright"); const path=require("path");
(async()=>{ const b=await chromium.launch();
  const p=await b.newPage({viewport:{width:430,height:760}});
  const errs=[]; p.on("pageerror",e=>errs.push(e.message));
  await p.goto("file://"+path.resolve(process.argv[2])); await p.waitForTimeout(800);
  const ok=(c,m)=>{ console.log((c?"  ✅ ":"  ❌ ")+m); if(!c)process.exitCode=1; };

  await p.evaluate(()=>{ const S=window.SG; const G=S.freshState(); G.party=[S.makeMon("foxfire",14)]; G.active=0; S.setG(G); S.flow.enterMap(true); });
  await p.waitForTimeout(300);
  await p.evaluate(()=>window.SG.flow.startEncounter(0.99));   // 강제 야생 조우(순차 인트로)

  // 인트로 동안 .enter 클래스가 절대 안 붙는지(이중 애니 제거) + me가 숨김→등장(깜빡임 없이)
  let enterSeen=false, meShown=false, meWasHidden=false;
  for(let i=0;i<26;i++){ const r=await p.evaluate(()=>{ const me=document.getElementById("meSprite"), fo=document.getElementById("foeSprite");
      const battleOn=document.getElementById("battle").classList.contains("active");
      return { enter: me.classList.contains("enter")||fo.classList.contains("enter"), meOp:parseFloat(getComputedStyle(me).opacity), battleOn }; });
    if(r.enter)enterSeen=true;
    if(r.battleOn && r.meOp<0.5)meWasHidden=true;   // 상대 등장 인트로 동안 me 숨김(등장 전)
    meShown = r.battleOn && r.meOp>0.9;             // 마지막 샘플 기준(등장 완료)
    await p.waitForTimeout(110); }

  ok(!enterSeen, "등장 중 .enter 이중 애니 클래스가 안 붙음");
  ok(meWasHidden, "순차 인트로 동안 내 정령 숨김(깜빡임 방지)");
  ok(meShown, "내 정령이 등장 완료(불투명)");
  ok(errs.length===0, "런타임 에러 0"+(errs.length?": "+errs.slice(0,3).join(" / "):""));
  console.log(process.exitCode?"\n❌ 실패":"\n🎉 정령 등장 애니 통과");
  await b.close(); process.exit(process.exitCode||0);
})();
