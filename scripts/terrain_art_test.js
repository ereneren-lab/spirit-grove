// 지형지물 아트 감사 — **아트가 있으면 쓰고, 없으면 절차적 그림으로 돌아가는가.**
//
// 왜 있나
//   유저: "지형지물도 이미지 필요하면 이야기해." → 건물 7 + 오브젝트 6을 발주하기로 했고,
//   **아트가 도착하기 전에 코드를 먼저 넣었다**(NPC 때와 같은 순서. 그래서 도착 당일 붙었다).
//   그런데 아트가 하나도 없으면 새 경로가 아예 안 돌아 "아직 안 깨졌다"를 확인할 수 없다.
//   → **회귀가 런타임에 아트를 주입해** 그리기 경로를 실제로 태운다.
//
// 재는 것
//   [1] 타일↔id 표가 단일 출처이고, 실제로 맵에 있는 타일만 가리키는가
//   [2] 아트가 없으면 **절차적 그림으로 폴백**하는가 (지금의 정상 상태)
//   [3] 주입하면 실제로 그 이미지를 그리는가 · 건물은 1.45배 좌표계를 그대로 쓰는가
//   [4] `#`(큰 나무)는 타일마다 위치·크기가 흔들리는가 (안 흔들면 숲이 격자로 보인다)
//   [5] 매니페스트에 실린 아트가 전부 디코드되는가 (아직 0장이면 그렇다고 말한다)
//
// ⚠️ 타일 문자를 이 파일에 적지 않는다 — TERRAIN_ART_ID에서 가져온다(병렬 테이블 금지).
const { chromium } = require("playwright"); const path=require("path");

const DOC = "outputs/production/2026-08-11_spirit-grove_terrain-art-order.md";

(async()=>{
  const b=await chromium.launch();
  const p=await b.newPage({viewport:{width:430,height:760}});
  const errs=[]; p.on("pageerror",e=>errs.push(e.message));
  let fail=0; const ok=(c,m)=>{ console.log((c?"  ✅ ":"  ❌ ")+m); if(!c)fail=1; };
  process.on("unhandledRejection",async e=>{ console.log("❌ "+e); await b.close(); process.exit(1); });
  await p.goto("file://"+path.resolve(process.argv[2])); await p.waitForTimeout(900);

  console.log("\n[1] 타일 ↔ 아트 id 표가 단일 출처다");
  const m=await p.evaluate(()=>{
    const S=window.SG,F=S.flow; S.setG(S.freshState()); F.enterMap(true);
    const ID=S.TERRAIN_ART_ID||{};
    /* 맵 문자열에 실제로 존재하는 타일만 가리키는지 — 오타로 없는 문자를 적으면
       그 아트는 영영 안 그려지고 아무도 모른다. */
    /* ⚠️ 맵 크기(W/H)는 SG에 노출돼 있지 않다 → tileAt이 값을 주는 범위를 넉넉히 훑는다. */
    const used=new Set();
    for(let y=0;y<100;y++)for(let x=0;x<100;x++){ const t=F.tileAt(x,y); if(t)used.add(t); }
    const keys=Object.keys(ID);
    return { keys, ids:Object.values(ID), ghost:keys.filter(k=>!used.has(k)),
             dupIds:Object.values(ID).filter((v,i,a)=>a.indexOf(v)!==i),
             /* ⚠️ 빌드에 실린 아트 수는 **[3]이 더미를 꽂기 전에** 세야 한다.
                   나중에 세면 더미까지 세어 "0종인데 12종"이라고 말한다(실제로 그랬다). */
             loaded:Object.keys(S.TERRAIN_ART||{}) };
  });
  ok(m.keys.length>0, `타일 매핑 ${m.keys.length}건 (공허한 통과 방지)`);
  ok(m.ghost.length===0, `맵에 실재하는 타일만 가리킨다 (유령 ${m.ghost.length}건: ${m.ghost.join(",")||"없음"})`);
  ok(m.dupIds.length===0, `한 아트 id를 두 타일이 쓰지 않는다 (중복 ${m.dupIds.join(",")||"없음"})`);
  console.log(`     · id: ${m.ids.join(" ")}`);

  /* 드로우 콜을 가로채 분류한다(npc_sheet_test와 같은 기법).
     아트 경로는 drawImage(5인자) 하나로 끝나고, 절차적 경로는 fill/stroke가 잔뜩 나온다. */
  const probe=`(tx,ty)=>{
    const F=window.SG.Field; let img=0, shapes=0, rect=null;
    const ctx=new Proxy({},{ get:(t,k)=>{
      if(k==="drawImage")return (...a)=>{ img++; rect=a.slice(1); };
      if(k==="canvas")return {width:430,height:760};
      if(k==="createRadialGradient"||k==="createLinearGradient")return ()=>({addColorStop:()=>{}});
      if(k==="fillStyle"||k==="strokeStyle"||k==="lineWidth"||k==="lineCap"||k==="font"||k==="textAlign"||k==="textBaseline"||k==="imageSmoothingEnabled"||k==="globalAlpha")return "";
      return (...a)=>{ if(k==="fill"||k==="stroke"||k==="fillRect"||k==="strokeRect")shapes++; };
    }, set:()=>true });
    F._tile(ctx, window.SG.flow.tileAt(tx,ty), 0, 0, 100, tx, ty, 1.0);
    return {img, shapes, rect};
  }`;

  console.log("\n[2] 아트가 없으면 절차적 그림으로 폴백한다");
  const spots=await p.evaluate(()=>{
    const F=window.SG.flow, ID=window.SG.TERRAIN_ART_ID||{};
    /* 각 타일 문자가 실제로 있는 첫 좌표를 찾아둔다 — 좌표를 이 파일에 박으면 맵을 못 고친다. */
    const out={};
    for(let y=0;y<100;y++)for(let x=0;x<100;x++){ const t=F.tileAt(x,y); if(t&&ID[t]&&!out[t])out[t]=[x,y]; }
    return out;
  });
  ok(Object.keys(spots).length>0, `검사할 좌표를 맵에서 찾았다 (${Object.keys(spots).length}종)`);
  /* ⚠️ **아트를 그 자리에서 떼고 잰다.** 08-11에 `npc_sheet_test [2]`가 정확히 같은 이유로 빨개졌다 —
        "빌드에 아트가 하나도 없다"에 기대고 있다가 진짜 아트가 실리자 무너졌다.
        폴백은 아트가 있든 없든 살아 있어야 하는 경로다 → 키를 빼고 재고 되돌린다. */
  const noArt=await p.evaluate(([probeSrc,sp])=>{
    const A=window.SG.TERRAIN_ART, keep={...A};
    for(const k of Object.keys(A)) delete A[k];
    try{
      const run=new Function("return "+probeSrc)(); const out={};
      for(const [t,xy] of Object.entries(sp)) out[t]=run(xy[0],xy[1]);
      return out;
    } finally { Object.assign(A, keep); }
  }, [probe, spots]);
  const noImg=Object.entries(noArt).filter(([,v])=>v.img>0).map(([t])=>t);
  const noShape=Object.entries(noArt).filter(([,v])=>v.shapes<3).map(([t])=>t);
  ok(noImg.length===0, `아트가 없으면 이미지를 안 그린다 (그린 타일: ${noImg.join(",")||"없음"})`);
  ok(noShape.length===0, `대신 전부 절차적으로 그린다 (도형이 적은 타일: ${noShape.join(",")||"없음"})`);

  console.log("\n[3] 아트를 주입하면 실제로 그 이미지를 그린다");
  const drew=await p.evaluate(async([probeSrc,sp])=>{
    const S=window.SG;
    /* 64×64 더미를 만들어 TERRAIN_ART에 꽂는다.
       ⚠️ `TERRAIN_ART`는 스코프 안의 const다 — window에 새로 만들면 게임은 안 본다.
          SG로 내보낸 **같은 객체**에 키를 꽂아야 실제 경로가 읽는다(NPC 때 여기서 한 번 헛돌았다). */
    const cv=document.createElement("canvas"); cv.width=cv.height=64;
    const g=cv.getContext("2d"); g.fillStyle="#0f0"; g.fillRect(0,0,64,64);
    const url=cv.toDataURL("image/png");
    const ID=S.TERRAIN_ART_ID;
    for(const id of Object.values(ID)) S.TERRAIN_ART[id]=url;
    /* 캐시를 채우고 디코드까지 기다린다 — 첫 그리기는 원래 폴백이다(complete=false). */
    await Promise.all(Object.keys(ID).map(t=>new Promise(r=>{
      const im=S.terrainArt(t); if(!im)return r(); im.complete?r():(im.onload=r, im.onerror=r); })));
    const run=new Function("return "+probeSrc)(); const out={};
    for(const [t,xy] of Object.entries(sp)) out[t]=run(xy[0],xy[1]);
    return out;
  }, [probe, spots]);
  const notDrawn=Object.entries(drew).filter(([,v])=>v.img!==1).map(([t])=>t);
  ok(notDrawn.length===0, `주입한 타일 전부가 이미지 1회로 끝난다 (아닌 타일: ${notDrawn.join(",")||"없음"})`);

  /* 📌 건물은 `_k=1.45` 확대 좌표계에 그려진다 — 아트도 **같은 상자**를 써야 절차적과 크기가 맞는다.
     오브젝트는 타일 상자 그대로다. 둘을 비교해 확대가 살아 있는지 본다. */
  const bld=await p.evaluate(()=>window.SG.DOOR_TILES||"");
  const bldT=Object.keys(drew).filter(t=>bld.indexOf(t)>=0);
  const objT=Object.keys(drew).filter(t=>bld.indexOf(t)<0&&t!=="#");
  /* ⚠️ 앞 단정이 이미 실패했으면 rect가 null이다 — 여기서 크래시하면 원인이 가려진다. */
  const _br=bldT.length&&drew[bldT[0]].rect, _or=objT.length&&drew[objT[0]].rect;
  if(_br&&_or){
    const bs=_br[2], os=_or[2];
    ok(Math.abs(bs/os-1.45)<0.02, `건물은 오브젝트보다 1.45배 크게 그린다 (${(bs/os).toFixed(3)}배)`);
  } else ok(false, `건물/오브젝트 표본을 못 얻었다 (그리기 자체가 안 된 것이다 — 위 단정을 볼 것)`);

  console.log("\n[4] 큰 나무(#)는 타일마다 흔들린다 — 안 흔들면 숲이 격자로 보인다");
  const jit=await p.evaluate(async(probeSrc)=>{
    const F=window.SG.flow, run=new Function("return "+probeSrc)();
    const pts=[]; for(let y=0;y<100&&pts.length<8;y++)for(let x=0;x<100&&pts.length<8;x++) if(F.tileAt(x,y)==="#")pts.push([x,y]);
    return pts.map(([x,y])=>run(x,y).rect);
  }, probe);
  const sizes=new Set(jit.filter(Boolean).map(r=>Math.round(r[2]*100)));
  const offs=new Set(jit.filter(Boolean).map(r=>Math.round(r[0]*100)+","+Math.round(r[1]*100)));
  ok(jit.length>=4, `큰 나무 표본 ${jit.length}칸`);
  ok(sizes.size>1, `크기가 타일마다 다르다 (서로 다른 크기 ${sizes.size}종)`);
  ok(offs.size>1, `위치가 타일마다 다르다 (서로 다른 위치 ${offs.size}종)`);

  console.log("\n[5] 매니페스트에 실린 아트");
  /* 아직 0장이어도 실패가 아니다 — 발주 대기 상태가 정상이다. 다만 **말은 한다.** */
  console.log(`     · 지금 실린 지형 아트: ${m.loaded.length>0?m.loaded.length+"종 — "+m.loaded.join(" "):"0종 (발주 대기 — 절차적으로 그린다)"}`);
  /* 실린 게 있으면 전부 아는 id인지 본다 — 오타로 넣으면 조용히 폴백한다. */
  const unknown=m.loaded.filter(k=>m.ids.indexOf(k)<0);
  ok(unknown.length===0, `실린 아트가 전부 아는 id다 (모르는 id ${unknown.length}건: ${unknown.join(",")||"없음"})`);

  ok(errs.length===0, `런타임 에러 0 (${errs.length})${errs.length?": "+errs[0].slice(0,70):""}`);
  await b.close();
  console.log(fail?"\n❌ terrain_art_test 실패":"\n🎉 지형지물 아트 통과");
  console.log(`   📌 발주안: ${DOC}`);
  process.exit(fail);
})();
