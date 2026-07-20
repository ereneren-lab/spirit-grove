// 트레이너 교체 AI 회귀 테스트:
//  - 상성이 크게 불리하면 벤치의 유리한 정령으로 교체한다
//  - 교체는 상대의 턴을 소모 — 내 기술은 새로 나온 정령에게 들어간다
//  - 교체해도 HP/랭크가 인스턴스에 남는다(되돌아오면 그대로)
//  - 한 전투 최대 2회, 유리하면 안 바꾼다, 벤치가 다 쓰러지면 안 바꾼다
//  - 기절 교대가 "살아있는 다음 정령"을 고른다(순차 idx++ 아님)
const { chromium } = require("playwright"); const path=require("path");
(async()=>{ const b=await chromium.launch();
  const p=await b.newPage({viewport:{width:430,height:760}});
  const errs=[]; p.on("pageerror",e=>errs.push(e.message));
  await p.goto("file://"+path.resolve(process.argv[2])); await p.waitForTimeout(800);
  const ok=(c,m)=>{ console.log((c?"  ✅ ":"  ❌ ")+m); if(!c)process.exitCode=1; };

  // 불리한 매치업을 인위적으로 세팅하고 교체가 일어나는지
  const setup=`(async(force)=>{
    const S=window.SG, F=S.flow; S.setG(S.freshState()); S.CONFIG.reduceMotion=true;
    const G=S.G();
    // 내 정령: 물 타입(물 기술) — 불 타입에게 강하다
    G.party=[S.makeMon("dewdrop",30)]; G.active=0;
    G.inBattle=true; G.busy=false;
    // 상대 트레이너: 선두는 불(물에 약함), 벤치에 풀(물에 강함)
    G.trainer={key:"T",name:"테스트 트레이너",em:"🧑",team:[["foxfire",30],["seedbean",30]],
               idx:0,reward:null,money:0,boss:false,rematch:false,mons:[],fainted:new Set(),switches:0};
    G.foe=F.trainerMon(0);
    if(force)Math.random=()=>0.99;   // 25% 변덕 분기를 확정적으로 통과시킨다
    return null; })`;

  const r=await p.evaluate(async(setupSrc)=>{
    const S=window.SG, F=S.flow;
    const out={};
    await eval(setupSrc)(true);
    const G=S.G();
    // 매치업 점수 자체 검증
    out.curScore=F.matchupScore(G.foe,G.party[0]);
    const bench=F.trainerMon(1);
    out.benchScore=F.matchupScore(bench,G.party[0]);
    const beforeId=G.foe.id;
    const swapped=await F.foeMaybeSwitch();
    out.swapped=!!swapped; out.beforeId=beforeId; out.afterId=S.G().foe.id;
    out.switches=S.G().trainer.switches; out.idx=S.G().trainer.idx;
    return out;
  }, setup);

  // 유리한 매치업이면 교체하지 않는다
  const noSwap=await p.evaluate(async(setupSrc)=>{
    const S=window.SG, F=S.flow;
    await eval(setupSrc)(true);
    const G=S.G();
    G.party=[S.makeMon("emberwolf",30)];   // 불 vs 불 선두 — 불리하지 않다
    const swapped=await F.foeMaybeSwitch();
    return { swapped:!!swapped, id:S.G().foe.id };
  }, setup);

  // 교체 상한 2회
  const cap=await p.evaluate(async(setupSrc)=>{
    const S=window.SG, F=S.flow;
    await eval(setupSrc)(true);
    S.G().trainer.switches=2;
    return { swapped:!!(await F.foeMaybeSwitch()) };
  }, setup);

  // 벤치가 전멸이면 교체 불가
  const dead=await p.evaluate(async(setupSrc)=>{
    const S=window.SG, F=S.flow;
    await eval(setupSrc)(true);
    F.trainerMon(1).hp=0;
    return { swapped:!!(await F.foeMaybeSwitch()) };
  }, setup);

  // 교체해도 HP·랭크가 인스턴스에 남는가 + 기절 교대가 살아있는 놈을 고르는가
  const persist=await p.evaluate(async(setupSrc)=>{
    const S=window.SG, F=S.flow;
    await eval(setupSrc)(true);
    const G=S.G();
    G.foe.hp=Math.floor(G.foe.maxHp*0.4); G.foe.stages.atk=2;
    const hurtHp=G.foe.hp;
    await F.foeMaybeSwitch();                 // 불 → 풀로 교체
    const outMon=F.trainerMon(0);
    // 되돌아온 정령의 HP는 유지, 랭크는 리셋(본가 규칙)
    const hpKept=outMon.hp===hurtHp, stageReset=(outMon.stages.atk||0)===0;
    // 기절 교대: 현재(풀,idx=1)를 기절시키면 살아있는 0번으로 돌아가야 한다
    const t=S.G().trainer; t.fainted.add(t.idx);
    const nextI=F.trainerNextAlive();
    return { hpKept, stageReset, curIdx:t.idx, nextI };
  }, setup);

  ok(r.curScore<-0.5, `선두(불)가 물 상대로 크게 불리 (점수 ${r.curScore})`);
  ok(r.benchScore>r.curScore, `벤치(풀)가 더 나은 매치업 (${r.benchScore} > ${r.curScore})`);
  ok(r.swapped, "불리하면 교체한다");
  ok(r.beforeId==="foxfire" && r.afterId==="seedbean", `교체 대상이 유리한 쪽 (${r.beforeId}→${r.afterId})`);
  ok(r.switches===1 && r.idx===1, `교체 카운트/인덱스 갱신 (switches=${r.switches}, idx=${r.idx})`);
  ok(!noSwap.swapped, `유리한 매치업이면 교체 안 함 (${noSwap.id} 유지)`);
  ok(!cap.swapped, "한 전투 교체 상한 2회");
  ok(!dead.swapped, "벤치가 전멸이면 교체 불가");
  ok(persist.hpKept, "교체해도 물러난 정령의 HP 유지(되돌아오면 그대로)");
  ok(persist.stageReset, "물러난 정령의 랭크는 리셋(본가 규칙)");
  ok(persist.nextI===0, `기절 교대가 살아있는 정령을 고른다 (idx=${persist.curIdx} → ${persist.nextI})`);
  ok(errs.length===0, "런타임 에러 0"+(errs.length?": "+errs.slice(0,3).join(" / "):""));
  console.log(process.exitCode?"\n❌ 실패":"\n🎉 트레이너 교체 AI 통과");
  await b.close(); process.exit(process.exitCode||0);
})();
