// 몽키 퍼즈: 실제 키·클릭을 무작위로 오래 때려 넣고, 게임이 깨지지 않는지 본다.
// 단위 테스트는 "내가 상상한 경로"만 확인한다. 이건 상상 못 한 조합을 찾는 쪽이다.
//
// 감시 항목
//  1) 처리되지 않은 런타임 에러 0
//  2) G.busy 영구 잠금 (입력이 영원히 안 먹는 상태)
//  3) 스탯/HP에 NaN·음수·maxHp 초과
//  4) 파티가 통째로 사라지거나 활성 인덱스가 범위를 벗어남
//  5) 전투가 아닌데 전투 화면에 갇히거나, 그 반대
//
// 사용: node scripts/monkey_test.js <dist> [초]
const { chromium } = require("playwright"); const path=require("path");

(async()=>{
  const SECONDS=Number(process.argv[3]||45);
  const b=await chromium.launch();
  const p=await b.newPage({viewport:{width:430,height:760}});
  const errs=[]; p.on("pageerror",e=>errs.push(e.message));
  const stacks=[]; p.on("pageerror",e=>stacks.push(String(e.stack||e.message).split("\n").slice(0,4).join(" | ")));
  await p.goto("file://"+path.resolve(process.argv[2]));
  await p.waitForTimeout(900);
  const ok=(c,m)=>{ console.log((c?"  ✅ ":"  ❌ ")+m); if(!c)process.exitCode=1; };

  // 시드 고정 난수 — 실패하면 같은 입력열을 재현할 수 있어야 한다
  let seed=20260720;
  const rnd=()=>{ seed=(seed*1664525+1013904223)>>>0; return seed/4294967296; };
  const pick=a=>a[Math.floor(rnd()*a.length)];

  // 게임 시작까지는 결정적으로 진행(퍼즈는 그 이후부터)
  const clearStory=async(max=40)=>{ for(let i=0;i<max;i++){
      const st=await p.evaluate(()=>({dlg:document.getElementById("dialogBox").classList.contains("show"),
                                      story:!!document.querySelector("#storyOverlay.active")}));
      if(!st.dlg&&!st.story)return;
      await p.evaluate(()=>{ const s=document.getElementById("storySkip")||document.getElementById("storyNext"); if(s)s.click(); });
      await p.keyboard.press("Enter"); await p.waitForTimeout(180); } };
  await p.click("#newGameBtn",{force:true}); await p.waitForTimeout(500);
  await p.evaluate(()=>{const c=document.querySelector("#charRow > *"); if(c)c.click();});
  await p.click("#confirmChar",{force:true}); await p.waitForTimeout(600); await clearStory();
  await p.evaluate(()=>{const c=document.querySelector("#starterRow > *"); if(c)c.click();});
  await p.click("#confirmStarter",{force:true}); await p.waitForTimeout(900); await clearStory();
  await p.waitForTimeout(500);

  // 집 안에서 시작하므로 밖으로 내보낸 뒤 퍼즈를 시작한다(실내에서 맴돌면 커버리지가 안 나온다)
  for(let i=0;i<24;i++){
    const st=await p.evaluate(()=>({indoor:window.SG.G().indoor,
      dlg:document.getElementById("dialogBox").classList.contains("show")}));
    if(!st.indoor)break;
    if(st.dlg){ await p.keyboard.press("Enter"); } else { await p.keyboard.press("ArrowDown"); }
    await p.waitForTimeout(160);
  }
  await p.waitForTimeout(400);

  const started=await p.evaluate(()=>!!(window.SG.G().party||[]).length);
  ok(started, "퍼즈 시작 전 게임 진입 완료");

  // ⚠️ 무작위 Escape는 설정 오버레이를 열었다 닫았다 하며 시간만 먹는다. 탈출용으로만 따로 쓴다.
  const KEYS=["ArrowUp","ArrowDown","ArrowLeft","ArrowRight","Enter","z","x"," "];
  const t0=Date.now(); let acts=0, busySince=null, maxBusyMs=0;
  const visited=new Set(); let battleCount=0, wasInBattle=false;
  const anomalies=[];

  while((Date.now()-t0)/1000 < SECONDS){
    acts++;
    // 커버리지 표본은 전투 분기보다 먼저 — 전투에서 continue하면 계측이 통째로 건너뛰어진다
    {
      const c=await p.evaluate(()=>{ const G=window.SG.G();
        return {k:(G.indoor||"")+"|"+G.pos.x+","+G.pos.y, inB:!!G.inBattle, busy:!!G.busy}; });
      visited.add(c.k);
      if(c.inB && !wasInBattle)battleCount++;
      wasInBattle=c.inB;
      // ⚠️ busy 계측은 반드시 전투 분기보다 "앞"에서 해야 한다. 뒤에 두면 전투 중 continue로
      //    샘플이 통째로 건너뛰어져, 연속 busy가 아니라 샘플 간격을 재게 된다(27초처럼 보였다).
      if(c.busy){ if(busySince==null)busySince=Date.now(); maxBusyMs=Math.max(maxBusyMs,Date.now()-busySince); }
      else busySince=null;
    }

    // ⚠️ 전투에 들어가면 무작위 키로는 기술을 못 고르고 그대로 갇힌다(커버리지가 0으로 수렴).
    //    전투 중엔 실제 메뉴 버튼을 눌러 턴을 진행시킨다 — 공격 위주, 가끔 도망.
    const bt=await p.evaluate(()=>{
      const G=window.SG.G();
      if(!G.inBattle)return null;
      const main=document.getElementById("mainMenu");
      const mv=document.getElementById("moveMenu");
      return { busy:!!G.busy,
               mainOn: main && getComputedStyle(main).display!=="none",
               moveOn: mv && getComputedStyle(mv).display!=="none" };
    });
    if(bt){
      if(bt.busy){ await p.keyboard.press("Enter"); await p.waitForTimeout(120); continue; }
      if(bt.moveOn){
        await p.evaluate(()=>{ const b=[...document.querySelectorAll("#moveMenu .mbtn")].filter(x=>!x.disabled);
          if(b.length)b[Math.floor(Math.random()*b.length)].click(); });
      } else if(bt.mainOn){
        const wantRun=rnd()<0.12;
        await p.evaluate(w=>{ const b=[...document.querySelectorAll("#mainMenu .mbtn")];
          const t=b.find(x=>x.textContent.includes(w?"도망":"공격"))||b[0]; if(t)t.click(); }, wantRun);
      } else await p.keyboard.press("Enter");
      await p.waitForTimeout(230);
      continue;
    }

    // ⚠️ 매번 방향을 새로 뽑으면 제자리에서 진동만 하고 아무 데도 못 간다.
    //    한 방향을 2~5회 이어 눌러 실제로 이동·조우가 일어나게 한다.
    const r=rnd();
    if(r<0.62){
      const d=pick(["ArrowUp","ArrowDown","ArrowLeft","ArrowRight"]);
      const rep=2+Math.floor(rnd()*4);
      for(let j=0;j<rep;j++){ await p.keyboard.press(d); await p.waitForTimeout(38); }
    } else if(r<0.85){
      await p.keyboard.press(pick(KEYS));
    } else {
      await p.evaluate(()=>{
        const btns=[...document.querySelectorAll("button")].filter(x=>x.offsetParent && !x.disabled);
        if(!btns.length)return;
        // 파괴적인 것(새 게임/저장 초기화)은 제외 — 퍼즈 중 리셋되면 의미가 없다
        const safe=btns.filter(x=>!/새 게임|초기화|삭제|리셋/.test(x.textContent||"") && x.id!=="newGameBtn");
        const t=safe.length?safe:btns;
        t[Math.floor(Math.random()*t.length)].click();
      });
    }
    await p.waitForTimeout(22);

    // ⚠️ 오버레이(가방·도감·설정)에 들어가면 방향키가 안 먹어 원숭이가 그 안에서 굳는다.
    //    주기적으로 빠져나와야 실제로 맵을 돌아다니며 의미 있는 커버리지가 나온다.
    if(acts%9===0){
      const stuck=await p.evaluate(()=>!!document.querySelector(".overlay.active"));
      if(stuck){ for(let j=0;j<3;j++){ await p.keyboard.press("Escape"); await p.waitForTimeout(70); } }
    }

    if(acts%12===0){
      const st=await p.evaluate(()=>{
        const G=window.SG.G(); if(!G)return {noG:true};
        const bad=[];
        (G.party||[]).forEach((m,i)=>{ if(!m||m.isEgg)return;
          if(!isFinite(m.hp)||!isFinite(m.maxHp)||!isFinite(m.atk)||!isFinite(m.spd))bad.push(`p${i}:NaN`);
          if(m.hp<0)bad.push(`p${i}:hp<0(${m.hp})`);
          if(m.hp>m.maxHp)bad.push(`p${i}:hp>max(${m.hp}/${m.maxHp})`);
          if(!isFinite(m.level)||m.level<1||m.level>100)bad.push(`p${i}:lv(${m.level})`);
        });
        if(G.foe&&(!isFinite(G.foe.hp)||G.foe.hp<0))bad.push("foe:hp");
        if((G.party||[]).length===0)bad.push("party:empty");
        if(G.active<0||G.active>=(G.party||[]).length)bad.push(`active:${G.active}/${(G.party||[]).length}`);
        if(!isFinite(G.money)||G.money<0)bad.push(`money:${G.money}`);
        const view=([...document.querySelectorAll(".view")].find(x=>x.classList.contains("active"))||{}).id;
        if(view==="battle"&&!G.inBattle)bad.push("view=battle but !inBattle");
        return { busy:!!G.busy, view, bad, inBattle:!!G.inBattle };
      });
      if(st.noG){ anomalies.push("G가 사라짐"); break; }
      if(st.bad&&st.bad.length)anomalies.push(...st.bad);
    }
  }

  // ⚠️ 퍼즈가 전투 한복판에서 끝날 수 있다. 고정 대기로 busy를 보면 "부하로 느린 것"을
  //    영구 잠금으로 오판한다 → 전투를 실제로 마무리시키고, busy가 풀릴 때까지 넉넉히 기다린다.
  const settleUntil=Date.now()+45000;
  while(Date.now()<settleUntil){
    const st=await p.evaluate(()=>{ const G=window.SG.G();
      const main=document.getElementById("mainMenu"), mv=document.getElementById("moveMenu");
      return { busy:!!G.busy, inB:!!G.inBattle,
               mainOn: main&&getComputedStyle(main).display!=="none",
               moveOn: mv&&getComputedStyle(mv).display!=="none" }; });
    if(!st.busy && !st.inB)break;
    if(st.inB && !st.busy && st.moveOn)
      await p.evaluate(()=>{ const b=document.querySelector("#moveMenu .mbtn"); if(b)b.click(); });
    else if(st.inB && !st.busy && st.mainOn)
      await p.evaluate(()=>{ const b=[...document.querySelectorAll("#mainMenu .mbtn")].find(x=>x.textContent.includes("공격")); if(b)b.click(); });
    else await p.keyboard.press("Enter");
    await p.waitForTimeout(260);
  }
  await p.waitForTimeout(800);
  const fin=await p.evaluate(()=>{
    const G=window.SG.G();
    return { busy:!!G.busy, inBattle:!!G.inBattle, party:(G.party||[]).length, money:G.money,
             view:([...document.querySelectorAll(".view")].find(x=>x.classList.contains("active"))||{}).id,
             lv:(G.party||[]).map(m=>m&&m.level), seen:G.seen.size, caught:G.caught.size };
  });

  // 퍼즈 후에도 조작이 살아 있는가
  await p.evaluate(()=>{ const s=document.getElementById("storySkip")||document.getElementById("storyNext"); if(s)s.click(); });
  for(let i=0;i<12;i++){ await p.keyboard.press("Escape"); await p.waitForTimeout(80); }
  await p.waitForTimeout(400);
  const pre=await p.evaluate(()=>({...window.SG.G().pos}));
  let alive=false;
  for(const k of ["ArrowDown","ArrowUp","ArrowLeft","ArrowRight","ArrowDown","ArrowUp"]){
    await p.keyboard.press(k); await p.waitForTimeout(260);
    const now=await p.evaluate(()=>({...window.SG.G().pos, inB:window.SG.G().inBattle}));
    if(now.x!==pre.x||now.y!==pre.y||now.inB){ alive=true; break; }
  }

  console.log(`\n  [퍼즈 결과] ${SECONDS}초 · 입력 ${acts}회 · 시드 20260720`);
  console.log(`     최종: ${fin.view} · 파티 ${fin.party}마리(Lv ${fin.lv.join("/")}) · 목격 ${fin.seen} · 소지금 ${fin.money}`);
  console.log(`     busy 최장 연속: ${maxBusyMs}ms`);
  console.log(`     커버리지: 서로 다른 칸 ${visited.size}곳 방문 · 전투 ${battleCount}회 진입\n`);

  if(stacks.length)console.log("  [스택]\n     "+stacks.slice(0,3).join("\n     "));
  ok(errs.length===0, `처리되지 않은 런타임 에러 0 (${errs.length}${errs.length?": "+errs.slice(0,3).join(" / "):""})`);
  ok(anomalies.length===0, `상태 이상 0건 (${anomalies.length}${anomalies.length?": "+[...new Set(anomalies)].slice(0,5).join(", "):""})`);
  ok(maxBusyMs<12000, `입력 영구 잠금 없음 (busy 최장 ${maxBusyMs}ms)`);
  ok(fin.party>=1, `파티가 남아 있다 (${fin.party}마리)`);
  ok(!fin.busy, `퍼즈 후 busy 해제 (${fin.busy})`);
  ok(alive, "퍼즈 후에도 조작이 살아 있다");
  // 커버리지가 너무 낮으면 "통과"에 의미가 없다 — 다만 부하가 걸린 환경에선 입력 자체가
  // 적게 들어가므로, "입력이 충분히 들어간 경우에만" 탐험량을 따진다.
  // (게임 문제가 아니라 머신이 느린 것을 실패로 보고하면 신호가 죽는다)
  // 전투에 오래 머물면 방문 칸은 적을 수밖에 없다 → 탐험 또는 전투 중 하나로 "실제로 놀았는지"를 본다
  // ⚠️ 임계값을 높게(20칸/2전투) 걸면 부하로 입력이 스로틀된 환경에서 게이트가 죽는다
  //    (load 12·30초에 216입력이 들어가도 9칸·1전투밖에 못 갔다 — 게임 문제 아님).
  //    진짜 실패 신호는 "퍼저가 아예 안 놀았다"이므로 **약한 바닥**만 게이트하고 전체 수치는 참고로 출력.
  if(acts>=200) ok(visited.size>=5 || battleCount>=1,
     `퍼저가 실제로 움직임 (입력 ${acts}회 · ${visited.size}칸 · 전투 ${battleCount}회)`);
  else console.log(`  ⚠️  입력이 ${acts}회뿐이라 진행량 판정을 건너뜀 (머신 부하)`);
  // ⚠️ 전투 발생은 무작위 탐험에 달렸다 — 0회라고 실패시키면 플레이키 테스트가 된다.
  //    게이트는 커버리지로 두고, 전투 횟수는 "이번 퍼즈가 얼마나 깊이 갔는지" 참고치로만 알린다.
  if(battleCount===0)console.log("  ⚠️  이번 회차는 전투를 만나지 못했다 — 전투 경로는 검증되지 않음");
  else console.log(`  ℹ️  전투 ${battleCount}회를 실제로 겪으며 검증됨`);
  console.log(process.exitCode?"\n❌ 실패":"\n🎉 몽키 퍼즈 통과");
  await b.close(); process.exit(process.exitCode||0);
})();
