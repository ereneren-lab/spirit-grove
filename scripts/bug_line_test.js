// 콘텐츠 회귀 — 신규 벌레(bug) 프라이머리 라인(홀씨벌레→숲바람나방).
// bug는 기존에 gearclad의 2차 타입으로만 있었다(1차 bug 0). 이 라인이 타입 커버를 채운다.
// ⚠️ 아트는 SVG 플레이스홀더(매니페스트 미등록 → creatureSVG 폴백) — 실제 그림은 나중에 업로드.
const { chromium } = require("playwright"); const path=require("path");
(async()=>{ const b=await chromium.launch();
  const p=await b.newPage({viewport:{width:430,height:760}});
  const errs=[]; p.on("pageerror",e=>errs.push(e.message));
  await p.goto("file://"+path.resolve(process.argv[2])); await p.waitForTimeout(600);
  const ok=(c,m)=>{ console.log((c?"  ✅ ":"  ❌ ")+m); if(!c)process.exitCode=1; };

  const r=await p.evaluate(()=>{ const S=window.SG;
    const a=S.byId("sporelet"), c=S.byId("gustmoth");
    // bug 1차 타입 종 수
    const bugPrimary=S.DEX.filter(d=>d.type==="bug").length;
    // 진화: makeMon 후 레벨업으로 진화하는지(엔진 경유 대신 데이터 확인)
    const m=S.makeMon("sporelet",17);
    // 전투 성립: makeMon이 정상 스탯을 내는지
    const mm=S.makeMon("gustmoth",40);
    const statSum=mm.maxHp+mm.atk+mm.def+mm.spa+mm.spDef+mm.spd;
    // 학습셋: 홀씨벌레가 12렙에 벌레버즈 배움
    const m12=S.makeMon("sporelet",12);
    // SVG 플레이스홀더
    const svg=S.creatureVisual?/svg/i.test(S.creatureVisual("sporelet",a.type)):false;
    // 도감 등장(ENC_POOLS)
    const pools=S.flow.ENC_POOLS||{};
    const inWild=Object.values(pools).some(arr=>Array.isArray(arr)&&arr.includes("sporelet"));
    return { hasA:!!a, hasB:!!c, bugPrimary, dex:S.DEX.length,
      evoTo:a&&a.evolveTo, evoLv:a&&a.evolveLv, aType:a&&a.type, cType:c&&c.type, cType2:c&&c.type2,
      m40Sum:statSum, learnsBuzz:m12.moves.includes("bugbuzz"), svg, inWild,
      flavorA:!!(S.FLAVOR&&S.FLAVOR.sporelet), flavorB:!!(S.FLAVOR&&S.FLAVOR.gustmoth) }; });

  ok(r.hasA && r.hasB, "홀씨벌레·숲바람나방이 도감에 있다");
  ok(r.dex===108, `DEX 108종 (${r.dex})`);
  ok(r.bugPrimary>=2, `bug 1차 타입 종이 생겼다 (${r.bugPrimary}) — 기존 0에서 채움`);
  ok(r.aType==="bug" && r.cType==="bug" && r.cType2==="flying", "타입: 홀씨벌레=bug · 숲바람나방=bug/flying");
  ok(r.evoTo==="gustmoth" && r.evoLv===18, `진화: 홀씨벌레 → 숲바람나방 (Lv${r.evoLv})`);
  ok(r.learnsBuzz, "홀씨벌레가 레벨업으로 벌레버즈(bugbuzz)를 배운다");
  ok(r.m40Sum>400 && r.m40Sum<1600, `숲바람나방 Lv40 스탯이 합리적 범위 (합 ${r.m40Sum})`);
  ok(r.flavorA && r.flavorB, "두 종 모두 FLAVOR(도감 설명) 있음");
  ok(r.svg, "아트 미등록 → SVG 플레이스홀더로 렌더된다");
  ok(r.inWild, "홀씨벌레가 야생 조우 풀에 배치됨(획득 가능)");
  ok(errs.length===0, "런타임 에러 0"+(errs.length?": "+errs.slice(0,2).join(" / "):""));
  console.log(process.exitCode?"\n❌ 실패":"\n🎉 신규 벌레 라인 통과");
  await b.close(); process.exit(process.exitCode||0);
})();
