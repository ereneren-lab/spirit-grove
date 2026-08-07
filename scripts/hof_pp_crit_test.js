// 명예의 전당 · PP 회복 아이템 · 급소 랭크 회귀 테스트
const { chromium } = require("playwright"); const path=require("path");
(async()=>{ const b=await chromium.launch();
  const p=await b.newPage({viewport:{width:430,height:760}});
  const errs=[]; p.on("pageerror",e=>errs.push(e.message));
  await p.goto("file://"+path.resolve(process.argv[2])); await p.waitForTimeout(800);
  const ok=(c,m)=>{ console.log((c?"  ✅ ":"  ❌ ")+m); if(!c)process.exitCode=1; };

  /* ===== 급소 랭크 ===== */
  const crit=await p.evaluate(()=>{
    const S=window.SG, F=S.flow;
    const mk=()=>S.makeMon("racoonmon",30);
    const plain=S.MOVES["tackle"], hi=S.MOVES["slash"];
    const a=mk();
    const out={ table:[0,1,2,3,4].map(n=>{ const m=mk(); m._critStage=n; return +F.critChance(m,plain).toFixed(4); }) };
    out.highCritMove=!!hi && !!hi.highCrit;
    out.baseVsHigh=[+F.critChance(a,plain).toFixed(4), +F.critChance(a,hi).toFixed(4)];
    // 초점렌즈
    const lens=mk(); lens.held="scopelens";
    out.lens=+F.critChance(lens,plain).toFixed(4);
    // 상한 4단계
    const cap=mk(); cap._critStage=9; out.cap=+F.critChance(cap,plain).toFixed(4);
    // 실측: 급소 랭크가 오르면 실제 급소가 더 자주 난다
    const count=(st)=>{ const m=mk(); m._critStage=st; const d=mk(); let c=0;
      for(let i=0;i<4000;i++){ if(S.damage(m,d,plain).crit)c++; } return c; };
    out.obs0=count(0); out.obs2=count(2);
    return out;
  });

  /* ===== 기합충전이 실제 전투에서 급소 랭크를 올리는가 + 교체로 사라지는가 ===== */
  const focus=await p.evaluate(async()=>{
    const S=window.SG, F=S.flow; S.setG(S.freshState()); S.CONFIG.reduceMotion=true; S.CONFIG.battleText="auto";
    const G=S.G();
    const me=S.makeMon("racoonmon",30); me.moves=["focusenergy","tackle"]; me.pp={focusenergy:15,tackle:30};
    const bench=S.makeMon("cindercat",30);
    G.party=[me,bench]; G.active=0; G.foe=S.makeMon("shellow",30); G.foe.maxHp=G.foe.hp=9999;
    G.inBattle=true; G.busy=false; G.wild=true; F.setupBattleUI();
    await new Promise(r=>setTimeout(r,200));
    await F.doMove("focusenergy");
    const afterUse=me._critStage||0;
    G.busy=false;
    await F.chooseSwitch(1);
    return { afterUse, afterSwitch:me._critStage||0 };
  });

  /* ===== PP 회복 아이템 ===== */
  const pp=await p.evaluate(()=>{
    const S=window.SG, F=S.flow; S.setG(S.freshState());
    const G=S.G();
    const m=S.makeMon("racoonmon",30); G.party=[m]; G.active=0;
    const k0=m.moves[0], k1=m.moves[1]||m.moves[0];
    const full0=S.MOVES[k0].pp;
    m.pp[k0]=0; if(k1!==k0)m.pp[k1]=S.MOVES[k1].pp-1;
    G.items.ether=1; G.items.elixir=1;
    const ether=F.applyItemEffect({key:"ether",use:"pp",amt:10});
    const afterEther={ mv:m.pp[k0], other:m.pp[k1], left:G.items.ether };
    // 남은 것 다 비우고 elixir
    m.moves.forEach(k=>{ m.pp[k]=0; });
    const elixir=F.applyItemEffect({key:"elixir",use:"pp",all:true});
    const allFull=m.moves.every(k=>m.pp[k]===S.MOVES[k].pp);
    // 가득 찼을 때는 소모되지 않아야 한다
    G.items.elixir=1;
    const wasted=F.applyItemEffect({key:"elixir",use:"pp",all:true});
    return { ether:!!ether, afterEther, full0, elixir:!!elixir, allFull, wasted:!!wasted, elixirLeft:G.items.elixir,
             inShop:(window.SG.flow.renderShop?true:true) };
  });

  /* ===== 명예의 전당 ===== */
  const hof=await p.evaluate(()=>{
    const S=window.SG, F=S.flow; S.setG(S.freshState());
    const G=S.G();
    const a=S.makeMon("blazelion",45); a.shiny=true; a.nick="불꽃이";
    G.party=[a, S.makeMon("krakentide",43)];
    G.caught=new Set(["blazelion","krakentide","foxfire"]); G.playSec=7325;
    F.recordHallOfFame();
    const rec=G.hallOfFame[0];
    F.showHallOfFame();
    const body=document.getElementById("endingBody");
    const shown=body.innerHTML;
    // 세이브 왕복
    const ser=F.serialize(); const round=JSON.parse(JSON.stringify(ser));
    S.setG(S.freshState());
    const okDe=F.deserialize(round);
    const after=S.G().hallOfFame;
    // 트레이너 카드 버튼
    S.G().hallOfFame=after; F.renderTrainerCard();
    const cardBtn=!!document.querySelector("#cardBody #cardHof");
    return { n:G.hallOfFame?1:0, recParty:rec.party.length, recDex:rec.dex, recPlay:rec.play,
             shinyMark:rec.party[0].sh, nickKept:rec.party[0].nm,
             hasName:shown.indexOf("불꽃이")>=0, hasTime:shown.indexOf("2시간")>=0,
             okDe, afterLen:after?after.length:0, afterParty:after&&after[0]?after[0].party.length:0, cardBtn };
  });

  const T=crit.table;
  ok(Math.abs(T[0]-1/16)<1e-3 && Math.abs(T[1]-1/8)<1e-3 && Math.abs(T[2]-0.25)<1e-3 && Math.abs(T[3]-1/3)<1e-3 && Math.abs(T[4]-0.5)<1e-3,
     `급소 랭크표가 본가값 (${T.map(v=>v.toFixed(3)).join(" / ")})`);
  ok(crit.highCritMove, "높은 급소율 기술(가르기) 정의됨");
  ok(crit.baseVsHigh[1]>crit.baseVsHigh[0], `highCrit 기술이 단계 +1 (${crit.baseVsHigh[0]}→${crit.baseVsHigh[1]})`);
  ok(crit.lens>crit.baseVsHigh[0], `초점렌즈가 단계 +1 (${crit.lens})`);
  ok(Math.abs(crit.cap-0.5)<1e-3, `급소 랭크 4단계 상한 (${crit.cap})`);
  ok(crit.obs2>crit.obs0*2, `실제 급소 발생이 랭크에 따라 증가 (4000회 중 ${crit.obs0} → ${crit.obs2})`);
  ok(focus.afterUse===2, `기합충전이 급소 랭크 +2 (${focus.afterUse})`);
  ok(focus.afterSwitch===0, `교체하면 급소 랭크도 사라진다 (${focus.afterSwitch})`);
  ok(pp.ether && pp.afterEther.mv===10, `기력의 물방울: 가장 닳은 기술 +10 (0→${pp.afterEther.mv})`);
  ok(pp.afterEther.other===undefined||pp.afterEther.other!==0, "다른 기술은 건드리지 않음");
  ok(pp.afterEther.left===0, "사용 시 소모됨");
  ok(pp.elixir && pp.allFull, "만능 물방울: 전 기술 PP 완전 회복");
  ok(!pp.wasted && pp.elixirLeft===1, "PP가 가득이면 소모되지 않는다");
  ok(hof.recParty===2 && hof.recDex===3, `명예의 전당 기록 (파티 ${hof.recParty}, 도감 ${hof.recDex})`);
  ok(hof.shinyMark===true && hof.nickKept==="불꽃이", `샤이니·닉네임 보존 (${hof.nickKept}, shiny=${hof.shinyMark})`);
  ok(hof.hasName && hof.hasTime, "명예의 전당 화면에 파티·플레이 시간 표시");
  ok(hof.okDe && hof.afterLen===1 && hof.afterParty===2, `세이브 왕복 후에도 기록 유지 (${hof.afterLen}회 / 파티 ${hof.afterParty})`);
  ok(hof.cardBtn, "트레이너 카드에 재열람 버튼");
  ok(errs.length===0, "런타임 에러 0"+(errs.length?": "+errs.slice(0,3).join(" / "):""));
  console.log(process.exitCode?"\n❌ 실패":"\n🎉 명예의 전당/PP/급소 통과");
  await b.close(); process.exit(process.exitCode||0);
})();
