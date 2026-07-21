// 순수 규칙 단위 테스트 — 브라우저 없이 node에서 밀리초 단위로 돈다.
//
// 왜 있는가
//   이 프로젝트 테스트 64개 중 56개가 Chromium을 띄운다. 그런데 그중 상당수는
//   게임 함수를 직접 호출할 뿐이라 브라우저가 필요해서가 아니라 코드가 HTML 안에 갇혀 있어서였다.
//   순수 규칙을 src/rules/*.js로 떼어낸 뒤로는 여기서 즉시 검증할 수 있다.
//   ⚠️ 브라우저가 필요한 것(DOM/캔버스/오디오/입력)은 계속 playwright 테스트로 남긴다.
//
// 실행: node scripts/rules_unit_test.js
const R=require("./rules_env.js");
let fail=0;
const ok=(c,m)=>{ console.log((c?"  ✅ ":"  ❌ ")+m); if(!c)fail++; };
const near=(a,b,tol)=>Math.abs(a-b)<=tol;

// 테스트용 정령. ⚠️ 실제 makeMon은 IV를 랜덤으로 굴리므로, 배율 검증은 반드시 스탯을 못박아야 한다.
const mk=o=>Object.assign({
  name:"테스트", level:50, atk:100, def:100, spa:100, spDef:100, spd:100,
  maxHp:200, hp:200, type:"normal", type2:null, status:null, ability:"sturdy",
  held:null, stages:R.newStages(),
},o);

console.log("\n[규칙 로드]");
ok(R.__names.length>20, `규칙 심볼 ${R.__names.length}개 추출`);
ok(R.__order.join(",")==="util,tables,battle", `로드 순서 ${R.__order.join("→")}`);

console.log("\n[랭크 배율 — 본가 표]");
// 공/방 랭크: s>=0 → (2+s)/2, s<0 → 2/(2-s)
ok(R.stageMul(0)===1, "랭크 0 → 1.0");
ok(R.stageMul(1)===1.5 && R.stageMul(2)===2 && R.stageMul(6)===4, "랭크 +1/+2/+6 → 1.5/2.0/4.0");
ok(near(R.stageMul(-1),2/3,1e-9) && R.stageMul(-6)===0.25, "랭크 -1/-6 → 0.667/0.25");
// 명중/회피 랭크: 3/3 기준
ok(R.accMul(0)===1 && near(R.accMul(1),4/3,1e-9) && R.accMul(3)===2, "명중 랭크 0/+1/+3 → 1.0/1.333/2.0");
ok(near(R.accMul(-1),0.75,1e-9) && near(R.accMul(-3),0.5,1e-9), "명중 랭크 -1/-3 → 0.75/0.5");
ok(Object.keys(R.newStages()).length===7, "랭크는 7종(공·방·속·특공·특방·명중·회피)");

console.log("\n[급소 랭크]");
ok(JSON.stringify(R.CRIT_RATE)===JSON.stringify([1/16,1/8,1/4,1/3,1/2]), "급소 확률표가 본가 값");
ok(R.critStage(mk(),{})===0, "기본 급소 단계 0");
ok(R.critStage(mk(),{highCrit:true})===1, "highCrit 기술 → +1");
ok(R.critStage(mk({held:"scopelens"}),{highCrit:true})===2, "초점렌즈와 합산 → +2");
ok(R.critStage(mk({_critStage:9}),{highCrit:true})===4, "상한 4에서 멈춘다");

console.log("\n[다단히트 분포]");
{
  const c={2:0,3:0,4:0,5:0}, N=60000;
  for(let i=0;i<N;i++)c[R.multiHits([2,5])]++;
  const p=k=>c[k]/N*100;
  ok(near(p(2),37.5,1.5)&&near(p(3),37.5,1.5), `2·3회 각 37.5% (${p(2).toFixed(1)}/${p(3).toFixed(1)})`);
  ok(near(p(4),12.5,1.5)&&near(p(5),12.5,1.5), `4·5회 각 12.5% (${p(4).toFixed(1)}/${p(5).toFixed(1)})`);
  const avg=(2*c[2]+3*c[3]+4*c[4]+5*c[5])/N;
  ok(near(avg,3.0,0.05), `평균 타수 3.0 — 균등이면 3.5로 부푼다 (${avg.toFixed(3)})`);
  const s=new Set(); for(let i=0;i<2000;i++)s.add(R.multiHits([2,3]));
  ok([...s].sort().join(",")==="2,3", "2~5 외 범위는 균등 유지");
}

console.log("\n[타입 상성표]");
{
  const tk=Object.keys(R.TYPES), missing=[];
  tk.forEach(a=>tk.forEach(d=>{ if(!R.EFF[a]||R.EFF[a][d]===undefined)missing.push(a+"→"+d); }));
  ok(missing.length===0, `EFF ${tk.length}×${tk.length} 완전 (${missing.slice(0,3).join(",")||"누락 없음"})`);
  ok(R.EFF.fire.grass===2 && R.EFF.water.fire===2 && R.EFF.grass.water===2, "불>풀>물>불 상성 성립");
  ok(R.EFF.elec.ground===0, "전기→땅 무효(0)");
  // 신규 3타입(얼음·독·땅) 주요 상성 — 예전엔 type_chart_test.js(브라우저)가 봤다.
  //   그 테스트는 단일타입 방어자에 damage().eff를 썼는데, eff는 EFF의 곱이므로 EFF 직접 단정이 동치이자 더 순수하다.
  ok(R.EFF.ice.grass===2 && R.EFF.ice.fire===0.5 && R.EFF.ice.flying===2, "얼음: 풀2·불0.5·비행2");
  ok(R.EFF.ground.elec===2 && R.EFF.ground.flying===0 && R.EFF.ground.poison===2, "땅: 전기2·비행무효·독2");
  ok(R.EFF.poison.grass===2 && R.EFF.poison.ground===0.5, "독: 풀2·땅0.5");
  ok(R.EFF.fire.ice===2 && R.EFF.rock.ice===2, "얼음은 불·바위에 2배로 맞는다");
}

console.log("\n[파생 테이블]");
{
  const tk=Object.keys(R.TYPES);
  const miss=t=>tk.filter(k=>t[k]===undefined||t[k]==="");
  ["TYPE_KO","TYPE_CLASS","TYPE_COLOR","TYPE_PARTICLE","TYPE_ICON","DEFAULT_ABILITY"].forEach(n=>
    ok(miss(R[n]).length===0, `${n}이 전 타입을 덮는다 (${miss(R[n]).join(",")||"누락 없음"})`));
  ok(tk.every(k=>!!R.TYPES[k].spec===!!R.SPEC_TYPES[k]), "SPEC_TYPES가 TYPES.spec과 일치");
  const sk=Object.keys(R.STATUSES);
  ["STATUS_KO","STATUS_CLS","_MV_STATUS_KO"].forEach(n=>
    ok(sk.filter(k=>!R[n][k]).length===0, `${n}이 전 상태를 덮는다`));
  ok(sk.every(k=>R.STATUSES[k].imm ? R.STATUS_TYPE_IMMUNE[k]===R.STATUSES[k].imm
                                   : R.STATUS_TYPE_IMMUNE[k]===undefined),
     "면역표가 STATUSES.imm과 일치(잠듦은 면역 없음)");
}

console.log("\n[데미지 공식]");
{
  // 상성이 배율로 실제 반영되는가 (난수 폭이 있으므로 평균으로 본다)
  const avg=(a,d,mv,n=400)=>{ let s=0; for(let i=0;i<n;i++)s+=R.damage(a,d,mv).dmg; return s/n; };
  const atk=mk({type:"fire"});
  const neutral=avg(atk, mk({type:"normal"}), {type:"fire",power:80});
  const weak   =avg(atk, mk({type:"grass"}),  {type:"fire",power:80});
  const resist =avg(atk, mk({type:"water"}),  {type:"fire",power:80});
  ok(near(weak/neutral,2,0.15), `효과 굉장 ≈ 2배 (${(weak/neutral).toFixed(2)})`);
  ok(near(resist/neutral,0.5,0.06), `효과 별로 ≈ 0.5배 (${(resist/neutral).toFixed(2)})`);
  // STAB
  const stab=avg(mk({type:"fire"}), mk({type:"normal"}), {type:"fire",power:80});
  const noStab=avg(mk({type:"rock"}), mk({type:"normal"}), {type:"fire",power:80});
  ok(near(stab/noStab,1.5,0.12), `자속 보정 ≈ 1.5배 (${(stab/noStab).toFixed(2)})`);
  // 부유 = 땅 무효
  ok(R.damage(mk({type:"ground"}), mk({ability:"levitate"}), {type:"ground",power:80}).eff===0,
     "부유 특성이 땅 기술을 무효로 만든다");
  // 화상은 물리만 반감 (⚠️ 특성을 guts로 두면 오히려 1.5배라 검증이 뒤집힌다 → sturdy 고정)
  const phys=avg(mk({type:"rock"}), mk({type:"normal"}), {type:"rock",power:80});
  const physBrn=avg(mk({type:"rock",status:"brn"}), mk({type:"normal"}), {type:"rock",power:80});
  ok(near(physBrn/phys,0.5,0.06), `화상이 물리를 반감 (${(physBrn/phys).toFixed(2)})`);
  const spec=avg(mk({type:"fire"}), mk({type:"normal"}), {type:"fire",power:80});
  const specBrn=avg(mk({type:"fire",status:"brn"}), mk({type:"normal"}), {type:"fire",power:80});
  ok(near(specBrn/spec,1.0,0.06), `화상은 특수를 안 깎는다 (${(specBrn/spec).toFixed(2)})`);
  // 특수기가 특공/특방 랭크를 쓴다 (예전엔 특수기가 랭크를 통째로 무시했다)
  const up=mk({type:"fire"}); up.stages.spa=2;
  ok(avg(up, mk({type:"normal"}), {type:"fire",power:80}) > spec*1.6,
     "특수기가 특공 랭크를 반영한다");
  const dn=mk({type:"normal"}); dn.stages.spDef=2;
  ok(avg(mk({type:"fire"}), dn, {type:"fire",power:80}) < spec*0.75,
     "특수기가 상대 특방 랭크를 반영한다");
  ok(R.damage(mk(), mk(), {type:"normal",power:1}).dmg>=1, "데미지는 최소 1");
}

console.log("\n[지닌 물건 — 전투 배율]");
{
  const avg=(a,d,mv,n=400)=>{ let s=0; for(let i=0;i<n;i++)s+=R.damage(a,d,mv).dmg; return s/n; };
  const base=avg(mk({type:"fire"}), mk({type:"normal"}), {type:"fire",power:80});
  // 생명의구슬 ×1.3
  const orb=avg(mk({type:"fire",held:"lifeorb"}), mk({type:"normal"}), {type:"fire",power:80});
  ok(near(orb/base,1.3,0.08), `생명의구슬 위력 ×1.3 (${(orb/base).toFixed(2)})`);
  // 힘의띠 ×1.1 (데이터 필드로 이전됨 — 예전엔 하드코딩)
  const pb=avg(mk({type:"fire",held:"powerband"}), mk({type:"normal"}), {type:"fire",power:80});
  ok(near(pb/base,1.1,0.08), `힘의띠 위력 ×1.1 (${(pb/base).toFixed(2)})`);
  // 타입 부적 +20% — 같은 타입 기술만
  const chm=avg(mk({type:"fire",held:"charm_fire"}), mk({type:"normal"}), {type:"fire",power:80});
  ok(near(chm/base,1.2,0.08), `불부적: 불 기술 +20% (${(chm/base).toFixed(2)})`);
  const chmOff=avg(mk({type:"fire",held:"charm_water"}), mk({type:"normal"}), {type:"fire",power:80});
  ok(near(chmOff/base,1.0,0.08), `물부적은 불 기술엔 안 붙는다 (${(chmOff/base).toFixed(2)})`);
  // 구애스카프 속도 ×1.5
  ok(R.effSpd(mk({held:"choicescarf"}))===150 && R.effSpd(mk())===100, "구애스카프 속도 ×1.5");
  // 타입 부적은 TYPES 파생 — 전 타입 존재
  const tk=Object.keys(R.TYPES);
  ok(tk.every(t=>R.HELD_ITEMS["charm_"+t] && R.HELD_ITEMS["charm_"+t].boost===t), `타입 부적 ${tk.length}종이 TYPES에서 파생`);
  ok(["lifeorb","focussash","choiceband","choicescarf"].every(k=>R.HELD_ITEMS[k]), "신규 지닌물건 4종 정의");
}

console.log("\n[혼란 자해]");
{
  // ⚠️ maxHp를 넉넉히 줘야 30% 상한이 먼저 걸려 공/방 영향이 가려지지 않는다.
  const soft=mk({maxHp:9999,hp:9999,def:50}), hard=mk({maxHp:9999,hp:9999,def:200});
  const av=m=>{ let s=0; for(let i=0;i<400;i++)s+=R.confusionSelfHit(m); return s/400; };
  ok(av(soft)>av(hard), `방어가 높으면 자해가 작다 (${av(soft).toFixed(0)} > ${av(hard).toFixed(0)})`);
  const tiny=mk({maxHp:100,hp:100,def:1,atk:999});
  ok(R.confusionSelfHit(tiny)<=30, "자해는 maxHp의 30%를 넘지 않는다");
  ok(R.confusionSelfHit(mk())>=1, "자해는 최소 1");
}

console.log("\n[속도]");
{
  const base=mk(); ok(R.effSpd(base)===100, "기본 속도 그대로");
  ok(R.effSpd(mk({status:"par"}))===50, "마비는 속도 절반");
  const up=mk(); up.stages.spd=2; ok(R.effSpd(up)===200, "속도 랭크 +2 → 2배");
}

console.log("\n[순수성]");
// 규칙 계층이 DOM/브라우저 API를 직접 참조하면 이 환경에서 터진다. 소스에도 흔적이 없어야 한다.
{
  const bad=/\bdocument\.|\bwindow\.|localStorage|requestAnimationFrame/g;
  const hits=[...R.__source.matchAll(bad)].map(m=>m[0]);
  // injectPalette는 typeof 가드 뒤에서만 document를 쓴다 → 가드 없는 사용이 있는지만 본다
  const unguarded=hits.filter(h=>h==="window."||h==="localStorage"||h==="requestAnimationFrame");
  ok(unguarded.length===0, `규칙 계층에 가드 없는 브라우저 API 없음 (${unguarded.join(",")||"없음"})`);
  ok(/typeof document!=="undefined"/.test(R.__source), "document 사용은 typeof 가드 뒤에 있다");
}

console.log(fail?`\n❌ 실패 ${fail}건`:"\n🎉 순수 규칙 단위 테스트 통과");
process.exit(fail?1:0);
