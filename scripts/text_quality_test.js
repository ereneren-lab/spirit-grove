// 한국어 표기 품질 회귀 (전체 감사 F-03 · F-06 · F-14 · F-17).
//
// 이 게임은 전부 한국어인데 텍스트 처리가 **영어 기본값** 위에 얹혀 있었다:
//   · 어절 중간 줄바꿈 — lang="ko"의 브라우저 기본은 음절 단위라 "…돌아 / 간다", "…눌 / 러"가 났다.
//     하필 스타터 선택·오프닝·첫 코치 = 새 플레이어가 가장 먼저 보는 세 화면에서 실측됐다.
//   · 전투 메시지의 조사가 이름에서 떨어졌다 — .msg가 flex라 <b>이름</b>이 아이템이 되고
//     gap:4px이 "찌리볼 은(는) 중독되었다!"를 만들었다.
//   · 괄호형 조사 145건(은(는)/이(가)/을(를)/와(과))이 그대로 화면에 나갔다.
//
// ⚠️ **조사는 145곳을 각각 고치지 않는다** — 출력 길목(setMsg/showDialog/toast/flashHint/스토리)에서
//    한 번 고른다. 이 테스트는 그 길목이 실제로 배선돼 있는지를 본다(함수만 있고 안 불리면 의미가 없다).
// ⚠️ .msg의 gap을 0으로 두면 조사는 붙지만 **띄어쓰기가 통째로 사라진다**(flex가 공백 텍스트 노드를
//    렌더하지 않는다) — "야생설을삐미정령이 나타났다!"를 실제로 겪었다. 둘 다 여기서 단정한다.
const { chromium } = require("playwright"); const path=require("path");

(async()=>{
  const b=await chromium.launch();
  const p=await b.newPage({viewport:{width:430,height:760}});
  const errs=[]; p.on("pageerror",e=>errs.push(e.message));
  let fail=0; const ok=(c,m)=>{ console.log((c?"  ✅ ":"  ❌ ")+m); if(!c)fail=1; };
  process.on("unhandledRejection",async e=>{ console.log("❌ "+e); await b.close(); process.exit(1); });
  await p.goto("file://"+path.resolve(process.argv[2])); await p.waitForTimeout(900);

  console.log("\n[1] 조사 선택이 받침을 본다");
  const j=await p.evaluate(()=>{ const f=window.SG.flow.fixJosa;
    return { 받침O:f("<b>찌리볼</b>은(는) 쓰러졌다"), 받침X:f("<b>미르</b>은(는) 쓰러졌다"),
             을:f("불티폭발을(를) 배웠다"), 를:f("소용돌이을(를) 배웠다"),
             이:f("파라온이(가) 나타났다"), 가:f("비룡이(가) 나타났다"),
             와과:f("파라온와(과) 교환"), 비한글:f("${name}이(가) 태어났다") }; });
  ok(j.받침O==="<b>찌리볼</b>은 쓰러졌다", `받침 있으면 '은' — ${j.받침O}`);
  ok(j.받침X==="<b>미르</b>는 쓰러졌다", `받침 없으면 '는' (태그를 건너뛴다) — ${j.받침X}`);
  ok(j.을==="불티폭발을 배웠다" && j.를==="소용돌이를 배웠다", `을/를 — ${j.을} · ${j.를}`);
  ok(j.이==="파라온이 나타났다" && j.가==="비룡이 나타났다", `이/가 — ${j.이} · ${j.가}`);
  ok(j.와과==="파라온과 교환", `와/과는 순서가 반대다(받침 있으면 '과') — ${j.와과}`);
  ok(j.비한글.indexOf("이(가)")>=0, `한글이 아니면 손대지 않는다 — ${j.비한글}`);

  console.log("\n[2] 출력 길목이 실제로 그 함수를 지난다");
  const wired=await p.evaluate(async()=>{ const S=window.SG,F=S.flow,G=S.freshState();
    G.party=[S.makeMon("foxfire",20)]; S.setG(G); F.enterMap(true);
    const out={};
    /* ⚠️ 예전엔 `F.flashHint && F.flashHint(...)`로 썼는데 노출이 안 돼 있어 **호출이 통째로 건너뛰어졌고**
       기본 문구엔 조사가 없어 단정이 공허하게 통과했다. 없으면 실패로 잡는다. */
    out.hasFn=typeof F.flashHint==="function";
    if(out.hasFn)F.flashHint("테스트 정령은(는) 지나간다");
    out.hint=document.getElementById("mapHint").textContent;
    F.startEncounter(1); await new Promise(r=>setTimeout(r,1500));
    out.msg=document.getElementById("battleMsg").textContent;
    return out; });
  ok(wired.hasFn, "flashHint가 테스트에 노출돼 있다(없으면 아래 단정이 공허해진다)");
  ok(wired.hint.indexOf("테스트 정령은 ")===0, `flashHint가 길목을 지난다 — "${wired.hint}"`);
  ok(/야생 .+ 정령이 나타났다/.test(wired.msg), `전투 메시지의 띄어쓰기가 살아 있다 — "${wired.msg}"`);

  console.log("\n[3] 조사와 이름 사이가 벌어지지 않는다 (.msg가 flex가 아니다)");
  const gap=await p.evaluate(()=>{ const el=document.getElementById("battleMsg");
    el.innerHTML=window.SG.flow.fixJosa("야생 <b>찌리볼</b>은(는) 중독되었다!");
    const cs=getComputedStyle(el);
    return {text:el.textContent, display:cs.display}; });
  ok(gap.text==="야생 찌리볼은 중독되었다!", `조사는 붙고 띄어쓰기는 살아 있다 — "${gap.text}"`);
  ok(gap.display!=="flex", `.msg가 flex가 아니다(공백 텍스트 노드가 사라지지 않는다) — ${gap.display}`);

  console.log("\n[4] 한국어 줄바꿈이 어절 단위다");
  const wb=await p.evaluate(()=>{ const cs=getComputedStyle(document.querySelector(".stage"));
    return {wordBreak:cs.wordBreak, overflowWrap:cs.overflowWrap}; });
  ok(wb.wordBreak==="keep-all", `word-break:keep-all — ${wb.wordBreak}`);
  ok(/break-word|anywhere/.test(wb.overflowWrap), `긴 영문·URL은 overflow-wrap이 받는다 — ${wb.overflowWrap}`);

  console.log("\n[5] flashHint는 textContent라 태그를 넣으면 글자로 찍힌다");
  const tags=await p.evaluate(()=>{ const src=document.documentElement.innerHTML;
    return (src.match(/flashHint\(`[^`]*<b>/g)||[]).length + (src.match(/flashHint\("[^"]*<b>/g)||[]).length; });
  ok(tags===0, `flashHint 호출에 <b>가 없다 (${tags}곳)`);

  ok(errs.length===0, `런타임 에러 0 (${errs.length})${errs.length?": "+errs.slice(0,2).join(" | "):""}`);
  await b.close();
  console.log(fail?"\n❌ text_quality_test 실패":"\n✅ text_quality_test 통과");
  process.exit(fail);
})();
