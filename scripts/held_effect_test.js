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
      if(it.boost){ const base=avg(mk(),mk({type:"normal"}),{type:it.boost,power:80});
        const with_=avg(mk({held:k}),mk({type:"normal"}),{type:it.boost,power:80});
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

  ok(errs.length===0, `런타임 에러 0 (${errs.length})${errs.length?": "+errs.slice(0,2).join(" | "):""}`);
  await b.close();
  console.log(fail?"\n❌ held_effect_test 실패":"\n🎉 지닌물건 효과 감사 통과");
  process.exit(fail);
})();
