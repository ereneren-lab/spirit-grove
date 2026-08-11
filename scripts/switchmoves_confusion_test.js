// 교체기(배턴터치·울부짖기) + 혼란 자해 공식 회귀 테스트
const { chromium } = require("playwright"); const path=require("path");
(async()=>{ const b=await chromium.launch();
  const p=await b.newPage({viewport:{width:430,height:760}});
  const errs=[]; p.on("pageerror",e=>errs.push(e.message));
  await p.goto("file://"+path.resolve(process.argv[2])); await p.waitForTimeout(800);
  const ok=(c,m)=>{ console.log((c?"  ✅ ":"  ❌ ")+m); if(!c)process.exitCode=1; };

  /* ===== 혼란 자해: 고정 %가 아니라 위력 40 물리기 공식 ===== */
  const conf=await p.evaluate(()=>{
    const S=window.SG, F=S.flow; S.setG(S.freshState());
    const med=m=>{ const a=[]; for(let i=0;i<201;i++)a.push(F.confusionSelfHit(m)); a.sort((x,y)=>x-y); return a[100]; };
    // 방어가 높으면 자해가 약해야 한다(예전 고정 9%에선 방어가 무의미했다)
    // ⚠️ maxHp는 넉넉히 준다 — confusionSelfHit에 maxHp*0.30 상한이 있어서,
    //    HP를 작게 잡으면 상한이 먼저 걸려 공격/방어 영향이 가려진다.
    const glass=S.makeMon("racoonmon",40); glass.def=20; glass.atk=60; glass.maxHp=2000;
    const tank =S.makeMon("racoonmon",40); tank.def=90;  tank.atk=60; tank.maxHp=2000;
    // 공격이 높으면 자해가 세야 한다
    const weak =S.makeMon("racoonmon",40); weak.def=40; weak.atk=20; weak.maxHp=2000;
    const strong=S.makeMon("racoonmon",40); strong.def=40; strong.atk=80; strong.maxHp=2000;
    // maxHp가 커도 자해량은 안 변한다(고정 %가 아니라는 증거). 둘 다 상한 밖.
    const small=S.makeMon("racoonmon",40); small.def=40; small.atk=50; small.maxHp=1000;
    const big  =S.makeMon("racoonmon",40); big.def=40;   big.atk=50;   big.maxHp=4000;
    // 공격 랭크도 탄다
    const buffed=S.makeMon("racoonmon",40); buffed.def=40; buffed.atk=50; buffed.maxHp=2000; buffed.stages.atk=2;
    const plain =S.makeMon("racoonmon",40); plain.def=40;  plain.atk=50;  plain.maxHp=2000;
    // 상한: 공격이 터무니없이 높아도 maxHp의 30%를 못 넘는다
    const cap=S.makeMon("racoonmon",40); cap.def=5; cap.atk=400; cap.maxHp=300;
    return { glass:med(glass), tank:med(tank), weak:med(weak), strong:med(strong),
             small:med(small), big:med(big), buffed:med(buffed), plain:med(plain),
             capped:med(cap), capMax:Math.floor(300*0.30) };
  });

  /* ===== 배턴터치: 랭크를 넘기고 교체 ===== */
  const baton=await p.evaluate(async()=>{
    const S=window.SG, F=S.flow; S.setG(S.freshState()); S.CONFIG.reduceMotion=true; S.CONFIG.battleText="auto";
    const G=S.G();
    const a=S.makeMon("racoonmon",30); a.moves=["batonpass","tackle"]; a.pp={batonpass:15,tackle:30};
    const bmon=S.makeMon("cindercat",30);
    G.party=[a,bmon]; G.active=0; G.foe=S.makeMon("shellow",30); G.foe.maxHp=G.foe.hp=9999;
    G.inBattle=true; G.busy=false; G.wild=true; F.setupBattleUI();
    await new Promise(r=>setTimeout(r,180));
    a.stages.atk=3; a.stages.spd=2; a._critStage=2;
    const pr=F.doMove("batonpass");
    // 강제 교체 오버레이가 뜰 때까지 기다린다(대사 대기 때문에 즉시 열리지 않는다)
    let overlayOpen=false;
    for(let i=0;i<40 && !overlayOpen;i++){
      await new Promise(r=>setTimeout(r,80));
      overlayOpen=document.getElementById("switchOverlay").classList.contains("active");
    }
    await F.chooseSwitch(1);
    await Promise.race([pr.catch(()=>{}), new Promise(r=>setTimeout(r,3000))]);
    await new Promise(r=>setTimeout(r,220));
    const now=S.G().party[S.G().active];
    return { overlayOpen, activeId:now.id, atk:now.stages.atk||0, spd:now.stages.spd||0, crit:now._critStage||0,
             oldAtk:a.stages.atk||0 };
  });

  /* ===== 울부짖기: 트레이너는 강제 교체, 야생은 쫓아냄 ===== */
  const roar=await p.evaluate(async()=>{
    const S=window.SG, F=S.flow; S.CONFIG.reduceMotion=true;
    const out={};
    // 트레이너전
    S.setG(S.freshState()); let G=S.G();
    const me=S.makeMon("racoonmon",30); me.moves=["roar","tackle"]; me.pp={roar:15,tackle:30};
    G.party=[me]; G.active=0;
    G.trainer={key:"T",name:"테스트",em:"🧑",team:[["foxfire",30],["seedbean",30]],idx:0,reward:null,money:0,
               boss:false,rematch:false,mons:[],fainted:new Set(),switches:0};
    G.foe=F.trainerMon(0); G.foe.stages.atk=3;
    G.inBattle=true; G.busy=false; F.setupBattleUI();
    await new Promise(r=>setTimeout(r,180));
    const beforeId=G.foe.id;
    await F.doMove("roar");
    await new Promise(r=>setTimeout(r,260));
    out.trainer={ before:beforeId, after:S.G().foe.id, idx:S.G().trainer.idx,
                  oldStagesCleared:(F.trainerMon(0).stages.atk||0)===0 };
    // 야생
    S.setG(S.freshState()); G=S.G();
    const me2=S.makeMon("racoonmon",30); me2.moves=["roar","tackle"]; me2.pp={roar:15,tackle:30};
    G.party=[me2]; G.active=0; G.foe=S.makeMon("shellow",30); G.inBattle=true; G.busy=false; G.wild=true;
    F.setupBattleUI(); await new Promise(r=>setTimeout(r,180));
    const xpBefore=me2.xp||0;
    await F.doMove("roar");
    await new Promise(r=>setTimeout(r,320));
    out.wild={ stillInBattle:!!S.G().inBattle, xpGained:(me2.xp||0)-xpBefore };
    return out;
  });

  const mvs=await p.evaluate(()=>{
    const S=window.SG;
    return { baton:!!S.MOVES.batonpass, roar:!!S.MOVES.roar, roarPri:S.MOVES.roar&&S.MOVES.roar.pri,
             desc:S.moveDesc("roar")+"|"+S.moveDesc("batonpass") };
  });

  ok(conf.tank<conf.glass, `방어가 높으면 혼란 자해가 약하다 (방어20 ${conf.glass} vs 방어90 ${conf.tank})`);
  ok(conf.strong>conf.weak, `공격이 높으면 혼란 자해가 세다 (공20 ${conf.weak} vs 공80 ${conf.strong})`);
  ok(Math.abs(conf.small-conf.big)<=2, `maxHp와 무관 — 고정 %가 아니다 (HP100 ${conf.small} vs HP900 ${conf.big})`);
  ok(conf.buffed>conf.plain, `공격 랭크도 자해에 반영 (랭크0 ${conf.plain} vs 랭크+2 ${conf.buffed})`);
  ok(conf.capped===conf.capMax, `자해 상한 maxHp의 30% (${conf.capped}/${conf.capMax})`);
  ok(mvs.baton && mvs.roar, "배턴터치·울부짖기 정의됨");
  ok(mvs.roarPri===-6, `울부짖기는 후공(우선도 ${mvs.roarPri})`);
  ok(mvs.desc.indexOf("강제 교체")>=0 && mvs.desc.indexOf("랭크를 넘기고")>=0, "기술 설명에 교체 효과 표기");
  ok(baton.overlayOpen, "배턴터치가 교체 선택창을 띄운다");
  ok(baton.activeId==="cindercat", `실제로 교체됨 (${baton.activeId})`);
  ok(baton.atk===3 && baton.spd===2, `랭크를 이어받는다 (공+${baton.atk}, 속+${baton.spd})`);
  ok(baton.crit===2, `급소 랭크도 이어받는다 (+${baton.crit})`);
  ok(roar.trainer.before==="foxfire" && roar.trainer.after==="seedbean", `울부짖기가 트레이너 정령을 강제 교체 (${roar.trainer.before}→${roar.trainer.after})`);
  ok(roar.trainer.oldStagesCleared, "끌려나간 정령의 랭크는 사라진다");
  ok(!roar.wild.stillInBattle, "야생에게 쓰면 쫓아내고 전투 종료");
  ok(roar.wild.xpGained===0, "쫓아낸 것이므로 경험치는 안 준다");
  ok(errs.length===0, "런타임 에러 0"+(errs.length?": "+errs.slice(0,3).join(" / "):""));
  console.log(process.exitCode?"\n❌ 실패":"\n🎉 교체기/혼란 공식 통과");
  await b.close(); process.exit(process.exitCode||0);
})();
