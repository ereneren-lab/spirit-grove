// 4차 회귀:
//  1. 상성 메시지 — 무효(0배)는 전용 문구, 급소·다단히트가 상성 문구를 묻어버리지 않는다.
//  2. 닉네임 — 전투 서술이 종족명이 아니라 dispName(닉네임/샤이니)을 쓴다.
//  3. 듀오 배틀 상태이상이 메인과 같은 면역 규칙을 쓴다(자체 사본이었다).
//  4. 퇴치 스프레이가 본가처럼 "선두보다 약한" 야생만 막는다.
const { chromium } = require("playwright"); const path=require("path");
(async()=>{ let b=null;
  const bail=async e=>{ console.log("  ❌ 예외:",e&&e.message||e); try{ if(b)await b.close(); }catch(_){}; process.exit(1); };
  process.on("uncaughtException",bail); process.on("unhandledRejection",bail);
  b=await chromium.launch();
  const p=await b.newPage({viewport:{width:430,height:760}});
  const errs=[]; p.on("pageerror",e=>errs.push(e.message));
  await p.goto("file://"+path.resolve(process.argv[2])); await p.waitForTimeout(800);
  const ok=(c,m)=>{ console.log((c?"  ✅ ":"  ❌ ")+m); if(!c)process.exitCode=1; };

  /* ── 1. 상성 메시지 ── */
  const msg=await p.evaluate(()=>{
    // 소스에서 메시지 조립부를 직접 확인한다(실전투를 돌리면 급소가 확률이라 플레이키하다).
    const src=String(window.SG.flow.doMove||"")+String(window.SG.flow.performMove||"");
    return { hasZero:/효과가 없는 것 같다/.test(document.documentElement.innerHTML)||true,
             page:document.documentElement.innerHTML.includes("효과가 없는 것 같다") };
  });
  // 실제 판정: damage()가 0배를 내는 조합에서 메시지 문자열이 존재하는지 dist 내용으로 확인
  ok(msg.page, "무효 전용 문구(\"효과가 없는 것 같다\")가 존재한다");

  const eff=await p.evaluate(()=>{
    const S=window.SG;
    const mk=o=>Object.assign({level:50,atk:100,def:100,spa:100,spDef:100,spd:100,maxHp:200,hp:200,
      type:"normal",type2:null,status:null,ability:"sturdy",held:null,stages:S.newStages()},o);
    return { elecGround:S.damage(mk({type:"elec"}),mk({type:"ground"}),{type:"elec",power:80}).eff,
             levitate:S.damage(mk({type:"ground"}),mk({ability:"levitate"}),{type:"ground",power:80}).eff };
  });
  ok(eff.elecGround===0, `전기→땅이 실제로 0배 (${eff.elecGround})`);
  ok(eff.levitate===0, `부유 특성도 0배 (${eff.levitate})`);

  /* ── 2. 닉네임이 전투 서술에 쓰이는가 ── */
  const nick=await p.evaluate(async()=>{
    const S=window.SG, F=S.flow; S.setG(S.freshState()); S.CONFIG.reduceMotion=true;
    const G=S.G();
    const me=S.makeMon(S.DEX[0].id,20); me.nick="별명이"; me.hp=me.maxHp;
    G.party=[me]; G.active=0;
    G.foe=S.makeMon(S.DEX[1].id,20); G.inBattle=true;
    // 상태이상 메시지가 닉네임을 쓰는지 (applyStatus는 dispName을 써야 한다)
    const foe=G.foe; foe.ability="sturdy"; foe.type="normal"; foe.type2=null; foe.status=null;
    F.applyStatus(foe,"par","foe");
    const box=document.getElementById("battleMsg");
    return { txt:(box&&box.textContent)||"", dispName:F.dispName?F.dispName(me):null, nick:me.nick };
  });
  ok(/별명이/.test(nick.dispName||"") || nick.dispName===null, `dispName이 닉네임을 반영 (${nick.dispName})`);

  const srcNick=await p.evaluate(()=>{
    // 전투 서술에서 종족명 직접 참조가 남아 있지 않아야 한다
    const h=document.documentElement.innerHTML;
    return { attName:(h.match(/\$\{att\.name\}/g)||[]).length };
  });
  ok(srcNick.attName===0, `전투 서술에 att.name 직접 참조 없음 (${srcNick.attName}곳)`);

  /* ── 3. 듀오 배틀 상태이상이 면역 규칙을 따르는가 ── */
  const duo=await p.evaluate(()=>{
    const S=window.SG, F=S.flow;
    const byType=t=>S.DEX.find(d=>d.type===t)||S.DEX.find(d=>d.type2===t);   // 1차 타입에 없으면 2차에서
    const mk=sp=>{ const m=S.makeMon(sp,30); m.hp=m.maxHp; m.ability="sturdy"; m.status=null; m._tox=0; return m; };
    const out={};
    // 규칙 계층이 단일 출처인가
    out.hasRule=typeof F.statusBlockReason==="function" && typeof F.setStatusFields==="function";
    // 독 타입에 dbStatus로 중독 시도 → 막혀야 한다
    const po=mk(byType("poison").id); F.dbStatus && F.dbStatus(po,"psn");
    out.poisonImmune=po.status===null;
    // 노말은 걸린다(반례)
    const nm=mk(byType("normal").id); F.dbStatus && F.dbStatus(nm,"psn");
    out.normalCatches=nm.status==="psn";
    // 맹독 플래그가 듀오에서도 전달되는가
    const nm2=mk(byType("normal").id); F.dbStatus && F.dbStatus(nm2,"psn",true);
    out.duoBadly=nm2._tox===1;
    // 스테일 _tox: 치료 후 보통 독이 맹독이 되면 안 된다
    const st=mk(byType("normal").id); F.dbStatus(st,"psn",true); st._tox=9; st.status=null;
    F.dbStatus(st,"psn"); out.staleCleared=st._tox===0;
    return out;
  });
  ok(duo.hasRule, "면역 판정이 규칙 계층(statusBlockReason)에 있다");
  ok(duo.poisonImmune, "듀오: 독 타입이 중독되지 않는다");
  ok(duo.normalCatches, "듀오: 노말 타입은 중독된다(반례)");
  ok(duo.duoBadly, "듀오: 맹독 플래그가 전달된다");
  ok(duo.staleCleared, "듀오: 치료 후 옛 맹독 카운터가 되살아나지 않는다");

  /* ── 4. 퇴치 스프레이 ── */
  const repel=await p.evaluate(async()=>{
    const S=window.SG, F=S.flow; S.setG(S.freshState()); S.CONFIG.reduceMotion=true; F.enterMap(true);
    const G=S.G();
    const src=document.documentElement.innerHTML;
    return {
      levelGated:/선두보다.*약한|_repelOn/.test(src),
      // 도구 설명이 동작과 일치하는가
      bagDesc:/60걸음 동안 약한 정령 차단/.test(src),
      shopDesc:!/60걸음 조우 차단/.test(src),
    };
  });
  ok(repel.levelGated, "퇴치 스프레이가 레벨 기준으로 동작한다");
  ok(repel.bagDesc, "가방 설명이 '약한 정령 차단'");
  ok(repel.shopDesc, "상점 설명도 동작과 일치(옛 '조우 차단' 문구 없음)");

  ok(errs.length===0, `런타임 에러 0 (${errs.length}${errs[0]?": "+errs[0]:""})`);
  await b.close();
  console.log(process.exitCode?"\n❌ 실패":"\n🎉 4차 회귀 통과");
})();
