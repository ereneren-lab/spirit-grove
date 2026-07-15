// HP 틱음 검증: 감소량에 비례한 비프 수 + 위험권 진입 경고음. Chromium Web Audio 계측.
const { chromium } = require("playwright"); const path=require("path");
(async()=>{ const b=await chromium.launch({args:["--autoplay-policy=no-user-gesture-required"]});
  const p=await b.newPage(); const errs=[]; p.on("pageerror",e=>errs.push(e.message));
  await p.goto("file://"+path.resolve(process.argv[2])); await p.waitForTimeout(700);
  const r=await p.evaluate(()=>{
    const A=window.SG.Audio; A.init && A.init(); if(A.ctx&&A.ctx.resume)A.ctx.resume();
    if(!A.ctx) return {err:"no ctx after init"};
    const freqs=[]; const orig=A.ctx.createOscillator.bind(A.ctx);
    A.ctx.createOscillator=function(){ const o=orig(); const of=o.frequency; freqs.push(of.value); return o; };
    // 오실레이터 frequency는 note()에서 .value= 로 설정됨. 계측: note 호출 수를 세기 위해 createOscillator 카운트.
    let n=0; const oc=A.ctx.createOscillator; A.ctx.createOscillator=function(){ n++; return oc(); };
    A.muted=false;
    const before=n; A.hpTick(100,60); const big=n-before;       // 40% 감소 → 다수 비프
    const b2=n; A.hpTick(100,97); const small=n-b2;             // 3% 감소 → 소수 비프
    const b3=n; A.hpTick(30,5); const crit=n-b3;                // 위험권 진입 → 비프+경고음2
    const b4=n; A.hpTick(80,80); const none=n-b4;               // 감소 없음 → 무음
    return {big,small,crit,none};
  });
  const ok=(c,m)=>{ console.log((c?"  ✅ ":"  ❌ ")+m); if(!c)process.exitCode=1; };
  if(r.err){ console.log("❌",r.err); process.exit(1); }
  console.log("계측:",JSON.stringify(r));
  ok(r.big>=5, `큰 감소(40%) → 비프 다수 (${r.big}개)`);
  ok(r.small<r.big && r.small>=1, `작은 감소(3%) → 비프 소수 (${r.small}개) < 큰 감소`);
  ok(r.crit>r.small, `위험권 진입 → 비프+경고음 (${r.crit}개)`);
  ok(r.none===0, `감소 없음 → 무음 (${r.none}개)`);
  ok(errs.length===0, "런타임 에러 0");
  console.log(process.exitCode?"\n❌ 실패":"\n🎉 HP 틱음 검증 통과");
  await b.close(); process.exit(process.exitCode||0);
})();
