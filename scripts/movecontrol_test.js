// 앵콜·도발·방해(기술 제어) 회귀: 볼라타일 설정(doMove) + AI 준수(foeChooseMove) + 카운터 감소.
const { chromium } = require("playwright"); const path=require("path");
(async()=>{ const b=await chromium.launch();
  const p=await b.newPage({viewport:{width:430,height:760}});
  const errs=[]; p.on("pageerror",e=>errs.push(e.message));
  await p.goto("file://"+path.resolve(process.argv[2])); await p.waitForTimeout(800);
  const ok=(c,m)=>{ console.log((c?"  ✅ ":"  ❌ ")+m); if(!c)process.exitCode=1; };

  const drive=async(meMoves,mePP,foeMoves,foePP,foeLast,move)=>p.evaluate(async(a)=>{
    const S=window.SG,F=S.flow; S.setG(S.freshState()); S.CONFIG.reduceMotion=true; S.CONFIG.battleText="auto"; const G=S.G();
    const m=S.makeMon("racoonmon",45); m.moves=a.meMoves; m.pp=a.mePP; m.maxHp=m.hp=9999; m.atk=300;
    const f=S.makeMon("racoonmon",20); f.moves=a.foeMoves; f.pp=a.foePP; f.maxHp=f.hp=9999; if(a.foeLast)f._lastMove=a.foeLast;
    G.party=[m]; G.active=0; G.foe=f; G.inBattle=true; G.busy=false; G.wild=true; F.setupBattleUI();
    await new Promise(r=>setTimeout(r,150)); await F.doMove(a.move);
    const dl=Date.now()+9000; while(S.G().busy&&Date.now()<dl)await new Promise(r=>setTimeout(r,60));
    return { enc:f._encore?{move:f._encore.move,turns:f._encore.turns}:null, taunt:f._taunt||0,
             dis:f._disable?{move:f._disable.move,turns:f._disable.turns}:null,
             aiPick:S.foeChooseMove(f, S.G().party[0]) }; },
    {meMoves,mePP,foeMoves,foePP,foeLast,move});

  /* ── 1. 앵콜: 마지막 기술 고정 + AI가 그것만 ── */
  const enc=await drive(["encore","tackle"],{encore:5,tackle:30},["tackle","growl"],{tackle:30,growl:40},"tackle","encore");
  ok(enc.enc && enc.enc.move==="tackle" && enc.enc.turns===2, "앵콜: 상대를 마지막 기술로 고정(적용 턴에 3→2 감소)");
  ok(enc.aiPick==="tackle", "앵콜: 적 AI가 고정된 기술만 고른다");

  /* ── 2. 도발: 변화기 봉쇄 + AI가 변화기 회피 ── */
  const tau=await drive(["taunt","tackle"],{taunt:15,tackle:30},["growl","tackle"],{growl:40,tackle:30},null,"taunt");
  ok(tau.taunt>0, "도발: 상대 도발 상태");
  ok(tau.aiPick==="tackle", "도발: 적 AI가 변화기(growl)를 안 고른다");

  /* ── 3. 방해: 마지막 기술 봉인 + AI가 그 기술 회피 ── */
  const dis=await drive(["disable","tackle"],{disable:15,tackle:30},["tackle","growl"],{tackle:30,growl:40},"tackle","disable");
  ok(dis.dis && dis.dis.move==="tackle", "방해: 상대 마지막 기술 봉인");
  ok(dis.aiPick!=="tackle", `방해: 적 AI가 봉인된 기술을 안 고른다 (${dis.aiPick})`);

  /* ── 4. showMoves: 도발 시 변화기 버튼 비활성 ── */
  const menu=await p.evaluate(async()=>{ const S=window.SG,F=S.flow; S.setG(S.freshState()); S.CONFIG.reduceMotion=true; const G=S.G();
    const m=S.makeMon("racoonmon",30); m.moves=["tackle","growl"]; m.pp={tackle:30,growl:40}; m.maxHp=m.hp=9999; m._taunt=3;
    G.party=[m]; G.active=0; G.foe=S.makeMon("racoonmon",20); G.foe.maxHp=G.foe.hp=9999; G.inBattle=true; G.busy=false; G.wild=true; F.setupBattleUI();
    await new Promise(r=>setTimeout(r,120)); F.showMoves();
    const btns=[...document.querySelectorAll("#moveMenu .mbtn")];
    const tk=btns.find(x=>x.textContent.includes("몸통박치기")), gr=btns.find(x=>x.textContent.includes("위협"));
    return { tkOn:tk&&!tk.disabled, grOff:gr&&gr.disabled }; });
  ok(menu.tkOn && menu.grOff, "showMoves: 도발 중 변화기(위협)만 비활성");

  /* ── 5. 카운터 감소(턴마다) ── */
  const dec=await p.evaluate(async()=>{ const S=window.SG,F=S.flow; S.setG(S.freshState()); S.CONFIG.reduceMotion=true; S.CONFIG.battleText="auto"; const G=S.G();
    const m=S.makeMon("racoonmon",45); m.moves=["tackle"]; m.pp={tackle:30}; m.maxHp=m.hp=9999; m._taunt=3;
    const f=S.makeMon("racoonmon",20); f.moves=["tackle"]; f.pp={tackle:30}; f.maxHp=f.hp=9999;
    G.party=[m]; G.active=0; G.foe=f; G.inBattle=true; G.busy=false; G.wild=true; F.setupBattleUI();
    await new Promise(r=>setTimeout(r,150)); const t0=m._taunt; await F.doMove("tackle");
    const dl=Date.now()+9000; while(S.G().busy&&Date.now()<dl)await new Promise(r=>setTimeout(r,60));
    return { t0, t1:m._taunt }; });
  ok(dec.t1===dec.t0-1, `제어 카운터가 매 턴 감소 (${dec.t0}→${dec.t1})`);

  ok(errs.length===0, "런타임 에러 0"+(errs.length?": "+errs.slice(0,3).join(" / "):""));
  console.log(process.exitCode?"\n❌ 실패":"\n🎉 기술 제어(앵콜·도발·방해) 통과");
  await b.close(); process.exit(process.exitCode||0);
})();
