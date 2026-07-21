// 2턴기 회귀: 날기(충전+반무적)·솔라빔(충전). 1턴째 충전·무적, 2턴째 재부상 공격. 시뮬 파리티.
const { chromium } = require("playwright"); const path=require("path"), fs=require("fs");
(async()=>{ const b=await chromium.launch();
  const p=await b.newPage({viewport:{width:430,height:760}});
  const errs=[]; p.on("pageerror",e=>errs.push(e.message));
  await p.goto("file://"+path.resolve(process.argv[2])); await p.waitForTimeout(800);
  const ok=(c,m)=>{ console.log((c?"  ✅ ":"  ❌ ")+m); if(!c)process.exitCode=1; };

  /* ── 1. 날기: 1턴 충전+반무적 → 2턴째 강타 ── */
  const fly=await p.evaluate(async()=>{ const S=window.SG,F=S.flow;
    S.setG(S.freshState()); S.CONFIG.reduceMotion=true; S.CONFIG.battleText="auto"; const G=S.G();
    const m=S.makeMon("racoonmon",45); m.moves=["fly"]; m.pp={fly:10}; m.maxHp=m.hp=9999; m.atk=250;
    const f=S.makeMon("racoonmon",20); f.moves=["tackle"]; f.pp={tackle:30}; f.maxHp=f.hp=9999; f.atk=200;
    G.party=[m]; G.active=0; G.foe=f; G.inBattle=true; G.busy=false; G.wild=true; F.setupBattleUI();
    const drain=async()=>{ const dl=Date.now()+9000; while(S.G().busy&&Date.now()<dl)await new Promise(r=>setTimeout(r,60)); };
    await new Promise(r=>setTimeout(r,150));
    // 1턴째: 충전
    const myHp0=m.hp; await F.doMove("fly"); await drain();
    const charging=m._charging, invuln=m._invuln, foeHpAfter1=f.hp, myHpAfter1=m.hp;
    // 2턴째: 재부상 공격(메뉴는 fly만 잠김이지만 doMove로 강제)
    await F.doMove("fly"); await drain();
    return { charging, invuln, foeUnhurtTurn1:(foeHpAfter1===9999), meUnhurtTurn1:(myHpAfter1===myHp0),
             clearedAfter2:(!m._charging && !m._invuln), foeDmgTurn2:(9999-f.hp) }; });
  ok(fly.charging==="fly" && fly.invuln===true, "날기 1턴째: 충전 + 반무적");
  ok(fly.foeUnhurtTurn1, "날기 1턴째엔 피해 없음(충전만)");
  ok(fly.meUnhurtTurn1, "날기 중엔 상대 공격이 안 닿는다(반무적)");
  ok(fly.clearedAfter2 && fly.foeDmgTurn2>0, `날기 2턴째: 재부상하며 강타 (${fly.foeDmgTurn2})`);

  /* ── 2. 솔라빔: 충전(무적 아님) → 2턴째 강타 ── */
  const solar=await p.evaluate(async()=>{ const S=window.SG,F=S.flow;
    S.setG(S.freshState()); S.CONFIG.reduceMotion=true; S.CONFIG.battleText="auto"; const G=S.G();
    const m=S.makeMon("racoonmon",45); m.moves=["solarbeam"]; m.pp={solarbeam:10}; m.maxHp=m.hp=9999; m.spa=250;
    const f=S.makeMon("racoonmon",20); f.moves=["tackle"]; f.pp={tackle:30}; f.maxHp=f.hp=9999; f.atk=200;
    G.party=[m]; G.active=0; G.foe=f; G.inBattle=true; G.busy=false; G.wild=true; F.setupBattleUI();
    const drain=async()=>{ const dl=Date.now()+9000; while(S.G().busy&&Date.now()<dl)await new Promise(r=>setTimeout(r,60)); };
    await new Promise(r=>setTimeout(r,150));
    const myHp0=m.hp; await F.doMove("solarbeam"); await drain();
    const charging=m._charging, invuln=!!m._invuln, meHurt=(m.hp<myHp0);   // 무적 아니라 상대에게 맞는다
    await F.doMove("solarbeam"); await drain();
    return { charging, invuln, meHurt, foeDmg:(9999-f.hp) }; });
  ok(solar.charging==="solarbeam" && solar.invuln===false, "솔라빔 1턴째: 충전(반무적 아님)");
  ok(solar.meHurt, "솔라빔 충전 중엔 상대에게 맞는다");
  ok(solar.foeDmg>0, `솔라빔 2턴째: 강타 (${solar.foeDmg})`);

  /* ── 3. 시뮬 파리티 ── */
  const SIM=fs.readFileSync(path.join(__dirname,"battle_sim.js"),"utf8").match(/module\.exports\s*=\s*`([\s\S]*)`;?\s*$/)[1];
  await p.addScriptTag({content: SIM});
  const sim=await p.evaluate(()=>{ const S=window.SG, SIM=window.__SIM;
    const mk=(o)=>{ const m=S.makeMon("racoonmon",30); m.maxHp=m.hp=9999; m.atk=250; m.pp={fly:10,tackle:30}; return Object.assign(m,o); };
    let A=mk({}), B=mk({});
    SIM.applyMove(A,B,"fly"); const charged=A._charging==="fly" && A._invuln===true && B.hp===9999;
    SIM.applyMove(B,A,"tackle"); const missed=(A.hp===9999);    // 무적이라 안 맞음
    SIM.applyMove(A,B,"fly"); const resurf=(!A._charging && B.hp<9999);
    return { charged, missed, resurf }; });
  ok(sim.charged, "시뮬: 날기 충전+무적, 1턴째 피해 없음");
  ok(sim.missed, "시뮬: 무적 중엔 상대 공격 빗나감");
  ok(sim.resurf, "시뮬: 2턴째 재부상 강타");

  ok(errs.length===0, "런타임 에러 0"+(errs.length?": "+errs.slice(0,3).join(" / "):""));
  console.log(process.exitCode?"\n❌ 실패":"\n🎉 2턴기 통과");
  await b.close(); process.exit(process.exitCode||0);
})();
