// 랭크(능력변화) 본가화 회귀 테스트:
//  - 특수기도 특공/특방 랭크를 탄다(예전엔 isSpec일 때 배율을 1로 죽였음)
//  - 화상은 물리 공격만 반감
//  - 명중/회피 랭크가 명중 판정에 반영(본가 3/3 배율표)
//  - 급소는 공격자 마이너스/방어자 플러스 랭크를 무시
//  - 교체하면 물러난 정령의 랭크·혼란·씨앗이 리셋(부스트 유지 익스플로잇 차단)
const { chromium } = require("playwright"); const path=require("path");
(async()=>{ const b=await chromium.launch();
  const p=await b.newPage({viewport:{width:430,height:760}});
  const errs=[]; p.on("pageerror",e=>errs.push(e.message));
  await p.goto("file://"+path.resolve(process.argv[2])); await p.waitForTimeout(800);
  const ok=(c,m)=>{ console.log((c?"  ✅ ":"  ❌ ")+m); if(!c)process.exitCode=1; };

  const r=await p.evaluate(()=>{
    const S=window.SG; S.setG(S.freshState()); S.CONFIG.reduceMotion=true;
    const mk=(id,lv)=>S.makeMon(id,lv);
    // 데미지는 rand(0.85,1.0)·급소 난수가 섞이므로 표본 중앙값으로 비교한다.
    const med=(att,def,mv,n)=>{ const a=[]; for(let i=0;i<(n||101);i++)a.push(S.damage(att,def,S.MOVES[mv]).dmg); a.sort((x,y)=>x-y); return a[Math.floor(a.length/2)]; };

    const out={};
    // --- 1. 특수기 × 특공 랭크 ---
    { const A=mk("foxfire",30), D=mk("racoonmon",30);
      const base=med(A,D,"ember"); A.stages.spa=2; const boost=med(A,D,"ember");
      out.specStage={base,boost,ratio:boost/base}; }        // 특공 +2 => 2.0배 기대
    // --- 2. 특수기 × 특방 랭크 ---
    { const A=mk("foxfire",30), D=mk("racoonmon",30);
      const base=med(A,D,"ember"); D.stages.spDef=2; const guarded=med(A,D,"ember");
      out.spDefStage={base,guarded,ratio:guarded/base}; }    // 특방 +2 => 0.5배 기대
    // --- 3. 물리기는 여전히 공격 랭크 ---
    { const A=mk("racoonmon",30), D=mk("racoonmon",30);
      const base=med(A,D,"tackle"); A.stages.atk=2; const boost=med(A,D,"tackle");
      out.physStage={ratio:boost/base}; }
    // --- 4. 화상: 물리만 반감, 특수는 그대로 ---
    //     ⚠️ 근성(guts) 보유 정령은 상태이상이 오히려 공격 1.5배라 화상 검증이 안 된다.
    //     기본 특성 폴백이 guts라 여기선 데미지에 관여 안 하는 특성으로 고정한다.
    { const A=mk("foxfire",30), D=mk("racoonmon",30); A.ability=D.ability="sturdy";
      const sp0=med(A,D,"ember"); A.status="brn"; const sp1=med(A,D,"ember");
      const B=mk("racoonmon",30); B.ability="sturdy"; const ph0=med(B,D,"tackle"); B.status="brn"; const ph1=med(B,D,"tackle");
      out.burn={specRatio:sp1/sp0, physRatio:ph1/ph0}; }
    // --- 5. 명중/회피 랭크 배율표 ---
    out.accTable={ p1:S.accMul(1), p2:S.accMul(2), m1:S.accMul(-1), m6:S.accMul(-6), zero:S.accMul(0) };
    // --- 6. 급소가 랭크를 무시 ---
    { const A=mk("racoonmon",30), D=mk("racoonmon",30); A.stages.atk=-6;
      const a=[]; for(let i=0;i<3000;i++){ const d=S.damage(A,D,S.MOVES["tackle"]); if(d.crit)a.push(d.dmg); }
      const nonCrit=[]; for(let i=0;i<400;i++){ const d=S.damage(A,D,S.MOVES["tackle"]); if(!d.crit)nonCrit.push(d.dmg); }
      a.sort((x,y)=>x-y); nonCrit.sort((x,y)=>x-y);
      out.critIgnore={crit:a[Math.floor(a.length/2)], normal:nonCrit[Math.floor(nonCrit.length/2)], n:a.length}; }
    // --- 7. 새 랭크를 쓰는 기술이 정의됨 ---
    out.newMoves=["nastyplot","amnesia","doubleteam","sandattack"].map(k=>{
      const m=S.MOVES[k]; return m?{k,stat:m.eff&&m.eff.stat,stage:m.eff&&m.eff.stage}:null; });
    // --- 8. stages 초기화에 신규 키가 들어감 ---
    out.stageKeys=Object.keys(mk("foxfire",5).stages).sort().join(",");
    return out;
  });

  // --- 9. 교체 시 랭크 리셋 (플로우) ---
  const sw=await p.evaluate(async()=>{
    const S=window.SG, F=S.flow; const G=S.G();
    G.party=[S.makeMon("foxfire",30), S.makeMon("racoonmon",30)]; G.active=0;
    G.foe=S.makeMon("dewdrop",25); G.inBattle=true; G.wild=true;
    const lead=G.party[0]; lead.stages.spa=4; lead.stages.atk=3; lead._confuse=3; lead._seeded=true;
    await F.chooseSwitch(1);
    return { spa:lead.stages.spa, atk:lead.stages.atk, conf:lead._confuse, seed:!!lead._seeded, active:S.G().active };
  });

  const r1=r.specStage, r2=r.spDefStage;
  ok(Math.abs(r1.ratio-2.0)<0.18, `특수기가 특공 +2 랭크를 탄다 (${r1.base}→${r1.boost}, ${r1.ratio.toFixed(2)}배)`);
  ok(Math.abs(r2.ratio-0.5)<0.09, `특수기가 상대 특방 +2 랭크에 막힌다 (${r2.base}→${r2.guarded}, ${r2.ratio.toFixed(2)}배)`);
  ok(Math.abs(r.physStage.ratio-2.0)<0.18, `물리기 공격 +2 랭크 유지 (${r.physStage.ratio.toFixed(2)}배)`);
  ok(Math.abs(r.burn.specRatio-1.0)<0.12, `화상이 특수기는 안 깎는다 (${r.burn.specRatio.toFixed(2)}배)`);
  ok(Math.abs(r.burn.physRatio-0.5)<0.12, `화상이 물리기는 반감 (${r.burn.physRatio.toFixed(2)}배)`);
  const A=r.accTable;
  ok(Math.abs(A.zero-1)<1e-9 && Math.abs(A.p1-4/3)<1e-9 && Math.abs(A.p2-5/3)<1e-9 && Math.abs(A.m1-0.75)<1e-9 && Math.abs(A.m6-1/3)<1e-9,
     `명중 랭크 배율표가 본가값 (+1=${A.p1.toFixed(2)}, -1=${A.m1.toFixed(2)}, -6=${A.m6.toFixed(2)})`);
  ok(r.critIgnore.n>50 && r.critIgnore.crit > r.critIgnore.normal*2,
     `급소가 공격자 -6 랭크를 무시 (급소 ${r.critIgnore.crit} vs 일반 ${r.critIgnore.normal})`);
  ok(r.newMoves.every(Boolean), "신규 랭크 기술 4종 정의됨");
  ok(r.newMoves.some(m=>m&&m.stat==="spa") && r.newMoves.some(m=>m&&m.stat==="spDef")
     && r.newMoves.some(m=>m&&m.stat==="eva") && r.newMoves.some(m=>m&&m.stat==="acc"),
     "신규 기술이 특공/특방/회피/명중 랭크를 각각 건드림");
  ok(r.stageKeys==="acc,atk,def,eva,spDef,spa,spd", `stages 7종 초기화 (${r.stageKeys})`);
  ok(sw.spa===0 && sw.atk===0, `교체 시 물러난 정령 랭크 리셋 (특공 4→${sw.spa}, 공격 3→${sw.atk})`);
  ok(sw.conf===0 && sw.seed===false, "교체 시 혼란·씨앗도 해제");
  ok(sw.active===1, "교체 자체는 정상 동작");
  ok(errs.length===0, "런타임 에러 0"+(errs.length?": "+errs.slice(0,3).join(" / "):""));
  console.log(process.exitCode?"\n❌ 실패":"\n🎉 랭크 시스템 통과");
  await b.close(); process.exit(process.exitCode||0);
})();
