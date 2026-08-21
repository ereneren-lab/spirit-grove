// H1-2 회귀 — 개체값 잠재력·성격 보정을 '상시' 표기하는가.
// 왜: IV/성격 엔진은 있었으나 플레이어가 매번 감정사/요약을 열어야 보였다. 이제 파티 카드엔
//     잠재력 등급을, 요약 능력치 막대엔 성격 ▲/▼ 를 상시 노출한다. 표기 배선이 끊기면 조용히 사라진다.
const { chromium } = require("playwright"); const path=require("path");
(async()=>{ const b=await chromium.launch();
  const p=await b.newPage({viewport:{width:430,height:760}});
  const errs=[]; p.on("pageerror",e=>errs.push(e.message));
  await p.goto("file://"+path.resolve(process.argv[2])); await p.waitForTimeout(800);
  const ok=(c,m)=>{ console.log((c?"  ✅ ":"  ❌ ")+m); if(!c)process.exitCode=1; };

  const r=await p.evaluate(()=>{ const S=window.SG,F=S.flow; S.setG(S.freshState()); const G=S.G();
    const mk=(nat,ivs)=>{ const m=S.makeMon("foxfire",25); m.nature=nat; m.ivs=ivs; return m; };
    // 보정 성격(adamant 공↑특공↓) + 고IV / 무보정 성격(hardy) + 저IV
    const hi=mk("adamant",{hp:31,atk:31,def:31,spa:28,spDef:30,spd:30});   // 총 181 → 최상급
    const lo=mk("hardy",  {hp:2,atk:3,def:1,spa:0,spDef:4,spd:2});          // 총 12 → 평범, 보정 없음
    G.party=[hi,lo];
    (F.renderPC||window.renderPC)();
    const pc=(document.getElementById("pcBody")||{}).innerHTML||"";
    // 요약(보정 성격)
    (F.pcAction||window.pcAction)("sum",0);
    const sumHi=(document.getElementById("sumBody")||{}).innerHTML||"";
    // 요약(무보정 성격) — ▲/▼ 없어야
    (F.pcAction||window.pcAction)("sum",1);
    const sumLo=(document.getElementById("sumBody")||{}).innerHTML||"";
    return { pcIV:/잠재력/.test(pc), pcTop:/최상급/.test(pc), pcPlain:/평범/.test(pc),
             sumUp:/▲/.test(sumHi), sumDown:/▼/.test(sumHi), sumNat:/공격↑ 특수공격↓/.test(sumHi),
             loNoArrow:!/▲/.test(sumLo)&&!/▼/.test(sumLo), loNoBoost:/보정 없음/.test(sumLo) };
  });

  ok(r.pcIV, "파티 카드에 개체값 잠재력 등급이 상시 표기된다");
  ok(r.pcTop && r.pcPlain, "잠재력 등급이 개체별로 갈린다(최상급/평범 동시 확인)");
  ok(r.sumUp && r.sumDown, "요약 능력치 막대에 성격 ▲/▼ 가 붙는다");
  ok(r.sumNat, "요약 성격 라벨이 보정 방향(공격↑ 특수공격↓)을 보여준다");
  ok(r.loNoArrow && r.loNoBoost, "무보정 성격은 화살표 없이 '보정 없음'으로 표기된다");
  ok(errs.length===0, "런타임 에러 0"+(errs.length?": "+errs.slice(0,2).join(" / "):""));
  console.log(process.exitCode?"\n❌ 실패":"\n🎉 개체값·성격 상시 라벨 통과");
  await b.close(); process.exit(process.exitCode||0);
})();
