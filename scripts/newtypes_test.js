// 새 타입/기술/냉동 회귀 테스트: 얼음/독/땅 크리처 타이핑, 새 기술 정의, 냉동(frz) 상태 표시.
const { chromium } = require("playwright"); const path=require("path");
(async()=>{ const b=await chromium.launch();
  const p=await b.newPage({viewport:{width:430,height:760}});
  const errs=[]; p.on("pageerror",e=>errs.push(e.message));
  await p.goto("file://"+path.resolve(process.argv[2])); await p.waitForTimeout(800);
  const ok=(c,m)=>{ console.log((c?"  ✅ ":"  ❌ ")+m); if(!c)process.exitCode=1; };

  const r=await p.evaluate(()=>{ const S=window.SG;
    const t=id=>{ const m=S.makeMon(id,20); return m.type+(m.type2?"/"+m.type2:""); };
    const mv=k=>!!S.MOVES[k];
    // 모든 크리처의 기술이 MOVES에 존재하는지(오타/누락)
    let badMove=0; for(const sp of S.DEX){ for(const k of (sp.moves||[])) if(!S.MOVES[k])badMove++; for(const [,k] of (sp.learn||[])) if(!S.MOVES[k])badMove++; }
    // 냉동 상태 표시
    const G=S.freshState(); G.party=[S.makeMon("emberwolf",20)]; G.active=0; G.party[0].status="frz"; G.inBattle=true; G.foe=S.makeMon("shellow",10); S.setG(G);
    let frzChip=""; try{ S.flow.renderCombatants(); frzChip=document.getElementById("meStages").innerHTML; }catch(e){ frzChip="ERR:"+e.message; }
    return { iceling:t("iceling"), frostwyrm:t("frostwyrm"), snowl:t("snowl"), glaciarch:t("glaciarch"),
      jellure:t("jellure"), swampfrog:t("swampfrog"), burrowmouse:t("burrowmouse"), boulderin:t("boulderin"), magmadon:t("magmadon"),
      badMove, icebeam:mv("icebeam"), blizzard:mv("blizzard"), sludge:mv("sludge"), quake:mv("quake"), dig:mv("dig"),
      frzChip }; });

  ok(r.badMove===0, `모든 크리처 기술이 MOVES에 존재 (누락 ${r.badMove})`);
  ok(r.iceling==="ice", `얼음정=얼음 (${r.iceling})`);
  ok(r.frostwyrm==="ice/dragon", `빙하룡=얼음/용 (${r.frostwyrm})`);
  ok(r.snowl==="flying/ghost", `눈올빼=비행/고스트 (${r.snowl})`);
  ok(r.glaciarch==="ice/dragon", `빙하제=얼음/용 (${r.glaciarch})`);
  ok(r.jellure==="water/ghost", `개굴알=물/고스트 (${r.jellure})`);
  ok(r.swampfrog==="water/poison", `개굴몽=물/독 (${r.swampfrog})`);
  ok(r.burrowmouse==="ground", `굴다람=땅 (${r.burrowmouse})`);
  ok(r.boulderin==="rock/steel", `바위정=바위/강철 (${r.boulderin})`);
  ok(r.magmadon==="fire/ground", `마그마룡=불/땅 (${r.magmadon})`);
  ok(r.icebeam&&r.blizzard&&r.sludge&&r.quake&&r.dig, "새 기술 정의됨(냉동빔/눈보라/오물폭탄/지진/땅파기)");
  ok(r.frzChip.includes("냉동"), `냉동 상태칩 표시 (${r.frzChip.replace(/<[^>]+>/g,'').trim()})`);
  ok(errs.length===0, "런타임 에러 0"+(errs.length?": "+errs.slice(0,3).join(" / "):""));
  console.log(process.exitCode?"\n❌ 실패":"\n🎉 새 타입/냉동 통과");
  await b.close(); process.exit(process.exitCode||0);
})();
