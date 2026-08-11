// 주인공 걷기 스프라이트 시트 감사 — **시트를 넣으면 실제로 그 칸이, 그 박자로 그려지는가.**
//
// 왜 있나
//   지금까지 주인공은 정지 이미지 2장(앞/뒤)이었고 왼쪽은 앞모습 좌우 반전이었다.
//   걷기 애니를 넣으면서 3×3 시트(정지/걸음A/걸음B × 아래/위/옆)로 바꿨는데, 이 저장소의 단골 사고가
//   여기서 두 가지 모양으로 재발할 수 있다:
//     ① 규칙(어느 칸을 쓸지)은 맞는데 **그리기가 그 칸을 안 읽는다** — 순수 함수만 재면 절대 못 잡는다.
//     ② 시트가 없을 때 폴백이 깨진다 — 아트 교체는 한 번에 안 끝나므로 중간 상태가 반드시 존재한다.
//   → **캔버스 픽셀을 직접 읽어서** 어느 칸이 그려졌는지 역산한다.
//
// ⚠️ 실내(집)에서 잰다 — 야외는 낮/밤 틴트가 캔버스 위에 반투명 레이어를 덮어 색이 변한다.
const { chromium } = require("playwright"); const path=require("path");

(async()=>{
  const b=await chromium.launch();
  const p=await b.newPage({viewport:{width:430,height:760},deviceScaleFactor:2});
  const errs=[]; p.on("pageerror",e=>errs.push(e.message));
  let fail=0; const ok=(c,m)=>{ console.log((c?"  ✅ ":"  ❌ ")+m); if(!c)fail=1; };
  process.on("unhandledRejection",async e=>{ console.log("❌ "+e); await b.close(); process.exit(1); });
  await p.goto("file://"+path.resolve(process.argv[2])); await p.waitForTimeout(1000);

  // ── 새 게임 → 집 안까지
  const tap=async s=>{ await p.click(s).catch(()=>{}); await p.waitForTimeout(400); };
  await tap("#newGameBtn");
  await p.locator("#charRow .pick-card").first().click().catch(()=>{}); await p.waitForTimeout(250);
  await tap("#confirmChar");
  await p.locator("#starterRow .pick-card").first().click().catch(()=>{}); await p.waitForTimeout(250);
  await tap("#confirmStarter"); await p.waitForTimeout(700);
  for(let i=0;i<12;i++){ if(await p.locator("#storySkip").isVisible().catch(()=>false)){ await p.click("#storySkip").catch(()=>{}); break; } await p.click("#storyNext").catch(()=>{}); await p.waitForTimeout(150); }
  await p.waitForTimeout(1200);
  /* ⚠️ 집에 들어오면 엄마 대사가 큐에 남아 `G.busy`가 켜져 있고, **busy 동안엔 방향키가 안 먹는다.**
     Enter만 두드려선 안 풀린다 — 게임의 `advanceDialog()`를 직접 불러 큐를 비워야 한다
     (fullrun_test가 같은 방식을 쓴다). 이걸 안 하면 주인공이 한 칸도 안 움직여
     "애니가 안 돈다"는 **오진**을 하게 된다 — 실제로 처음에 그렇게 빨갛게 나왔다. */
  for(let i=0;i<40;i++){
    const st=await p.evaluate(()=>{ const G=window.SG.G();
      const box=document.getElementById("dialogBox");
      if(box&&box.classList.contains("show"))window.SG.flow.advanceDialog();
      return {busy:!!G.busy, dlg:!!(box&&box.classList.contains("show"))}; });
    if(!st.busy&&!st.dlg)break;
    await p.waitForTimeout(150);
  }
  const ready=await p.evaluate(()=>({busy:!!window.SG.G().busy, pos:{...window.SG.G().pos}}));
  ok(!ready.busy, `조작 가능 상태가 됐다 (busy=${ready.busy}, pos=${ready.pos.x},${ready.pos.y})`);

  console.log("\n[1] 시트를 넣으면 정지 이미지 대신 시트가 쓰인다");
  /* 칸마다 고유색을 칠한 3×3 시트를 런타임에 주입한다. 색 = (10+행*80, 10+열*80, 250).
     캔버스에서 파랑 250인 픽셀을 찾아 (행,열)을 역산한다 — 어느 칸이 그려졌는지가 그대로 나온다.
     ⚠️ 옆모습(행2)엔 오른쪽에만 표식을 둬서 **좌우 반전 여부**까지 읽는다. */
  await p.evaluate(()=>{
    const C=32, cv=document.createElement("canvas"); cv.width=cv.height=C*3;
    const g=cv.getContext("2d");
    for(let r=0;r<3;r++)for(let c=0;c<3;c++){
      g.fillStyle=`rgb(${10+r*80},${10+c*80},250)`; g.fillRect(c*C+4,r*C+4,C-8,C-8);
      if(r===2){ g.fillStyle="rgb(250,250,10)"; g.fillRect(c*C+C-9, r*C+4, 5, 6); }   // 옆모습 우측 표식
    }
    window.SG.HERO_SHEET["0"]=cv.toDataURL();
  });
  await p.waitForTimeout(700);

  // 게임 캔버스에서 마커 픽셀을 훑어 (행,열) 집합과 표식 위치를 돌려준다
  const sample=async()=>p.evaluate(()=>{
    const cv=[...document.querySelectorAll("canvas")].filter(c=>c.width>300)[0];
    if(!cv)return null;
    const g=cv.getContext("2d"); const d=g.getImageData(0,0,cv.width,cv.height).data;
    const cells=new Set(); let markX=-1, minX=1e9, maxX=-1;
    for(let i=0;i<d.length;i+=4){
      const R=d[i],G=d[i+1],B=d[i+2];
      if(B>=245&&B<=255&&(R-10)%80===0&&(G-10)%80===0&&R<=170&&G<=170){
        cells.add(((R-10)/80)+","+((G-10)/80));
        const x=((i/4)%cv.width); if(x<minX)minX=x; if(x>maxX)maxX=x;
      }
      if(R>=245&&G>=245&&B<=20){ const x=((i/4)%cv.width); if(x>markX)markX=x; }
    }
    return {cells:[...cells], minX, maxX, markX};
  });

  const s0=await sample();
  ok(s0&&s0.cells.length>0, `시트 칸이 화면에 그려진다 (관측된 행,열: ${s0?s0.cells.join(" / "):"없음"})`);

  /* ⚠️ **어디서 걷느냐가 결과를 바꾼다.** 집 위쪽(y≤4)엔 침대·책상이 있어 옆으로 못 간다 →
     거기서 오른쪽을 누르면 방향이 안 바뀌어 "옆모습이 안 나온다"는 **오진**이 나온다(실제로 그랬다).
     그래서 각 방향을 재기 전에 **열린 바닥(y=5 줄)으로 옮긴다.** 이 줄은 x=1~7이 뚫려 있다(실측). */
  const pos=async()=>p.evaluate(()=>({...window.SG.G().pos}));
  const stepTo=async(key,test,max=12)=>{ for(let i=0;i<max;i++){ if(test(await pos()))return true;
      await p.keyboard.press(key); await p.waitForTimeout(200); } return test(await pos()); };
  // 걷는 동안 표본을 뜬다 → 관측된 행/열 집합과 표식 위치
  const walk=async(key,ticks=40)=>{ const rows=new Set(), cols=new Set(); let mark=null;
    await p.keyboard.down(key);
    for(let i=0;i<ticks;i++){ const s=await sample();
      (s&&s.cells||[]).forEach(k=>{ rows.add(k.split(",")[0]); cols.add(k.split(",")[1]); });
      if(s&&s.markX>=0&&s.minX<1e9)mark=(s.markX>(s.minX+s.maxX)/2)?"right":"left";
      await p.waitForTimeout(60); }
    await p.keyboard.up(key); await p.waitForTimeout(200);
    return {rows,cols,mark}; };

  console.log("\n[2] 걸으면 프레임이 실제로 바뀐다");
  /* 규칙상 순서는 [정지, A, 정지, B]다. 걷는 동안 **열이 2종류 이상** 관측돼야 한다.
     ⚠️ **실제로 움직이는 구간에서 재야 한다.** 벽에 막혀 제자리면 정지 프레임(0열)만 나와
     "애니가 안 돈다"로 오독한다 — 앞서 그렇게 빨갛게 나왔다. 그래서 이동 전후 좌표를 같이 확인한다. */
  const before=await pos();
  const down=await walk("ArrowDown",12);
  const after=await pos();
  ok(after.y>before.y, `아래로 실제로 이동했다 (${before.y} → ${after.y}) — 안 움직이면 아래 단정이 무의미하다`);
  ok(down.rows.has("0"), `아래로 걸으면 0행(정면)을 쓴다 (관측된 행: ${[...down.rows].sort().join(",")})`);
  /* ⚠️ **열(프레임) 판정은 여기서 하지 않는다 — 세로로 걸을 공간이 한 칸뿐이다.**
     출신지 실내는 세로가 짧아 아래로 한 칸 가면 곧 벽이다. 그 뒤로는 `moving`이 false라
     정지 프레임(0열)만 계속 나온다 → **무작위로 빨개졌다**(같은 빌드에서 3/3 통과 ↔ 2/2 실패).
     프레임 순서 [정지,A,정지,B] 중 절반이 0열이라 짧은 표본은 특히 잘 속는다.
     → 열 판정은 **가로 열린 줄(x=1~7, 6칸)** 에서 한다([3]). `heroSheetFrame`의 열 계산은
        방향과 무관한 공통 로직이라(HERO_FRAME_ORDER 하나를 공유) 단정이 약해지지 않는다.
        방향별로 다른 건 **행**이고, 그건 여기서 그대로 확인한다. */
  const openRow=after.y;

  console.log("\n[3] 방향이 바뀌면 행이 바뀐다");
  const up=await walk("ArrowUp",10);
  ok(up.rows.has("1"), `위로 걸으면 1행(뒷모습)을 쓴다 (${[...up.rows].sort().join(",")})`);
  // 옆으로 걷기 전에 반드시 열린 줄(x=1~7이 뚫린 y)로 되돌아온다
  await stepTo("ArrowDown", q=>q.y>=openRow);
  await stepTo("ArrowLeft", q=>q.x<=2);
  const xb=(await pos()).x;
  const right=await walk("ArrowRight",24);
  const xa=(await pos()).x;
  /* 📌 열 판정의 전제 — **여러 칸을 실제로 걸었는가.** 한 칸만 가고 멈추면
     나머지 표본이 전부 정지 프레임이라 [2]와 같은 플레이크가 여기로 옮겨온다. */
  ok(xa-xb>=3, `오른쪽으로 여러 칸 걸었다 (${xb} → ${xa}, ${xa-xb}칸 · 기준 3칸 이상)`);
  ok(right.rows.has("2"), `옆으로 걸으면 2행(옆모습)을 쓴다 (${[...right.rows].sort().join(",")})`);
  ok(right.cols.size>=2, `옆으로 걸을 때도 프레임이 바뀐다 (관측된 열: ${[...right.cols].sort().join(",")||"없음"})`);

  console.log("\n[4] 왼쪽은 옆모습을 좌우 반전한다");
  /* 옆모습 칸의 우측에만 노란 표식을 뒀다. 오른쪽 이동이면 표식이 스프라이트의 오른쪽,
     왼쪽 이동이면 반전돼 왼쪽에 있어야 한다. */
  const left=await walk("ArrowLeft",12);
  ok(right.mark==="right", `오른쪽 이동: 표식이 오른쪽에 있다 (${right.mark})`);
  ok(left.mark==="left", `왼쪽 이동: 표식이 왼쪽에 있다 = 반전됐다 (${left.mark})`);

  console.log("\n[5] 시트를 빼면 예전 경로로 폴백한다 (아트 교체 중간 상태)");
  await p.evaluate(()=>{ delete window.SG.HERO_SHEET["0"]; });
  await p.waitForTimeout(500);
  const s5=await sample();
  ok(s5&&s5.cells.length===0, `시트를 빼면 시트 칸이 안 그려진다 (남은 칸: ${s5?s5.cells.length:"?"})`);
  const alive=await p.evaluate(()=>{ const cv=[...document.querySelectorAll("canvas")].filter(c=>c.width>300)[0];
    if(!cv)return false; const d=cv.getContext("2d").getImageData(0,0,cv.width,cv.height).data;
    let nonBlank=0; for(let i=0;i<d.length;i+=400)if(d[i+3]>0)nonBlank++; return nonBlank>10; });
  ok(alive, "폴백 후에도 화면이 정상적으로 그려진다");

  ok(errs.length===0, `런타임 에러 0 (${errs.length})${errs.length?": "+errs.slice(0,2).join(" | "):""}`);
  await b.close();
  console.log(fail?"\n❌ hero_sheet_test 실패":"\n🎉 주인공 걷기 시트 감사 통과");
  process.exit(fail);
})();
