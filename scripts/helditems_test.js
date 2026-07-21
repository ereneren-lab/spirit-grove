// 지닌 물건 확장 회귀 테스트 (전투 흐름 + 시뮬 파리티).
//  - 기합의띠: 풀피에서 쓰러질 공격을 1HP로 버티고 소모
//  - 구애 아이템: 처음 쓴 기술로 고정(기술 메뉴에서 다른 기술 비활성)
//  - 생명의구슬: 공격해 피해를 입히면 최대HP 1/10 반동
//  - 밸런스 시뮬(battle_sim.js)도 위 셋을 동일하게 모델링(파리티)
// (순수 배율 — 생명구슬 ×1.3·타입부적 +20%·힘의띠 ×1.1·구애스카프 속도 — 은 rules_unit_test.js에서 검증)
const { chromium } = require("playwright"); const path=require("path"), fs=require("fs");
(async()=>{ const b=await chromium.launch();
  const p=await b.newPage({viewport:{width:430,height:760}});
  const errs=[]; p.on("pageerror",e=>errs.push(e.message));
  await p.goto("file://"+path.resolve(process.argv[2])); await p.waitForTimeout(800);
  const ok=(c,m)=>{ console.log((c?"  ✅ ":"  ❌ ")+m); if(!c)process.exitCode=1; };

  /* ── 1. 레지스트리 ── */
  const reg=await p.evaluate(()=>{ const H=window.SG.HELD_ITEMS||{};
    return { four:["lifeorb","focussash","choiceband","choicescarf"].every(k=>H[k]),
             charms:Object.keys(window.SG.TYPES).every(t=>H["charm_"+t]&&H["charm_"+t].boost===t),
             orbData:!!(H.lifeorb&&H.lifeorb.dmg===1.3&&H.lifeorb.recoil===0.1) }; });
  ok(reg.four, "신규 지닌물건 4종이 레지스트리에 있다");
  ok(reg.charms, "타입 부적이 전 타입 파생돼 있다");
  ok(reg.orbData, "생명의구슬 데이터 필드(dmg 1.3 · recoil 0.1)");

  /* ── 2. 전투 흐름 ── */
  const done=`(async()=>{ const S=window.SG; const dl=Date.now()+8000; while(S.G().busy&&Date.now()<dl)await new Promise(r=>setTimeout(r,60)); })`;
  const flow=await p.evaluate(async()=>{
    const S=window.SG, F=S.flow; const wait=async()=>{ const dl=Date.now()+8000; while(S.G().busy&&Date.now()<dl)await new Promise(r=>setTimeout(r,60)); };
    const out={};
    // (a) 기합의띠: 풀피에서 치명타를 1HP로 버틴다
    { S.setG(S.freshState()); S.CONFIG.reduceMotion=true; S.CONFIG.battleText="auto"; const G=S.G();
      const me=S.makeMon("racoonmon",30); me.moves=["tackle"]; me.pp={tackle:30}; me.maxHp=me.hp=100; me.held="focussash";
      const foe=S.makeMon("racoonmon",50); foe.moves=["tackle"]; foe.pp={tackle:30}; foe.atk=999; foe.maxHp=foe.hp=9999;
      G.party=[me]; G.active=0; G.foe=foe; G.inBattle=true; G.busy=false; G.wild=true; F.setupBattleUI();
      await new Promise(r=>setTimeout(r,150)); await F.doMove("tackle"); await wait();
      out.sash={ hp:me.hp, held:me.held }; }   // hp===1, held===null
    // (b) 구애머리띠: 첫 기술로 고정 → 메뉴에서 다른 기술 비활성
    { S.setG(S.freshState()); S.CONFIG.reduceMotion=true; S.CONFIG.battleText="auto"; const G=S.G();
      const me=S.makeMon("racoonmon",30); me.moves=["tackle","ember"]; me.pp={tackle:30,ember:25}; me.maxHp=me.hp=9999; me.held="choiceband";
      const foe=S.makeMon("racoonmon",30); foe.moves=["growl"]; foe.pp={growl:40}; foe.maxHp=foe.hp=9999;
      G.party=[me]; G.active=0; G.foe=foe; G.inBattle=true; G.busy=false; G.wild=true; F.setupBattleUI();
      await new Promise(r=>setTimeout(r,150)); await F.doMove("tackle"); await wait();
      F.showMoves();
      const btns=[...document.querySelectorAll("#moveMenu .mbtn")];
      const tk=btns.find(x=>x.textContent.includes("몸통박치기")), em=btns.find(x=>x.textContent.includes("불꽃세례"));
      out.choice={ lock:me._choiceLock, tkOn:tk&&!tk.disabled, emOff:em&&em.disabled }; }
    // (c) 생명의구슬: 공격하면 최대HP 1/10 반동 (상대는 무해한 growl만)
    { S.setG(S.freshState()); S.CONFIG.reduceMotion=true; S.CONFIG.battleText="auto"; const G=S.G();
      const me=S.makeMon("racoonmon",30); me.moves=["tackle"]; me.pp={tackle:30}; me.maxHp=me.hp=1000; me.held="lifeorb";
      const foe=S.makeMon("racoonmon",30); foe.moves=["growl"]; foe.pp={growl:40}; foe.maxHp=foe.hp=9999;
      G.party=[me]; G.active=0; G.foe=foe; G.inBattle=true; G.busy=false; G.wild=true; F.setupBattleUI();
      await new Promise(r=>setTimeout(r,150)); await F.doMove("tackle"); await wait();
      out.orb={ hp:me.hp, max:me.maxHp }; }   // 1000 - 100 = 900
    return out;
  });
  ok(flow.sash.hp===1 && flow.sash.held===null, `기합의띠: 풀피 치명타를 1HP로 버티고 소모 (hp=${flow.sash.hp}, held=${flow.sash.held})`);
  ok(flow.choice.lock==="tackle" && flow.choice.tkOn && flow.choice.emOff, `구애머리띠: tackle 고정 · 다른 기술 비활성 (lock=${flow.choice.lock})`);
  ok(flow.orb.hp===flow.orb.max-Math.floor(flow.orb.max/10), `생명의구슬: 공격 시 최대HP 1/10 반동 (${flow.orb.max}→${flow.orb.hp})`);

  /* ── 3. 시뮬 파리티 ── */
  const SIM=fs.readFileSync(path.join(__dirname,"battle_sim.js"),"utf8").match(/module\.exports\s*=\s*`([\s\S]*)`;?\s*$/)[1];
  await p.addScriptTag({content: SIM});
  const sim=await p.evaluate(()=>{
    const S=window.SG, SIM=window.__SIM; const mk=()=>{ const m=S.makeMon("racoonmon",30); m.pp={tackle:30,ember:25}; return m; };
    // 생명구슬 반동
    let A=mk(); A.maxHp=A.hp=1000; A.held="lifeorb"; let B=mk(); B.maxHp=B.hp=9999;
    SIM.applyMove(A,B,"tackle"); const orbHp=A.hp;
    // 기합의띠
    let C=mk(); C.maxHp=C.hp=100; C.held="focussash"; C.atk=1; let D=mk(); D.maxHp=D.hp=100; D.held="focussash"; let E=mk(); E.atk=999;
    SIM.applyMove(E,D,"tackle"); const sashHp=D.hp, sashHeld=D.held;
    // 구애 고정
    let F2=mk(); F2.held="choiceband"; let G2=mk(); G2.maxHp=G2.hp=9999;
    SIM.applyMove(F2,G2,"tackle"); const lock=F2._choiceLock;
    return { orbHp, sashHp, sashHeld, lock };
  });
  ok(sim.orbHp===900, `시뮬: 생명구슬 반동 (1000→${sim.orbHp})`);
  ok(sim.sashHp===1 && sim.sashHeld===null, `시뮬: 기합의띠 1HP 생존+소모 (hp=${sim.sashHp})`);
  ok(sim.lock==="tackle", `시뮬: 구애 고정 (${sim.lock})`);

  ok(errs.length===0, "런타임 에러 0"+(errs.length?": "+errs.slice(0,3).join(" / "):""));
  console.log(process.exitCode?"\n❌ 실패":"\n🎉 지닌 물건 확장 통과");
  await b.close(); process.exit(process.exitCode||0);
})();
