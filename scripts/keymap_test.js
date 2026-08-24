// H5-D 회귀 — 키 리매핑(키보드 재설정).
// ⚠️ 핵심: (1) 기본값은 화살표+WASD 이중 바인딩과 기존 확인/취소 키를 그대로 보존(구 조작 불변),
//   (2) 재설정은 충돌 없이 그 키를 다른 액션에서 떼고, (3) 캡처 흐름이 실제로 동작하며,
//   (4) 세이브 왕복에 영속되고, (5) 실제 핸들러가 keyAction을 타야 한다(대사 진행으로 확인).
const { chromium } = require("playwright"); const path=require("path");
(async()=>{ const b=await chromium.launch();
  const p=await b.newPage({viewport:{width:900,height:760}});
  const errs=[]; p.on("pageerror",e=>errs.push(e.message));
  await p.goto("file://"+path.resolve(process.argv[2])); await p.waitForTimeout(800);
  const ok=(c,m)=>{ console.log((c?"  ✅ ":"  ❌ ")+m); if(!c)process.exitCode=1; };

  // ── 기본값 보존 ──
  const def=await p.evaluate(()=>{ const F=window.SG.flow; window.SG.CONFIG.keymap=null;
    return { up1:F.keyAction("ArrowUp"), up2:F.keyAction("w"), dn:F.keyAction("s"), lf:F.keyAction("a"),
      rt:F.keyAction("ArrowRight"), conf1:F.keyAction("Enter"), conf2:F.keyAction(" "), conf3:F.keyAction("z"),
      can1:F.keyAction("x"), can2:F.keyAction("Escape"), can3:F.keyAction("Backspace"), run:F.keyAction("Shift"),
      none:F.keyAction("q"), order:F.KEY_ACTION_ORDER.length }; });
  ok(def.up1==="up"&&def.up2==="up"&&def.dn==="down"&&def.lf==="left"&&def.rt==="right", "이동: 화살표+WASD 이중 바인딩 유지");
  ok(def.conf1==="confirm"&&def.conf2==="confirm"&&def.conf3==="confirm", "확인: Enter/Space/Z");
  ok(def.can1==="cancel"&&def.can2==="cancel"&&def.can3==="cancel"&&def.run==="run", "취소: X/Esc/⌫ · 달리기: Shift");
  ok(def.none===null && def.order===7, "미지정 키는 null · 7개 액션");

  // ── 재설정 + 충돌 제거 ──
  const rb=await p.evaluate(()=>{ const F=window.SG.flow; window.SG.CONFIG.keymap=null;
    F.bindKey("up","i");                       // 이동 위 → I(교체)
    const upI=F.keyAction("i")==="up";
    F.bindKey("confirm","w");                   // 확인 → W(원래 up의 보조키였음) → 충돌 제거돼야
    const confW=F.keyAction("w")==="confirm";
    const upReplaced=F.keyAction("ArrowUp")===null;      // 위로를 재설정하면 그 액션은 고른 키로 '교체'된다
    const downKeepsDual=F.keyAction("ArrowDown")==="down" && F.keyAction("s")==="down";  // 손대지 않은 액션은 이중 기본값 유지
    const km=F.effKeymap();
    const noDup=!km.up.includes("w");           // up에서 w가 떨어졌다
    return { upI, confW, upReplaced, downKeepsDual, noDup }; });
  ok(rb.upI && rb.upReplaced, "재설정: 위로=I로 교체(그 액션은 고른 한 키로 대체)");
  ok(rb.confW && rb.noDup, "재설정 충돌 제거: W를 확인에 주면 이동 위에서 뗀다");
  ok(rb.downKeepsDual, "손대지 않은 액션(아래로)은 화살표+WASD 이중 기본값을 유지");

  // ── 기본값 복원 ──
  const rs=await p.evaluate(()=>{ const F=window.SG.flow; F.resetKeymap();
    return { w:F.keyAction("w"), custom:window.SG.CONFIG.keymap }; });
  ok(rs.w==="up" && rs.custom===null, "기본값으로 되돌리면 W=위로 복원 · keymap=null");

  // ── 캡처 흐름(설정 UI에서 재설정 버튼 → 다음 키 입력) ──
  const cap=await p.evaluate(async()=>{ const F=window.SG.flow; F.resetKeymap(); F.renderKeymap();
    const btns=[...document.querySelectorAll("#keymapBox button")];
    btns[0].click();   // 첫 행 = '위로' 재설정 → 캡처 모드
    const capturing=document.querySelector("#keymapBox div div:nth-child(2)")?document.querySelector("#keymapBox").textContent.includes("키를 누르세요"):false;
    document.dispatchEvent(new KeyboardEvent("keydown",{key:"j",bubbles:true}));
    await new Promise(r=>setTimeout(r,20));
    return { capturing, bound:F.keyAction("j")==="up" }; });
  ok(cap.capturing, "재설정 버튼을 누르면 '키를 누르세요' 캡처 모드로 들어간다");
  ok(cap.bound, "캡처 중 누른 키(J)가 위로에 바인딩된다");

  // ── 세이브 왕복 ──
  const round=await p.evaluate(()=>{ const S=window.SG,F=S.flow; S.setG(S.freshState()); S.G().party=[S.makeMon("foxfire",5)];
    F.resetKeymap(); F.bindKey("cancel","q");
    const ser=F.serialize(); F.resetKeymap();               // 메모리 초기화
    const clearedQ=F.keyAction("q")===null; F.deserialize(ser);
    return { hasKm:!!(ser.cfg&&ser.cfg.km&&ser.cfg.km.cancel), clearedQ, restored:F.keyAction("q")==="cancel" }; });
  ok(round.hasKm && round.clearedQ, "직렬화 cfg.km에 커스텀 맵이 담기고 초기화가 검증된다");
  ok(round.restored, "⭐세이브 왕복 후 키 리매핑이 복원된다");

  // ── 실제 핸들러가 keyAction을 탄다(대사 진행) ──
  const func=await p.evaluate(async()=>{ const S=window.SG,F=S.flow; S.setG(S.freshState());
    S.CONFIG.reduceMotion=true; F.resetKeymap(); F.bindKey("confirm","k");
    document.getElementById("map").classList.add("active");
    F.showDialog([{name:"",text:"하나"},{name:"",text:"둘"}]);
    const before=F.dialogActive();
    document.dispatchEvent(new KeyboardEvent("keydown",{key:"k",bubbles:true}));  // 확인=K → 다음 장
    await new Promise(r=>setTimeout(r,20));
    document.dispatchEvent(new KeyboardEvent("keydown",{key:"k",bubbles:true}));  // → 닫힘
    await new Promise(r=>setTimeout(r,20));
    document.getElementById("map").classList.remove("active");
    return { before, closed:!F.dialogActive() }; });
  ok(func.before && func.closed, "재설정한 확인 키(K)로 실제 대사가 진행·종료된다(핸들러가 keyAction 경유)");

  ok(errs.length===0, "런타임 에러 0"+(errs.length?": "+errs.slice(0,2).join(" / "):""));
  console.log(process.exitCode?"\n❌ 실패":"\n🎉 키 리매핑 통과");
  await b.close(); process.exit(process.exitCode||0);
})();
