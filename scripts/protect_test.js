// 방어(protect) 회귀 테스트.
//  - MOVES.protect 정의(우선도 4·변화기·eff.protect) + moveDesc 표기
//  - 실전투(doMove): 방어를 쓴 턴엔 상대 공격이 완전히 막힌다(HP 불변) / 안 쓴 턴엔 맞는다
//  - 연속 사용 카운터: 방어 성공 시 _protectStreak++, 방어 아닌 기술을 쓰면 0으로 리셋
//  - 밸런스 시뮬(battle_sim.js)도 같은 규칙을 모델링한다(차단 + 연속 실패 1/3^streak) — 수치가 정직하게 유지되도록
const { chromium } = require("playwright"); const path=require("path"), fs=require("fs");
(async()=>{ const b=await chromium.launch();
  const p=await b.newPage({viewport:{width:430,height:760}});
  const errs=[]; p.on("pageerror",e=>errs.push(e.message));
  await p.goto("file://"+path.resolve(process.argv[2])); await p.waitForTimeout(800);
  const ok=(c,m)=>{ console.log((c?"  ✅ ":"  ❌ ")+m); if(!c)process.exitCode=1; };

  /* ── 1. 기술 정의 + 설명 ── */
  const def=await p.evaluate(()=>{ const S=window.SG, m=S.MOVES.protect;
    return { has:!!m, power:m&&m.power, pri:m&&m.pri, eff:m&&m.eff&&m.eff.protect,
             desc:S.moveDesc("protect") }; });
  ok(def.has && def.power===0 && def.pri===4 && def.eff===true, `protect 정의(위력0·우선도4·eff.protect) (pri=${def.pri})`);
  ok(/막/.test(def.desc), `moveDesc가 방어 효과를 설명 ("${def.desc}")`);

  /* ── 2. 실전투: 방어 턴은 피해 0, 비방어 턴은 맞는다 ── */
  const busyWait=`(async()=>{ const S=window.SG; const dl=Date.now()+8000; while(S.G().busy && Date.now()<dl){ await new Promise(r=>setTimeout(r,60)); } })()`;
  const blk=await p.evaluate(async()=>{
    const S=window.SG, F=S.flow; const done=async()=>{ const dl=Date.now()+8000; while(S.G().busy&&Date.now()<dl)await new Promise(r=>setTimeout(r,60)); };
    const setup=()=>{ S.setG(S.freshState()); S.CONFIG.reduceMotion=true; S.CONFIG.battleText="auto"; const G=S.G();
      const me=S.makeMon("racoonmon",30); me.moves=["protect","tackle"]; me.pp={protect:10,tackle:30}; me.maxHp=me.hp=9999;
      const foe=S.makeMon("racoonmon",40); foe.moves=["tackle"]; foe.pp={tackle:30}; foe.atk=200; foe.maxHp=foe.hp=9999;
      G.party=[me]; G.active=0; G.foe=foe; G.inBattle=true; G.busy=false; G.wild=true; F.setupBattleUI(); return {me,foe}; };
    // (a) 방어를 쓴 턴 — 상대 tackle이 막혀 내 HP 불변
    let {me}=setup(); await new Promise(r=>setTimeout(r,180));
    await F.doMove("protect"); await done();
    const guarded = me.hp;                              // 9999 그대로여야 함
    const streakAfterProtect = me._protectStreak||0;    // 1
    const protectCleared = !me._protect;                // 턴 끝에 해제
    // (b) 대조: 방어 없이 tackle 쓴 턴 — 상대에게 맞아 HP 감소
    ({me}=setup()); await new Promise(r=>setTimeout(r,180));
    await F.doMove("tackle"); await done();
    const hit = me.hp;                                  // 9999 미만
    const streakAfterTackle = me._protectStreak||0;     // 0
    return { guarded, hit, max:9999, streakAfterProtect, streakAfterTackle, protectCleared };
  });
  ok(blk.guarded===blk.max, `방어한 턴엔 상대 공격이 완전히 막힌다 (HP ${blk.guarded}/${blk.max})`);
  ok(blk.hit < blk.max, `방어 안 한 턴엔 상대에게 맞는다 (HP ${blk.hit}/${blk.max})`);
  ok(blk.streakAfterProtect===1, `방어 성공 시 연속 카운터 1 (${blk.streakAfterProtect})`);
  ok(blk.streakAfterTackle===0, `방어 아닌 기술을 쓰면 카운터 리셋 (${blk.streakAfterTackle})`);
  ok(blk.protectCleared, "방어 플래그는 턴 종료 시 해제된다");

  /* ── 3. 밸런스 시뮬도 방어를 모델링(차단 + 연속 실패율) ── */
  const SIM=fs.readFileSync(path.join(__dirname,"battle_sim.js"),"utf8").match(/module\.exports\s*=\s*`([\s\S]*)`;?\s*$/)[1];
  await p.addScriptTag({content: SIM});
  const sim=await p.evaluate(()=>{
    const S=window.SG, SIM=window.__SIM;
    const mk=()=>{ const m=S.makeMon("racoonmon",30); m.maxHp=m.hp=9999; m.atk=200; m.pp={protect:10,tackle:30}; return m; };
    // 차단: A가 방어하면 B의 tackle이 A에게 안 들어간다
    let A=mk(), B=mk(); A._protectStreak=0;
    SIM.applyMove(A,B,"protect");                 // A._protect=true(streak0→항상)
    const setProt=!!A._protect;
    const hpBefore=A.hp; SIM.applyMove(B,A,"tackle"); const blockedHp=A.hp;
    A._protect=false; SIM.applyMove(B,A,"tackle"); const openHp=A.hp;
    // 연속 실패율: streak 0이면 항상 성공, streak 1이면 ≈1/3
    let s0=0; for(let i=0;i<200;i++){ const M=mk(); M._protectStreak=0; SIM.applyMove(M,B,"protect"); if(M._protect)s0++; }
    let s1=0; const N=600; for(let i=0;i<N;i++){ const M=mk(); M._protectStreak=1; SIM.applyMove(M,B,"protect"); if(M._protect)s1++; }
    return { setProt, blockedHp, hpBefore, openHp, s0rate:s0/200, s1rate:s1/N };
  });
  ok(sim.setProt && sim.blockedHp===sim.hpBefore, `시뮬: 방어가 피해를 막는다 (${sim.hpBefore}→${sim.blockedHp})`);
  ok(sim.openHp < sim.hpBefore, `시뮬: 방어 없으면 피해가 들어간다 (${sim.hpBefore}→${sim.openHp})`);
  ok(sim.s0rate===1, `시뮬: 첫 방어는 항상 성공 (${(sim.s0rate*100).toFixed(0)}%)`);
  ok(Math.abs(sim.s1rate-1/3)<0.08, `시뮬: 연속 방어는 ≈1/3로 성공 (${(sim.s1rate*100).toFixed(0)}%)`);

  ok(errs.length===0, "런타임 에러 0"+(errs.length?": "+errs.slice(0,3).join(" / "):""));
  console.log(process.exitCode?"\n❌ 실패":"\n🎉 방어(protect) 통과");
  await b.close(); process.exit(process.exitCode||0);
})();
