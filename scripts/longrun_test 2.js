// 장기 플레이스루: 실제 입력만으로 "첫 체육관 뱃지"까지 플레이하고, 난이도 커브를 실측한다.
//
// 왜 필요한가
//   curve_test.js는 XP 경제만 모델링한 시뮬레이션이다. 상성·교체·회복약·도주·전멸이 빠져 있다.
//   이건 실제로 걸어다니고, 실제로 싸우고, 실제로 회복약을 먹으며 도달 레벨과 전투 수를 잰다.
//
// 봇의 행동은 "성실한 초보 플레이어" 수준으로만 둔다:
//   - 이동은 게임이 제공하는 목표 트래커 탭(실제 플레이어 조작)
//   - 전투는 상성이 가장 좋은 기술 선택, HP 35% 아래면 회복약, 위험하면 도주
//   - 전멸하면 그대로 진행(게임이 마을로 돌려보냄)
//
// 사용: node scripts/longrun_test.js <dist> [예산초]
const { chromium } = require("playwright"); const path=require("path");

(async()=>{
  // 예외로 죽어도 브라우저는 반드시 닫는다
  let b=null;
  const bail=async(e)=>{ console.log("  ❌ 예외:",e&&e.message||e); try{ if(b)await b.close(); }catch(_){}; process.exit(1); };
  process.on("uncaughtException",bail); process.on("unhandledRejection",bail);

  const BUDGET=Number(process.argv[3]||240);
  b=await chromium.launch();
  const p=await b.newPage({viewport:{width:430,height:760}});
  const errs=[]; p.on("pageerror",e=>errs.push(e.message));
  await p.goto("file://"+path.resolve(process.argv[2]));
  await p.waitForTimeout(900);
  const ok=(c,m)=>{ console.log((c?"  ✅ ":"  ❌ ")+m); if(!c)process.exitCode=1; };

  /* ── 시작(결정적) ── */
  const clearStory=async(max=50)=>{ for(let i=0;i<max;i++){
      const st=await p.evaluate(()=>({dlg:document.getElementById("dialogBox").classList.contains("show"),
                                      story:!!document.querySelector("#storyOverlay.active")}));
      if(!st.dlg&&!st.story)return;
      await p.evaluate(()=>{ const s=document.getElementById("storySkip")||document.getElementById("storyNext"); if(s)s.click(); });
      await p.keyboard.press("Enter"); await p.waitForTimeout(150); } };
  await p.click("#newGameBtn",{force:true}); await p.waitForTimeout(450);
  await p.evaluate(()=>{const c=document.querySelector("#charRow > *"); if(c)c.click();});
  await p.click("#confirmChar",{force:true}); await p.waitForTimeout(500); await clearStory();
  await p.evaluate(()=>{const c=document.querySelector("#starterRow > *"); if(c)c.click();});
  await p.click("#confirmStarter",{force:true}); await p.waitForTimeout(800); await clearStory();
  // 집 밖으로
  for(let i=0;i<25;i++){
    const st=await p.evaluate(()=>({indoor:window.SG.G().indoor,
      dlg:document.getElementById("dialogBox").classList.contains("show")}));
    if(!st.indoor)break;
    if(st.dlg)await p.keyboard.press("Enter"); else await p.keyboard.press("ArrowDown");
    await p.waitForTimeout(150);
  }

  const stats={ battles:0, wins:0, runs:0, faints:0, potions:0, catches:0,
                levelAtGym:null, battlesAtGym:null, gymTries:0, gymWin:false,
                trainerBattles:0, wildBattles:0, samples:[] };
  let wasBattle=false, lastStep=0;
  // ⚠️ blackout(전멸)은 파티를 즉시 회복시키므로 aliveCount===0으로는 못 잡는다.
  //    소지금이 크게 줄면 전멸로 본다(게임이 패널티로 돈을 깎는다).
  let lastMoney=null, xpBase=null;
  const t0=Date.now();

  /* ── 메인 루프 ── */
  while((Date.now()-t0)/1000 < BUDGET){
    const st=await p.evaluate(()=>{
      const G=window.SG.G();
      const main=document.getElementById("mainMenu"), mv=document.getElementById("moveMenu");
      const lead=G.party[G.active];
      return {
        view:([...document.querySelectorAll(".view")].find(x=>x.classList.contains("active"))||{}).id,
        inB:!!G.inBattle, busy:!!G.busy, trainer:!!G.trainer,
        dlg:document.getElementById("dialogBox").classList.contains("show"),
        story:!!document.querySelector("#storyOverlay.active"),
        overlay:!!document.querySelector(".overlay.active"),
        mainOn: main&&getComputedStyle(main).display!=="none",
        moveOn: mv&&getComputedStyle(mv).display!=="none",
        badges:(G.badges||[]).length, indoor:G.indoor,
        hp: lead?lead.hp/lead.maxHp:1, lv: lead?lead.level:0,
        aliveCount:(G.party||[]).filter(m=>m&&!m.isEgg&&m.hp>0).length,
        potion:(G.items.potion||0)+(G.items.hyperpotion||0),
        pos:G.pos,
      };
    });

    // 뱃지 획득 = 목표 달성
    {
      const cur=await p.evaluate(()=>{ const G=window.SG.G();
        const tot=(G.party||[]).reduce((a,m)=>a+(m&&!m.isEgg?(m.level*1000+(m.xp||0)):0),0);
        return { money:G.money, xp:tot }; });
      if(xpBase==null)xpBase=cur.xp;
      if(lastMoney!=null && cur.money < lastMoney-40){ stats.faints++; }
      lastMoney=cur.money; stats.xpGained=cur.xp-xpBase;
    }
    if(st.badges>=1){ stats.gymWin=true; stats.levelAtGym=st.lv; stats.battlesAtGym=stats.battles; break; }

    if(st.story||st.dlg){ await clearStory(6); continue; }

    /* ── 전투 ── */
    if(st.inB){
      if(!wasBattle){ stats.battles++; if(st.trainer)stats.trainerBattles++; else stats.wildBattles++; wasBattle=true; }
      if(st.busy){ await p.keyboard.press("Enter"); await p.waitForTimeout(120); continue; }
      if(st.moveOn){
        // 상성이 가장 좋은 기술을 고른다(성실한 플레이어 수준)
        const idx=await p.evaluate(()=>{
          const S=window.SG,G=S.G(); const me=G.party[G.active],foe=G.foe;
          if(!me||!foe)return 0;
          let best=0,bs=-1;
          me.moves.forEach((k,i)=>{
            const mo=S.MOVES[k]; if(!mo)return;
            if((me.pp[k]||0)<=0)return;
            let e=S.EFF?S.EFF[mo.type][foe.type]:1;
            if(foe.type2&&foe.type2!==foe.type&&S.EFF)e*=S.EFF[mo.type][foe.type2];
            const stab=(mo.type===me.type||(me.type2&&mo.type===me.type2))?1.5:1;
            const sc=(mo.power||0)*e*stab;
            if(sc>bs){ bs=sc; best=i; }
          });
          return best;
        });
        await p.evaluate(i=>{ const b=[...document.querySelectorAll("#moveMenu .mbtn")].filter(x=>!x.disabled);
          (b[i]||b[0]||{click(){}}).click(); }, idx);
        await p.waitForTimeout(240);
        continue;
      }
      if(st.mainOn){
        // 위험하면 회복 → 그래도 안 되면 도주(야생만)
        if(st.hp<0.35 && st.potion>0){
          await p.evaluate(()=>{ const b=[...document.querySelectorAll("#mainMenu .mbtn")].find(x=>x.textContent.includes("아이템")); if(b)b.click(); });
          await p.waitForTimeout(300);
          // ⚠️ 가방은 주머니 탭이 있어 회복약이 첫 화면에 없을 수 있다.
          //    탭을 순회하며 "회복약" 항목의 사용 버튼을 찾아 누른다.
          const used=await p.evaluate(()=>{
            const clickIn=root=>{
              const rows=[...root.querySelectorAll("*")].filter(e=>/회복약/.test(e.textContent||"") && e.children.length<6);
              for(const r of rows){
                const btn=r.querySelector("button")||(r.closest("*")||{}).querySelector?.("button");
                if(btn && !btn.disabled){ btn.click(); return true; }
              }
              const direct=[...root.querySelectorAll("button")].find(b=>/회복약|사용/.test(b.textContent||"") && !b.disabled);
              if(direct){ direct.click(); return true; }
              return false;
            };
            const ov=document.getElementById("bagOverlay");
            if(!ov)return false;
            if(clickIn(ov))return true;
            const tabs=[...ov.querySelectorAll("button")].filter(b=>/회복|도구|열매|볼/.test(b.textContent||""));
            for(const t of tabs){ t.click(); if(clickIn(ov))return true; }
            return false;
          });
          if(used){ stats.potions++; await p.waitForTimeout(500);
            await p.evaluate(()=>{ const c=document.querySelector(".overlay.active .closex"); if(c)c.click(); });
            await p.waitForTimeout(200); continue; }
          await p.keyboard.press("Escape"); await p.waitForTimeout(200);
        }
        if(st.hp<0.18 && !st.trainer){
          await p.evaluate(()=>{ const b=[...document.querySelectorAll("#mainMenu .mbtn")].find(x=>x.textContent.includes("도망")); if(b)b.click(); });
          stats.runs++; await p.waitForTimeout(400); continue;
        }
        await p.evaluate(()=>{ const b=[...document.querySelectorAll("#mainMenu .mbtn")].find(x=>x.textContent.includes("공격")); if(b)b.click(); });
        await p.waitForTimeout(220);
        continue;
      }
      await p.keyboard.press("Enter"); await p.waitForTimeout(180);
      continue;
    }

    /* ── 필드 ── */
    if(wasBattle){ wasBattle=false; }
    if(st.overlay){ await p.keyboard.press("Escape"); await p.waitForTimeout(150); continue; }

    // 전멸 감지(파티 전원 기절 → 게임이 마을로 되돌림)
    if(st.aliveCount===0){ stats.faints++; await p.waitForTimeout(600); continue; }

    // 목표 트래커 탭 = 실제 플레이어 조작. 목표 지점으로 자동 이동한다.
    const tapped=await p.evaluate(()=>{ const el=document.getElementById("goalTrack");
      if(el && el.offsetParent){ el.click(); return true; } return false; });
    if(tapped){
      // ⚠️ 매 루프마다 재탭하면 경로가 계속 리셋돼 제자리를 맴돈다.
      //    이동이 멈추거나(도착·조우) 전투가 걸릴 때까지 기다린 뒤 다음 판단을 한다.
      let last=null, still=0;
      for(let i=0;i<40;i++){
        await p.waitForTimeout(220);
        const q=await p.evaluate(()=>{ const G=window.SG.G();
          return {k:G.pos.x+","+G.pos.y, inB:!!G.inBattle, dlg:document.getElementById("dialogBox").classList.contains("show")}; });
        if(q.inB||q.dlg)break;
        if(q.k===last){ if(++still>=3)break; } else { still=0; last=q.k; }
      }
    }
    else { for(let i=0;i<4;i++){ await p.keyboard.press("ArrowUp"); await p.waitForTimeout(90); } }

    // 진행 표본(30초마다)
    const el=Math.floor((Date.now()-t0)/30000);
    if(el>lastStep){ lastStep=el;
      stats.samples.push({t:el*30, lv:st.lv, battles:stats.battles, badges:st.badges, pos:`${st.pos.x},${st.pos.y}`}); }
  }

  const fin=await p.evaluate(()=>{ const G=window.SG.G();
    return { badges:(G.badges||[]).length, lv:(G.party||[]).map(m=>m&&m.level),
             party:(G.party||[]).length, caught:G.caught.size, seen:G.seen.size,
             money:G.money, defeated:[...G.defeated].length, pos:G.pos, indoor:G.indoor }; });

  const mins=((Date.now()-t0)/60000).toFixed(1);
  console.log(`\n  [장기 플레이 결과] ${mins}분 · 예산 ${BUDGET}초`);
  console.log(`     전투 ${stats.battles}회 (야생 ${stats.wildBattles} · 트레이너 ${stats.trainerBattles})`);
  console.log(`     회복약 ${stats.potions}회 · 도주 ${stats.runs}회 · 전멸 ${stats.faints}회 · 누적 XP +${stats.xpGained||0}`);
  console.log(`     최종: 뱃지 ${fin.badges} · 파티 Lv ${fin.lv.join("/")} · 목격 ${fin.seen}종 · 소지금 ${fin.money}`);
  console.log(`     위치: ${fin.indoor||"필드"} ${fin.pos.x},${fin.pos.y} · 격파 ${fin.defeated}건`);
  if(stats.samples.length){
    console.log("     진행 곡선(30초 간격):");
    stats.samples.forEach(s=>console.log(`       ${String(s.t).padStart(3)}초  Lv${String(s.lv).padStart(2)} · 전투 ${String(s.battles).padStart(2)}회 · 뱃지 ${s.badges} · (${s.pos})`));
  }
  console.log("");

  ok(errs.length===0, `장기 플레이 중 런타임 에러 0 (${errs.length}${errs.length?": "+errs.slice(0,3).join(" / "):""})`);
  ok(stats.battles>=3, `전투가 실제로 여러 번 일어났다 (${stats.battles}회)`);
  ok(fin.party>=1, `파티가 유지된다 (${fin.party}마리)`);
  // 짧은 예산에선 레벨업까지 못 갈 수 있다 → 경험치를 실제로 얻었는지로 본다
  ok((stats.xpGained||0)>0, `경험치를 실제로 획득 (+${stats.xpGained||0})`);
  // ⚠️ 전멸 횟수는 게이트가 아니라 참고치다. 소지금 급감으로 '추정'하는 프록시라
  //    야생 승리 수입과 섞여 부정확하고(경향치), 봇의 무작위 동선에 따라 크게 흔들린다
  //    (같은 코드로 1·2·1·5회가 나왔다). 하드 임계값을 걸면 간헐적으로 실패한다.
  console.log(`  ℹ️  전멸 추정 ${stats.faints}회 (소지금 프록시 — 경향치로만 볼 것)`);
  // 난이도 실측 결과는 참고치로 출력 — 뱃지 획득 여부는 예산에 좌우되므로 실패로 보지 않는다
  if(stats.gymWin) console.log(`  ℹ️  첫 뱃지 획득 — 그 시점 Lv${stats.levelAtGym} · 누적 전투 ${stats.battlesAtGym}회`);
  else console.log(`  ℹ️  예산 내 첫 뱃지 미획득 (전투 ${stats.battles}회, Lv ${Math.max(...fin.lv)}) — 예산을 늘려 재측정 가능`);

  console.log(process.exitCode?"\n❌ 실패":"\n🎉 장기 플레이스루 통과");
  await b.close(); process.exit(process.exitCode||0);
})();
