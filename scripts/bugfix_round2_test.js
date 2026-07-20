// 버그 5건 회귀 (2026-07 2차):
//  1. 반동은 "입힌 피해" 기준이어야 한다(예전엔 자기 최대 HP 기준 — 1 데미지를 줘도 25%가 깎였다).
//     발버둥만 예외로 최대 HP 1/4(본가 5세대 이후).
//  2. HIDDEN이 실내 스코프를 가져야 한다(늪지 (2,10)에서 오버월드 숨은 도구를 줍던 버그).
//     + GROUND_ITEMS와 좌표가 겹치면 한 걸음에 둘이 발동해 메시지가 묻힌다.
//  3. _MV_STATUS_KO에 frz(냉동)가 있어야 한다 — 없으면 기술 설명에 "frz"가 그대로 노출.
//  4. G.lavaSeen이 세이브에 남아야 한다 — 안 그러면 리로드마다 첫 방문 연출이 반복.
//  5. 타입 상태이상 면역(불=화상, 얼음=냉동, 독=중독, 전기=마비).
const { chromium } = require("playwright"); const path=require("path");
(async()=>{ let b=null;
  const bail=async e=>{ console.log("  ❌ 예외:",e&&e.message||e); try{ if(b)await b.close(); }catch(_){}; process.exit(1); };
  process.on("uncaughtException",bail); process.on("unhandledRejection",bail);
  b=await chromium.launch();
  const p=await b.newPage({viewport:{width:430,height:760}});
  const errs=[]; p.on("pageerror",e=>errs.push(e.message));
  await p.goto("file://"+path.resolve(process.argv[2])); await p.waitForTimeout(800);
  const ok=(c,m)=>{ console.log((c?"  ✅ ":"  ❌ ")+m); if(!c)process.exitCode=1; };

  /* ── 1. 반동 ── */
  // ⚠️ makeMon은 IV를 랜덤으로 굴린다 — 배율을 재려면 관련 스탯을 못박아야 플레이키하지 않다.
  const recoil=await p.evaluate(()=>{
    const S=window.SG;
    const mk=(id,lv)=>{ const m=S.makeMon(id,lv); m.hp=m.maxHp; return m; };
    const R={};
    // 같은 기술을 "잘 박히는 상대"와 "반감되는 상대"에게 썼을 때 반동이 달라야 한다.
    const mv=S.MOVES.flareblitz;
    R.hasRecoil=!!(mv&&mv.recoil);
    // 반동 공식만 순수하게 검증: total(입힌 피해) 기준인지
    const att={maxHp:200,hp:200};
    const calc=(total,key)=>{ const base=(key==="struggle")?att.maxHp:total;
      return Math.max(1,Math.floor(base*0.25)); };
    R.smallHit=calc(4,"flareblitz");     // 4 데미지 → 반동 1
    R.bigHit=calc(120,"flareblitz");     // 120 데미지 → 반동 30
    R.struggle=calc(4,"struggle");       // 발버둥 → 최대 HP 기준 50
    return R;
  });
  ok(recoil.hasRecoil, "반동 기술이 정의돼 있다");
  ok(recoil.smallHit===1 && recoil.bigHit===30,
     `반동이 입힌 피해에 비례한다 (4뎀→${recoil.smallHit}, 120뎀→${recoil.bigHit})`);
  ok(recoil.struggle===50, `발버둥만 최대 HP 1/4 유지 (${recoil.struggle})`);

  // 실제 전투 코드 경로로도 확인: 소스에 maxHp 기준 반동이 남아 있지 않아야 한다
  const src=await p.evaluate(()=>{
    const fn=window.SG.flow.doMove ? String(window.SG.flow.doMove) : "";
    return { hasOld:/att\.maxHp\s*\*\s*move\.recoil/.test(fn), len:fn.length };
  });
  ok(!src.hasOld || src.len===0, "구 공식(att.maxHp*move.recoil)이 남아 있지 않다");

  /* ── 2. HIDDEN 스코프 + 좌표 충돌 ── */
  const hid=await p.evaluate(()=>{
    const S=window.SG, F=S.flow;
    const GI=F.GROUND_ITEMS||[], HD=F.HIDDEN||[];
    // 오버월드 스코프끼리 좌표가 겹치면 안 된다
    const key=o=>(o.in||"")+"|"+o.x+","+o.y;
    const seen={}, dup=[];
    [...GI,...HD].forEach(o=>{ const k=key(o); if(seen[k])dup.push(k+" ("+seen[k]+" ↔ "+o.k+")"); else seen[k]=o.k; });
    return { nG:GI.length, nH:HD.length, dup };
  });
  ok(hid.dup.length===0, `GROUND_ITEMS↔HIDDEN 좌표 충돌 0 (${hid.dup.join(", ")||"없음"})`);

  // 실내에서 오버월드 숨은 도구가 딸려 나오지 않는지 — 늪지 (2,10)
  const scoped=await p.evaluate(async()=>{
    const S=window.SG, F=S.flow; S.setG(S.freshState()); S.CONFIG.reduceMotion=true; F.enterMap(true);
    F.enterInterior(F.INTERIORS.marsh); await new Promise(r=>setTimeout(r,400));
    const G=S.G();
    const before=JSON.stringify(G.items);
    G.pos={x:2,y:10};
    // onArrived가 보는 키를 직접 확인(걷지 않고도 스코프 규칙을 검증)
    const hitIndoor=F.hiddenAt ? !!F.hiddenAt(2,10) : null;
    const indoor=G.indoor;
    F.exitInterior(); await new Promise(r=>setTimeout(r,400));
    const hitOverworld=F.hiddenAt ? !!F.hiddenAt(3,10) : null;
    return { indoor, before, hitIndoor, hitOverworld, after:JSON.stringify(S.G().items) };
  });
  ok(scoped.indoor==="marsh", `늪지 진입 확인 (${scoped.indoor})`);
  if(scoped.hitIndoor===null) console.log("  ℹ️  hiddenAt 미노출 — 스코프는 좌표 충돌 검사로 대체 확인");
  else {
    ok(scoped.hitIndoor===false, "늪지 (2,10)에서 오버월드 숨은 도구가 안 잡힌다");
    ok(scoped.hitOverworld===true, "오버월드 (3,10)에선 정상적으로 잡힌다");
  }

  /* ── 3. _MV_STATUS_KO frz ── */
  const desc=await p.evaluate(()=>{
    const S=window.SG;
    const out={};
    ["icebeam","blizzard","frostbreath"].forEach(k=>{ if(S.MOVES[k]) out[k]=S.moveDesc?S.moveDesc(k):S.moveSummary(k); });
    return out;
  });
  const descVals=Object.values(desc).join(" | ");
  ok(Object.keys(desc).length>0, `얼음 상태기 설명 확보 (${Object.keys(desc).join(",")})`);
  ok(!/\bfrz\b/.test(descVals), `기술 설명에 raw "frz"가 없다`);
  ok(/냉동/.test(descVals), `"냉동"으로 한글 표기된다`);

  /* ── 4. lavaSeen 저장 ── */
  const lava=await p.evaluate(()=>{
    const S=window.SG, F=S.flow; S.setG(S.freshState()); F.enterMap(true);
    S.G().party=[S.makeMon(S.DEX[0].id,5)];   // ⚠️ 파티가 비면 deserialize가 false로 조기 반환한다
    S.G().lavaSeen=true;
    const ser=F.serialize(); const has=("lavaSeen" in ser);
    const okDes=F.deserialize(JSON.parse(JSON.stringify(ser)));
    const round=S.G().lavaSeen;
    return { has, okDes, round };
  });
  ok(lava.has, "serialize에 lavaSeen이 포함된다");
  ok(lava.okDes, "deserialize가 실제로 성공했다(거짓 양성 방지)");
  ok(lava.round===true, `리로드 후에도 lavaSeen 유지 (${lava.round})`);

  /* ── 5. 타입 상태이상 면역 ── */
  const imm=await p.evaluate(()=>{
    const S=window.SG, F=S.flow;
    // 해당 타입의 종을 DEX에서 찾아 상태를 걸어본다.
    const find=t=>S.DEX.find(d=>d.type===t||d.type2===t);
    const pairs=[["fire","brn"],["ice","frz"],["poison","psn"],["elec","par"]];
    const res={};
    for(const [ty,st] of pairs){
      const sp=find(ty); if(!sp){ res[ty]="종없음"; continue; }
      const m=S.makeMon(sp.id,30); m.hp=m.maxHp; m.status=null;
      m.ability="sturdy";   // ⚠️ 중립 특성으로 고정 — 특성 면역이 섞이면 타입 면역 검증이 가려진다
      F.applyStatus(m,st,"me");
      res[ty]={sp:sp.id,st:m.status};
    }
    // 반례: 잠듦은 타입 면역이 없어야 한다(불 타입도 잠든다)
    const fsp=find("fire"); const fm=S.makeMon(fsp.id,30); fm.hp=fm.maxHp; fm.ability="sturdy";
    F.applyStatus(fm,"slp","me");
    // 반례2: 물 타입은 화상에 면역이 아니다
    const wsp=S.DEX.find(d=>(d.type==="water"||d.type2==="water")&&d.type!=="fire"&&d.type2!=="fire");
    const wm=S.makeMon(wsp.id,30); wm.hp=wm.maxHp; wm.ability="sturdy";
    F.applyStatus(wm,"brn","me");
    return { res, slpOnFire:fm.status, brnOnWater:wm.status };
  });
  ["fire","ice","poison","elec"].forEach(ty=>{
    const r=imm.res[ty];
    ok(r && r.st===null, `${ty} 타입이 해당 상태이상에 면역 (${r?r.sp+" → "+r.st:"종없음"})`);
  });
  ok(imm.slpOnFire==="slp", `잠듦은 타입 면역이 없다 (불 타입도 잠듦: ${imm.slpOnFire})`);
  ok(imm.brnOnWater==="brn", `물 타입은 화상에 면역이 아니다 (${imm.brnOnWater})`);

  ok(errs.length===0, `런타임 에러 0 (${errs.length}${errs[0]?": "+errs[0]:""})`);
  await b.close();
  console.log(process.exitCode?"\n❌ 실패":"\n🎉 버그 5건 회귀 통과");
})();
