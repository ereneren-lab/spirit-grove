// 회귀 — 트레이너 배틀 스프라이트가 '옛날 절차적 형체'로 나오지 않고 픽셀 시트로 통일되는지.
// ⚠️ 유저 제보: "NPC 만나고 배틀 들어가면 그 이상한 형체가 옛날 버전으로 있다."
//   원인: 오버월드 NPC는 NPC_ARCH로 픽셀 시트(spr.sheet)를 받는데, 배틀은 trainerSpr이 시트 없는
//   절차적 스펙을 새로 만들어 써서 같은 인물이 배틀에서만 블록형이었다.
//   ① 로밍 트레이너(T1·V·T18…) = 같은 battleKey의 오버월드 NPC 스펙(시트 포함) 재사용.
//   ② NPC 아닌 지역 가드·제단 수호자·설산 주인 = TRAINER_ARCH로 시트 배정.
//   ③ 손튜닝 spr이 있는 관장 1~4·군주 X = 개성 있는 손그림 그대로(시트 강제 안 함).
//   ④ TRAINERS에 없는 배틀키(쌍둥이 DUO)도 오버월드 NPC 스프라이트를 인트로에 세운다.
const { chromium } = require("playwright"); const path=require("path");
(async()=>{ const b=await chromium.launch();
  const p=await b.newPage({viewport:{width:430,height:820},deviceScaleFactor:2,isMobile:true,hasTouch:true});
  const errs=[]; p.on("pageerror",e=>errs.push(e.message));
  await p.goto("file://"+path.resolve(process.argv[2])); await p.waitForTimeout(700);
  const ok=(c,m)=>{ console.log((c?"  ✅ ":"  ❌ ")+m); if(!c)process.exitCode=1; };

  const r=await p.evaluate(()=>{
    const F=window.SG.flow, S=window.SG;
    const spr=k=>F.trainerSpr(k);
    // ① 로밍 트레이너 = 오버월드 NPC와 동일 시트
    const roam={}; for(const k of ["T1","T9","V","T18","T2","T4"]){ const s=spr(k); roam[k]=s&&s.sheet||null; }
    // 오버월드 NPC의 시트와 실제로 일치하는지(같은 battleKey)
    const npcMatch=(()=>{ const npc=S.NPCS.find(n=>n&&n.battleKey==="T1"); const s=spr("T1"); return !!(npc&&npc.spr&&s&&s.sheet&&s.sheet===npc.spr.sheet); })();
    // ② NPC 아닌 트레이너 = TRAINER_ARCH 시트
    const arch={}; for(const k of ["5","6","h","r","u","v","y","SNOW"]){ const s=spr(k); arch[k]=s&&s.sheet||null; }
    // ③ 손튜닝 관장·군주 = 시트 강제 안 됨(개성 있는 절차적 스펙 유지), 단 스펙 자체는 존재
    const hand={}; for(const k of ["1","2","3","4","X"]){ const s=spr(k); hand[k]={has:!!s, sheet:s&&s.sheet||null}; }
    // ④ DUO(쌍둥이) — TRAINERS 항목이 없어도 오버월드 NPC 시트로 인트로 스프라이트
    const duo=spr("DUO");
    return { roam, npcMatch, arch, hand, duo:duo&&duo.sheet||null };
  });

  // ① 로밍 트레이너 전부 시트 보유 + 실제 오버월드와 일치
  const roamAll=Object.values(r.roam).every(Boolean);
  ok(roamAll, "로밍 트레이너가 배틀에서도 픽셀 시트를 쓴다 "+JSON.stringify(r.roam));
  ok(r.npcMatch, "배틀 스프라이트가 같은 인물의 오버월드 NPC 시트와 정확히 일치한다(T1)");

  // ② 지역 가드·수호자·설산 주인 시트 배정
  const archAll=Object.values(r.arch).every(Boolean);
  ok(archAll, "NPC 아닌 지역 가드·수호자·설산 주인도 시트를 받는다 "+JSON.stringify(r.arch));
  ok(r.arch.SNOW==="snowMaster", "설산의 주인은 전용 snowMaster 시트를 쓴다");

  // ③ 손튜닝 관장·군주는 개성 있는 손그림 유지(스펙 존재, 시트 강제 없음)
  const handKept=["1","2","3","4","X"].every(k=>r.hand[k].has && !r.hand[k].sheet);
  ok(handKept, "관장 1~4·군주 X는 손튜닝 절차적 스펙을 유지한다(시트로 덮지 않음)");

  // ④ 쌍둥이 인트로 스프라이트 존재
  ok(r.duo==="kid_f", `쌍둥이(DUO)도 오버월드 시트로 인트로에 선다 (${r.duo})`);

  ok(errs.length===0, "런타임 에러 0"+(errs.length?": "+errs.slice(0,2).join(" / "):""));
  console.log(process.exitCode?"\n❌ 실패":"\n🎉 트레이너 스프라이트 통일 통과");
  await b.close(); process.exit(process.exitCode||0);
})();
