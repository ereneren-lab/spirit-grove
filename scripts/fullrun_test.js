// 전수 플레이스루 — 봇이 **실제 입력만으로** 처음부터 최대한 멀리(챔피언까지) 진행한다.
//
// 왜 필요한가:
//   longrun_test는 "첫 뱃지"에서 멈춘다. 그래서 그 뒤 구간(체육관 2~4 · 숲의 군주 · 리그 · 챔피언)은
//   아무도 실제로 걸어본 적이 없었고, 이번 세션에 "문서엔 완비인데 플레이에선 안 돌던" 버그가 6건 나왔다.
//   이 하네스는 진행 가능성 자체를 증명하려는 것 — 어디서 막히는지가 결과물이다.
//
// 봇이 하는 일: 목표 트래커 탭 이동 · 상성 기술 선택 · 회복약 · 위험하면 도주 ·
//   **약해진 야생 포획(파티 6마리까지)** · **정령센터에서 회복** · 진화/기술배우기 오버레이 처리.
// ⚠️ 확률·부하에 좌우되므로 하드 게이트는 "런타임 에러 0 / 진행이 0은 아니다"만. 도달 지점은 참고 출력.
//
// ── 현재 상태: 미완(WIP) ────────────────────────────────────────────────
// 아직 **첫 뱃지도 못 간다.** 지금까지 잡은 건 전부 봇 쪽 결함이고(게임 버그 0건),
// 게임은 10분 연속 플레이에서 런타임 에러 0으로 버텼다. 고친 결함:
//   1) HP 18%에서 도주 → 경험치를 못 얻어 Lv5 정체·전멸 반복 → 도주는 최후 수단으로
//   2) 간호사 회복이 다단 대사라 clearStory가 대사 사이 공백에서 조기 종료 → 회복 완료까지 폴링
//   3) 실패한 도주를 무한 반복 → 전투당 3회 상한
//   4) 기절 후 **강제 교체 오버레이**를 전투 중에 처리 안 해 Enter만 두드리며 갇힘
//   5) 실내에서 목표 트래커가 숨겨져 **센터 안에 7분간 갇힘** → 출구로 나가는 로직 추가
//   6) 실패한 회복약 클릭을 성공으로 세어 5분에 169회 반복 → 개수 감소로 성공 판정
//   7) **강제 교체에서 숨겨진 ✕를 클릭** → 게임이 다시 열어 무한 루프(정지의 진짜 원인이었다).
//      게임은 정상이다 — forced면 `switchClose`를 display:none으로 감춘다. `.click()`이 숨은 버튼도
//      동작한다는 게 함정. → `offsetParent!==null`로 **보이는 버튼만** 누른다.
//   8) 전투 중 가방이 열린 채 남으면 **주머니 탭만 무한 클릭** → 오버레이를 id로 구분해 가방은 닫는다.
//
// ── 트레이스 사용법 ──
//   TRACE=1 node scripts/fullrun_test.js dist/spirit_grove_3d.html 240
//   매 루프 한 줄(분기·상태·열린 오버레이 id/버튼)을 찍는다. 정지하면 마지막 몇 줄이 곧 원인이다.
//
// ⚠️ 남은 것(다음 세션):
//   · 이제 하드 정지는 없다(파티 4마리·도감 3까지 진행). 대신 목표 트래커 이동이
//     **두 칸 사이를 오간다**(예: 8,44 ↔ 9,43). 탭할 때마다 경로가 재계산되고 조우로 끊겨
//     한두 칸만 가고 마는 것으로 보인다.
//   · ⚠️ **시도했다가 되돌린 방법**: `currentGoal()`의 좌표를 읽어 `walkTo`로 끝까지 걷게 했더니
//     **더 나빠졌다**(6분간 8,44에서 전투 0회). 목표가 비보행이라 인접칸으로 우회시켰는데도 경로가
//     안 잡히거나 즉시 끊긴 것으로 보인다 — 같은 길로 다시 가지 말 것. 원인부터 볼 것:
//     `walkTo`가 무엇을 반환하는지, `bfsPath`가 그 좌표쌍에서 왜 실패하는지 먼저 찍어볼 것.
//   · 상점에서 회복약 보충, 체육관 견습생 처리, 리그 5연전 회복 없이 진행 등 미검증.
// ⚠️ verify.sh·playtest.sh에 **일부러 등록하지 않았다** — 아직 신뢰할 수 없어 CI에 넣으면 노이즈만 된다.
//    수동 실행: node scripts/fullrun_test.js dist/spirit_grove_3d.html <초>
const { chromium } = require("playwright"); const path=require("path");

(async()=>{
  const BUDGET=Number(process.argv[3]||600);
  const b=await chromium.launch();
  const p=await b.newPage({viewport:{width:430,height:760}});
  const errs=[]; p.on("pageerror",e=>errs.push(e.message));
  const die=async(m)=>{ console.log("❌ "+m); await b.close(); process.exit(1); };
  process.on("unhandledRejection", async e=>die("unhandledRejection: "+e));
  await p.goto("file://"+path.resolve(process.argv[2])); await p.waitForTimeout(1000);
  const ok=(c,m)=>{ console.log((c?"  ✅ ":"  ❌ ")+m); if(!c)process.exitCode=1; };

  // ── 게임 시작(타이틀 → 캐릭터 → 스타터 → 스토리) ──
  const clearStory=async(n)=>{ for(let i=0;i<n;i++){
      const hit=await p.evaluate(()=>{
        const s=document.querySelector("#storyOverlay.active");
        if(s){ const btn=s.querySelector("#storyNext")||s.querySelector("button"); if(btn){btn.click(); return "story";} }
        if(document.getElementById("dialogBox").classList.contains("show")){ window.SG.flow.advanceDialog(); return "dlg"; }
        return null; });
      if(!hit)break; await p.waitForTimeout(220); } };
  await p.evaluate(()=>{ const b=[...document.querySelectorAll("button")].find(x=>/새 게임|시작/.test(x.textContent||"")); if(b)b.click(); });
  await p.waitForTimeout(600);
  await p.evaluate(()=>{ const b=[...document.querySelectorAll("button")].find(x=>/확정|결정|선택/.test(x.textContent||"")); if(b)b.click(); });
  await p.waitForTimeout(600);
  await p.evaluate(()=>{ const c=[...document.querySelectorAll(".starter-card,.mon-card,button")].find(x=>/파라꼬/.test(x.textContent||"")); if(c)c.click(); });
  await p.waitForTimeout(400);
  await p.evaluate(()=>{ const b=[...document.querySelectorAll("button")].find(x=>/결정|확정|이 정령/.test(x.textContent||"")); if(b)b.click(); });
  await clearStory(14);
  const started=await p.evaluate(()=>{ const G=window.SG.G(); return !!(G&&G.party&&G.party.length); });
  if(!started){ // 실패 시 폴백 — 화면 전환 배선이 바뀌었을 수 있다
    await p.evaluate(()=>{ const S=window.SG; const G=S.freshState(); G.party=[S.makeMon("foxfire",5)]; S.setG(G); S.flow.enterMap(true); });
  }
  await p.waitForTimeout(500);

  const t0=Date.now();
  const stats={battles:0,wild:0,trainer:0,caught:0,potions:0,runs:0,heals:0,faints:0,milestones:[],samples:[]};
  let wasBattle=false, lastStep=-1, lastMoney=null, stuck=0, lastKey="", fleeTries=0, healCooldown=0, potionFail=0;

  const mark=(name,st)=>{ if(stats.milestones.some(m=>m.name===name))return;
    stats.milestones.push({name, t:Math.round((Date.now()-t0)/1000), lv:st.lv, battles:stats.battles, party:st.party});
    console.log(`     🏁 ${String(Math.round((Date.now()-t0)/1000)).padStart(4)}초  ${name} (파티 ${st.party}마리 · 선두 Lv${st.lv} · 누적 전투 ${stats.battles})`); };

  // 정령센터에서 회복 — 문으로 부딪혀 들어가 카운터의 간호사에게 부딪힌다(실제 조작과 같은 경로)
  const healAtCenter=async()=>{
    const done=await p.evaluate(async()=>{
      const S=window.SG,F=S.flow,G=S.G(); if(G.indoor)return "indoor";
      let best=null,bd=1e9;
      for(let y=0;y<50;y++)for(let x=0;x<25;x++){ if(F.tileAt(x,y)!=="+"){continue;}
        const d=Math.abs(x-G.pos.x)+Math.abs(y-G.pos.y); if(d<bd){bd=d;best={x,y};} }
      if(!best)return "no-center";
      // 문(+)은 비보행이라 인접 보행칸까지 간 뒤 부딪혀 들어간다
      const nb=[[0,1],[0,-1],[1,0],[-1,0]].map(([dx,dy])=>({x:best.x+dx,y:best.y+dy}))
                .filter(q=>F.walkable(q.x,q.y));
      if(!nb.length)return "no-approach";
      const spot=nb[0];
      const n=F.walkTo(spot.x,spot.y);
      return n?("walk:"+spot.x+","+spot.y+":"+best.x+","+best.y):"no-path";
    });
    if(!String(done).startsWith("walk"))return false;
    const [,sp,door]=String(done).split(":");
    const [sx,sy]=sp.split(",").map(Number), [dx,dy]=door.split(",").map(Number);
    let arrived=false, last=null, still=0;
    for(let i=0;i<60;i++){ await p.waitForTimeout(200);
      const q=await p.evaluate(()=>{ const G=window.SG.G(); return {x:G.pos.x,y:G.pos.y,inB:!!G.inBattle}; });
      if(q.inB)return false;
      if(q.x===sx&&q.y===sy){ arrived=true; break; }
      const k=q.x+","+q.y; if(k===last){ if(++still>=4)break; } else { still=0; last=k; } }
    // ⚠️ 도착 못 했는데 방향키를 누르면 엉뚱한 데서 헛돈다 → 포기하고 쿨다운(계속 재시도하면 루프를 통째로 잡아먹는다)
    if(!arrived)return false;
    const dir = dy<sy?"ArrowUp":dy>sy?"ArrowDown":dx<sx?"ArrowLeft":"ArrowRight";
    await p.keyboard.press(dir); await p.waitForTimeout(700);
    // 센터 안: 위로 걸어가 카운터의 간호사에게 부딪히면 회복
    for(let i=0;i<8;i++){ await p.keyboard.press("ArrowUp"); await p.waitForTimeout(260); }
    // ⚠️ 간호사 회복은 인사 → 회복 → 배웅의 다단 대사다. clearStory는 대사 **사이 공백**에서 조기 종료하므로
    //    회복이 끝날 때까지 대사를 넘기며 폴링해야 한다(안 그러면 항상 healed=false → 무한 회복 루프).
    let healed=false;
    for(let i=0;i<24;i++){
      await p.evaluate(()=>{ if(document.getElementById("dialogBox").classList.contains("show"))window.SG.flow.advanceDialog(); });
      await p.waitForTimeout(260);
      healed=await p.evaluate(()=>{ const G=window.SG.G(); return (G.party||[]).every(m=>!m||m.isEgg||m.hp===m.maxHp); });
      if(healed)break;
    }
    // 나가기
    for(let i=0;i<10;i++){ await p.keyboard.press("ArrowDown"); await p.waitForTimeout(220);
      const out=await p.evaluate(()=>!window.SG.G().indoor); if(out)break; }
    if(healed)stats.heals++;
    return healed;
  };

  const TRACE=!!process.env.TRACE;
  let iter=0, lastTrace=Date.now();
  const tr=(branch,st)=>{ if(!TRACE)return; const dt=Date.now()-lastTrace; lastTrace=Date.now();
    console.log(`   [${String(++iter).padStart(4)}] +${String(dt).padStart(5)}ms ${branch.padEnd(14)} `+
      `inB=${st.inB?1:0} busy=${st.busy?1:0} main=${st.mainOn?1:0} mv=${st.moveOn?1:0} ov=${st.overlay?1:0} `+
      `dlg=${st.dlg?1:0} indoor=${st.indoor||"-"} hp=${(st.hp*100).toFixed(0)}% pot=${st.potion} pos=${st.pos.x},${st.pos.y}`+
      (st.ovId!==undefined&&st.ovId!==null?` OV[${st.ovId}] "${st.ovTxt}" btns=${JSON.stringify(st.ovBtns)}`:"")); };
  while((Date.now()-t0)/1000 < BUDGET){
    const st=await p.evaluate(()=>{ const S=window.SG,G=S.G();
      const main=document.getElementById("mainMenu"), mv=document.getElementById("moveMenu");
      const lead=G.party[G.active];
      return { inB:!!G.inBattle, busy:!!G.busy, trainer:!!G.trainer, wild:!!G.inBattle&&!G.trainer,
        dlg:document.getElementById("dialogBox").classList.contains("show"),
        story:!!document.querySelector("#storyOverlay.active"),
        overlay:!!document.querySelector(".overlay.active"),
        ovId:(document.querySelector(".overlay.active")||{}).id||null,
        ovTxt:((document.querySelector(".overlay.active")||{}).textContent||"").replace(/\s+/g," ").trim().slice(0,60),
        ovBtns:[...(document.querySelector(".overlay.active")||{querySelectorAll:()=>[]}).querySelectorAll("button")].map(b=>(b.textContent||"").trim().slice(0,10)+(b.disabled?"[x]":"")).slice(0,8),
        mainOn: main&&getComputedStyle(main).display!=="none",
        moveOn: mv&&getComputedStyle(mv).display!=="none",
        badges:(G.badges||[]).length, lord:!!G.badge, champion:!!G.champion, indoor:G.indoor,
        hp: lead?lead.hp/lead.maxHp:1, lv: lead?lead.level:0, party:(G.party||[]).length,
        alive:(G.party||[]).filter(m=>m&&!m.isEgg&&m.hp>0).length,
        potion:(G.items.potion||0)+(G.items.hyperpotion||0),
        balls:(G.items.ball||0)+(G.items.greatball||0),
        foeHp: G.foe?G.foe.hp/G.foe.maxHp:1, money:G.money, pos:G.pos };
    });

    // 마일스톤
    if(st.badges>=1)mark("체육관1 뱃지",st);
    if(st.badges>=2)mark("체육관2 뱃지",st);
    if(st.badges>=3)mark("체육관3 뱃지",st);
    if(st.badges>=4)mark("체육관4 뱃지 — 리그 개방",st);
    if(st.lord)mark("숲의 군주 격파",st);
    if(st.champion){ mark("👑 챔피언 등극",st); break; }

    if(st.story||st.dlg){ tr("story/dlg",st); await clearStory(6); continue; }

    /* ── 전투 ── */
    if(st.inB){
      if(!wasBattle){ stats.battles++; st.trainer?stats.trainer++:stats.wild++; wasBattle=true; fleeTries=0; }
      // ⚠️ 선두가 기절하면 **강제 교체 오버레이**가 뜬다. 이걸 전투 밖에서만 처리하면
      //    봇이 메뉴를 못 찾아 Enter만 두드리며 영영 갇힌다(실측으로 확인).
      if(st.overlay){
        const picked=await p.evaluate(()=>{ const ov=document.querySelector(".overlay.active"); if(!ov)return false;
          // ⚠️ 오버레이 종류를 구분해야 한다. 예전엔 전부 "아무 버튼이나 누르기"로 처리해서,
          //    가방이 열린 채로 남으면 **주머니 탭만 무한 클릭**하며 전투가 영영 안 끝났다.
          if(ov.id==="bagOverlay"){ const x=[...ov.querySelectorAll("button")].find(b=>b.offsetParent!==null&&/✕|×/.test(b.textContent||""));
            if(x){ x.click(); return true; } return false; }
          // ⚠️ **숨겨진 버튼을 누르면 안 된다.** 강제 교체(기절 후)에서는 게임이 닫기 ✕를 display:none으로
          //    감추는데, .click()은 숨겨진 버튼도 동작한다 → 봇이 ✕를 눌러 닫고 게임이 다시 열어
          //    **무한 루프**에 빠졌다(실측: 이 하네스가 1~5분에 멈추던 진짜 원인).
          const visible=x=>x.offsetParent!==null && !x.disabled;
          const btns=[...ov.querySelectorAll("button")].filter(visible);
          const act=btns.find(x=>/내보내기|배운다|확인|예/.test(x.textContent||""))
                 || btns.find(x=>!/✕|×|닫기|취소|그만/.test(x.textContent||""));
          if(act){ act.click(); return true; }
          const card=[...ov.querySelectorAll(".mon-card")].find(c=>!/기절/.test(c.textContent||"")&&c.offsetParent!==null);
          if(card){ card.click(); return true; } return false; });
        tr("battle:overlay",st); if(!picked)await p.keyboard.press("Enter");
        await p.waitForTimeout(320); continue;
      }
      if(st.busy){ tr("battle:busy",st); await p.keyboard.press("Enter"); await p.waitForTimeout(130); continue; }
      if(st.moveOn){ tr("battle:move",st);
        const idx=await p.evaluate(()=>{ const S=window.SG,G=S.G(); const me=G.party[G.active],foe=G.foe;
          if(!me||!foe)return 0; let best=0,bs=-1;
          me.moves.forEach((k,i)=>{ const mo=S.MOVES[k]; if(!mo||(me.pp[k]||0)<=0)return;
            let e=S.EFF?S.EFF[mo.type][foe.type]:1;
            if(foe.type2&&foe.type2!==foe.type&&S.EFF)e*=S.EFF[mo.type][foe.type2];
            const stab=(mo.type===me.type||(me.type2&&mo.type===me.type2))?1.5:1;
            const sc=(mo.power||0)*e*stab; if(sc>bs){bs=sc;best=i;} });
          return best; });
        await p.evaluate(i=>{ const bs=[...document.querySelectorAll("#moveMenu .mbtn")].filter(x=>!x.disabled);
          (bs[i]||bs[0]||{click(){}}).click(); }, idx);
        await p.waitForTimeout(230); continue;
      }
      if(st.mainOn){ tr("battle:main",st);
        // 파티가 모자라면 약해진 야생을 잡는다(게이트는 3~6마리를 전제로 설계돼 있다)
        if(st.wild && st.party<6 && st.balls>0 && st.foeHp<0.55){
          const threw=await p.evaluate(()=>{ const b=[...document.querySelectorAll("#mainMenu .mbtn")].find(x=>/포획/.test(x.textContent||"")); if(b){b.click();return true;} return false; });
          if(threw){ await p.waitForTimeout(1400);
            const got=await p.evaluate(()=>window.SG.G().party.length);
            if(got>st.party)stats.caught++;
            continue; }
        }
        if(st.hp<0.35 && st.potion>0 && potionFail<5){
          await p.evaluate(()=>{ const b=[...document.querySelectorAll("#mainMenu .mbtn")].find(x=>/아이템/.test(x.textContent||"")); if(b)b.click(); });
          await p.waitForTimeout(300);
          const used=await p.evaluate(()=>{ const ov=document.getElementById("bagOverlay"); if(!ov)return false;
            const clickIn=root=>{ const rows=[...root.querySelectorAll("*")].filter(e=>/회복약/.test(e.textContent||"")&&e.children.length<6);
              for(const r of rows){ const btn=r.querySelector("button"); if(btn&&!btn.disabled){btn.click();return true;} }
              const d=[...root.querySelectorAll("button")].find(b=>/회복약|사용/.test(b.textContent||"")&&!b.disabled);
              if(d){d.click();return true;} return false; };
            if(clickIn(ov))return true;
            for(const t of [...ov.querySelectorAll("button")].filter(b=>/회복|도구/.test(b.textContent||""))){ t.click(); if(clickIn(ov))return true; }
            return false; });
          // ⚠️ 클릭이 "먹혔는지"를 개수 감소로 확인해야 한다 — 안 그러면 실패한 클릭을 성공으로 세고
          //    같은 분기를 무한 반복한다(실측: 5분에 169회).
          const after=await p.evaluate(()=>{ const G=window.SG.G(); return (G.items.potion||0)+(G.items.hyperpotion||0); });
          if(used && after<st.potion){ stats.potions++; await p.waitForTimeout(500);
            await p.evaluate(()=>{ const c=document.querySelector(".overlay.active .closex"); if(c)c.click(); });
            await p.waitForTimeout(200); continue; }
          await p.keyboard.press("Escape"); await p.waitForTimeout(200);
          potionFail++;   // 회복약 경로가 안 먹으면 그만 시도한다
        }
        if(st.hp<0.12 && st.wild && st.potion===0 && st.alive<=1 && fleeTries<3){ fleeTries++;
          await p.evaluate(()=>{ const b=[...document.querySelectorAll("#mainMenu .mbtn")].find(x=>/도망/.test(x.textContent||"")); if(b)b.click(); });
          stats.runs++; await p.waitForTimeout(400); continue;
        }
        await p.evaluate(()=>{ const b=[...document.querySelectorAll("#mainMenu .mbtn")].find(x=>/공격/.test(x.textContent||"")); if(b)b.click(); });
        await p.waitForTimeout(210); continue;
      }
      tr("battle:enter",st); await p.keyboard.press("Enter"); await p.waitForTimeout(170); continue;
    }

    /* ── 필드 ── */
    if(wasBattle)wasBattle=false;
    if(st.overlay){ tr("field:overlay",st); // 진화·기술배우기 등: 확인 버튼이 있으면 누르고 없으면 닫는다
      const handled=await p.evaluate(()=>{ const ov=document.querySelector(".overlay.active"); if(!ov)return false;
        const visible=x=>x.offsetParent!==null && !x.disabled;   // 숨겨진 버튼 클릭 금지(위 주석 참조)
        const b=[...ov.querySelectorAll("button")].filter(visible)
          .find(x=>/내보내기|배운다|확인|그만|예|닫기/.test(x.textContent||""));
        if(b){b.click();return true;} return false; });
      if(!handled){ await p.keyboard.press("Escape"); }
      await p.waitForTimeout(220); continue;
    }
    if(st.alive===0){ tr("field:wipe",st); stats.faints++; await p.waitForTimeout(700); continue; }

    if(lastMoney!=null && st.money<lastMoney-40)stats.faints++;
    lastMoney=st.money;

    // 파티가 다치면 센터로 — 회복약이 없으면 진행이 막히므로 봇도 실제 플레이처럼 회복하러 간다
    if((st.hp<0.5 || st.alive<st.party) && st.potion<=1 && !st.indoor && healCooldown<=0){
      tr("field:heal",st); const healed=await healAtCenter();
      if(healed){ healCooldown=0; continue; }
      healCooldown=12;   // 실패하면 한동안 다시 시도하지 않는다(진행을 막지 않게)
    }
    if(healCooldown>0)healCooldown--;

    // ⚠️ 실내에서는 목표 트래커가 숨겨져 있어 봇이 방향키 폴백으로 제자리를 맴돈다.
    //    (실측: 센터 안에서 7분간 갇혀 간호사에게만 계속 부딪혔다.) 실내면 먼저 출구로 나간다.
    if(st.indoor){ tr("field:exit",st);
      const walked=await p.evaluate(()=>{ const S=window.SG,F=S.flow,G=S.G();
        const I=F.INTERIORS[G.indoor]; if(!I)return false;
        // 출구 타일 바로 위 칸까지 걸어간 뒤 아래로 밟고 나간다
        const ax=I.exitX, ay=I.exitY-1;
        if(G.pos.x===ax&&G.pos.y===ay)return "at";
        return F.walkTo(ax,ay)?"walk":false; });
      if(walked==="walk"){ for(let i=0;i<40;i++){ await p.waitForTimeout(200);
          const q=await p.evaluate(()=>{ const S=window.SG,G=S.G(); const I=S.flow.INTERIORS[G.indoor]||{};
            return {done:!G.indoor||(G.pos.x===I.exitX&&G.pos.y===I.exitY-1), inB:!!G.inBattle}; });
          if(q.done||q.inB)break; } }
      for(let i=0;i<4;i++){ await p.keyboard.press("ArrowDown"); await p.waitForTimeout(240);
        const out=await p.evaluate(()=>!window.SG.G().indoor); if(out)break; }
      await p.waitForTimeout(300); continue;
    }

    tr("field:goal",st);
    const tapped=await p.evaluate(()=>{ const el=document.getElementById("goalTrack");
      if(el&&el.offsetParent){ el.click(); return true; } return false; });
    if(tapped){ let last=null,still=0;
      for(let i=0;i<50;i++){ await p.waitForTimeout(210);
        const q=await p.evaluate(()=>{ const G=window.SG.G();
          return {k:(G.indoor||"")+G.pos.x+","+G.pos.y, inB:!!G.inBattle, dlg:document.getElementById("dialogBox").classList.contains("show")}; });
        if(q.inB||q.dlg)break;
        if(q.k===last){ if(++still>=3)break; } else { still=0; last=q.k; } } }
    else { for(let i=0;i<4;i++){ await p.keyboard.press("ArrowUp"); await p.waitForTimeout(90); } }

    // 진행 정체 감지(같은 칸에서 계속 맴돌면 기록)
    const key=(st.indoor||"")+st.pos.x+","+st.pos.y+"/"+st.badges;
    if(key===lastKey)stuck++; else { stuck=0; lastKey=key; }

    const el=Math.floor((Date.now()-t0)/60000);
    if(el>lastStep){ lastStep=el;
      stats.samples.push({t:el, lv:st.lv, party:st.party, battles:stats.battles, badges:st.badges, pos:`${st.indoor||""}${st.pos.x},${st.pos.y}`}); }
  }

  const fin=await p.evaluate(()=>{ const G=window.SG.G();
    return { badges:(G.badges||[]).length, lord:!!G.badge, champion:!!G.champion,
      lv:(G.party||[]).map(m=>m&&m.level), party:(G.party||[]).length,
      caught:G.caught.size, money:G.money, pos:G.pos, indoor:G.indoor,
      defeated:[...G.defeated].length }; });

  const mins=((Date.now()-t0)/60000).toFixed(1);
  console.log(`\n  [전수 플레이스루] ${mins}분 · 예산 ${BUDGET}초`);
  console.log(`     전투 ${stats.battles}회 (야생 ${stats.wild} · 트레이너 ${stats.trainer}) · 포획 ${stats.caught} · 회복약 ${stats.potions} · 센터회복 ${stats.heals} · 도주 ${stats.runs}`);
  console.log(`     도달: 뱃지 ${fin.badges}/4 · 숲의 군주 ${fin.lord?"격파":"미격파"} · 챔피언 ${fin.champion?"등극":"미등극"}`);
  console.log(`     파티 ${fin.party}마리 Lv[${fin.lv.join(",")}] · 도감 ${fin.caught} · 소지금 ${fin.money} · 위치 ${fin.indoor||"필드"} ${fin.pos.x},${fin.pos.y}`);
  if(stats.samples.length){ console.log("     진행 곡선(1분 간격):");
    stats.samples.forEach(s=>console.log(`       ${String(s.t).padStart(2)}분  Lv${String(s.lv).padStart(2)} · 파티${s.party} · 전투 ${String(s.battles).padStart(3)}회 · 뱃지 ${s.badges} · ${s.pos}`)); }
  if(!stats.milestones.length)console.log("     ⚠️ 마일스톤 0건 — 예산 안에서 첫 뱃지도 못 얻었다");

  ok(errs.length===0, "런타임 에러 0"+(errs.length?": "+errs.slice(0,3).join(" / "):""));
  ok(stats.battles>0, `전투가 실제로 발생했다 (${stats.battles}회)`);
  ok(fin.party>=1, `파티가 유지된다 (${fin.party}마리)`);
  console.log(`  ℹ️  도달 지점은 예산·확률에 좌우된다 — 게이트가 아니라 관측값이다`);
  console.log(process.exitCode?"\n❌ 실패":"\n🎉 전수 플레이스루 종료");
  await b.close(); process.exit(process.exitCode||0);
})();
