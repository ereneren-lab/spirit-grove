// 오버월드 날씨 회귀 테스트.
//  - owWeather: 지역별 특징 날씨(REGION_WEATHER)를 결정적으로 돌려주고, 실내면 clear
//  - setWeather: 오버월드 날씨를 그대로 전투로 옮긴다("필드에서 본 날씨 = 전투 날씨") — snow→hail, fog→없음
//  - pickWild: 날씨에 어울리는 타입이 더 자주 나온다(비→물/얼음 등)
//  - 필드 렌더가 날씨 연출을 그려도 에러 0
// 날씨는 실시간 기반(dayCycle 방식)이라 setOwWeather(w)로 강제해 결정적으로 검증한다.
const { chromium } = require("playwright"); const path=require("path");
(async()=>{ const b=await chromium.launch();
  const p=await b.newPage({viewport:{width:430,height:760}});
  const errs=[]; p.on("pageerror",e=>errs.push(e.message));
  await p.goto("file://"+path.resolve(process.argv[2])); await p.waitForTimeout(800);
  const ok=(c,m)=>{ console.log((c?"  ✅ ":"  ❌ ")+m); if(!c)process.exitCode=1; };

  /* ── 1. 테이블 ── */
  const t=await p.evaluate(()=>{ const F=window.SG.flow;
    return { rw:F.REGION_WEATHER, snow:F.OW_BATTLE_WEATHER.snow, fog:F.OW_BATTLE_WEATHER.fog, sun:F.OW_BATTLE_WEATHER.sun, rain:F.OW_BATTLE_WEATHER.rain }; });
  ok(Array.isArray(t.rw) && t.rw.length===7, `REGION_WEATHER 7지역 정의 (${t.rw&&t.rw.join(",")})`);
  ok(t.snow==="hail" && t.fog===undefined && t.sun==="sun" && t.rain==="rain", `전투 매핑: 눈→hail · 안개→없음 · 쨍쨍→sun · 비→rain`);

  /* ── 2. owWeather 지역 정확성 + 실내 clear ── */
  const reg=await p.evaluate(()=>{ const S=window.SG,F=S.flow; S.setG(S.freshState()); F.setOwWeather(null); const G=S.G(); G.indoor=null;
    const ys=[48,44,37,31,22,13,9];   // 각 지역 밴드의 대표 y
    const out=ys.map((y,r)=>{ G.pos={x:8,y}; const base=F.REGION_WEATHER[r]; const w=F.owWeather(); return { r, base, w, okv:(w===base||w==="clear") }; });
    G.indoor="gym1"; G.pos={x:4,y:5}; const indoor=F.owWeather();
    return { out, indoor }; });
  ok(reg.out.every(o=>o.okv), `owWeather가 지역별로 base 또는 clear만 반환 (${reg.out.map(o=>o.r+":"+o.w).join(" ")})`);
  ok(reg.indoor==="clear", `특징 날씨 없는 실내(체육관)는 clear (${reg.indoor})`);

  /* ── 2b. 신규 지역(인테리어)의 상시 특징 날씨 + 전투 전이 ── */
  const iw=await p.evaluate(()=>{ const S=window.SG,F=S.flow; S.setG(S.freshState()); F.setOwWeather(null); const G=S.G();
    const want={mooncanyon:"fog",desert:"sand",crystalcave:"snow",wyverngorge:"rain"};
    const out={}; for(const id in want){ G.indoor=id; G.pos={x:6,y:5};
      const ow=F.owWeather(); F.setWeather(); out[id]={ow,battle:S.G().weather}; }
    G.indoor=null; F.setOwWeather(null);
    return { out, map:F.INDOOR_WEATHER, battleMap:F.OW_BATTLE_WEATHER }; });
  ok(iw.out.mooncanyon.ow==="fog" && !iw.out.mooncanyon.battle, "달그림자=안개(연출만, 전투 날씨 없음)");
  ok(iw.out.desert.ow==="sand" && iw.out.desert.battle==="sand", "사막=모래바람 → 전투 sand");
  ok(iw.out.crystalcave.ow==="snow" && iw.out.crystalcave.battle==="hail", "수정 동굴=싸라기눈 → 전투 hail");
  ok(iw.out.wyverngorge.ow==="rain" && iw.out.wyverngorge.battle==="rain", "비룡 협곡=폭풍우 → 전투 rain");
  ok(iw.map && Object.keys(iw.map).length===5, `INDOOR_WEATHER 5지역 정의 (${Object.keys(iw.map||{}).join(",")})`);

  /* ── 3. setWeather가 필드 날씨를 전투로 옮긴다 ── */
  const carry=await p.evaluate(()=>{ const S=window.SG,F=S.flow; const G=S.G(); G.indoor=null;
    const chk=w=>{ F.setOwWeather(w); F.setWeather(); return S.G().weather; };
    const out={ rain:chk("rain"), snow:chk("snow"), sun:chk("sun"), fog:chk("fog"), clear:chk("clear") };
    F.setOwWeather(null); return out; });
  ok(carry.rain==="rain" && carry.snow==="hail" && carry.sun==="sun", `전투가 필드 날씨를 받는다 (비→${carry.rain}, 눈→${carry.snow}, 쨍쨍→${carry.sun})`);
  ok(!carry.fog && !carry.clear, `안개·맑음은 전투 날씨 없음 (${carry.fog}/${carry.clear})`);

  /* ── 4. pickWild 날씨 편향(통계) ── */
  const bias=await p.evaluate(()=>{ const S=window.SG,F=S.flow; const G=S.G(); G.indoor=null; G.pos={x:8,y:22};
    const frac=(w,types)=>{ F.setOwWeather(w); let hit=0,N=800; for(let i=0;i<N;i++){ const sp=F.pickWild(20,0); if(sp&&(types.includes(sp.type)||types.includes(sp.type2)))hit++; } return hit/N; };
    const rain=frac("rain",["water","ice"]); const clear=frac("clear",["water","ice"]);
    F.setOwWeather(null); return { rain, clear }; });
  ok(bias.rain>bias.clear+0.12, `비 올 때 물/얼음 조우 증가 (비 ${(bias.rain*100).toFixed(0)}% vs 맑음 ${(bias.clear*100).toFixed(0)}%)`);

  /* ── 5. 날씨 연출(drawWeatherFx)이 에러 없이 그린다 ── */
  const render=await p.evaluate(()=>{ const F=window.SG.flow; let err=null;
    try{ const c=document.createElement("canvas"); c.width=430; c.height=600; const ctx=c.getContext("2d");
      for(const w of ["rain","snow","fog","sun","sand"])F.drawWeatherFx(ctx,430,600,32,w); }catch(e){ err=e.message; }
    return err; });
  ok(render===null, `날씨 연출 렌더 에러 0 (${render||"없음"})`);

  ok(errs.length===0, "런타임 에러 0"+(errs.length?": "+errs.slice(0,3).join(" / "):""));
  console.log(process.exitCode?"\n❌ 실패":"\n🎉 오버월드 날씨 통과");
  await b.close(); process.exit(process.exitCode||0);
})();
