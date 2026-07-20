// 순수 규칙(src/rules/*.js)을 node에서 평가해 돌려준다. 브라우저 없이 밀리초 단위로 돈다.
//
// 왜 이런 모양인가
//   규칙 파일들은 모듈이 아니라 "한 스크립트 스코프에 이어붙여지는 조각"이다(브라우저에서 그렇게 인라인된다).
//   그래서 require/export 보일러플레이트를 넣지 않고, 여기서 build.py와 **같은 순서로 이어붙여**
//   vm 컨텍스트 하나에서 평가한다 → 테스트가 도는 코드와 브라우저가 도는 코드가 문자 그대로 같다.
//   (파일마다 module.exports를 달면 그 자체가 또 하나의 동기화 대상이 된다.)
//
// ⚠️ 순서는 build.py의 repl 순서와 반드시 일치해야 한다: util → tables → battle.
// ⚠️ vm에서 top-level `const`/`function`은 컨텍스트 객체에 붙지 않는다(렉시컬 스코프).
//    그래서 선언 이름을 **소스에서 자동 추출**해 내보낸다 — 손으로 나열하면 그 목록이
//    또 하나의 병렬 테이블이 되어, 이 리팩터가 없애려던 문제를 다시 만든다.
const fs=require("fs"), path=require("path"), vm=require("vm");

const ORDER=["util","tables","battle"];
const dir=path.join(__dirname,"..","src","rules");
const src=ORDER.map(n=>{
  const f=path.join(dir,n+".js");
  if(!fs.existsSync(f)) throw new Error("규칙 파일 없음: "+f);
  return "/* ---- "+n+".js ---- */\n"+fs.readFileSync(f,"utf8");
}).join("\n");

// 최상위 선언만 잡는다: 규칙 파일에서 top-level 선언은 들여쓰기가 없다는 점을 이용.
// (함수 안의 `const [lo,hi]=mr` 같은 건 들여쓰기가 있어 자연히 제외된다.)
const names=new Set();
for(const m of src.matchAll(/^(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=/gm)) names.add(m[1]);
for(const m of src.matchAll(/^function\s+([A-Za-z_$][\w$]*)\s*\(/gm)) names.add(m[1]);
if(!names.size) throw new Error("규칙 소스에서 선언을 하나도 못 찾았다 — 추출 정규식을 확인할 것");

// document/window 없음 = 브라우저 전용 코드가 섞여 들어오면 즉시 터진다(순수성 회귀 감지).
const ctx={ Math, Object, Array, JSON, String, Number, Boolean, Error, console };
ctx.globalThis=ctx;
vm.createContext(ctx);
const footer="\n;globalThis.__rules={"+[...names].join(",")+"};";
vm.runInContext(src+footer, ctx, {filename:"src/rules/*.js"});

module.exports=Object.assign({}, ctx.__rules, {
  __source:src, __order:ORDER, __names:[...names],
});
