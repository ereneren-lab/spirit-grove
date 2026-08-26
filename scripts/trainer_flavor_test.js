// 회귀 — 잡트레이너(T1~T24) 대사가 지역·성격을 반영해 다채로운지.
// ⚠️ 유저 제보: "승리 대사가 '역시 강하네' 같은 일반적인 한 줄이 많다." → 지역/타입/성격별로 다듬음.
//   ① intro·outro 모두 존재 ② outro 전부 서로 다름(일반 문구 중복 금지) ③ 예전 밋밋한 문구가 사라졌는지
//   ④ 이름 접두사 규약 유지(showDialog가 stripNamePrefix로 헤더에 이름을 뽑는다).
const { chromium } = require("playwright"); const path=require("path");
(async()=>{ const b=await chromium.launch();
  const p=await b.newPage(); const errs=[]; p.on("pageerror",e=>errs.push(e.message));
  await p.goto("file://"+path.resolve(process.argv[2])); await p.waitForTimeout(600);
  const ok=(c,m)=>{ console.log((c?"  ✅ ":"  ❌ ")+m); if(!c)process.exitCode=1; };

  const r=await p.evaluate(()=>{
    const T=window.SG.TRAINERS;
    const keys=Object.keys(T).filter(k=>/^T\d+$/.test(k));
    const intros=keys.map(k=>T[k].intro||"");
    const outros=keys.map(k=>T[k].outro||"");
    return { n:keys.length,
      allIntro:intros.every(s=>s.length>0), allOutro:outros.every(s=>s.length>0),
      dupOutro:outros.length-new Set(outros).size,
      dupIntro:intros.length-new Set(intros).size,
      // 예전 밋밋 문구가 남아있지 않은지
      bland:outros.filter(s=>/^우와, 강하다… 너 진짜 잘한다!$|역시 강하네\.$|역시 넌 대단해…$|우와, 강하다!$/.test(s)).length,
      // 지역 어휘가 실제로 스며들었는지(마을·초원·숲·호수·고원·제단 키워드 등장 수)
      regionWords:(intros.join(" ")+outros.join(" ")).match(/마을|초원|숲|호수|고원|제단|눈보라|우듬지|물결|바위|칼바위|수정/g)||[],
      short:outros.filter(s=>s.replace(/^[^:]+:\s*/,"").length<6).length };
  });

  ok(r.n>=24, `T1~T24 트레이너 ${r.n}종 확인`);
  ok(r.allIntro && r.allOutro, "모든 트레이너가 intro·outro를 갖는다");
  ok(r.dupOutro===0, `승리 대사(outro)가 전부 서로 다르다 (중복 ${r.dupOutro})`);
  ok(r.dupIntro===0, `도전 대사(intro)가 전부 서로 다르다 (중복 ${r.dupIntro})`);
  ok(r.bland===0, `예전 밋밋한 일반 문구가 사라졌다 (잔존 ${r.bland})`);
  ok(r.regionWords.length>=12, `지역 어휘가 대사에 스며들었다 (${r.regionWords.length}회)`);
  ok(r.short===0, `너무 짧은 승리 대사가 없다 (잔존 ${r.short})`);
  ok(errs.length===0, "런타임 에러 0"+(errs.length?": "+errs.slice(0,2).join(" / "):""));
  console.log(process.exitCode?"\n❌ 실패":"\n🎉 트레이너 대사 다채로움 통과");
  await b.close(); process.exit(process.exitCode||0);
})();
