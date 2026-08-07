// 포획 루프 강화 회귀 테스트: 상태이상 배율 + 볼 종류 보너스 + 볼 던지기 라우팅.
const { chromium } = require("playwright"); const path=require("path");
(async()=>{ const b=await chromium.launch();
  const p=await b.newPage({viewport:{width:430,height:760}});
  const errs=[]; p.on("pageerror",e=>errs.push(e.message));
  await p.goto("file://"+path.resolve(process.argv[2])); await p.waitForTimeout(800);
  const ok=(c,m)=>{ console.log((c?"  ✅ ":"  ❌ ")+m); if(!c)process.exitCode=1; };

  /* ── 1. 상태이상 포획 배율 ── */
  const st=await p.evaluate(()=>{ const F=window.SG.flow;
    return { slp:F.statusCatchBonus("slp"), frz:F.statusCatchBonus("frz"),
             par:F.statusCatchBonus("par"), psn:F.statusCatchBonus("psn"), none:F.statusCatchBonus(null) }; });
  ok(st.slp===0.25 && st.frz===0.25, `잠듦·냉동이 최대 배율 (${st.slp})`);
  ok(st.par===0.14 && st.psn===0.14, `마비·독은 중간 배율 (${st.par})`);
  ok(st.none===0, "상태이상 없으면 0");
  ok(st.slp>st.par && st.par>st.none, "잠듦 > 마비 > 없음 순");

  /* ── 2. 볼 종류 보너스 ── */
  const bb=await p.evaluate(()=>{ const S=window.SG, F=S.flow; S.setG(S.freshState()); const G=S.G();
    const water={type:"water",type2:null}, fire={type:"fire",type2:null};
    G.battleTurn=0; const quick0=F.ballBonus("quickball",fire);
    G.battleTurn=2; const quick2=F.ballBonus("quickball",fire);
    return { great:F.ballBonus("greatball",fire), ultra:F.ballBonus("ultraball",fire),
             netWater:F.ballBonus("netball",water), netFire:F.ballBonus("netball",fire),
             quick0, quick2, dusk:F.ballBonus("duskball",fire), heal:F.ballBonus("healball",fire), plain:F.ballBonus("ball",fire) }; });
  ok(bb.great===0.22 && bb.ultra===0.35 && bb.ultra>bb.great, "고급 < 울트라볼");
  ok(bb.netWater===0.30 && bb.netFire===0, "네트볼: 물엔 보너스, 불엔 없음");
  ok(bb.quick0===0.42 && bb.quick2===0, "퀵볼: 첫 턴만 보너스");
  ok(bb.dusk>=0.03, `다크볼: 최소 보너스 이상 (${bb.dusk})`);
  ok(bb.plain===0, "기본 정령구는 보너스 0");

  /* ── 3. 레지스트리 + 상점 + 표기 ── */
  const reg=await p.evaluate(()=>{ const S=window.SG, F=S.flow;
    const balls=["ball","greatball","ultraball","duskball","netball","quickball","healball"];
    return { all:balls.every(k=>F.BALLS[k]), shop:balls.slice(2).every(k=>F.SHOP.some(x=>x.key===k)),
             ko:balls.slice(2).every(k=>F.ITEM_KO&&F.ITEM_KO[k]),
             pocket:F.bagPocket({key:"ultraball"}) }; });
  ok(reg.all, "볼 7종 레지스트리 정의");
  ok(reg.shop && reg.ko, "신규 볼이 상점·표기에 등록");
  ok(reg.pocket==="ball", "신규 볼이 가방 볼 주머니로 분류");

  /* ── 4. 가방에서 볼 던지기 → tryCatch로 라우팅(소모) ── */
  const route=await p.evaluate(async()=>{ const S=window.SG, F=S.flow; S.setG(S.freshState()); S.CONFIG.reduceMotion=true; const G=S.G();
    G.party=[S.makeMon("racoonmon",20)]; G.active=0; G.foe=S.makeMon("dewdrop",5); G.foe.hp=1; G.inBattle=true; G.wild=true; G.busy=false;
    G.items.ultraball=2; F.setupBattleUI&&F.setupBattleUI();
    const before=G.items.ultraball;
    F.battleUseItem({key:"ultraball"});   // 볼 사용 → tryCatch가 소모
    const dl=Date.now()+9000; while(S.G().busy&&Date.now()<dl)await new Promise(r=>setTimeout(r,80));
    return { before, after:S.G().items.ultraball }; });
  ok(route.after===route.before-1, `가방에서 울트라볼을 던지면 1개 소모 (${route.before}→${route.after})`);

  ok(errs.length===0, "런타임 에러 0"+(errs.length?": "+errs.slice(0,3).join(" / "):""));
  console.log(process.exitCode?"\n❌ 실패":"\n🎉 포획 루프 통과");
  await b.close(); process.exit(process.exitCode||0);
})();
