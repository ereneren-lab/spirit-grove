// 밸런스 실측: 게임의 "진짜 전투 코드"로 게이트 전투를 수천 판 돌려 승률 곡선을 낸다.
//
// curve_test.js와 뭐가 다른가
//   curve_test는 XP 경제만 모델링한 시뮬레이션(킬당 레벨업 속도)이다. 실제로 이길 수 있는지는 안 본다.
//   이건 damage()·foeChooseMove()·특성·급소·랭크·상성·급소랭크·화상 등 실제 로직을 그대로 써서
//   "레벨 N의 파티가 이 관장을 몇 % 이긴다"를 잰다.
//
// 추상화한 것(정직하게)
//   - 이동/조우/아이템 사용은 없다. 전투만 본다.
//   - 플레이어 AI는 foeChooseMove(게임의 적 AI)를 그대로 써서 양쪽을 같은 수준으로 둔다.
//     즉 "평범하게 두는 플레이어" 기준이며, 숙련자는 이보다 잘한다.
//
// 사용: node scripts/balance_test.js <dist> [판수]
const { chromium } = require("playwright"); const path=require("path");

(async()=>{
  let b=null;
  const bail=async(e)=>{ console.log("  ❌ 예외:",e&&e.message||e); try{ if(b)await b.close(); }catch(_){}; process.exit(1); };
  process.on("uncaughtException",bail); process.on("unhandledRejection",bail);

  const N=Number(process.argv[3]||400);
  b=await chromium.launch();
  const p=await b.newPage({viewport:{width:430,height:760}});
  const errs=[]; p.on("pageerror",e=>errs.push(e.message));
  await p.goto("file://"+path.resolve(process.argv[2]));
  await p.waitForTimeout(900);
  const ok=(c,m)=>{ console.log((c?"  ✅ ":"  ❌ ")+m); if(!c)process.exitCode=1; };

  const R=await p.evaluate(async(N)=>{
    const S=window.SG;
    S.setG(S.freshState());
    const G=S.G();

    // 전투 한 판을 게임 로직으로 굴린다(연출·await 없이 계산만).
    function fight(myTeam, foeTeam, maxTurns){
      const mine=myTeam.map(([id,lv])=>S.makeMon(id,lv));
      const foes=foeTeam.map(([id,lv])=>S.makeMon(id,lv));
      mine.forEach(m=>{m.hp=m.maxHp;}); foes.forEach(m=>{m.hp=m.maxHp;});
      let mi=0, fi=0, turns=0;
      const alive=a=>a.some(m=>m.hp>0);
      while(alive(mine)&&alive(foes)&&turns<(maxTurns||300)){
        turns++;
        while(mine[mi] && mine[mi].hp<=0) mi++;
        while(foes[fi] && foes[fi].hp<=0) fi++;
        if(!mine[mi]||!foes[fi])break;
        const me=mine[mi], fo=foes[fi];
        // 양쪽 다 게임의 적 AI로 기술 선택 → "평범한 플레이어" 기준
        const pick=(a,d)=>{ let k=S.foeChooseMove(a,d);
          if(!S.MOVES[k]||(a.pp[k]||0)<=0){ const u=(a.moves||[]).filter(x=>S.MOVES[x]&&(a.pp[x]||0)>0); k=u.length?u[0]:"struggle"; }
          return k; };
        const mk=pick(me,fo), fk=pick(fo,me);
        const meFirst=S.effSpd(me)>=S.effSpd(fo);
        const order=meFirst?[[me,fo,mk],[fo,me,fk]]:[[fo,me,fk],[me,fo,mk]];
        for(const [a,d,k] of order){
          if(a.hp<=0||d.hp<=0)continue;
          const mv=S.MOVES[k]; if(!mv)continue;
          if(a.pp[k]!=null)a.pp[k]=Math.max(0,a.pp[k]-1);
          if(mv.power>0){
            if(mv.acc<100 && Math.random()*100>mv.acc)continue;
            const hits=mv.multi?(1+Math.floor(Math.random()*(mv.multi[1]-mv.multi[0]+1))+mv.multi[0]-1):1;
            for(let h=0;h<hits && d.hp>0;h++){
              const r=S.damage(a,d,mv); d.hp=Math.max(0,d.hp-r.dmg);
            }
            if(mv.drain)a.hp=Math.min(a.maxHp,a.hp+Math.floor((a.maxHp-a.hp)*0.15));
            if(mv.recoil)a.hp=Math.max(0,a.hp-Math.floor(a.maxHp*0.06));
          } else if(mv.heal){
            a.hp=Math.min(a.maxHp,a.hp+Math.floor(a.maxHp*mv.heal));
          } else if(mv.eff&&mv.eff.stat){
            const t=mv.eff.target==="self"?a:d;
            t.stages=t.stages||S.newStages();
            if(mv.eff.stat in t.stages)
              t.stages[mv.eff.stat]=Math.max(-6,Math.min(6,(t.stages[mv.eff.stat]||0)+mv.eff.stage));
          }
        }
      }
      return { win: alive(mine)&&!alive(foes), turns,
               hpLeft: mine.filter(m=>m.hp>0).reduce((a,m)=>a+m.hp/m.maxHp,0) };
    }

    // ⚠️ 파티 모델이 결과를 좌우한다. 3마리 중티어로 챔피언에 붙이면 당연히 0%다.
    //    진행도에 맞춰 "그 시점의 평범한 플레이어 파티"를 구성한다:
    //    초반은 스타터+흔한 종 3마리, 후반은 최종진화 6마리.
    const byTier=t=>S.DEX.filter(d=>d.tier===t&&!d.legend&&!d.secret).map(d=>d.id);
    const T1=byTier(1), T2=byTier(2), T3=byTier(3);
    // ⚠️ 파티를 고정으로 고르면 "어느 종을 골랐나"가 결과를 지배한다.
    //    (실제로 같은 챔피언전이 파티 구성만 바꿔 0% ↔ 55%로 흔들렸다)
    //    → 매 판 티어 풀에서 무작위로 뽑아 분포를 본다.
    function partyFor(stage, lv){
      const size=stage===0?3:stage===1?5:6;
      const pool=stage===0?T2.concat(T1):stage===1?T3.concat(T2):T3;
      const team=[];
      const used=new Set();
      for(let i=0;i<size;i++){
        let id, guard=0;
        do{ id=pool[Math.floor(Math.random()*pool.length)]; }while(used.has(id)&&++guard<20);
        used.add(id);
        team.push([id, Math.max(3, lv-(i%2))]);
      }
      return team;
    }

    const GATES=[
      {key:"1", name:"체육관1 초원",   stage:0},
      {key:"2", name:"체육관2 숲",     stage:0},
      {key:"3", name:"체육관3 수정호수", stage:1},
      {key:"4", name:"체육관4 고원",    stage:1},
      {key:"X", name:"숲의 군주",      stage:2},
      {key:"q", name:"챔피언",        stage:2},
    ];

    const out=[];
    for(const g of GATES){
      const tr=S.TRAINERS[g.key]; if(!tr)continue;
      const foeLv=Math.max(...tr.team.map(t=>t[1]));
      const rows=[];
      // 상대 최고 레벨 기준 -6 ~ +6 구간을 훑어 승률 곡선을 만든다
      for(let d=-6; d<=6; d+=2){
        const lv=Math.max(3,foeLv+d);
        let w=0, turns=0, hp=0;
        for(let i=0;i<N;i++){
          const r=fight(partyFor(g.stage,lv), tr.team);
          if(r.win){ w++; hp+=r.hpLeft; }
          turns+=r.turns;
        }
        rows.push({ lv, delta:d, rate:+(w/N*100).toFixed(1),
                    turns:+(turns/N).toFixed(1), hpLeft:w?+(hp/w).toFixed(2):0 });
      }
      // 승률 60~75%가 되는 레벨 = "의도된 도전 레벨"
      const fair=rows.find(r=>r.rate>=55&&r.rate<=85);
      out.push({ key:g.key, name:g.name, foeLv, teamSize:tr.team.length, myTeam:partyFor(g.stage,foeLv).length, rows,
                 fairLv: fair?fair.lv:null, fairRate: fair?fair.rate:null });
    }
    return { gates:out, floors:S.flow.WILD_FLOOR };
  }, N);

  console.log(`\n  [게이트별 승률 곡선] 각 ${N}판 · 게임의 실제 전투 코드 사용\n`);
  console.log("  게이트            상대Lv(팀)  내팀  파티Lv별 승률(%)");
  for(const g of R.gates){
    const cells=g.rows.map(r=>`${r.lv}:${String(r.rate).padStart(5)}`).join("  ");
    console.log(`  ${g.name.padEnd(16)} ${String(g.foeLv).padStart(3)}(${g.teamSize})   ${String(g.myTeam).padStart(2)}마리  ${cells}`);
  }
  console.log("\n  [의도된 도전 레벨] 승률 55~85% 구간에 처음 드는 파티 레벨");
  for(const g of R.gates){
    const gap=g.fairLv!=null?(g.fairLv-g.foeLv):null;
    console.log(`  ${g.name.padEnd(16)} 상대 Lv${String(g.foeLv).padStart(2)} → 파티 Lv${g.fairLv==null?" ?":String(g.fairLv).padStart(2)} (차이 ${gap==null?"?":(gap>0?"+":"")+gap}) · 승률 ${g.fairRate==null?"?":g.fairRate+"%"}`);
  }
  console.log(`\n  참고: WILD_FLOOR(지역별 야생 하한) = [${R.floors.join(", ")}]\n`);

  // 판정 기준
  //  (a) 모든 게이트에 "해볼 만한" 레벨 구간(승률 55~85%)이 있어야 한다 → 도전이 존재
  //  (b) 상대보다 6레벨 낮은데도 90% 넘게 이기면 게이트가 무의미하다 → 언더레벨 무쌍 금지
  //  ⚠️ "동레벨 100%"를 실패로 잡던 예전 기준은 잘못이었다. 파티가 관장보다 많으면
  //     동레벨 고승률은 자연스럽다. 문제는 '낮은 레벨로도 이기는가'다.
  const broken=[];
  for(const g of R.gates){
    const under=g.rows.find(r=>r.delta===-6);
    if(under && under.rate>=90)broken.push(`${g.name}: -6레벨에서 ${under.rate}% (언더레벨 무쌍)`);
  }
  const noFair=R.gates.filter(g=>g.fairLv==null).map(g=>g.name);
  const monotonic=R.gates.every(g=>{
    // 레벨이 오르면 승률도 올라야 한다(전투 로직이 정상이라는 위생 검사)
    const rs=g.rows.map(r=>r.rate);
    return rs[rs.length-1]>=rs[0];
  });

  ok(errs.length===0, `런타임 에러 0 (${errs.length})`);
  ok(monotonic, "레벨이 오르면 승률도 오른다 (전투 로직 위생 검사)");
  ok(broken.length===0, `언더레벨(-6)로 무쌍 가능한 게이트 없음 (${broken.length}${broken.length?": "+broken.join(" / "):""})`);
  ok(noFair.length===0, `모든 게이트에 '해볼 만한' 레벨 구간 존재 (없음: ${noFair.join(", ")||"—"})`);
  console.log(process.exitCode?"\n❌ 실패":"\n🎉 밸런스 실측 통과");
  await b.close(); process.exit(process.exitCode||0);
})();
