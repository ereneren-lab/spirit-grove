// NPC 원형 시트 감사 — **시트가 있으면 쓰고, 없으면 절차적으로 돌아가는가.**
//
// 왜 있나
//   유저: "차라리 프롬프트 짜서 여러 간단한 npc들 만드는 게 낫겠다."
//   NPC 47명에 원형 12종 시트를 붙이는 경로를 넣었는데, 이건 **아트가 도착하기 전에 짜는 코드**다.
//   그래서 "아직 안 깨졌다"를 확인할 방법이 없다 — 시트가 하나도 없으니 새 경로가 아예 안 돈다.
//   → **회귀가 런타임에 시트를 주입해** 그리기 경로를 실제로 태운다(주인공 시트 때와 같은 방식).
//
// 재는 것
//   [1] 원형 매핑이 단일 출처이고, 아는 원형만 쓰는가
//   [2] 아트가 없을 때 **절차적 스프라이트로 폴백**하는가 (지금의 정상 상태)
//   [3] 시트를 주입하면 **실제로 시트에서 잘라 그리는가** (drawImage 9인자 + 올바른 칸)
//   [4] 방향에 따라 행이 바뀌고, 왼쪽은 좌우 반전하는가 (주인공과 같은 규칙을 쓰는지)
//
// ⚠️ 원형 이름을 이 파일에 적지 않는다 — NPC_ARCH에서 가져온다. 테스트가 상수를 들면
//    그것도 병렬 테이블이다(goal_test·gym_test가 실제로 그렇게 빨개진 적이 있다).
const { chromium } = require("playwright"); const path=require("path");

const DOC = "outputs/production/2026-08-11_spirit-grove_npc-sheet-prompts.md";

(async()=>{
  const b=await chromium.launch();
  const p=await b.newPage({viewport:{width:430,height:760}});
  const errs=[]; p.on("pageerror",e=>errs.push(e.message));
  let fail=0; const ok=(c,m)=>{ console.log((c?"  ✅ ":"  ❌ ")+m); if(!c)fail=1; };
  process.on("unhandledRejection",async e=>{ console.log("❌ "+e); await b.close(); process.exit(1); });
  await p.goto("file://"+path.resolve(process.argv[2])); await p.waitForTimeout(900);

  console.log("\n[1] 원형 매핑이 단일 출처다");
  const m=await p.evaluate(()=>{
    const S=window.SG,F=S.flow; S.setG(S.freshState()); F.enterMap(true);
    const A=S.NPC_ARCH||{};
    const ids=(F.NPCS||[]).map(n=>n.id);
    const mapped=Object.keys(A);
    return { archs:[...new Set(Object.values(A))].sort(),
             mappedCount:mapped.length,
             ghost:mapped.filter(id=>!ids.includes(id)),          // 없는 NPC를 가리키는 매핑
             sprHas:(F.NPCS||[]).filter(n=>n.spr&&n.spr.sheet).length,
             npcCount:ids.length };
  });
  ok(m.mappedCount>0, `원형 매핑 ${m.mappedCount}건 (공허한 통과 방지)`);
  ok(m.archs.length>=8, `원형 ${m.archs.length}종 — ${m.archs.join(" ")}`);
  /* 📌 오타로 없는 id를 적으면 그 NPC만 조용히 폴백한다 — 화면을 안 보면 절대 모른다. */
  ok(m.ghost.length===0, `매핑이 실존하는 NPC만 가리킨다 (유령 ${m.ghost.length}건: ${m.ghost.join(",")||"없음"})`);
  ok(m.sprHas===m.mappedCount, `매핑된 ${m.mappedCount}명 전원의 spr에 원형이 붙었다 (실제 ${m.sprHas}명)`);
  console.log(`     · NPC ${m.npcCount}명 중 ${m.sprHas}명이 원형을 갖는다 (나머지는 실내 인물 등, 절차적으로 남는다)`);

  console.log("\n[2] 아트가 없으면 절차적 스프라이트로 폴백한다");
  /* 드로우 콜을 가로채 분류한다(npc_sprite_test와 같은 기법).
     시트 경로는 drawImage(9인자) 하나로 끝나고, 절차적 경로는 _rr/arc가 잔뜩 나온다. */
  const probe=`(spec)=>{
    const F=window.SG.Field; let img9=0, shapes=0;
    const ctx=new Proxy({},{ get:(t,k)=>{
      if(k==="drawImage")return (...a)=>{ if(a.length===9)img9++; };
      if(k==="canvas")return {width:430,height:760};
      if(k==="createRadialGradient"||k==="createLinearGradient")
        return ()=>({addColorStop:()=>{}});
      if(k==="fillStyle"||k==="strokeStyle"||k==="lineWidth"||k==="imageSmoothingEnabled")return "";
      return (...a)=>{ if(k==="fill"||k==="stroke")shapes++; };
    }, set:()=>true });
    F._char(ctx, 100, 100, 32, spec, "down", 1.0, true);
    return {img9, shapes};
  }`;
  /* ⚠️ **아트를 그 자리에서 떼고 잰다.** 예전엔 "빌드에 시트가 하나도 없다"에 기대고 있었는데,
        08-11에 진짜 아트 12장이 실리자 이 블록이 빨개졌다 — 그것도 **간헐적으로**.
        이미지 디코드가 끝나기 전엔 `_sh.complete`가 false라 폴백이 돌아 우연히 통과했다
        (단독 실행에선 통과하고 verify 안에선 실패했다).
        폴백은 아트가 있든 없든 살아 있어야 하는 경로다 → 키를 빼고 재고 되돌린다. */
  const noArt=await p.evaluate(probeSrc=>{
    const A=window.SG.NPC_SHEET_ART;
    const arch=Object.values(window.SG.NPC_ARCH)[0];   // 원형 이름을 이 파일에 적지 않는다
    const keep=A[arch]; delete A[arch];
    try{ return (new Function("return "+probeSrc)())({sheet:arch, outfit:"#888"}); }
    finally{ if(keep!==undefined)A[arch]=keep; }
  }, probe);
  ok(noArt.img9===0, `시트가 없으면 시트를 안 그린다 (drawImage 9인자 ${noArt.img9}회)`);
  ok(noArt.shapes>20, `대신 절차적으로 그린다 (도형 ${noArt.shapes}회)`);

  console.log("\n[3] 시트를 주입하면 실제로 시트에서 잘라 그린다");
  const drew=await p.evaluate(async(probeSrc)=>{
    /* 192×192(3×3 · 칸 64) 더미 시트를 만들어 NPC_SHEET_ART에 꽂는다.
       ⚠️ npcSheet()는 **성공한 Image만 캐시**하므로 나중에 꽂아도 읽힌다(그렇게 설계돼 있다). */
    const cv=document.createElement("canvas"); cv.width=cv.height=192;
    const g=cv.getContext("2d"); g.fillStyle="#f0f"; g.fillRect(0,0,192,192);
    const url=cv.toDataURL("image/png");
    /* ⚠️ `NPC_SHEET_ART`는 스코프 안의 const다 — window에 새로 만들면 게임은 안 본다.
       SG로 내보낸 **같은 객체**에 키를 꽂아야 실제 경로가 읽는다. */
    window.SG.NPC_SHEET_ART.__probe__=url;
    const img=new Image(); img.src=url;
    await new Promise(r=>{ img.complete?r():img.onload=r; });
    // 캐시에 직접 넣어 로드 완료 상태를 보장한다(네트워크 타이밍에 안 흔들리게)
    const F=window.SG.Field;
    const calls=[];
    const ctx=new Proxy({},{ get:(t,k)=>{
      if(k==="drawImage")return (...a)=>{ if(a.length===9)calls.push(a.slice(1,5)); };
      if(k==="canvas")return {width:430,height:760};
      if(k==="createRadialGradient"||k==="createLinearGradient")return ()=>({addColorStop:()=>{}});
      if(k==="scale")return (sx)=>calls.push(["flip",sx]);
      if(k==="fillStyle"||k==="strokeStyle"||k==="lineWidth"||k==="imageSmoothingEnabled")return "";
      return ()=>{};
    }, set:()=>true });
    const run=(dir,moving)=>{ calls.length=0;
      F._char(ctx,100,100,32,{sheet:"__probe__"},dir,moving?0.06:0,moving);
      return calls.slice(); };
    // npcSheet 캐시를 채우기 위해 한 번 호출해 두고, 이미지가 뜰 때까지 기다린다
    window.SG.npcSheet && window.SG.npcSheet("__probe__");
    await new Promise(r=>setTimeout(r,250));
    return { down:run("down",true), up:run("up",true), left:run("left",true),
             right:run("right",true), idle:run("down",false) };
  }, probe);

  const cut=a=>a.filter(x=>x[0]!=="flip");
  const flip=a=>a.some(x=>x[0]==="flip"&&x[1]===-1);
  ok(cut(drew.down).length===1, `시트에서 한 칸만 잘라 그린다 (drawImage ${cut(drew.down).length}회)`);
  const [sx,sy,sw,sh]=cut(drew.down)[0]||[];
  ok(sw===64&&sh===64, `칸 크기가 64×64로 잡힌다 (${sw}×${sh})`);
  ok(sy===0, `아래를 보면 0행을 쓴다 (sy=${sy})`);
  ok(cut(drew.up)[0] && cut(drew.up)[0][1]===64, `위를 보면 1행을 쓴다 (sy=${cut(drew.up)[0]&&cut(drew.up)[0][1]})`);
  ok(cut(drew.right)[0] && cut(drew.right)[0][1]===128, `옆을 보면 2행을 쓴다 (sy=${cut(drew.right)[0]&&cut(drew.right)[0][1]})`);

  console.log("\n[4] 왼쪽은 옆모습을 좌우 반전한다 (주인공과 같은 규칙)");
  ok(cut(drew.left)[0] && cut(drew.left)[0][1]===128, `왼쪽도 2행(옆모습)을 쓴다`);
  ok(flip(drew.left), `왼쪽일 때만 좌우 반전한다 (left=${flip(drew.left)} · right=${flip(drew.right)})`);
  ok(!flip(drew.right), `오른쪽은 반전하지 않는다`);
  /* 📌 정지 프레임은 0열이어야 한다 — 안 그러면 서 있는 NPC가 걷는 자세로 굳는다. */
  ok(cut(drew.idle)[0] && cut(drew.idle)[0][0]===0, `멈춰 있으면 0열(정지)을 쓴다 (sx=${cut(drew.idle)[0]&&cut(drew.idle)[0][0]})`);

  console.log("\n[5] 실제로 배포될 시트가 전부 그려진다 (더미가 아니라 진짜 아트)");
  /* 왜 있나
       [3]은 **더미**를 꽂아 경로만 태운다 — 그림이 깨졌거나 규격이 어긋나도 초록이다.
       실제로 08-11에 아트가 들어오자 [2]가 빨개졌는데 [3][4]는 아무 말도 안 했다.
       → 매니페스트에 실린 것들을 **디코드까지 기다려** 진짜로 그려지는지 본다.
     ⚠️ 첫 그리기는 원래 폴백이다 — `npcSheet()`가 그 자리에서 Image를 만들기 때문에
        아직 `complete`가 false다. 그래서 **미리 부르고 로드를 기다린 뒤** 잰다. */
  const real=await p.evaluate(async probeSrc=>{
    /* ⚠️ [3]이 꽂아둔 더미(`__probe__`)를 빼고 센다 — 안 빼면 "12종"이 "13종"으로 보여
          다음 사람이 원형이 하나 더 있는 줄 안다. */
    const A=window.SG.NPC_SHEET_ART, archs=Object.keys(A).filter(k=>!k.startsWith("__")), run=new Function("return "+probeSrc)();
    const out={archs:archs.length, bad:[], cells:{}};
    for(const a of archs){
      const im=window.SG.npcSheet(a);
      if(!im){ out.bad.push(a+":시트없음"); continue; }
      await new Promise(r=>{ im.complete?r():(im.onload=r, im.onerror=r); });
      if(!im.naturalWidth){ out.bad.push(a+":디코드실패"); continue; }
      if(im.naturalWidth!==im.naturalHeight||im.naturalWidth%3){ out.bad.push(`${a}:${im.naturalWidth}x${im.naturalHeight}`); continue; }
      out.cells[im.naturalWidth/3]=(out.cells[im.naturalWidth/3]||0)+1;
      if(run({sheet:a, outfit:"#888"}).img9!==1) out.bad.push(a+":안그려짐");
    }
    return out;
  }, probe);
  ok(real.archs>0, `매니페스트에 실린 시트 ${real.archs}종 (0이면 이 블록이 공허하다)`);
  ok(real.bad.length===0, `전부 디코드되고 3×3 정사각이며 실제로 그려진다 (문제 ${real.bad.length}건: ${real.bad.join(",")||"없음"})`);
  ok(Object.keys(real.cells).length<=1, `칸 크기가 한 값으로 통일돼 있다 (${JSON.stringify(real.cells)})`);

  ok(errs.length===0, `런타임 에러 0 (${errs.length})${errs.length?": "+errs[0].slice(0,70):""}`);
  await b.close();
  console.log(fail?"\n❌ npc_sheet_test 실패":"\n🎉 NPC 원형 시트 통과");
  console.log(`   📌 아트 프롬프트·투입 절차: ${DOC}`);
  process.exit(fail);
})();
