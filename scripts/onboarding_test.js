// 초반 온보딩 감사 — **네 출신지 전부에서 "나오자마자 배틀"이 아닌가.**
//
// 왜 있나
//   유저: "집에서 나오자마자 너무 본격 실전이다. 포켓몬처럼 차근차근 갔으면."
//   ⚠️ 처음엔 리오 앞의 풀숲만 물렸는데 **출신지가 넷이라 셋은 그대로였다** — 실측으로
//      미나 2칸 · 토리 2칸 · 엘 **1칸** 앞이 풀숲이었고, 게다가 셋은 초원(야생 하한 Lv7)이라
//      마을(Lv5)에서 시작하는 리오보다 **센 야생**을 만났다. 스타터는 Lv5다.
//   한 곳만 고치고 "고쳤다"고 하기 쉬운 자리라 **넷 전부를 잰다.**
//
// 재는 것
//   [1] 출구에서 풀숲까지 최소 거리 — 넷 다 완충이 있는가
//   [2] 출구 옆에 안내인이 있고, **출신지마다 다른 사람**인가
//   [3] 안내인이 실제로 말을 하는가(대사가 비어 있지 않은가)
const { chromium } = require("playwright"); const path=require("path");

const MIN_BUFFER = 3;      // 출구에서 첫 풀숲까지 최소 이 칸수는 떨어져 있어야 한다

(async()=>{
  const b=await chromium.launch();
  const p=await b.newPage({viewport:{width:430,height:760}});
  const errs=[]; p.on("pageerror",e=>errs.push(e.message));
  let fail=0; const ok=(c,m)=>{ console.log((c?"  ✅ ":"  ❌ ")+m); if(!c)fail=1; };
  process.on("unhandledRejection",async e=>{ console.log("❌ "+e); await b.close(); process.exit(1); });
  await p.goto("file://"+path.resolve(process.argv[2])); await p.waitForTimeout(900);

  const r=await p.evaluate(({MIN})=>{
    const S=window.SG,F=S.flow;
    S.setG(S.freshState()); F.enterMap(true);
    const out=[];
    (F.HOME_POS||S.HOME_POS||[]).forEach((hp,i)=>{
      // 출구에서 가장 가까운 풀숲(T)까지 맨해튼 거리
      let best=99;
      for(let y=0;y<50;y++)for(let x=0;x<25;x++){
        if((F.tileAt(x,y)||"")==="T"){ const d=Math.abs(x-hp.x)+Math.abs(y-hp.y); if(d<best)best=d; }
      }
      // 출구에서 2칸 안에 있는 NPC
      const near=(F.NPCS||[]).filter(n=>n.x!=null && Math.abs(n.x-hp.x)+Math.abs(n.y-hp.y)<=2);
      out.push({ i, home:(S.CHAR_HOME||[])[i], pos:hp.x+","+hp.y, grass:best,
                 guides:near.map(n=>({id:n.id,name:n.name,lines:(n.lines||[]).length,
                                      first:(n.lines||[])[0]||"", battle:!!n.battleKey})) });
    });
    return out;
  }, {MIN:MIN_BUFFER});

  /* ⚠️ **0건이면 실패다.** 처음 짤 때 HOME_POS를 SG에서 찾았는데 실제로는 flow에 있어서
     빈 배열을 돌며 전부 초록이 떴다 — 공허한 통과. 표본 수부터 단정한다. */
  console.log("\n[0] 표본 확인");
  ok(r.length===4, `출신지 ${r.length}곳을 실제로 쟀다 (기대 4)`);
  console.log("\n[1] 네 출신지 전부 첫 풀숲까지 완충이 있다");
  r.forEach(h=>ok(h.grass>=MIN_BUFFER,
    `${h.home} (${h.pos}) — 첫 풀숲까지 ${h.grass}칸 (기준 ${MIN_BUFFER}칸 이상)`));

  console.log("\n[2] 출구 옆에 안내인이 있고, 출신지마다 다른 사람이다");
  r.forEach(h=>{
    const g=h.guides.filter(x=>!x.battle);       // 전투 트레이너는 안내인이 아니다
    ok(g.length>0, `${h.home} — 안내인이 있다 (${g.map(x=>x.name).join(",")||"없음"})`);
    ok(g.every(x=>x.lines>0), `${h.home} — 안내인이 할 말이 있다 (대사 ${g.map(x=>x.lines).join("/")}줄)`);
  });
  const names=r.flatMap(h=>h.guides.filter(x=>!x.battle).map(x=>x.name));
  ok(new Set(names).size===names.length, `안내인 ${names.length}명이 서로 다른 사람이다 — ${names.join(" / ")}`);
  const firsts=r.flatMap(h=>h.guides.filter(x=>!x.battle).map(x=>x.first));
  ok(new Set(firsts).size===firsts.length, `첫 대사가 서로 다르다 (${new Set(firsts).size}/${firsts.length})`);

  console.log("\n[3] 안내인이 전투를 걸지 않는다 (첫 만남이 배틀이면 안 된다)");
  r.forEach(h=>ok(!h.guides.some(x=>x.battle), `${h.home} — 출구 2칸 안에 전투 트레이너 없음`));

  ok(errs.length===0, `런타임 에러 0 (${errs.length})${errs.length?": "+errs[0].slice(0,70):""}`);
  await b.close();
  console.log(fail?"\n❌ onboarding_test 실패":"\n🎉 초반 온보딩 통과");
  process.exit(fail);
})();
