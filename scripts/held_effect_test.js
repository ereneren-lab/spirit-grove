// 지닌물건 효과 감사 — **표에 선언한 효과 필드가 실제로 게임에서 도는가**.
//
// 왜 있나
//   HELD_ITEMS는 "전투 효과를 데이터 필드로 표현해 단일 출처에서 읽는다"는 설계인데,
//   2026-08-06에 재보니 **`lifeorb`의 `recoil:0.1`은 아무 데서도 안 읽히고 있었다**.
//   실제 반동은 `att.held==="lifeorb"` 키 비교 + `maxHp/10` 하드코딩이었다 →
//   반동이 있는 지닌물건을 새로 추가해도 **조용히 아무 일도 안 일어난다**.
//   메시지도 "생명의 구슬의 반동"으로 박혀 있어 다른 아이템이면 엉뚱한 이름이 뜬다.
//   이 저장소의 단골 사고("정의는 있는데 플레이에서 안 돈다")가 데이터 필드 층에서 재발한 것이다.
//   → 선언한 필드마다 **관측 가능한 차이**를 단정한다. 새 아이템을 넣으면 자동으로 검사 대상이 된다.
//
// ⚠️ dmg·spdx·boost는 순수 함수(damage·effSpd)로 재고, recoil·lock·sash는 **실제 전투 한 턴**을 돌려 잰다.
const { chromium } = require("playwright"); const path=require("path");

(async()=>{
  const b=await chromium.launch();
  const p=await b.newPage({viewport:{width:430,height:760}});
  const errs=[]; p.on("pageerror",e=>errs.push(e.message));
  let fail=0; const ok=(c,m)=>{ console.log((c?"  ✅ ":"  ❌ ")+m); if(!c)fail=1; };
  process.on("unhandledRejection",async e=>{ console.log("❌ "+e); await b.close(); process.exit(1); });
  await p.goto("file://"+path.resolve(process.argv[2])); await p.waitForTimeout(900);

  console.log("\n[1] dmg · spdx · boost — 선언한 배율이 실제 계산에 반영된다");
  const pure=await p.evaluate(()=>{ const S=window.SG, H=S.HELD_ITEMS;
    const mk=(o)=>Object.assign(S.makeMon("racoonmon",50),{atk:120,spa:120,def:100,spDef:100,spd:100,
      maxHp:999,hp:999,status:null,stages:S.newStages(),held:null},o||{});
    const avg=(a,d,mv,n=300)=>{ let s=0; for(let i=0;i<n;i++)s+=S.damage(a,d,mv).dmg; return s/n; };
    const out=[];
    for(const k in H){ const it=H[k];
      if(it.dmg){ const base=avg(mk(),mk(),{type:"normal",power:80});
        const with_=avg(mk({held:k}),mk(),{type:"normal",power:80});
        const want=it.dmg>1, got=with_>base*1.03, got2=with_<base*0.97;
        out.push({k, field:"dmg", val:it.dmg, ok:(want?got:got2), base:Math.round(base), with:Math.round(with_)}); }
      if(it.spdx){ const a=mk(), c=mk({held:k});
        out.push({k, field:"spdx", val:it.spdx, ok:Math.abs(S.flow?0:0)===0 && (it.spdx>1? S.effSpd(c)>S.effSpd(a) : S.effSpd(c)<S.effSpd(a)),
                  base:Math.round(S.effSpd(a)), with:Math.round(S.effSpd(c))}); }
      if(it.boost){ /* ⚠️ 타깃은 어떤 타입에도 면역이 없는 순수 water로(고스트→노말·에스퍼→악 같은 0배 방지).
                        racoonmon이 normal/dark라 type2까지 명시로 덮어야 한다. */
        const tgt=()=>mk({type:"water",type2:null});
        const base=avg(mk(),tgt(),{type:it.boost,power:80});
        const with_=avg(mk({held:k}),tgt(),{type:it.boost,power:80});
        out.push({k, field:"boost", val:it.boost, ok:with_>base*1.03, base:Math.round(base), with:Math.round(with_)}); }
    }
    return out; });
  const bad=pure.filter(r=>!r.ok);
  const byField=f=>pure.filter(r=>r.field===f).length;
  ok(bad.length===0, `dmg ${byField("dmg")}건 · spdx ${byField("spdx")}건 · boost ${byField("boost")}건 전부 계산에 반영` +
     (bad.length?` — 반영 안 됨: ${bad.map(r=>`${r.k}.${r.field}(${r.base}→${r.with})`).join(", ")}`:""));

  console.log("\n[2] recoil — 선언한 비율만큼 실제로 반동을 입는다 (하드코딩이면 여기서 걸린다)");
  /* ⚠️ 예전 코드는 lifeorb만 알고 비율도 1/10 고정이었다 → recoil:0.05짜리를 넣어도 0.1이 깎이거나
     아예 안 깎였다. **선언값과 실측 감소량이 맞는지**를 본다. */
  const recoilKeys=await p.evaluate(()=>Object.keys(window.SG.HELD_ITEMS).filter(k=>window.SG.HELD_ITEMS[k].recoil));
  for(const k of recoilKeys){
    const r=await p.evaluate(async(k)=>{ const S=window.SG,F=S.flow;
      S.setG(S.freshState()); S.CONFIG.reduceMotion=true; S.CONFIG.battleText="auto"; const G=S.G();
      const m=S.makeMon("racoonmon",50); m.moves=["tackle"]; m.pp={tackle:30};
      m.maxHp=1000; m.hp=1000; m.atk=200; m.held=k;
      const f=S.makeMon("racoonmon",30); f.moves=["tackle"]; f.pp={tackle:30}; f.maxHp=99999; f.hp=99999;
      G.party=[m]; G.active=0; G.foe=f; G.inBattle=true; G.busy=false; G.wild=true; F.setupBattleUI();
      await new Promise(r=>setTimeout(r,120));
      const before=m.hp;
      await F.doMove("tackle");
      const dl=Date.now()+9000; while(S.G().busy&&Date.now()<dl)await new Promise(r=>setTimeout(r,50));
      const foeHit=99999-f.hp;
      return {lost:before-m.hp, want:Math.floor(1000*S.HELD_ITEMS[k].recoil), foeHit, msg:(document.getElementById("battleMsg")||{}).textContent||""};
    }, k);
    // 상대가 반격해 깎일 수 있으므로 "정확히 want"가 아니라 "want 이상 감소"로 본다(0이면 반동이 아예 없다).
    ok(r.foeHit>0 && r.lost>=r.want && r.lost>0,
       `${k}: 최대HP의 ${Math.round(r.want/10)}% 반동 기대 ${r.want} · 실측 감소 ${r.lost} (상대 피해 ${r.foeHit})`);
    const ko=await p.evaluate(k=>window.SG.HELD_ITEMS[k].ko, k);
    ok(r.msg.indexOf("생명의 구슬")<0 || ko==="생명의구슬",
       `반동 메시지가 아이템 이름을 쓴다 (${ko})`);
  }

  console.log("\n[3] lock — 구애 계열은 첫 기술로 고정된다");
  const lockKeys=await p.evaluate(()=>Object.keys(window.SG.HELD_ITEMS).filter(k=>window.SG.HELD_ITEMS[k].lock));
  for(const k of lockKeys){
    const r=await p.evaluate(async(k)=>{ const S=window.SG,F=S.flow;
      S.setG(S.freshState()); S.CONFIG.reduceMotion=true; S.CONFIG.battleText="auto"; const G=S.G();
      const m=S.makeMon("racoonmon",50); m.moves=["tackle","growl"]; m.pp={tackle:30,growl:30};
      m.maxHp=9999; m.hp=9999; m.atk=200; m.held=k;
      const f=S.makeMon("racoonmon",30); f.moves=["tackle"]; f.pp={tackle:30}; f.maxHp=99999; f.hp=99999;
      G.party=[m]; G.active=0; G.foe=f; G.inBattle=true; G.busy=false; G.wild=true; F.setupBattleUI();
      await new Promise(r=>setTimeout(r,120));
      await F.doMove("tackle");
      const dl=Date.now()+9000; while(S.G().busy&&Date.now()<dl)await new Promise(r=>setTimeout(r,50));
      return {lock:m._choiceLock||null};
    }, k);
    ok(r.lock==="tackle", `${k}: 첫 기술로 고정됐다 (_choiceLock=${r.lock})`);
  }

  console.log("\n[4] 모든 지닌물건이 획득 가능하다");
  /* ⚠️ 만들어놓고 파는 곳이 없으면 그대로 죽은 콘텐츠다(tm_confuse가 그랬다). */
  const reach=await p.evaluate(()=>{ const S=window.SG,F=S.flow;
    const sold=new Set(); (F.SHOP||[]).forEach(x=>sold.add(x.key)); (F.PREMIUM||[]).forEach(x=>sold.add(x.key));
    (F.GROUND_ITEMS||[]).forEach(x=>sold.add(x.item)); (F.HIDDEN||[]).forEach(x=>sold.add(x.item));
    Object.values(S.TRAINERS||{}).forEach(t=>Object.keys(t.reward||{}).forEach(k=>sold.add(k)));
    const wild=new Set(); const W=S.WILD_HELD||{};
    Object.keys(W).forEach(t=>(W[t]||[]).forEach(k=>wild.add(k)));
    const all=Object.keys(S.HELD_ITEMS);
    return {all:all.length, missing:all.filter(k=>!sold.has(k)&&!wild.has(k)), wildN:wild.size}; });
  ok(reach.missing.length===0, `지닌물건 ${reach.all}종 전부 획득 경로가 있다 (없음: ${reach.missing.join(",")||"—"})`);
  console.log(`     참고: 야생이 들고 나오는 종류는 ${reach.wildN}가지다(나머지는 상점·보상 경로).`);

  console.log("\n[5] 야생 풀과 트레이너 풀이 실제로 분리돼 있다");
  /* 왜 있나 — 예전엔 두 풀이 하나였다. trainerMon이 makeMon을 그대로 쓰기 때문에
     "야생 풀을 넓혔더니 트레이너가 같이 세지는" 사고가 조용히 일어난다(실측 10.8%가 지닌물건을 든다).
     2026-08-06에 TRAINER_HELD로 분리했고, 이 단정이 그 분리를 고정한다.
     ⚠️ 표를 비교하는 게 아니라 **실제 트레이너 생성 경로(F.trainerMon)를 돌려서** 잰다 —
        makeMon 호출부 하나가 TRAINER_HELD 인자를 빠뜨리면 그 트레이너만 야생 풀을 쓰는데,
        표만 보면 그걸 절대 못 잡는다. */
  const sep=await p.evaluate(()=>{ const S=window.SG,F=S.flow;
    const flat=o=>{ const s=new Set(); Object.keys(o||{}).forEach(t=>(o[t]||[]).forEach(k=>s.add(k))); return s; };
    const wildSet=flat(S.WILD_HELD), trSet=flat(S.TRAINER_HELD);
    const wildOnly=[...wildSet].filter(k=>!trSet.has(k));   // 야생에서만 나와야 하는 것
    S.setG(S.freshState()); const G=S.G();
    // ── 트레이너 경로: 실제 팀 데이터를 실제 생성 함수로 만든다
    const teams=Object.values(S.TRAINERS||{}).filter(t=>Array.isArray(t.team)&&t.team.length);
    const trHeld={}; let nTr=0,heldTr=0;
    for(let rep=0;rep<30;rep++) for(const t of teams){
      G.trainer={key:"_t",name:"x",em:"🧑",team:t.team,idx:0,reward:null,money:0,
                 boss:false,rematch:false,mons:[],fainted:new Set(),switches:0};
      for(let i=0;i<t.team.length;i++){ const m=F.trainerMon(i); if(!m)continue;
        nTr++; if(m.held){ heldTr++; trHeld[m.held]=(trHeld[m.held]||0)+1; } } }
    // ── 야생 경로: makeMon 기본값(=WILD_HELD)
    const wHeld={}; let nW=0,heldW=0;
    const species=(S.DEX||[]).filter(d=>!d.legend);
    for(let rep=0;rep<30;rep++) for(const sp of species){ const m=S.makeMon(sp.id,30);
      nW++; if(m.held){ heldW++; wHeld[m.held]=(wHeld[m.held]||0)+1; } }
    return { wildOnly, leak:Object.keys(trHeld).filter(k=>wildOnly.includes(k)),
             unreached:wildOnly.filter(k=>!wHeld[k]),
             nTr,heldTr,nW,heldW, trKinds:Object.keys(trHeld).length }; });
  ok(sep.wildOnly.length>0, `야생 전용 지닌물건이 ${sep.wildOnly.length}종 있다 — 분리가 유명무실하지 않다`);
  ok(sep.leak.length===0,
     `트레이너 정령 ${sep.nTr}마리 중 야생 전용 아이템을 든 개체가 0이다` +
     (sep.leak.length?` — 샜다: ${sep.leak.join(",")} (makeMon 호출부가 TRAINER_HELD를 빠뜨렸다)`:""));
  ok(sep.unreached.length===0,
     `야생 전용 ${sep.wildOnly.length}종이 전부 야생 생성에서 실제로 나온다` +
     (sep.unreached.length?` — 안 나옴: ${sep.unreached.join(",")}`:""));
  console.log(`     휴대율: 트레이너 ${(sep.heldTr/sep.nTr*100).toFixed(1)}% (${sep.trKinds}종) · ` +
              `야생 ${(sep.heldW/sep.nW*100).toFixed(1)}%`);

  /* ⚠️ 듀오 트레이너는 **trainerMon을 안 거친다** — startDouble이 상대 2마리를 직접 만들고
     dbReplace가 벤치 교대분을 또 만든다. makeMon 호출부가 셋이라 위 단정만으론 두 곳이 사각지대다.
     여기서도 게임 함수를 그대로 부른다(같은 로직을 테스트에 재구현하면 인자 누락을 못 잡는다). */
  const duo=await p.evaluate(async()=>{ const S=window.SG,F=S.flow;
    const flat=o=>{ const s=new Set(); Object.keys(o||{}).forEach(t=>(o[t]||[]).forEach(k=>s.add(k))); return s; };
    const wildOnly=[...flat(S.WILD_HELD)].filter(k=>!flat(S.TRAINER_HELD).has(k));
    S.CONFIG.reduceMotion=true; S.CONFIG.textSpeed=0.01;   // dbReplace의 연출 대기를 0에 가깝게
    // 휴대율이 가장 높은 tier3에서 뽑아 표본을 아낀다(14%)
    const t3=(S.DEX||[]).filter(d=>!d.legend&&d.tier>=3).map(d=>d.id);
    const held={}; let n=0,nHeld=0;
    for(let rep=0;rep<60;rep++){
      S.setG(S.freshState()); const G=S.G();
      G.party=[S.makeMon("racoonmon",30),S.makeMon("dewdrop",30)];
      G.party.forEach(m=>{ m.hp=m.maxHp; });
      const pick=()=>[t3[Math.floor(Math.random()*t3.length)],40];
      if(!F.startDouble([pick(),pick(),pick(),pick()],"테스트 듀오",null))continue;   // 뒤 2마리는 벤치
      const DB=F.getDB(); if(!DB)continue;
      const tally=m=>{ if(!m)return; n++; if(m.held){ nHeld++; held[m.held]=(held[m.held]||0)+1; } };
      DB.foes.forEach(tally);
      DB.foes.forEach(f=>{ if(f)f.hp=0; });   // 둘 다 쓰러뜨려 벤치 교대를 강제한다
      await F.dbReplace();
      DB.foes.forEach(tally);
      G.inBattle=false; G.double=false;
    }
    return { wildOnly, leak:Object.keys(held).filter(k=>wildOnly.includes(k)), n, nHeld,
             kinds:Object.keys(held).length }; });
  ok(duo.n>0, `듀오 트레이너 경로가 실제로 돌았다 (상대 ${duo.n}마리 생성)`);
  ok(duo.leak.length===0,
     `듀오 상대 ${duo.n}마리(지닌물건 ${duo.nHeld}개) 중 야생 전용 아이템 0` +
     (duo.leak.length?` — 샜다: ${duo.leak.join(",")} (startDouble/dbReplace가 TRAINER_HELD를 빠뜨렸다)`:""));

  ok(errs.length===0, `런타임 에러 0 (${errs.length})${errs.length?": "+errs.slice(0,2).join(" | "):""}`);
  await b.close();
  console.log(fail?"\n❌ held_effect_test 실패":"\n🎉 지닌물건 효과 감사 통과");
  process.exit(fail);
})();
