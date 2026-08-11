// 정령 리그 연속 관문 실측.
//
// 왜 따로 재는가
//   balance_test는 각 전투를 "풀피로 따로" 잰다. 그런데 리그는 엘리트 4명 → 챔피언을
//   회복 없이 연속으로 치른다(스토리: "회복의 기회는 없으니 준비한 모든 것을 쏟아부어라").
//   즉 실제 난이도는 개별 승률의 곱보다도 나쁘다 — HP·PP가 누적으로 깎이기 때문.
//
// 재는 것
//   - 연속 5전 완주 승률(레벨별)
//   - 어디서 가장 많이 막히는가(스테이지별 탈락 분포)
//   - 회복약을 쓸 때/안 쓸 때 차이 (리그에서 아이템은 쓸 수 있다)
//
// 사용: node scripts/league_test.js <dist> [판수]
const { chromium } = require("playwright"); const path=require("path");
const SIM=require("./battle_sim.js");   // 두 하네스가 공유하는 전투 시뮬레이터

(async()=>{
  let b=null;
  const bail=async(e)=>{ console.log("  ❌ 예외:",e&&e.message||e); try{ if(b)await b.close(); }catch(_){}; process.exit(1); };
  process.on("uncaughtException",bail); process.on("unhandledRejection",bail);

  const N=Number(process.argv[3]||300);
  b=await chromium.launch();
  const p=await b.newPage({viewport:{width:430,height:760}});
  const errs=[]; p.on("pageerror",e=>errs.push(e.message));
  await p.goto("file://"+path.resolve(process.argv[2]));
  await p.waitForTimeout(900);
  const ok=(c,m)=>{ console.log((c?"  ✅ ":"  ❌ ")+m); if(!c)process.exitCode=1; };

  await p.addScriptTag({content:SIM});   // window.__SIM 설치
  const R=await p.evaluate(async(N)=>{
    const S=window.SG; S.setG(S.freshState());
    // 전투 한 판 — 공용 시뮬레이터(scripts/battle_sim.js). 내 팀은 상태를 이어받는다(HP·PP·상태이상 누적).
    // ⚠️ 예전엔 balance_test와 각자 사본을 갖고 있어, 한쪽만 고치면 두 측정이 서로 다른 규칙으로
    //    돌아가는데도 티가 안 났다.
    const battle=(mine,foeTeam,potions)=>window.__SIM.battle(mine,foeTeam,potions);

    const T3=S.DEX.filter(d=>d.tier===3&&!d.legend&&!d.secret).map(d=>d.id);
    // 리그 전에 하늘 신전이 열리므로 플레이어도 전설 1마리를 데려올 수 있다.
    // "전설 없이"와 "전설 1마리"를 나눠 재야 의도된 경로가 뭔지 보인다.
    const LEGENDS=S.DEX.filter(d=>d.legend).map(d=>d.id);
    const makeParty=(lv,withLegend)=>{
      const used=new Set(), team=[];
      if(withLegend){ const m=S.makeMon(LEGENDS[Math.floor(Math.random()*LEGENDS.length)], lv); m.hp=m.maxHp; team.push(m); }
      for(let i=team.length;i<6;i++){
        let id,g=0; do{ id=T3[Math.floor(Math.random()*T3.length)]; }while(used.has(id)&&++g<20);
        used.add(id);
        const m=S.makeMon(id, Math.max(3,lv-(i%2))); m.hp=m.maxHp; team.push(m);
      }
      return team;
    };

    const STAGES=[
      {k:"i", n:"엘리트 로사"}, {k:"j", n:"엘리트 마레"},
      {k:"k", n:"엘리트 이그니"}, {k:"l", n:"엘리트 제피르"},
      {k:"q", n:"챔피언 아리엘"},
    ];

    const out=[];
    for(const lv of [42,45,48,51,54]){
      for(const withLegend of [false,true]){
        let clears=0; const fellAt=new Array(STAGES.length).fill(0);
        let totalPotions=0;
        for(let i=0;i<N;i++){
          const party=makeParty(lv,withLegend);
          const pot={n:12};
          let s=0;
          for(; s<STAGES.length; s++){
            const r=battle(party, S.TRAINERS[STAGES[s].k].team, pot);
            totalPotions+=r.potionsUsed;
            if(!r.win)break;
          }
          if(s===STAGES.length)clears++; else fellAt[s]++;
        }
        out.push({ lv, withLegend, rate:+(clears/N*100).toFixed(1),
                   fellAt: fellAt.map(x=>+(x/N*100).toFixed(1)),
                   potionAvg:+(totalPotions/N).toFixed(1) });
      }
    }
    // 개별 전투 승률(비교용) — 풀피로 각각
    const solo=STAGES.map(st=>{
      let w=0; for(let i=0;i<N;i++){ const party=makeParty(48,false);
        if(battle(party, S.TRAINERS[st.k].team, {n:0}).win)w++; }
      return { n:st.n, rate:+(w/N*100).toFixed(1) };
    });
    return { out, solo, stages:STAGES.map(s=>s.n) };
  }, N);

  console.log(`\n  [정령 리그 연속 관문] 각 ${N}판 · 회복 없이 5연전 · 파티 6마리(최종진화)\n`);
  console.log("  파티Lv   완주율(전설 없음)   완주율(전설 1마리)   회복약 평균");
  const by={}; R.out.forEach(x=>{ by[x.lv]=by[x.lv]||{}; by[x.lv][x.withLegend?"y":"n"]=x; });
  Object.keys(by).forEach(lv=>{
    const n=by[lv].n, y=by[lv].y;
    console.log(`   ${String(lv).padStart(3)}    ${String(n.rate).padStart(14)}%   ${String(y.rate).padStart(15)}%   ${String(y.potionAvg).padStart(6)}개`);
  });

  console.log("\n  [어디서 막히나] 전설 없음·회복약 12개 기준, 각 스테이지에서 탈락한 비율(%)");
  const withPot=R.out.filter(x=>!x.withLegend);
  console.log("  파티Lv  " + R.stages.map(s=>s.padEnd(9)).join(""));
  withPot.forEach(x=>{
    console.log(`   ${String(x.lv).padStart(3)}   ` + x.fellAt.map(v=>String(v).padStart(6)+"%  ").join(""));
  });

  console.log("\n  [비교] 풀피로 각각 싸웠을 때 승률 (Lv48 기준)");
  R.solo.forEach(s=>console.log(`     ${s.n.padEnd(14)} ${String(s.rate).padStart(5)}%`));
  const soloProduct=R.solo.reduce((a,s)=>a*s.rate/100,1)*100;
  const actual=(by[48]&&by[48].y)?by[48].y.rate:null;
  console.log(`     개별 승률의 곱 = ${soloProduct.toFixed(1)}%  ·  실제 연속 완주 = ${actual}%`);
  console.log("");

  ok(errs.length===0, `런타임 에러 0 (${errs.length})`);
  // 리그는 최종 관문이니 어려워야 하지만, "어떤 레벨에서도 못 깬다"면 막다른 길이다
  /* ⚠️ 예전엔 `Math.max(...)` **단일 지점**에 `>=45` 하드 임계값을 걸었다 — 몬테카를로에서
     최댓값은 그 자체로 분산이 크고(게다가 위로 편향된다) 같은 코드가 40.7% / 51.3%를 오갔다.
     CLAUDE.md 원칙: "**여러 지점의 평균/누적으로 재거나 게이트에서 빼라. 임계값을 그냥 느슨하게
     푸는 건 진짜 회귀도 같이 숨긴다.**" → 준비가 가장 잘 된 **상위 3개 지점의 평균**으로 잰다.
     민감도는 유지되고(리그가 정말 막히면 상위 3개가 같이 내려간다) 분산만 줄어든다. */
  const rates=R.out.map(x=>x.rate).sort((a,b)=>b-a);
  const top3=rates.slice(0,3), best=Math.round(top3.reduce((a,b)=>a+b,0)/top3.length*10)/10;
  /* ⚠️ 임계값은 **분포 한가운데가 아니라 충분히 아래**에 둔다. 상위3평균은 관측 39~41%(σ≈1.5%p)라
     40을 걸면 또 반반 확률로 깜빡인다. 이 게이트의 역할은 "리그가 막다른 길이 됐다"를 잡는 것이고
     과거 실제 사고는 46%→5% 규모였다 — ±2%p 표류를 단속하는 게 아니다(수치는 계속 출력되므로 눈으로 본다). */
  ok(best>=35, `충분히 준비하면 완주 가능하다 (상위 3지점 평균 ${best}% · 최고 ${rates[0]}%)`);
  const lowest=R.out.find(x=>x.lv===42&&!x.withLegend);
  ok(lowest.rate<=25, `준비 없이 오면 벽이다 (Lv42·전설 없음 완주율 ${lowest.rate}%)`);
  // ⚠️ 엘리트 4가 "관문 역할"을 하는지가 핵심. 넷 다 탈락률 0%면 리그가 챔피언 단독 관문이 된다.
  const mid=R.out.find(x=>x.lv===48&&!x.withLegend);
  const eliteShare=mid.fellAt.slice(0,4).reduce((a,b)=>a+b,0);
  ok(eliteShare>=8, `엘리트 4가 실제로 관문 역할을 한다 (Lv48 탈락 중 엘리트 구간 ${eliteShare.toFixed(1)}%p)`);
  ok(mid.fellAt[4]>=20, `챔피언이 최종 벽이다 (Lv48 탈락 ${mid.fellAt[4]}%p)`);
  // 전설을 데려오면 유의미하게 쉬워져야 한다(신전 개방이 리그 준비의 일부라는 설계)
  // ⚠️ 한 레벨만 보면 플레이키하다 — n=250에서 비율 하나의 se가 ~3%p, 두 비율의 차는 ~4.3%p라
  //    임계값 5%p가 노이즈 안에 들어온다(실제로 3.6%p가 나와 실패한 적 있다).
  //    실측 효과는 ~9~19%p로 충분히 크므로, 세 레벨 평균으로 재서 분산만 줄인다(민감도는 유지).
  const gains=[48,51,54].map(lv=>{
    const a=R.out.find(x=>x.lv===lv&&!x.withLegend), b=R.out.find(x=>x.lv===lv&&x.withLegend);
    return (a&&b)?b.rate-a.rate:null;
  }).filter(v=>v!==null);
  const avgGain=gains.reduce((a,b)=>a+b,0)/gains.length;
  ok(gains.length===3, `전설 비교 표본 3개 레벨 확보 (${gains.length})`);
  ok(avgGain>5, `전설 준비가 보상된다 (48/51/54 평균 +${avgGain.toFixed(1)}%p · 각 ${gains.map(g=>g.toFixed(1)).join("/")})`);
  console.log(process.exitCode?"\n❌ 실패":"\n🎉 리그 실측 통과");
  await b.close(); process.exit(process.exitCode||0);
})();
