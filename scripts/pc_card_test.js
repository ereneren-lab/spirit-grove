// 정령 관리(PC) 카드 표시 회귀 — 목록에서 "위험/상태이상"을 알 수 있어야 한다.
//
// 왜 있나: 스크린샷 검수에서 HP 28%인 정령의 바가 **멀쩡한 초록**이고, 독에 걸린 정령에
//   **상태 표시가 아예 없었다**. 전투 화면엔 있는 정보가 목록에선 통째로 빠져 있었다.
//   (그리고 액션 버튼이 세로로 쌓여 카드가 길어 한 화면에 2마리도 안 들어왔다.)
const { chromium } = require("playwright"); const path=require("path");
(async()=>{ const b=await chromium.launch();
  const p=await b.newPage({viewport:{width:430,height:760}});
  const errs=[]; p.on("pageerror",e=>errs.push(e.message));
  process.on("uncaughtException", async e=>{ console.log("❌ 예외:",e.message); await b.close(); process.exit(1); });
  await p.goto("file://"+path.resolve(process.argv[2])); await p.waitForTimeout(900);
  const ok=(c,m)=>{ console.log((c?"  ✅ ":"  ❌ ")+m); if(!c)process.exitCode=1; };

  const r=await p.evaluate(()=>{ const S=window.SG,F=S.flow; S.setG(S.freshState()); const G=S.G();
    const mk=(id,lv)=>S.makeMon(id,lv);
    const crit=mk("blazelion",34); crit.hp=Math.round(crit.maxHp*0.12);     // 위험(≤20%)
    const warn=mk("krakentide",31); warn.hp=Math.round(warn.maxHp*0.40);    // 주의(≤50%)
    const fine=mk("titanoak",29);                                           // 정상
    const psn =mk("sproutcat",20); psn.status="psn";
    const dead=mk("voltrat",15); dead.hp=0;
    G.party=[crit,warn,fine,psn,dead]; G.active=0;
    F.enterMap(true);
    // ⚠️ 오버레이를 실제로 열지 않으면 rect가 전부 0이라 "카드 높이" 단정이 헛돈다(전투 레이아웃에서 이미 겪었다)
    const ov=document.getElementById("pcOverlay"); if(ov)ov.classList.add("active");
    F.renderPC();
    const cards=[...document.querySelectorAll("#pcBody .mon-card")];
    const bars=cards.map(c=>{ const i=c.querySelector(".mini-hp i"); return i?i.className.trim():"(없음)"; });
    const chips=cards.map(c=>{ const t=c.querySelector(".st .type-tag"); return t?t.textContent.trim():""; });
    // 카드 높이: 버튼이 세로로 쌓이면 200px를 넘었다
    const h=cards.length?Math.round(cards[0].getBoundingClientRect().height):0;
    const visible=cards.filter(c=>c.getBoundingClientRect().height>0).length;
    return {n:cards.length, bars, chips, h, visible};
  });

  ok(r.n===5 && r.visible===5, `카드 5장이 실제로 그려졌다 (${r.visible}/${r.n})`);
  ok(r.bars[0]==="hpcrit", `HP 12% → 위험색 (${r.bars[0]||"클래스 없음"})`);
  ok(r.bars[1]==="hpwarn", `HP 40% → 주의색 (${r.bars[1]||"클래스 없음"})`);
  ok(r.bars[2]==="", `HP 100% → 기본색 (${r.bars[2]||"클래스 없음"})`);
  ok(r.chips[3]==="독", `상태이상이 칩으로 보인다 (${r.chips[3]||"없음"})`);
  ok(r.chips[4]==="기절", `기절도 칩으로 보인다 (${r.chips[4]||"없음"})`);
  ok(r.chips[2]==="", "정상 정령엔 칩이 안 붙는다");
  ok(r.h>0 && r.h<200, `카드가 과하게 길지 않다 (${r.h}px — 버튼이 세로로 쌓이면 200px를 넘는다)`);

  ok(errs.length===0, "런타임 에러 0"+(errs.length?": "+errs.slice(0,3).join(" / "):""));
  console.log(process.exitCode?"\n❌ 실패":"\n🎉 정령 관리 카드 통과");
  await b.close(); process.exit(process.exitCode||0);
})();
