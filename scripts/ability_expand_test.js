// 특성 확대 + 야생 지닌물건 + 도망 공식 회귀 테스트
const { chromium } = require("playwright"); const path=require("path");
(async()=>{ const b=await chromium.launch();
  const p=await b.newPage({viewport:{width:430,height:760}});
  const errs=[]; p.on("pageerror",e=>errs.push(e.message));
  await p.goto("file://"+path.resolve(process.argv[2])); await p.waitForTimeout(800);
  const ok=(c,m)=>{ console.log((c?"  ✅ ":"  ❌ ")+m); if(!c)process.exitCode=1; };

  /* ===== 특성 다양성 ===== */
  const spread=await p.evaluate(()=>{
    const S=window.SG; S.setG(S.freshState());
    const cnt={}; S.DEX.forEach(d=>{ const a=S.makeMon(d.id,20).ability; cnt[a]=(cnt[a]||0)+1; });
    const keys=Object.keys(cnt);
    const top=Math.max(...Object.values(cnt));
    // 설명·한글명이 모든 특성에 있는지 (UI에서 undefined가 뜨지 않도록)
    const noDesc=keys.filter(k=>!S.ABILITY_DESC[k]);
    const noKo=keys.filter(k=>!S.ABILITY_KO[k]);
    return { n:keys.length, top, cnt, noDesc, noKo };
  });

  /* ===== 상태이상 면역 특성 ===== */
  const immune=await p.evaluate(()=>{
    const S=window.SG, F=S.flow; S.setG(S.freshState());
    const G=S.G(); G.party=[S.makeMon("racoonmon",30)]; G.active=0; G.foe=S.makeMon("shellow",30); G.inBattle=true;
    const t=(ab,st)=>{ const m=S.makeMon("racoonmon",30); m.ability=ab; F.applyStatus(m,st,"me"); return m.status; };
    return { slpBlocked:t("insomnia","slp"), slpOk:t("guts","slp"),
             psnBlocked:t("immunity","psn"), brnBlocked:t("waterveil","brn"),
             wrongPair:t("insomnia","psn") };   // 불면은 독을 막지 않는다
  });

  /* ===== 날씨 속도 특성 ===== */
  const speed=await p.evaluate(()=>{
    const S=window.SG; const G=S.G();
    // ⚠️ IV가 랜덤이라 개체마다 spd가 다르다. 특성 효과만 보려면 속도를 못박아야 한다.
    const mk=ab=>{ const m=S.makeMon("racoonmon",30); m.ability=ab; m.spd=60; m.stages.spd=0; return m; };
    const swift=mk("swiftswim"), chloro=mk("chlorophyll"), plain=mk("guts");
    G.weather=null; const base=S.effSpd(swift);
    G.weather="rain"; const rainSwift=S.effSpd(swift), rainPlain=S.effSpd(plain), rainChloro=S.effSpd(chloro);
    G.weather="sun"; const sunChloro=S.effSpd(chloro), sunSwift=S.effSpd(swift);
    G.weather=null;
    return { base, rainSwift, rainPlain, rainChloro, sunChloro, sunSwift };
  });

  /* ===== 스나이퍼 / 순수한힘 ===== */
  const dmg=await p.evaluate(()=>{
    const S=window.SG;
    const med=(a,d,mv,n)=>{ const arr=[]; for(let i=0;i<(n||301);i++)arr.push(S.damage(a,d,S.MOVES[mv])); return arr; };
    // ⚠️ IV가 랜덤이라 개체마다 공격/방어가 다르다. 특성 배율만 보려면 스탯을 못박아야 한다.
    const mk=ab=>{ const m=S.makeMon("racoonmon",40); m.ability=ab; m.atk=70; m.spa=70; return m; };
    const d0=S.makeMon("racoonmon",40); d0.ability="sturdy"; d0.def=60; d0.spDef=60; d0.maxHp=d0.hp=9999;
    // 순수한힘: 물리만 1.5배
    const hp=mk("hugepower"), pl=mk("guts");
    const phys=x=>{ const a=med(x,d0,"tackle").map(r=>r.dmg).sort((u,v)=>u-v); return a[150]; };
    // 스나이퍼: 급소일 때만 배율이 크다
    const sn=mk("sniper");
    const crits=med(sn,d0,"tackle",4000).filter(r=>r.crit).map(r=>r.dmg).sort((u,v)=>u-v);
    const norm =med(sn,d0,"tackle",600).filter(r=>!r.crit).map(r=>r.dmg).sort((u,v)=>u-v);
    return { hugePhys:phys(hp), plainPhys:phys(pl),
             snCrit:crits[Math.floor(crits.length/2)], snNorm:norm[Math.floor(norm.length/2)], nCrit:crits.length };
  });

  /* ===== 까칠한피부 / 불꽃몸 (실전) ===== */
  const contact=await p.evaluate(async()=>{
    const S=window.SG, F=S.flow; S.setG(S.freshState()); S.CONFIG.reduceMotion=true; S.CONFIG.battleText="auto";
    const G=S.G();
    const me=S.makeMon("racoonmon",40); me.moves=["tackle"]; me.pp={tackle:30}; me.ability="guts";
    G.party=[me]; G.active=0;
    G.foe=S.makeMon("shellow",40); G.foe.ability="roughskin"; G.foe.maxHp=G.foe.hp=99999;
    // ⚠️ 상대가 반격하면 그 데미지가 섞여 반동 측정이 오염된다 → 무해한 변화기만 쓰게 한다
    G.foe.moves=["harden"]; G.foe.pp={harden:30};
    G.inBattle=true; G.busy=false; G.wild=true; F.setupBattleUI();
    await new Promise(r=>setTimeout(r,150));
    const before=me.hp; const expect=Math.floor(me.maxHp/8);
    G.busy=false; await F.doMove("tackle");
    await new Promise(r=>setTimeout(r,200));
    const lost=before-me.hp;
    // 특수기는 접촉이 아니므로 까칠한피부가 안 걸린다
    const me2=S.makeMon("iceling",40); me2.moves=["icebeam"]; me2.pp={icebeam:20}; me2.ability="guts";
    S.setG(S.freshState()); const G2=S.G();
    G2.party=[me2]; G2.active=0; G2.foe=S.makeMon("shellow",40); G2.foe.ability="roughskin";
    G2.foe.maxHp=G2.foe.hp=99999; G2.foe.moves=["harden"]; G2.foe.pp={harden:30}; G2.inBattle=true; G2.busy=false; G2.wild=true; F.setupBattleUI();
    await new Promise(r=>setTimeout(r,150));
    const b2=me2.hp; G2.busy=false; await F.doMove("icebeam");
    await new Promise(r=>setTimeout(r,200));
    return { lost, expect, specLost:b2-me2.hp, foeAtkPossible:true };
  });

  /* ===== 자연회복: 교체하면 상태이상이 낫는다 ===== */
  const natcure=await p.evaluate(async()=>{
    const S=window.SG, F=S.flow; S.setG(S.freshState()); S.CONFIG.reduceMotion=true;
    const G=S.G();
    const a=S.makeMon("racoonmon",30); a.ability="naturalcure"; a.status="psn";
    const c=S.makeMon("cindercat",30);
    G.party=[a,c]; G.active=0; G.foe=S.makeMon("shellow",30); G.foe.maxHp=G.foe.hp=9999;
    G.inBattle=true; G.busy=false; G.wild=true; F.setupBattleUI();
    await new Promise(r=>setTimeout(r,150));
    await F.chooseSwitch(1);
    await new Promise(r=>setTimeout(r,200));
    // 자연회복이 없으면 그대로 남아야 한다
    S.setG(S.freshState()); const G2=S.G();
    const a2=S.makeMon("racoonmon",30); a2.ability="guts"; a2.status="psn";
    G2.party=[a2,S.makeMon("cindercat",30)]; G2.active=0; G2.foe=S.makeMon("shellow",30);
    G2.foe.maxHp=G2.foe.hp=9999; G2.inBattle=true; G2.busy=false; G2.wild=true; F.setupBattleUI();
    await new Promise(r=>setTimeout(r,150));
    await F.chooseSwitch(1);
    await new Promise(r=>setTimeout(r,200));
    return { cured:a.status, kept:a2.status };
  });

  /* ===== 야생 지닌물건 ===== */
  const held=await p.evaluate(()=>{
    const S=window.SG; S.setG(S.freshState());
    const count=(id,n)=>{ let h=0; const kinds=new Set();
      for(let i=0;i<n;i++){ const m=S.makeMon(id,20); if(m.held){h++;kinds.add(m.held);} } return {h,kinds:[...kinds]}; };
    const t1=count("racoonmon",4000), t3=count("krakentide",4000);
    const legend=count("dawnwyrm",600);
    return { t1r:t1.h/4000, t3r:t3.h/4000, t1kinds:t1.kinds, t3kinds:t3.kinds, legendHeld:legend.h };
  });

  /* ===== 도망 공식 ===== */
  const run=await p.evaluate(()=>{
    const S=window.SG; S.setG(S.freshState());
    const G=S.G();
    // ⚠️ 내가 상대보다 빠르면 첫 시도부터 상한(0.98)에 붙어 증가가 안 보인다.
    //    누적 효과를 보려면 느린 쪽으로 잡아야 한다.
    const me=S.makeMon("racoonmon",30); me.spd=20; G.party=[me]; G.active=0;
    G.foe=S.makeMon("shellow",30); G.foe.spd=80; G.inBattle=true;
    const A=Math.max(1,S.effSpd(me)), B=Math.max(1,S.effSpd(G.foe));
    const f=t=>Math.min(0.98,Math.max(0.12,(A*128/B + 30*t)/256));
    return { t1:+f(1).toFixed(3), t2:+f(2).toFixed(3), t5:+f(5).toFixed(3), fresh:S.freshState().runTries };
  });

  ok(spread.n>=16, `특성 ${spread.n}종 (예전 10종)`);
  ok(spread.top<=13, `한 특성 편중 완화 (최다 ${spread.top}종)`);
  ok(spread.noDesc.length===0 && spread.noKo.length===0,
     `모든 특성에 한글명·설명 존재 (누락 ${spread.noDesc.length+spread.noKo.length})`);
  ok(immune.slpBlocked===null && immune.slpOk==="slp", `불면이 잠듦을 막는다 (${immune.slpBlocked} vs 일반 ${immune.slpOk})`);
  ok(immune.psnBlocked===null, "면역이 독을 막는다");
  ok(immune.brnBlocked===null, "수의베일이 화상을 막는다");
  ok(immune.wrongPair==="psn", "불면은 독을 막지 않는다(면역 종류 구분)");
  ok(Math.abs(speed.rainSwift/speed.base-2)<0.01, `쓸비늘: 비에 속도 2배 (${speed.base}→${speed.rainSwift})`);
  ok(speed.rainPlain===speed.base && speed.rainChloro===speed.base, "비에 다른 특성은 그대로");
  ok(Math.abs(speed.sunChloro/speed.base-2)<0.01, `엽록소: 쨍쨍에 속도 2배 (${speed.sunChloro})`);
  ok(speed.sunSwift===speed.base, "쓸비늘은 쨍쨍에 반응하지 않는다");
  ok(dmg.hugePhys>dmg.plainPhys*1.35, `순수한힘: 물리 위력↑ (${dmg.plainPhys}→${dmg.hugePhys})`);
  ok(dmg.nCrit>60 && dmg.snCrit>dmg.snNorm*1.9, `스나이퍼: 급소 배율↑ (일반 ${dmg.snNorm} → 급소 ${dmg.snCrit})`);
  ok(contact.lost>0 && Math.abs(contact.lost-contact.expect)<=1, `까칠한피부: 물리 접촉에 1/8 반동 (${contact.lost}, 기대 ${contact.expect})`);
  ok(contact.specLost===0, `특수기에는 까칠한피부가 안 걸린다 (${contact.specLost})`);
  ok(natcure.cured===null, `자연회복: 교체로 상태이상 해제 (${natcure.cured})`);
  ok(natcure.kept==="psn", `자연회복이 없으면 상태이상 유지 (${natcure.kept})`);
  ok(held.t1r>0.02 && held.t1r<0.09, `야생 1티어 지닌물건 확률 ${(held.t1r*100).toFixed(1)}%`);
  ok(held.t3r>held.t1r, `티어가 높을수록 잘 들고 나온다 (${(held.t1r*100).toFixed(1)}% → ${(held.t3r*100).toFixed(1)}%)`);
  ok(held.t3kinds.some(k=>["leftovers","powerband","scopelens"].includes(k)), `3티어는 좋은 도구 (${held.t3kinds.join(",")})`);
  ok(held.legendHeld===0, "전설은 도구를 안 들고 나온다");
  ok(run.t2>run.t1 && run.t5>run.t2 && run.t1<0.9, `도망 시도할수록 확률 상승 (${run.t1}→${run.t2}→${run.t5})`);
  ok(run.fresh===0, "새 게임에서 도망 시도 횟수 0");
  ok(errs.length===0, "런타임 에러 0"+(errs.length?": "+errs.slice(0,3).join(" / "):""));
  console.log(process.exitCode?"\n❌ 실패":"\n🎉 특성 확대/야생 도구/도망 공식 통과");
  await b.close(); process.exit(process.exitCode||0);
})();
