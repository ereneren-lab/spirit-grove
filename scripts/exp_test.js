// 경험치 바 애니 회귀 테스트(포켓몬식): 100%까지 차오름 → 레벨업 시 0으로 리셋 → 잔여치까지 계속.
const { chromium } = require("playwright"); const path=require("path");
(async()=>{ const b=await chromium.launch({args:["--autoplay-policy=no-user-gesture-required"]});
  const p=await b.newPage({viewport:{width:430,height:760}});
  const errs=[]; p.on("pageerror",e=>errs.push(e.message));
  await p.goto("file://"+path.resolve(process.argv[2])); await p.waitForTimeout(800);
  const ok=(c,m)=>{ console.log((c?"  ✅ ":"  ❌ ")+m); if(!c)process.exitCode=1; };

  await p.evaluate(()=>{ const S=window.SG; const G=S.freshState();
    const m=S.makeMon("foxfire",5); m.xp=140;   // 레벨업 임박(need=150)
    G.party=[m]; G.active=0; G.inBattle=true; G.foe=S.makeMon("bunnyhop",5); G.foe.hp=0; S.setG(G);
    document.querySelectorAll(".view").forEach(v=>v.classList.remove("active")); document.getElementById("battle").classList.add("active");
    S.flow.setupBattleUI(); S.CONFIG.battleText="auto";
    S.flow.winBattle(); });

  const widths=[];
  for(let i=0;i<40;i++){ const w=await p.evaluate(()=>{ const e=document.getElementById("meExp"); return e?parseFloat(e.style.width)||0:-1; }); widths.push(w); await p.waitForTimeout(120); }
  const lvl=await p.evaluate(()=>window.SG.G().party[0].level);

  const fullIdx=widths.findIndex(w=>w>=99);
  const resetAfterFull = fullIdx>=0 && widths.slice(fullIdx).some(w=>w<=5);
  const continued = fullIdx>=0 && widths.slice(fullIdx).some(w=>w>10 && w<95);   // 리셋 후 잔여치까지 채움

  ok(fullIdx>=0, `경험치 바가 100%까지 차오름 (max=${Math.max(...widths)})`);
  ok(resetAfterFull, "레벨업 시 바가 0으로 리셋됨");
  ok(continued, "리셋 후 잔여 경험치까지 계속 채움");
  ok(lvl===6, `레벨업 완료 (Lv ${lvl})`);
  ok(errs.length===0, "런타임 에러 0"+(errs.length?": "+errs.slice(0,3).join(" / "):""));
  console.log(process.exitCode?"\n❌ 실패":"\n🎉 경험치 바 애니 통과");
  await b.close(); process.exit(process.exitCode||0);
})();
