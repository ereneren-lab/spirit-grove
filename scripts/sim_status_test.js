// 공용 전투 시뮬레이터(scripts/battle_sim.js)가 상태이상을 실제로 모델링하는지 지킨다.
//
// 왜 이 테스트가 있는가
//   예전 balance_test/league_test는 eff.status를 아예 처리하지 않았다. 그래서 타입 면역·맹독 같은
//   상태이상 변경을 넣고 "밸런스 수치가 그대로다"라고 나와도 **안전하다는 증거가 아니었다** —
//   애초에 측정 대상이 아니었을 뿐이다. 그 사각지대가 조용히 돌아오는 걸 막는 게 이 테스트다.
//   ⚠️ 여기서 실패하면 밸런스 수치의 의미가 달라진다. 수치만 보고 넘어가지 말 것.
const { chromium } = require("playwright"); const path=require("path");
const SIM=require("./battle_sim.js");
(async()=>{ let b=null;
  const bail=async e=>{ console.log("  ❌ 예외:",e&&e.message||e); try{ if(b)await b.close(); }catch(_){}; process.exit(1); };
  process.on("uncaughtException",bail); process.on("unhandledRejection",bail);
  b=await chromium.launch();
  const p=await b.newPage({viewport:{width:430,height:760}});
  const errs=[]; p.on("pageerror",e=>errs.push(e.message));
  await p.goto("file://"+path.resolve(process.argv[2])); await p.waitForTimeout(800);
  await p.addScriptTag({content:SIM});
  const ok=(c,m)=>{ console.log((c?"  ✅ ":"  ❌ ")+m); if(!c)process.exitCode=1; };

  const r=await p.evaluate(()=>{
    const S=window.SG, M=window.__SIM; S.setG(S.freshState());
    // ⚠️ 특성은 중립(sturdy)으로 고정 — 면역 특성이 섞이면 타입 면역 검증이 가려진다.
    const mk=(sp,lv)=>{ const m=S.makeMon(sp,lv||30); m.hp=m.maxHp; m.ability="sturdy"; m.status=null; m._tox=0; return m; };
    const byType=t=>S.DEX.find(d=>d.type===t)||S.DEX.find(d=>d.type2===t);
    const out={};

    // 1) 타입 면역이 시뮬에도 적용되는가 (게임과 같은 출처 STATUS_TYPE_IMMUNE를 써야 한다)
    out.imm={};
    for(const [st,ty] of Object.entries(S.STATUS_TYPE_IMMUNE)){
      const sp=byType(ty); if(!sp)continue;
      out.imm[st]={immune:!M.trySetStatus(mk(sp.id),st), on:ty};
    }
    // 반례: 노말 타입은 어떤 상태든 걸린다
    const nm=byType("normal");
    out.normalCatches=["brn","par","psn","slp","frz"].every(st=>M.trySetStatus(mk(nm.id),st));

    // 2) 특성 면역
    const a=mk(nm.id); a.ability="insomnia";
    out.abilityImm=!M.trySetStatus(a,"slp");

    // 3) 잠듦/냉동/마비가 턴을 먹는가
    const s=mk(nm.id); M.trySetStatus(s,"slp");
    let slpBlocked=0; for(let i=0;i<3;i++) if(!M.canAct(s)) slpBlocked++;
    out.slpBlocked=slpBlocked;
    // ⚠️ 표본이 작으면 흔들린다(20회로 재다가 10/20이 나와 실패했다). 비율로 크게 잰다.
    const f=mk(nm.id);
    let frzBlocked=0; for(let i=0;i<600;i++){ f.status="frz"; if(!M.canAct(f)) frzBlocked++; }
    out.frzRate=frzBlocked/600;
    const pa=mk(nm.id); pa.status="par";
    let parBlocked=0; for(let i=0;i<400;i++) if(!M.canAct(pa)) parBlocked++;
    out.parRate=parBlocked/400;

    // 4) 잔류 피해: 맹독 누적 vs 보통 독 고정 vs 화상
    const tox=mk(nm.id); tox.maxHp=160; tox.hp=160; tox.status="psn"; tox._tox=1;
    const toxSeq=[]; for(let i=0;i<3;i++){ const h=tox.hp; M.residual(tox,null); toxSeq.push(h-tox.hp); }
    out.toxSeq=toxSeq;
    const psn=mk(nm.id); psn.maxHp=160; psn.hp=160; psn.status="psn"; psn._tox=0;
    const psnSeq=[]; for(let i=0;i<3;i++){ const h=psn.hp; M.residual(psn,null); psnSeq.push(h-psn.hp); }
    out.psnSeq=psnSeq;
    const brn=mk(nm.id); brn.maxHp=160; brn.hp=160; brn.status="brn";
    const h0=brn.hp; M.residual(brn,null); out.brnDmg=h0-brn.hp;

    // 5) 교체 시 맹독 카운터 리셋(본가 규칙)
    const sw=mk(nm.id); sw.status="psn"; sw._tox=9; sw._confuse=3; M.onSwitchOut(sw);
    out.switchTox=sw._tox; out.switchConf=sw._confuse;

    // 6) 상태이상이 실제 전투 결과에 영향을 주는가 — 같은 상대를 상태 걸고/안 걸고 붙여본다
    const T3=S.DEX.filter(d=>d.tier===3&&!d.legend&&!d.secret).map(d=>d.id);
    const run=(pre)=>{ let w=0; const N=120;
      for(let i=0;i<N;i++){
        const team=[mk(T3[i%T3.length],40)];
        if(pre) team[0].status=pre;
        if(M.battle(team,[[T3[(i+3)%T3.length],40]],null).win) w++;
      }
      return w/N; };
    out.winClean=run(null); out.winBurned=run("brn");
    return out;
  });

  for(const [st,v] of Object.entries(r.imm))
    ok(v.immune, `${v.on} 타입이 ${st}에 면역 (시뮬)`);
  ok(r.normalCatches, "노말 타입은 모든 상태에 걸린다(반례)");
  ok(r.abilityImm, "특성 면역(불면)도 적용된다");
  ok(r.slpBlocked>=1 && r.slpBlocked<=3, `잠듦이 1~3턴 행동을 막는다 (${r.slpBlocked})`);
  ok(r.frzRate>0.7 && r.frzRate<0.9, `냉동 행동불가율 ≈80% (${(r.frzRate*100).toFixed(1)}%)`);
  ok(r.parRate>0.15 && r.parRate<0.35, `마비 실패율 ≈25% (${(r.parRate*100).toFixed(1)}%)`);
  ok(JSON.stringify(r.toxSeq)==="[10,20,30]", `맹독이 누적된다 (${r.toxSeq.join("→")})`);
  ok(JSON.stringify(r.psnSeq)==="[20,20,20]", `보통 독은 고정 1/8 (${r.psnSeq.join("→")})`);
  ok(r.brnDmg===10, `화상은 1/16 (${r.brnDmg})`);
  ok(r.switchTox===1 && r.switchConf===0, `교체 시 맹독 카운터 1로 리셋·혼란 해제 (${r.switchTox}/${r.switchConf})`);
  ok(r.winBurned < r.winClean, `상태이상이 전투 결과를 실제로 바꾼다 (정상 ${(r.winClean*100).toFixed(0)}% → 화상 ${(r.winBurned*100).toFixed(0)}%)`);

  ok(errs.length===0, `런타임 에러 0 (${errs.length}${errs[0]?": "+errs[0]:""})`);
  await b.close();
  console.log(process.exitCode?"\n❌ 실패":"\n🎉 시뮬레이터 상태이상 모델링 통과");
})();
