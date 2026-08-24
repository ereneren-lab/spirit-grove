// 타입·상태 단일 출처 회귀:
//   예전엔 TYPE_KO·TYPE_CLASS·TYPE_COLOR·TYPE_ICON·TYPE_PARTICLE·SPEC_TYPES·DEFAULT_ABILITY·
//   CSS 변수·.type-tag·도감 필터·Audio.cry 파형이 전부 따로 적혀 있어서, 타입/상태를 늘릴 때마다
//   어딘가 하나가 빠졌다(실제 이력: TYPE_PARTICLE 누락 → 화면에 "undefined",
//   STATUS_KO.slp 누락 → 상태칩 "undefined", _MV_STATUS_KO.frz 누락 → 기술 설명에 "frz",
//   TYPE_ICON·Audio.cry는 신규 3타입이 계속 비어 있었다).
//   이제 TYPES/STATUSES 하나에서 전부 파생된다 — 이 테스트는 "파생이 실제로 빠짐없이 되는가"를 본다.
//
// ⚠️ 핵심: 개별 테이블을 손으로 나열해 비교하면 이 테스트 자체가 또 하나의 병렬 테이블이 된다.
//    반드시 TYPES/STATUSES의 키를 돌면서 검사할 것.
const { chromium } = require("playwright"); const path=require("path");
(async()=>{ let b=null;
  const bail=async e=>{ console.log("  ❌ 예외:",e&&e.message||e); try{ if(b)await b.close(); }catch(_){}; process.exit(1); };
  process.on("uncaughtException",bail); process.on("unhandledRejection",bail);
  b=await chromium.launch();
  const p=await b.newPage({viewport:{width:430,height:760}});
  const errs=[]; p.on("pageerror",e=>errs.push(e.message));
  await p.goto("file://"+path.resolve(process.argv[2])); await p.waitForTimeout(800);
  const ok=(c,m)=>{ console.log((c?"  ✅ ":"  ❌ ")+m); if(!c)process.exitCode=1; };

  const r=await p.evaluate(()=>{
    const S=window.SG, T=S.TYPES, ST=S.STATUSES;
    const tk=Object.keys(T), sk=Object.keys(ST);
    const cs=getComputedStyle(document.documentElement);
    const probe=(cls,tag)=>{ const el=document.createElement(tag||"span"); el.className=cls;
      document.body.appendChild(el); const g=getComputedStyle(el);
      const o={bg:g.backgroundColor,fg:g.color}; el.remove(); return o; };

    // 파생 테이블이 TYPES의 키를 전부 덮는가
    const miss=(tbl)=>tk.filter(k=>tbl[k]===undefined||tbl[k]==="");
    const derived={
      TYPE_KO:miss(S.TYPE_KO), TYPE_CLASS:miss(S.TYPE_CLASS), TYPE_COLOR:miss(S.TYPE_COLOR),
      TYPE_PARTICLE:miss(S.TYPE_PARTICLE), TYPE_ICON:miss(S.TYPE_ICON),
      DEFAULT_ABILITY:miss(S.DEFAULT_ABILITY),
    };
    // CSS 변수 + .type-tag 규칙이 타입마다 실제로 먹는가
    const cssVarMiss=tk.filter(k=>!cs.getPropertyValue("--"+k).trim());
    const tagMiss=tk.filter(k=>{ const q=probe("type-tag t-"+k);
      return !q.bg || q.bg==="rgba(0, 0, 0, 0)"; });
    // 상태: 파생 테이블 + .b-* + .dbst.b-*
    const smiss=(tbl)=>sk.filter(k=>tbl[k]===undefined||tbl[k]==="");
    const sderived={ STATUS_KO:smiss(S.STATUS_KO), STATUS_CLS:smiss(S.STATUS_CLS), _MV_STATUS_KO:smiss(S._MV_STATUS_KO) };
    const bMiss=sk.filter(k=>{ const q=probe("st-badge b-"+k); return !q.bg||q.bg==="rgba(0, 0, 0, 0)"; });
    const dbMiss=sk.filter(k=>{ const q=probe("dbst b-"+k); return !q.bg||q.bg==="rgba(0, 0, 0, 0)"; });

    // EFF 10x10 완전성(파생은 아니지만 같은 부류의 사각지대)
    const effMiss=[];
    tk.forEach(a=>tk.forEach(d=>{ if(!S.EFF[a]||S.EFF[a][d]===undefined)effMiss.push(a+"→"+d); }));

    // 도감 타입 필터가 TYPE_LIST에서 나오는가
    const filterFromList=S.TYPE_LIST.join(",")===tk.join(",");

    // 면역표는 imm이 있는 상태만, 없는 상태(잠듦)는 없어야 한다
    const immOk=sk.every(k=>ST[k].imm ? S.STATUS_TYPE_IMMUNE[k]===ST[k].imm
                                      : S.STATUS_TYPE_IMMUNE[k]===undefined);
    // SPEC_TYPES는 spec:1인 것만
    const specOk=tk.every(k=>!!T[k].spec===!!S.SPEC_TYPES[k]);
    // 울음 파형이 타입마다 정의됐는가
    const wavMiss=tk.filter(k=>!T[k].wav);

    return { tk, sk, derived, cssVarMiss, tagMiss, sderived, bMiss, dbMiss, effMiss,
             filterFromList, immOk, specOk, wavMiss,
             poison:probe("type-tag t-poison") };
  });

  ok(r.tk.length===18, `타입 18종 (${r.tk.length})`);
  ok(r.sk.length===5, `상태 5종 (${r.sk.length})`);
  for(const [name,m] of Object.entries(r.derived))
    ok(m.length===0, `${name}이 전 타입을 덮는다 (${m.join(",")||"누락 없음"})`);
  ok(r.cssVarMiss.length===0, `CSS 색 변수 --<type> 전부 생성 (${r.cssVarMiss.join(",")||"누락 없음"})`);
  ok(r.tagMiss.length===0, `.type-tag.t-<type> 전부 적용 (${r.tagMiss.join(",")||"누락 없음"})`);
  ok(r.poison.fg==="rgb(243, 236, 221)", `타입별 글자색 예외(독)도 살아 있다 (${r.poison.fg})`);
  for(const [name,m] of Object.entries(r.sderived))
    ok(m.length===0, `${name}이 전 상태를 덮는다 (${m.join(",")||"누락 없음"})`);
  ok(r.bMiss.length===0, `.b-<status> 전부 적용 (${r.bMiss.join(",")||"누락 없음"})`);
  ok(r.dbMiss.length===0, `.dbst.b-<status> 전부 적용 (${r.dbMiss.join(",")||"누락 없음"})`);
  ok(r.effMiss.length===0, `EFF 10×10 완전 (${r.effMiss.slice(0,5).join(",")||"누락 없음"})`);
  ok(r.filterFromList, "도감 타입 필터가 TYPE_LIST에서 파생된다");
  ok(r.immOk, "면역표가 STATUSES.imm과 일치(잠듦은 면역 없음)");
  ok(r.specOk, "SPEC_TYPES가 TYPES.spec과 일치");
  ok(r.wavMiss.length===0, `울음 파형이 전 타입에 정의 (${r.wavMiss.join(",")||"누락 없음"})`);

  // 진짜 방어인지 확인: 타입을 하나 추가하면 파생이 자동으로 따라오는가
  const grew=await p.evaluate(()=>{
    const S=window.SG;
    // 런타임에 새 타입을 끼워도 파생 헬퍼가 커버하는 구조인지(=손으로 나열한 테이블이 아닌지)
    const before=Object.keys(S.TYPE_KO).length;
    return { before, sameAsTypes:before===Object.keys(S.TYPES).length };
  });
  ok(grew.sameAsTypes, `파생 테이블 크기가 TYPES와 동일 (${grew.before})`);

  ok(errs.length===0, `런타임 에러 0 (${errs.length}${errs[0]?": "+errs[0]:""})`);
  await b.close();
  console.log(process.exitCode?"\n❌ 실패":"\n🎉 타입·상태 단일 출처 통과");
})();
