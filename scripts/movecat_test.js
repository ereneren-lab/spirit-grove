// 기술 계열(물리/특수) 감사 — **기술 단위로 선언한 계열이 실제 게임에서 도는가**.
//
// 왜 있나
//   2026-08-06까지 이 게임은 `SPEC_TYPES[move.type]`으로 **타입이 계열을 강제**했다(3세대 이전 방식).
//   그래서 이중 타입 40종 중 31종이 두 타입이 물리/특수를 가로질러, STAB 둘 중 하나를 반드시
//   약한 스탯으로 쏘고 있었다(집게왕 하이드로펌프 125 vs 크로스촙 363). 계열을 기술 단위로 옮기면서
//   이 감사를 붙인다. 이 저장소의 단골 사고가 정확히 두 가지 모양으로 재발할 수 있기 때문이다:
//     ① 표(MOVE_CAT)에 선언했는데 계산이 안 읽는다 — 성격의 spa · lifeorb의 recoil과 같은 병.
//     ② 계열을 묻는 곳이 moveCat을 안 거치고 SPEC_TYPES를 직접 본다 — 병렬 판정 부활.
//        까칠한피부가 실제로 그 두 번째 호출부였다.
//
// ⚠️ 표끼리 비교하지 않는다. **실제 damage()와 실제 전투 한 턴**으로 잰다.
const { chromium } = require("playwright"); const path=require("path");

(async()=>{
  const b=await chromium.launch();
  const p=await b.newPage({viewport:{width:430,height:760}});
  const errs=[]; p.on("pageerror",e=>errs.push(e.message));
  let fail=0; const ok=(c,m)=>{ console.log((c?"  ✅ ":"  ❌ ")+m); if(!c)fail=1; };
  process.on("unhandledRejection",async e=>{ console.log("❌ "+e); await b.close(); process.exit(1); });
  await p.goto("file://"+path.resolve(process.argv[2])); await p.waitForTimeout(900);

  console.log("\n[1] 선언한 계열이 damage() 계산에 실제로 반영된다");
  /* 공격 스탯만 다른 두 정령으로 같은 기술을 쏜다. 물리 기술이면 atk 쪽이, 특수 기술이면 spa 쪽이
     더 아파야 한다. 계열이 안 읽히면(=타입 기본으로 계산되면) 뒤집힌 기술에서 즉시 걸린다. */
  const r1=await p.evaluate(()=>{ const S=window.SG,M=S.MOVES;
    const mk=(o)=>Object.assign(S.makeMon("racoonmon",50),{atk:60,spa:60,def:100,spDef:100,spd:100,
      maxHp:9999,hp:9999,status:null,stages:S.newStages(),held:null,ability:"guts",type:"normal",type2:null},o);
    const avg=(a,d,mv,n=300)=>{ let s=0; for(let i=0;i<n;i++)s+=S.damage(a,d,mv).dmg; return s/n; };
    const out=[];
    for(const k in M){ const mv=M[k]; if(!(mv.power>0))continue;
      const cat=S.moveCat(mv);
      const physMon=mk({atk:160,spa:60}), specMon=mk({atk:60,spa:160});
      const target=mk({type:"water"});   // ⚠️ water는 어떤 타입에도 면역이 없다(0 없음) — 고스트/노말/땅 등 면역기도 물/특 구분이 가능
      const dPhys=avg(physMon,target,mv), dSpec=avg(specMon,target,mv);
      const wins=dPhys>dSpec*1.15?"phys":(dSpec>dPhys*1.15?"spec":"무승부");
      out.push({k,name:mv.name,type:mv.type,declared:cat,overridden:!!mv.cat,measured:wins,
                dPhys:Math.round(dPhys),dSpec:Math.round(dSpec)}); }
    return out; });
  const wrong=r1.filter(x=>x.measured!==x.declared);
  const flipped=r1.filter(x=>x.overridden);
  ok(wrong.length===0, `공격기 ${r1.length}개 전부 선언한 계열대로 계산된다` +
     (wrong.length?` — 어긋남: ${wrong.map(x=>`${x.name}(선언 ${x.declared}, 실측 ${x.measured})`).join(", ")}`:""));
  ok(flipped.length>0 && flipped.every(x=>x.measured===x.declared),
     `타입 기본을 뒤집은 기술 ${flipped.length}개가 실제로 반대 스탯을 쓴다 ` +
     `(${flipped.map(x=>x.name+"→"+(x.declared==="spec"?"특수":"물리")).join(", ")})`);

  console.log("\n[2] cat이 없는 기술은 타입 기본과 정확히 일치한다 (하위호환)");
  const r2=await p.evaluate(()=>{ const S=window.SG,M=S.MOVES;
    const bad=[]; let n=0;
    for(const k in M){ const mv=M[k]; if(mv.cat)continue; n++;
      const want=S.SPEC_TYPES[mv.type]?"spec":"phys";
      if(S.moveCat(mv)!==want)bad.push(k); }
    return {n,bad}; });
  ok(r2.bad.length===0, `미지정 기술 ${r2.n}개가 전부 타입 기본값을 따른다 (어긋남: ${r2.bad.join(",")||"—"})`);

  console.log("\n[3] 계열을 묻는 다른 호출부도 moveCat을 거친다 (병렬 판정 방지)");
  /* 까칠한피부는 "물리 기술로 맞으면 반동"이다. 독 타입은 기본이 물리인데 오물폭탄은 특수로 뒤집었다.
     이 호출부가 아직 SPEC_TYPES를 본다면 오물폭탄에도 반동이 걸린다 → 여기서 걸린다.
     ⚠️ 실제 전투 한 턴을 돌린다(순수 함수로는 이 호출부를 못 지나간다). */
  const r3=await p.evaluate(async()=>{ const S=window.SG,F=S.flow;
    const run=async(mvKey)=>{
      S.setG(S.freshState()); const G=S.G(); S.CONFIG.reduceMotion=true; S.CONFIG.textSpeed=0.01;
      const me=S.makeMon("racoonmon",50); me.moves=[mvKey]; me.pp={[mvKey]:30};
      me.maxHp=9999; me.hp=9999; me.held=null; me.atk=140; me.spa=140;
      const foe=S.makeMon("boulderin",50); foe.ability="roughskin";   // 까칠한피부
      foe.maxHp=99999; foe.hp=99999; foe.held=null; foe.type="normal"; foe.type2=null;
      // ⚠️ 상대에게 공격기를 남겨두면 **반격 피해**가 내 HP를 깎아 반동과 구별되지 않는다.
      //    변화기만 주어 "내 HP가 줄었다 = 까칠한피부 반동"이 되게 만든다.
      foe.moves=["growl"]; foe.pp={growl:40};
      G.party=[me]; G.active=0; G.foe=foe; G.inBattle=true; G.busy=false; G.wild=true;
      F.setupBattleUI(); await new Promise(r=>setTimeout(r,120));
      const before=me.hp;
      await F.doMove(mvKey);
      const dl=Date.now()+9000; while(S.G().busy&&Date.now()<dl)await new Promise(r=>setTimeout(r,40));
      return {recoiled: S.G().party[0].hp < before, cat:S.moveCat(S.MOVES[mvKey])};
    };
    return { poisonjab:await run("poisonjab"),   // 독찌르기 — 물리(타입 기본 그대로)
             sludge:await run("sludge") };       // 오물폭탄 — 특수로 뒤집음
  });
  ok(r3.poisonjab.recoiled===true, `물리 기술(독찌르기)엔 까칠한피부 반동이 걸린다`);
  ok(r3.sludge.recoiled===false,
     `특수로 뒤집은 기술(오물폭탄)엔 반동이 안 걸린다 — 이 호출부가 타입이 아니라 moveCat을 본다` +
     (r3.sludge.recoiled?` ❗ SPEC_TYPES를 직접 보는 코드가 남아 있다`:""));

  console.log("\n[4] 플레이어가 계열을 화면에서 읽을 수 있다");
  /* 예전엔 어디에도 안 떴다. 같은 위력인데 피해가 3배 차이 나는 이유를 알 방법이 없었다. */
  const r4=await p.evaluate(()=>{ const S=window.SG;
    const s=(k)=>S.moveSummary(k);
    return { phys:s("boulder"), spec:s("hydro"), status:s("growl"),
             flipped:s("gust"), flippedPhys:s("aquajet") }; });
  ok(/물리/.test(r4.phys), `물리 기술에 "물리"가 뜬다 — ${r4.phys}`);
  ok(/특수/.test(r4.spec), `특수 기술에 "특수"가 뜬다 — ${r4.spec}`);
  ok(/변화/.test(r4.status)&&!/물리|특수/.test(r4.status), `변화기엔 계열 대신 "변화"가 뜬다 — ${r4.status}`);
  ok(/특수/.test(r4.flipped), `뒤집은 기술도 뒤집힌 대로 뜬다(바람일격) — ${r4.flipped}`);
  ok(/물리/.test(r4.flippedPhys), `뒤집은 기술도 뒤집힌 대로 뜬다(아쿠아제트) — ${r4.flippedPhys}`);

  console.log("\n[5] 모든 타입이 물리·특수 공격기를 다 갖는다 (이 변경의 목적)");
  /* 예전엔 타입마다 한쪽 계열만 존재했다(불=특수 6·0 / 바위=물리 6·0 …).
     그래서 "물리형 불 정령"이 자기 STAB을 쓸 방법이 구조적으로 없었다. */
  const r5=await p.evaluate(()=>{ const S=window.SG,M=S.MOVES;
    const t={}; for(const k in M){ const mv=M[k]; if(!(mv.power>0))continue;
      (t[mv.type]=t[mv.type]||{phys:0,spec:0})[S.moveCat(mv)]++; }
    return t; });
  /* ⚠️ 아직 한쪽뿐인 3타입은 **알면서 남긴 것**이다 — 뒤집을 후보가 전부 "배우는 종이 손해"이거나
     TM 전용 기술이 아예 없었다(normal은 파괴광선 22종 손해 · grass는 덩굴채찍 7종 손해 ·
     rock은 TM 전용 공격기가 0개). 나중에 그 타입에 **새 TM 기술**을 넣을 때 반대 계열로 만들면 풀린다.
     임계값이 아니라 **집합을 고정**한다 — 늘어나도 줄어도(=여기 적힌 근거가 바뀌어도) 걸리게. */
  const KNOWN_ONE_SIDED=["normal","grass","rock","dragon"];
  const oneSided=Object.entries(r5).filter(([t,c])=>c.phys===0||c.spec===0).map(([t])=>t).sort();
  console.log("     " + Object.entries(r5).map(([t,c])=>`${t} ${c.phys}/${c.spec}`).join(" · ") + "  (물리/특수)");
  ok(JSON.stringify(oneSided)===JSON.stringify([...KNOWN_ONE_SIDED].sort()),
     `한쪽 계열만 있는 타입이 알려진 3개 그대로다 (지금: ${oneSided.join(",")||"없음"} · 기대: ${[...KNOWN_ONE_SIDED].sort().join(",")})`);
  ok(Object.keys(r5).length-oneSided.length===12, `나머지 12타입은 물리·특수를 모두 갖는다`);

  ok(errs.length===0, `런타임 에러 0 (${errs.length})${errs.length?": "+errs.slice(0,2).join(" | "):""}`);
  await b.close();
  console.log(fail?"\n❌ movecat_test 실패":"\n🎉 기술 계열 감사 통과");
  process.exit(fail);
})();
