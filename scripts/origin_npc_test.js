// 출신지 인물 감사 — **출신지마다 다른 사람이, 다른 말을 하는가.**
//
// 왜 있나
//   출신지 4곳(연구소·야영지·농가·빈터)을 만들 때 지도와 도입 대사는 넣었지만 **안에 있는 사람(N 타일)은
//   비워뒀다.** 폴백이 걸려 네 곳 모두 "집주인"이 같은 말을 했다 — 화면을 안 보면 조용히 지나가는 종류다.
//   ⚠️ 화자 이름은 `INTERIOR_NPC_MSG`의 "이름: 본문"에서 잘라 쓴다(단일 출처).
//      그 이름과 도입에서 배웅한 화자(`ORIGIN_STORY[i].send`)가 어긋나면
//      "배웅한 사람과 집에 있는 사람이 다른" 상태가 되는데, 각각 보면 둘 다 멀쩡해 보인다
//      → **둘을 대조**한다. 이게 이 테스트의 핵심이다.
//
// ⚠️ 실내 NPC는 부딪혀 말을 건다. 다만 `Field`가 전역이 아니라 방향을 못 세워서,
//    좌표를 사람 바로 아래에 두고 게임의 `interact()`(A버튼)를 그대로 부른다.
const { chromium } = require("playwright"); const path=require("path");

(async()=>{
  const b=await chromium.launch();
  const p=await b.newPage({viewport:{width:430,height:760}});
  const errs=[]; p.on("pageerror",e=>errs.push(e.message));
  let fail=0; const ok=(c,m)=>{ console.log((c?"  ✅ ":"  ❌ ")+m); if(!c)fail=1; };
  process.on("unhandledRejection",async e=>{ console.log("❌ "+e); await b.close(); process.exit(1); });
  await p.goto("file://"+path.resolve(process.argv[2])); await p.waitForTimeout(900);

  console.log("\n[1] 출신지마다 다른 사람이 다른 말을 한다");
  const got=await p.evaluate(async()=>{
    const S=window.SG,F=S.flow; S.CONFIG.reduceMotion=true;
    const out=[];
    for(let i=0;i<(S.CHAR_HOME||[]).length;i++){
      const id=S.CHAR_HOME[i], m=F.INTERIORS[id]; if(!m){ out.push({id,err:"인테리어 없음"}); continue; }
      // 지도에서 N 좌표를 직접 찾는다 — 지도를 고쳐도 테스트가 안 깨진다
      let nx=-1, ny=-1;
      m.str.forEach((row,y)=>{ const x=row.indexOf("N"); if(x>=0&&nx<0){ nx=x; ny=y; } });
      S.setG(S.freshState()); const G=S.G(); G.styleIdx=i; F.enterMap(true); F.enterInterior(m);
      await new Promise(r=>setTimeout(r,320));
      G.pos={x:nx,y:ny+1};                       // 사람 바로 아래
      F.interact();
      const box=document.getElementById("dialogBox");
      const shown=box&&box.classList.contains("show");
      out.push({ id, npc:nx+","+ny, indoor:G.indoor, shown:!!shown,
                 name:shown?document.getElementById("dlgName").textContent:null,
                 text:shown?document.getElementById("dlgText").textContent:null,
                 send:(S.ORIGIN_STORY&&S.ORIGIN_STORY[i]&&S.ORIGIN_STORY[i].send||[]).map(d=>d.name)[0]||null });
      if(shown)F.advanceDialog&&F.advanceDialog();
      await new Promise(r=>setTimeout(r,120));
    }
    return out; });

  got.forEach(g=>{
    console.log(`\n  · ${g.id} (사람 ${g.npc})`);
    ok(g.shown, `  말을 걸면 대사가 뜬다`);
    ok(!!g.text && g.text.length>8, `  대사 — "${(g.text||"").slice(0,40)}…"`);
    /* 📌 핵심 단정: 집에 있는 사람 = 도입에서 배웅한 사람. 각각 보면 둘 다 멀쩡해 보인다. */
    ok(!!g.name && g.name===g.send, `  화자가 배웅한 사람과 같다 — 집 "${g.name}" · 도입 "${g.send}"`);
  });

  const names=got.map(g=>g.name), texts=got.map(g=>g.text);
  ok(new Set(names).size===names.length, `네 화자가 서로 다르다 (${names.join(" / ")})`);
  ok(new Set(texts).size===texts.length, `네 대사가 서로 다르다 (${new Set(texts).size}/${texts.length})`);
  ok(!names.includes("집주인"), `폴백("집주인")으로 새는 곳이 없다`);

  ok(errs.length===0, `런타임 에러 0 (${errs.length})${errs.length?": "+errs[0].slice(0,70):""}`);
  await b.close();
  console.log(fail?"\n❌ origin_npc_test 실패":"\n🎉 출신지 인물 통과");
  process.exit(fail);
})();
