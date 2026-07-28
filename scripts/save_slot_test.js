// 리포트(저장 슬롯) 회귀 (유저: "포켓몬처럼 게임 저장/여러 플레이 진행할 수 있게 리포트 만들어줘").
//
// 예전: 저장 키가 하나뿐이라 플레이를 **하나만** 굴릴 수 있었다(새 게임 = 기존 기록 소멸).
// 지금: 3칸. 새 게임/이어하기 둘 다 리포트 화면을 거치고, 저장은 현재 칸에만 쓰인다.
//
// ⚠️ 이 프로젝트의 저장 원칙: **구세이브를 무효화하지 않는다** → 1번 칸은 기존 키를 그대로 쓴다.
//    (이걸 어기면 이미 플레이 중인 사람의 기록이 사라진다.) 대조군으로 고정한다.
const { chromium } = require("playwright"); const path=require("path");

(async()=>{
  const b=await chromium.launch();
  const p=await b.newPage({viewport:{width:430,height:760}});
  const errs=[]; p.on("pageerror",e=>errs.push(e.message));
  let fail=0; const ok=(c,m)=>{ console.log((c?"  ✅ ":"  ❌ ")+m); if(!c)fail=1; };
  process.on("unhandledRejection",async e=>{ console.log("❌ "+e); await b.close(); process.exit(1); });
  await p.goto("file://"+path.resolve(process.argv[2])); await p.waitForTimeout(900);

  console.log("\n[1] 1번 칸은 기존 키 — 구세이브 보존");
  const keys=await p.evaluate(()=>({ s1:window.SG.flow.slotKey(1), s2:window.SG.flow.slotKey(2), s3:window.SG.flow.slotKey(3) }));
  ok(keys.s1==="spiritGroveSave_v4", `1번 = 기존 키 (${keys.s1})`);
  ok(keys.s2!==keys.s1 && keys.s3!==keys.s1 && keys.s2!==keys.s3, `2·3번은 별도 키 (${keys.s2} / ${keys.s3})`);

  console.log("\n[2] 서로 다른 칸에 서로 다른 플레이가 남는다");
  const mk=async(slot,lv,money)=>p.evaluate(([n,l,m])=>{ const S=window.SG;
      S.flow.setSlot(n); const G=S.freshState();
      G.party=[S.makeMon("foxfire",l)]; G.money=m; G.playSec=n*600; G.badges=n===2?["1"]:[];
      G.pos={x:8,y:44}; S.setG(G); S.flow.saveGame(); return true; },[slot,lv,money]);
  await mk(1,7,111); await mk(2,23,222); await mk(3,41,333);
  const info=await p.evaluate(()=>[1,2,3].map(n=>window.SG.flow.slotInfo(n)));
  ok(info.every(i=>!i.empty), "세 칸 모두 기록이 있다");
  ok(info[0].money===111&&info[1].money===222&&info[2].money===333,
     `칸마다 다른 기록 (소지금 ${info.map(i=>i.money).join(" / ")})`);
  ok(info[0].lv[0]===7&&info[1].lv[0]===23&&info[2].lv[0]===41,
     `레벨도 각각 (${info.map(i=>i.lv[0]).join(" / ")})`);
  ok(info[1].badges===1&&info[0].badges===0, "뱃지 수가 칸별로 따로 집계된다");

  console.log("\n[3] 저장은 **현재 칸에만** 쓰인다(다른 칸을 안 건드린다)");
  await p.evaluate(()=>{ const S=window.SG; S.flow.setSlot(2); const G=S.G(); G.money=99999; S.setG(G); S.flow.saveGame(); });
  const after=await p.evaluate(()=>[1,2,3].map(n=>window.SG.flow.slotInfo(n).money));
  ok(after[1]===99999, `현재 칸(2번)만 갱신됐다 (${after[1]})`);
  ok(after[0]===111&&after[2]===333, `다른 칸은 그대로 (${after[0]} / ${after[2]})`);

  console.log("\n[4] 이어하기 — 고른 칸이 실제로 불러와진다");
  const loaded=await p.evaluate(()=>{ const S=window.SG;
    const okk=S.flow.loadGame(3); return { okk, money:S.G().money, lv:S.G().party[0]&&S.G().party[0].level }; });
  ok(loaded.okk===true, "loadGame(3) 성공");
  ok(loaded.money===333&&loaded.lv===41, `3번 기록이 들어왔다 (소지금 ${loaded.money} · Lv${loaded.lv})`);

  console.log("\n[5] 리포트 화면");
  await p.evaluate(()=>window.SG.flow.openSlots("load"));
  await p.waitForTimeout(300);
  const ui=await p.evaluate(()=>{ const ov=document.getElementById("slotOverlay");
    const rows=[...ov.querySelectorAll(".bag-item")];
    return { open:ov.classList.contains("active"), rows:rows.length,
      txt:rows.map(r=>(r.querySelector(".nm")||{}).textContent||""),
      btns:rows.map(r=>(r.querySelector(".pick")||{}).textContent||"") }; });
  ok(ui.open, "리포트 오버레이가 열린다");
  ok(ui.rows===3, `칸이 3개다 (${ui.rows})`);
  ok(ui.btns.every(t=>/이어하기/.test(t)), `쓰여 있는 칸은 '이어하기' (${ui.btns.join(",")})`);
  // ⚠️ 캐릭터 이름 필드는 CHARS[].nm 이다(name 아님) — 잘못 짚으면 카드에 "undefined"가 뜬다(실제로 겪음)
  ok(ui.txt.every(t=>!/undefined/.test(t)), `카드에 undefined가 없다 ("${ui.txt[0]}")`);

  console.log("\n[6] 빈 칸은 이어하기 불가 · 새 게임은 가능(대조군)");
  await p.evaluate(()=>{ try{ localStorage.removeItem(window.SG.flow.slotKey(3)); }catch(e){} window.SG.flow.renderSlots(); });
  await p.waitForTimeout(200);
  const empt=await p.evaluate(()=>{ const rows=[...document.querySelectorAll("#slotOverlay .bag-item")];
    const last=rows[2]; return { ds:(last.querySelector(".ds")||{}).textContent||"", dis:!!(last.querySelector(".pick")||{}).disabled }; });
  ok(/비어 있음/.test(empt.ds), `빈 칸으로 표시된다 ("${empt.ds}")`);
  ok(empt.dis, "이어하기 모드에선 빈 칸을 못 고른다");
  await p.evaluate(()=>window.SG.flow.openSlots("new"));
  await p.waitForTimeout(250);
  const newm=await p.evaluate(()=>{ const rows=[...document.querySelectorAll("#slotOverlay .bag-item")];
    return { last:(rows[2].querySelector(".pick")||{}).textContent||"", first:(rows[0].querySelector(".pick")||{}).textContent||"" }; });
  ok(/시작/.test(newm.last), `새 게임 모드에선 빈 칸이 '시작' ("${newm.last}")`);
  ok(/덮어쓰기/.test(newm.first), `쓰여 있는 칸은 '덮어쓰기'로 경고 ("${newm.first}")`);

  ok(errs.length===0, `런타임 에러 0 (${errs.length}${errs.length?": "+errs[0]:""})`);
  console.log(fail?"\n❌ 실패":"\n🎉 리포트(저장 슬롯) 통과");
  await b.close(); process.exit(fail);
})();
