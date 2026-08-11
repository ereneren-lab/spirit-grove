// 실제 전투 흐름: 위험권 정령 → renderCombatants가 루프 켜고, 회복하면 끔
const { chromium } = require("playwright"); const path=require("path");
(async()=>{ const b=await chromium.launch({args:["--autoplay-policy=no-user-gesture-required"]});
  const p=await b.newPage(); const errs=[]; p.on("pageerror",e=>errs.push(e.message));
  await p.goto("file://"+path.resolve(process.argv[2])); await p.waitForTimeout(700);
  const r=await p.evaluate(()=>{
    const SG=window.SG, A=SG.Audio; A.init&&A.init(); if(A.ctx&&A.ctx.resume)A.ctx.resume(); A.muted=false;
    const G=SG.freshState(); G.party=[SG.makeMon("foxfire",15)]; G.foe=SG.makeMon("leafdrake",15); G.inBattle=true; SG.setG(G);
    const m=G.party[0];
    m.hp=Math.floor(m.maxHp*0.15);                 // 위험권
    SG.flow.renderCombatants(); const onWhenLow = !!A._lowTimer;
    m.hp=Math.floor(m.maxHp*0.9);                  // 회복
    SG.flow.renderCombatants(); const offWhenHealed = !A._lowTimer;
    m.hp=Math.floor(m.maxHp*0.1);                  // 다시 위험
    SG.flow.renderCombatants(); const onAgain = !!A._lowTimer;
    m.hp=0;                                         // 기절
    SG.flow.renderCombatants(); const offWhenFaint = !A._lowTimer;
    return {onWhenLow,offWhenHealed,onAgain,offWhenFaint};
  });
  const ok=(c,m)=>{ console.log((c?"  ✅ ":"  ❌ ")+m); if(!c)process.exitCode=1; };
  console.log("흐름:",JSON.stringify(r));
  ok(r.onWhenLow,"위험권(15%) → 루프 켜짐");
  ok(r.offWhenHealed,"회복(90%) → 루프 꺼짐");
  ok(r.onAgain,"다시 위험(10%) → 루프 켜짐");
  ok(r.offWhenFaint,"기절(0%) → 루프 꺼짐");
  ok(errs.length===0,"런타임 에러 0");
  console.log(process.exitCode?"❌":"🎉 저체력 루프 흐름 통과");
  await b.close(); process.exit(process.exitCode||0);
})();
