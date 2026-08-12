// 특성 확장 + 싸라기눈 날씨 회귀 테스트.
const { chromium } = require("playwright"); const path=require("path");
(async()=>{ const b=await chromium.launch();
  const p=await b.newPage({viewport:{width:430,height:760}});
  const errs=[]; p.on("pageerror",e=>errs.push(e.message));
  await p.goto("file://"+path.resolve(process.argv[2])); await p.waitForTimeout(800);
  const ok=(c,m)=>{ console.log((c?"  ✅ ":"  ❌ ")+m); if(!c)process.exitCode=1; };

  const r=await p.evaluate(()=>{ const S=window.SG; S.setG(S.freshState());
    const mk=ov=>Object.assign({atk:50,spa:50,def:50,spDef:50,hp:100,maxHp:100,stages:{atk:0,def:0,spd:0},status:null,type:"water",type2:null},ov);
    const dmg=(atk,defOv)=>S.damage(mk({}), mk(defOv), {type:atk,power:60,acc:100,pp:10});
    const levEff=dmg("ground",{ability:"levitate"}).eff;
    const normEff=dmg("ground",{ability:"guts",type:"grass"}).eff;   // 땅→풀 0.5 (부유 없음)
    // 싸라기눈: 얼음 위력 ×1.2 (실제 mon + 랜덤 고정으로 결정적 비교)
    Math.random=()=>0.9; const A=S.makeMon("frostwyrm",40), D=S.makeMon("seedbean",40);
    const g=S.G(); const noHail=S.damage(A,D,S.MOVES.icebeam).dmg; g.weather="hail"; const yesHail=S.damage(A,D,S.MOVES.icebeam).dmg; g.weather=null;
    return { levEff, normEff, iceAbil:S.DEFAULT_ABILITY.ice, groundAbil:S.DEFAULT_ABILITY.ground, jellureAbil:S.makeMon("jellure",20).ability,
      hailMv:!!S.MOVES.hailstorm, noHail, yesHail }; });

  ok(r.levEff===0, `부유: 땅 기술 무효 (eff=${r.levEff})`);
  ok(r.normEff>0, `부유 없으면 땅 기술 유효 (eff=${r.normEff})`);
  ok(r.iceAbil==="icebody", `얼음 타입 기본특성=얼음몸 (${r.iceAbil})`);
  ok(r.groundAbil==="sturdy", `땅 타입 기본특성=옹골참 (${r.groundAbil})`);
  ok(r.jellureAbil==="levitate", `개굴알 특성=부유 (${r.jellureAbil})`);
  ok(r.hailMv, "싸라기눈 기술 정의됨");
  ok(r.yesHail>r.noHail, `싸라기눈 때 얼음 위력↑ (${r.noHail}→${r.yesHail})`);
  ok(errs.length===0, "런타임 에러 0"+(errs.length?": "+errs.slice(0,3).join(" / "):""));
  console.log(process.exitCode?"\n❌ 실패":"\n🎉 특성/날씨 통과");
  await b.close(); process.exit(process.exitCode||0);
})();
