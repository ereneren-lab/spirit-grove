// 전투 연출 + 낮/밤 생태 회귀 테스트:
//  - TYPE_PARTICLE이 전 타입 커버 (비면 fxGlyph가 화면에 "undefined"를 날린다 — 실제 버그였음)
//  - 얼음·독·땅 기술 실행 중 전투 화면에 "undefined" 텍스트가 뜨지 않는다
//  - 간판 기술에 전용 연출(SIGFX)
//  - NIGHT/DAY 세트가 겹치지 않고 전부 실존 종이며, 낮·밤 어느 쪽도 풀이 마르지 않는다
//  - 시간대 한정 종은 도감 설명문의 생태와 일치한다(밤 종은 밤 얘기를 해야 한다)
const { chromium } = require("playwright"); const path=require("path");
(async()=>{ const b=await chromium.launch();
  const p=await b.newPage({viewport:{width:430,height:760}});
  const errs=[]; p.on("pageerror",e=>errs.push(e.message));
  await p.goto("file://"+path.resolve(process.argv[2])); await p.waitForTimeout(800);
  const ok=(c,m)=>{ console.log((c?"  ✅ ":"  ❌ ")+m); if(!c)process.exitCode=1; };

  const r=await p.evaluate(()=>{
    const S=window.SG;
    const types=["fire","water","grass","elec","normal","flying","rock","ice","poison","ground"];
    const TP=S.TYPE_PARTICLE||{};
    return { missingParticle:types.filter(t=>!TP[t]), types };
  });

  // 실제 전투에서 얼음/독/땅 기술을 써서 "undefined" 글리프가 생기는지 감시
  const live=await p.evaluate(async()=>{
    const S=window.SG, F=S.flow; S.setG(S.freshState()); S.CONFIG.reduceMotion=false; S.CONFIG.battleText="auto";
    const G=S.G();
    const me=S.makeMon("iceling",40); me.moves=["icebeam","blizzard","sludge","quake"];
    me.pp={icebeam:20,blizzard:20,sludge:20,quake:20};
    G.party=[me]; G.active=0; G.foe=S.makeMon("racoonmon",40); G.foe.maxHp=G.foe.hp=9999;
    G.inBattle=true; G.busy=false; G.wild=true;
    F.setupBattleUI(); await new Promise(r=>setTimeout(r,400));
    const field=document.getElementById("battleField");
    const seen=new Set();
    const obs=new MutationObserver(ms=>ms.forEach(m=>m.addedNodes.forEach(n=>{
      const t=(n.textContent||"").trim(); if(t)seen.add(t); })));
    obs.observe(field,{childList:true,subtree:true});
    for(const mv of ["icebeam","blizzard","sludge","quake"]){
      G.busy=false; G.foe.hp=9999; me.pp[mv]=20;
      await F.doMove(mv);
      await new Promise(r=>setTimeout(r,260));
    }
    obs.disconnect();
    return { glyphs:[...seen].slice(0,60), hasUndefined:[...seen].some(t=>t.indexOf("undefined")>=0) };
  });

  const sets=await p.evaluate(()=>{
    const S=window.SG;
    const N=[...(S.NIGHT_MONS||[])], D=[...(S.DAY_MONS||[])];
    const SEA=new Set([...(S.SEA_MONS||[])]), NW=new Set([...(S.NO_WILD||[])]);
    const DEX=S.DEX, FL=S.FLAVOR||{};
    const idOf=new Set(DEX.map(d=>d.id));
    const starters=new Set(DEX.filter(d=>d.starter).map(d=>d.id));
    const pools={};
    for(const tier of [1,2,3]){
      let base=DEX.filter(d=>d.tier===tier&&!SEA.has(d.id)&&!NW.has(d.id)&&!d.legend).map(d=>d.id);
      if(tier===1)base=base.filter(i=>!starters.has(i));
      pools["t"+tier]={day:base.filter(i=>N.indexOf(i)<0).length, night:base.filter(i=>D.indexOf(i)<0).length};
    }
    // 도감 설명문과 생태 일치
    const nk=["밤","달","야행","어둠","별"], dk=["낮","햇","태양","볕","아침","양지"];
    const nMismatch=N.filter(id=>{ const f=FL[id]; return f && !nk.some(w=>f.t.indexOf(w)>=0); });
    const dMismatch=D.filter(id=>{ const f=FL[id]; return f && !dk.some(w=>f.t.indexOf(w)>=0); });
    return { n:N.length, d:D.length, overlap:N.filter(i=>D.indexOf(i)>=0),
             ghost:[...N,...D].filter(i=>!idOf.has(i)), pools, nMismatch, dMismatch };
  });

  const fx=await p.evaluate(()=>{
    const K=window.SG.SIGFX?Object.keys(window.SG.SIGFX):[];
    return { count:K.length, want:["blizzard","icebeam","quake","dig","sludge","poisonjab"].filter(k=>K.indexOf(k)<0) };
  });

  ok(r.missingParticle.length===0, `TYPE_PARTICLE이 전 타입 커버 (누락 ${r.missingParticle.length}${r.missingParticle.length?": "+r.missingParticle:""})`);
  ok(!live.hasUndefined, `전투 화면에 "undefined" 글리프 없음 (관측 ${live.glyphs.length}종)`);
  ok(fx.want.length===0, `간판 기술 전용 연출 등록 (누락 ${fx.want.length}${fx.want.length?": "+fx.want:""})`);
  ok(fx.count>=16, `SIGFX ${fx.count}종 (10 → 확장)`);
  ok(sets.ghost.length===0, `시간대 세트가 전부 실존 종 (유령 ${sets.ghost.length}${sets.ghost.length?": "+sets.ghost:""})`);
  ok(sets.overlap.length===0, `낮/밤 중복 지정 없음 (${sets.overlap.length})`);
  ok(sets.n>=10 && sets.d>=8, `시간대 한정 확대 — 밤 ${sets.n}종 · 낮 ${sets.d}종 (예전 3/2)`);
  const pn=sets.pools; const poolOK=[1,2,3].every(t=>pn["t"+t].day>=6&&pn["t"+t].night>=6);
  ok(poolOK, `낮·밤 모든 티어 풀이 안 마름 (t1 ${pn.t1.day}/${pn.t1.night}, t2 ${pn.t2.day}/${pn.t2.night}, t3 ${pn.t3.day}/${pn.t3.night})`);
  ok(sets.nMismatch.length===0, `밤 한정 종의 도감 설명이 밤 생태와 일치 (불일치 ${sets.nMismatch.length}${sets.nMismatch.length?": "+sets.nMismatch:""})`);
  ok(sets.dMismatch.length===0, `낮 한정 종의 도감 설명이 낮 생태와 일치 (불일치 ${sets.dMismatch.length}${sets.dMismatch.length?": "+sets.dMismatch:""})`);
  ok(errs.length===0, "런타임 에러 0"+(errs.length?": "+errs.slice(0,3).join(" / "):""));
  console.log(process.exitCode?"\n❌ 실패":"\n🎉 전투 연출/낮밤 생태 통과");
  await b.close(); process.exit(process.exitCode||0);
})();
