// 배틀 기술 확장 회귀: 자폭(selfKO)·헤롱헤롱(attract, 성별)·묶기(trap+봉쇄+잔뎀) — 게임 흐름 + 시뮬 파리티.
const { chromium } = require("playwright"); const path=require("path"), fs=require("fs");
(async()=>{ const b=await chromium.launch();
  const p=await b.newPage({viewport:{width:430,height:760}});
  const errs=[]; p.on("pageerror",e=>errs.push(e.message));
  await p.goto("file://"+path.resolve(process.argv[2])); await p.waitForTimeout(800);
  const ok=(c,m)=>{ console.log((c?"  ✅ ":"  ❌ ")+m); if(!c)process.exitCode=1; };
  const setup=(me,foe)=>`(()=>{ const S=window.SG,F=S.flow; S.setG(S.freshState()); S.CONFIG.reduceMotion=true; S.CONFIG.battleText="auto"; const G=S.G();
     const m=S.makeMon("racoonmon",30); Object.assign(m,${me}); m.maxHp=m.hp=9999;
     const f=S.makeMon("racoonmon",30); Object.assign(f,${foe}); f.maxHp=f.hp=9999;
     G.party=[m]; G.active=0; G.foe=f; G.inBattle=true; G.busy=false; G.wild=true; F.setupBattleUI(); return {m,f}; })()`;
  const done=`async()=>{ const dl=Date.now()+9000; while(window.SG.G().busy&&Date.now()<dl)await new Promise(r=>setTimeout(r,60)); }`;

  /* ── 1. 자폭: 사용자가 기절 ── */
  const boom=await p.evaluate(async()=>{ const S=window.SG,F=S.flow; S.setG(S.freshState()); S.CONFIG.reduceMotion=true; S.CONFIG.battleText="auto"; const G=S.G();
    const m=S.makeMon("racoonmon",40); m.moves=["selfdestruct"]; m.pp={selfdestruct:5}; m.maxHp=m.hp=200;
    const f=S.makeMon("racoonmon",20); f.moves=["tackle"]; f.pp={tackle:30}; f.maxHp=f.hp=9999;
    G.party=[m,S.makeMon("cindercat",30)]; G.active=0; G.foe=f; G.inBattle=true; G.busy=false; G.wild=true; F.setupBattleUI();
    await new Promise(r=>setTimeout(r,150)); await F.doMove("selfdestruct");
    const dl=Date.now()+9000; while(S.G().busy&&Date.now()<dl)await new Promise(r=>setTimeout(r,60));
    return { meHp:m.hp, foeDmg:9999-f.hp }; });
  ok(boom.meHp===0, `자폭: 사용자가 기절 (HP ${boom.meHp})`);
  ok(boom.foeDmg>0, `자폭: 상대에게 큰 피해 (${boom.foeDmg})`);

  /* ── 2. 헤롱헤롱: 이성만 걸린다 ── */
  const atr2=await p.evaluate(async()=>{ const S=window.SG,F=S.flow;
    const mk=(me,foe)=>{ S.setG(S.freshState()); S.CONFIG.reduceMotion=true; S.CONFIG.battleText="auto"; const G=S.G();
      const m=S.makeMon("racoonmon",30); Object.assign(m,me); m.maxHp=m.hp=9999;
      const f=S.makeMon("racoonmon",30); Object.assign(f,foe); f.maxHp=f.hp=9999;
      G.party=[m]; G.active=0; G.foe=f; G.inBattle=true; G.busy=false; G.wild=true; F.setupBattleUI(); return {m,f}; };
    const drain=async()=>{ const dl=Date.now()+9000; while(S.G().busy&&Date.now()<dl)await new Promise(r=>setTimeout(r,60)); };
    let {f}=mk({moves:["attract"],pp:{attract:15},gender:"M"},{moves:["tackle"],pp:{tackle:30},gender:"F"});
    await new Promise(r=>setTimeout(r,150)); await F.doMove("attract"); await drain(); const opp=!!f._attract;
    ({f}=mk({moves:["attract"],pp:{attract:15},gender:"M"},{moves:["tackle"],pp:{tackle:30},gender:"M"}));
    await new Promise(r=>setTimeout(r,150)); await F.doMove("attract"); await drain(); const same=!!f._attract;
    return { opp, same }; });
  ok(atr2.opp===true, "헤롱헤롱: 이성에게 걸린다");
  ok(atr2.same===false, "헤롱헤롱: 동성에겐 안 걸린다");

  /* ── 3. 묶기: 상대 속박 + 도주 봉쇄 ── */
  const trap=await p.evaluate(async()=>{ const S=window.SG,F=S.flow;
    S.MOVES.bind.acc=100;   // ⚠️ 빗나가면 속박이 안 걸린다 → 프로브 동안만 명중 고정(플레이키 방지)
    S.setG(S.freshState()); S.CONFIG.reduceMotion=true; S.CONFIG.battleText="auto"; const G=S.G();
    const m=S.makeMon("racoonmon",40); m.moves=["bind"]; m.pp={bind:20}; m.maxHp=m.hp=9999; m.atk=300;
    const f=S.makeMon("racoonmon",20); f.moves=["tackle"]; f.pp={tackle:30}; f.maxHp=f.hp=9999;
    G.party=[m]; G.active=0; G.foe=f; G.inBattle=true; G.busy=false; G.wild=true; F.setupBattleUI();
    await new Promise(r=>setTimeout(r,150)); await F.doMove("bind");
    const dl=Date.now()+9000; while(S.G().busy&&Date.now()<dl)await new Promise(r=>setTimeout(r,60));
    return { foeTrapped:(f._trapped||0)>0, foeDmg:9999-f.hp }; });
  ok(trap.foeTrapped, `묶기: 상대가 속박됨 (남은 턴)`);
  ok(trap.foeDmg>0, "묶기: 피해도 준다");

  /* ── 4. 시뮬 파리티 ── */
  const SIM=fs.readFileSync(path.join(__dirname,"battle_sim.js"),"utf8").match(/module\.exports\s*=\s*`([\s\S]*)`;?\s*$/)[1];
  await p.addScriptTag({content: SIM});
  const sim=await p.evaluate(()=>{ const S=window.SG, SIM=window.__SIM;
    const mk=(o)=>{ const m=S.makeMon("racoonmon",30); m.maxHp=m.hp=9999; m.pp={selfdestruct:5,attract:15,bind:20,tackle:30}; return Object.assign(m,o); };
    // 자폭
    let A=mk({}), B=mk({}); SIM.applyMove(A,B,"selfdestruct"); const boom=A.hp===0 && B.hp<9999;
    // 헤롱헤롱 이성/동성
    let C=mk({gender:"M"}), D=mk({gender:"F"}); SIM.applyMove(C,D,"attract"); const atrOpp=!!D._attract;
    let E=mk({gender:"M"}), Fm=mk({gender:"M"}); SIM.applyMove(E,Fm,"attract"); const atrSame=!!Fm._attract;
    // 묶기
    let G2=mk({atk:300}), H=mk({}); SIM.applyMove(G2,H,"bind"); const trapped=(H._trapped||0)>0;
    return { boom, atrOpp, atrSame, trapped }; });
  ok(sim.boom, "시뮬: 자폭 사용자 기절+피해");
  ok(sim.atrOpp && !sim.atrSame, "시뮬: 헤롱헤롱 이성만");
  ok(sim.trapped, "시뮬: 묶기 속박");

  ok(errs.length===0, "런타임 에러 0"+(errs.length?": "+errs.slice(0,3).join(" / "):""));
  console.log(process.exitCode?"\n❌ 실패":"\n🎉 배틀 기술 확장 통과");
  await b.close(); process.exit(process.exitCode||0);
})();
