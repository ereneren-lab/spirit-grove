// 기술 연출 다양화 회귀 테스트
//  - 구조: SIGFX 조회가 power===0 조기 return보다 앞에 있어야 한다
//    (예전엔 뒤에 있어서 변화기는 전용 연출을 가질 수 '없었다')
//  - 변화기가 eff 종류(날씨/장막/함정/씨앗/상태/랭크/혼란)마다 다른 연출을 만든다
//  - 같은 타입 공격기끼리도 서로 다른 연출을 만든다
// 판정은 스크린샷 타이밍에 의존하지 않고, 연출이 배틀필드에 만든 DOM을 관찰한다.
const { chromium } = require("playwright"); const path=require("path");
(async()=>{ const b=await chromium.launch();
  const p=await b.newPage({viewport:{width:430,height:760}});
  const errs=[]; p.on("pageerror",e=>errs.push(e.message));
  await p.goto("file://"+path.resolve(process.argv[2])); await p.waitForTimeout(800);
  const ok=(c,m)=>{ console.log((c?"  ✅ ":"  ❌ ")+m); if(!c)process.exitCode=1; };

  // 한 기술을 쓰는 동안 battleField에 추가된 노드의 "지문"을 수집한다.
  const probe=async(moves)=>p.evaluate(async(mvs)=>{
    const S=window.SG, F=S.flow;
    const out={};
    for(const mv of mvs){
      S.setG(S.freshState()); S.CONFIG.reduceMotion=false; S.CONFIG.battleText="auto";
      const G=S.G();
      const me=S.makeMon("racoonmon",40); me.moves=[mv]; me.pp={}; me.pp[mv]=20;
      G.party=[me]; G.active=0; G.foe=S.makeMon("shellow",40); G.foe.maxHp=G.foe.hp=99999;
      G.inBattle=true; G.busy=false; G.wild=true; F.setupBattleUI();
      await new Promise(r=>setTimeout(r,120));
      const field=document.getElementById("battleField");
      const marks=[];
      const obs=new MutationObserver(ms=>ms.forEach(m=>m.addedNodes.forEach(n=>{
        if(n.nodeType!==1)return;
        const txt=(n.textContent||"").trim();
        const st=n.getAttribute&&n.getAttribute("style")||"";
        // 글리프면 문자, 아니면 형태(테두리/그라디언트/크기)로 지문을 만든다
        // ⚠️ cssText는 콜론 뒤에 공백을 넣어 직렬화된다("width: 100%") — 정규식에 \s* 필수
        // ⚠️ 판정 순서 주의: 낙뢰 기둥도 linear-gradient를 쓰므로 폭 검사가 먼저 와야 한다
        marks.push(txt || ("shape:"+(/border-radius:\s*50%/.test(st)?"ring"
          :/width:\s*9px/.test(st)?"bolt"
          :/width:\s*100%/.test(st)?"overlay"
          :/linear-gradient/.test(st)?"wall":"box")));
      })));
      obs.observe(field,{childList:true,subtree:true});
      G.busy=false; G.foe.hp=99999; me.pp[mv]=20;
      // ⚠️ 빗나가면 연출 자체가 실행되지 않는다(씨뿌리기·전기자극은 명중 90).
      //    연출 관측이 명중 난수에 휘둘리지 않도록 이 프로브 동안만 100으로 고정한다.
      const _acc=S.MOVES[mv].acc; S.MOVES[mv].acc=100;
      await F.doMove(mv);
      S.MOVES[mv].acc=_acc;
      await new Promise(r=>setTimeout(r,260));
      obs.disconnect();
      out[mv]=[...new Set(marks)].sort().join("|");
      // ⚠️ 앞 턴의 비동기 꼬리(잔뎀·날씨·연출)가 남아 있으면 다음 기술의 관측을 오염시킨다.
      //    G.busy가 풀리고 잔여 타이머가 정리될 때까지 기다린 뒤 다음으로 넘어간다.
      for(let w=0; w<30 && S.G().busy; w++) await new Promise(r=>setTimeout(r,60));
      await new Promise(r=>setTimeout(r,320));
    }
    return out;
  }, moves);

  // 구조 검증: 변화기에 SIGFX를 꽂으면 실제로 호출되는가
  const hooked=await p.evaluate(async()=>{
    const S=window.SG, F=S.flow; let called=false;
    S.SIGFX.harden=async()=>{ called=true; };
    S.setG(S.freshState()); S.CONFIG.reduceMotion=false; S.CONFIG.battleText="auto";
    const G=S.G(); const me=S.makeMon("racoonmon",40); me.moves=["harden"]; me.pp={harden:20};
    G.party=[me]; G.active=0; G.foe=S.makeMon("shellow",40); G.foe.maxHp=G.foe.hp=99999;
    G.inBattle=true; G.busy=false; G.wild=true; F.setupBattleUI();
    await new Promise(r=>setTimeout(r,120));
    await F.doMove("harden");
    delete S.SIGFX.harden;
    return called;
  });

  const status=await probe(["reflect","sandstorm","leechseed","stealthrock","swordsdance","thunderwave","recover","confuse"]);
  const attack=await probe(["ember","flare","inferno","flareblitz","thunder","spark","gust","peck"]);

  // 전 기술 전수 연출 — 런타임 에러 0 + "undefined" 글리프 0
  // 턴 전체(doMove)를 돌면 대사 대기 때문에 84종에 수 분이 걸린다. 연출 함수만 직접 부른다.
  const sweep=await p.evaluate(async()=>{
    const S=window.SG, F=S.flow;
    S.setG(S.freshState()); S.CONFIG.reduceMotion=false; S.CONFIG.textSpeed=0.35;
    const G=S.G();
    G.party=[S.makeMon("racoonmon",40)]; G.active=0; G.foe=S.makeMon("shellow",40);
    G.inBattle=true; G.wild=true; F.setupBattleUI();
    await new Promise(r=>setTimeout(r,120));
    const field=document.getElementById("battleField");
    const keys=Object.keys(S.MOVES); const bad=[], undef=[];
    for(const k of keys){
      const mv=S.MOVES[k]; const seen=[];
      const obs=new MutationObserver(ms=>ms.forEach(m=>m.addedNodes.forEach(n=>{
        const t=(n.textContent||"").trim(); if(t)seen.push(t); })));
      obs.observe(field,{childList:true,subtree:true});
      try{ await F.moveFx(mv,"me","foe",k); }
      catch(e){ bad.push(k+": "+e.message); }
      obs.disconnect();
      if(seen.some(t=>t.indexOf("undefined")>=0))undef.push(k);
    }
    return { ran:keys.length, bad, undef };
  });

  const counts=await p.evaluate(()=>{
    const S=window.SG; const sig=new Set(Object.keys(S.SIGFX||{}));
    let atkSig=0,atkAll=0;
    for(const k in S.MOVES){ const m=S.MOVES[k]; if(m.power>0){ atkAll++; if(sig.has(k))atkSig++; } }
    return {sigTotal:sig.size, atkSig, atkAll};
  });

  ok(hooked, "변화기에도 SIGFX가 적용된다 (power===0 조기 return보다 앞에서 조회)");
  const su=Object.values(status), sUniq=new Set(su).size;
  ok(sUniq>=7, `변화기 8종이 서로 다른 연출 (고유 지문 ${sUniq}/8)`);
  ok(status.reflect.indexOf("wall")>=0, `리플렉터=장막 벽 (${status.reflect})`);
  ok(status.sandstorm.indexOf("overlay")>=0 && status.sandstorm.indexOf("🌪️")>=0, `모래바람=화면 오버레이+회오리 (${status.sandstorm})`);
  ok(status.leechseed.indexOf("🌱")>=0 && status.leechseed.indexOf("🍃")>=0, `씨뿌리기=씨앗→덩굴 (${status.leechseed})`);
  ok(status.stealthrock.indexOf("🪨")>=0, `스텔스록=발밑 설치 (${status.stealthrock})`);
  ok(status.swordsdance.indexOf("ring")>=0, `능력↑=오라 링 (${status.swordsdance})`);
  ok(status.thunderwave.indexOf("⚡")>=0, `상태이상기=해당 상태 글리프 (${status.thunderwave})`);
  ok(status.recover.indexOf("💚")>=0, `회복=초록 (${status.recover})`);
  ok(status.confuse.indexOf("💫")>=0, `혼란=회전 별 (${status.confuse})`);

  const au=Object.values(attack), aUniq=new Set(au).size;
  ok(aUniq>=5, `같은 타입 공격기도 서로 구분됨 (고유 지문 ${aUniq}/8)`);
  ok(attack.ember!==attack.inferno && attack.flare!==attack.flareblitz,
     "불 기술 4종이 전부 다른 연출");
  ok(attack.thunder.indexOf("bolt")>=0, `천둥강타=낙뢰 기둥 (${attack.thunder})`);
  ok(counts.sigTotal>=30, `SIGFX ${counts.sigTotal}종 (최초 10종)`);
  ok(counts.atkSig===counts.atkAll, `공격기 전원 전용 연출 (${counts.atkSig}/${counts.atkAll})`);
  ok(sweep.bad.length===0, `전 기술 ${sweep.ran}종 발동 시 예외 0 (${sweep.bad.slice(0,3).join(" / ")||"없음"})`);
  ok(sweep.undef.length===0, `전 기술 발동 시 "undefined" 글리프 0 (${sweep.undef.slice(0,5).join(",")||"없음"})`);
  ok(errs.length===0, "런타임 에러 0"+(errs.length?": "+errs.slice(0,3).join(" / "):""));
  console.log(process.exitCode?"\n❌ 실패":"\n🎉 기술 연출 다양화 통과");
  await b.close(); process.exit(process.exitCode||0);
})();
