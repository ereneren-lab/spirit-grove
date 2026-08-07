// 도감 데이터 회귀 테스트:
//  - FLAVOR가 DEX 86종 전부 커버(예전엔 32종만, 63%가 빈 껍데기)
//  - 진화하면 키·무게가 반드시 커진다
//  - findHint가 실제 조우 풀에서 파생 — 해안 전용 종이 "숲 · 초원"이라 뜨던 거짓 정보 제거
//  - 도감 상세에 울음소리 버튼
const { chromium } = require("playwright"); const path=require("path");
(async()=>{ const b=await chromium.launch();
  const p=await b.newPage({viewport:{width:430,height:760}});
  const errs=[]; p.on("pageerror",e=>errs.push(e.message));
  await p.goto("file://"+path.resolve(process.argv[2])); await p.waitForTimeout(800);
  const ok=(c,m)=>{ console.log((c?"  ✅ ":"  ❌ ")+m); if(!c)process.exitCode=1; };

  const r=await p.evaluate(()=>{
    const S=window.SG, F=S.flow; S.setG(S.freshState()); S.CONFIG.reduceMotion=true;
    const DEX=S.DEX, FL=window.FLAVOR||S.FLAVOR;
    const out={dex:DEX.length};
    // 상세창을 열어 FLAVOR 존재 여부를 간접 확인하는 대신 findHint/FLAVOR를 직접 본다
    const byId=S.byId;
    // 1) 커버리지: 상세 렌더에 분류명이 폴백("흔함/중급/희귀")으로 뜨는 종이 없어야 한다
    const fallback=["흔함","중급","희귀"];
    const missing=[]; const shrink=[]; const hints={};
    for(const d of DEX){
      F.openDetail(d.id);
      const html=document.getElementById("dexDetailBody").innerHTML;
      const m=html.match(/·\s*([^·<]+?)\s*·\s*출현:\s*([^<]+)</);
      if(!m){ missing.push(d.id); continue; }
      const cat=m[1].trim(); hints[d.id]=m[2].trim();
      if(fallback.indexOf(cat)>=0)missing.push(d.id);
    }
    out.missing=missing;
    // 2) 진화 시 키/무게 증가
    const FLV=S.FLAVOR||null;
    out.hasFlavorExport=!!FLV;
    if(FLV){ for(const d of DEX){ if(!d.evolveTo)continue; const a=FLV[d.id],c=FLV[d.evolveTo];
      if(a&&c&&(c.h<=a.h||c.w<=a.w))shrink.push(d.id+"→"+d.evolveTo); } }
    out.shrink=shrink;
    // 3) 서식지 정확성: 해안 전용 종은 "숲 · 초원"이 뜨면 안 된다
    out.crablord=F.findHint(byId("crablord"));
    out.nipling=F.findHint(byId("nipling"));
    out.iceling=F.findHint(byId("iceling"));
    out.swampfrog=F.findHint(byId("swampfrog"));
    out.racoonmon=F.findHint(byId("racoonmon"));
    // 4) 전설/무야생은 특별 표기
    out.dawnwyrm=F.findHint(byId("dawnwyrm"));
    out.skydrake=F.findHint(byId("skydrake"));
    // 5) 풀에 있는 모든 종의 힌트가 그 지역을 포함하는지 (전수)
    const bad=[];
    for(const k in F.ENC_POOLS){ for(const id of F.ENC_POOLS[k]){ const sp=byId(id); if(!sp)continue;
      const ko=(F.HABITAT_KO||{})[k];   // ⚠️ 하드코딩 사본(병렬 테이블) 대신 실제 HABITAT_KO를 읽는다 — 새 풀 추가 시 안 깨진다
      if(F.findHint(sp).indexOf(ko)<0)bad.push(id+"@"+k); } }
    out.badHints=bad;
    // 6) 울음 버튼
    F.openDetail("foxfire");
    out.cryBtn=!!document.querySelector("#dexDetailBody .crybtn");
    return out;
  });

  ok(r.dex===86, `DEX 86종 (${r.dex})`);
  ok(r.missing.length===0, `FLAVOR가 전 종 커버 — 폴백 분류 0건 (누락 ${r.missing.length}${r.missing.length?": "+r.missing.slice(0,5):""})`);
  ok(r.shrink.length===0, `진화하면 키·무게가 커진다 (역행 ${r.shrink.length}건${r.shrink.length?": "+r.shrink.slice(0,3):""})`);
  // 집게왕은 섬·낚시(대물) 풀 소속(해안 아님). 바다 전용이라 오버월드 표기가 붙으면 안 된다.
  ok(r.crablord.indexOf("숲")<0 && r.crablord.indexOf("여명의 섬")>=0, `섬 전용 종에 숲이 안 뜬다 (집게왕: ${r.crablord})`);
  ok(r.nipling.indexOf("숲")<0, `바다 전용 종에 숲이 안 뜬다 (집게공: ${r.nipling})`);
  ok(r.iceling.indexOf("설원")>=0, `설원 종에 설원 표기 (빙구리: ${r.iceling})`);
  ok(r.swampfrog.indexOf("🌙")>=0, `밤 한정 종에 시간대 표기 (개굴몽: ${r.swampfrog})`);
  ok(r.racoonmon.indexOf("숲")>=0 || r.racoonmon.indexOf("초원")>=0, `일반 야생종은 오버월드 표기 유지 (라꾸리: ${r.racoonmon})`);
  ok(r.dawnwyrm.indexOf("전설")>=0, `전설은 특별 표기 (여명룡: ${r.dawnwyrm})`);
  ok(r.skydrake.indexOf("숲")<0, `야생 미출현 종에 숲이 안 뜬다 (${r.skydrake})`);
  ok(r.badHints.length===0, `모든 조우 풀 소속 종의 서식지 표기가 풀과 일치 (불일치 ${r.badHints.length}${r.badHints.length?": "+r.badHints.slice(0,5):""})`);
  ok(r.cryBtn, "도감 상세에 울음소리 버튼");
  ok(errs.length===0, "런타임 에러 0"+(errs.length?": "+errs.slice(0,3).join(" / "):""));
  console.log(process.exitCode?"\n❌ 실패":"\n🎉 도감 데이터 통과");
  await b.close(); process.exit(process.exitCode||0);
})();
