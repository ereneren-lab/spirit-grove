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
ok(R.__order.join(",")==="util,tables,moves,dex,battle", `로드 순서 ${R.__order.join("→")}`);

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

console.log("\n[주인공 스프라이트 그리기 규격]");
/* 왜 있나 — 픽셀 아트로 갈아탈 준비. 캔버스는 기본이 **보간(imageSmoothingEnabled=true)** 이라
   도트를 그대로 넣으면 뭉개지고, 크기가 32의 정수배가 아니면 격자가 울퉁불퉁해진다.
   반대로 지금의 고해상도 일러스트는 스무딩을 꺼서 축소하면 거칠어진다.
   → **원본 크기 하나로 갈리게** 만들었다(플래그 데이 없음). 그 분기를 여기서 고정한다.
   ⚠️ 실측 타일 크기는 68~83px다(뷰포트 430/390/768 기준) — 그 대역 전체에서 64로 안정돼야 한다. */
{
  const big=R.heroDrawSpec(360,77);            // 지금 아트(webp ~360px)
  ok(big.smooth===true && !big.pixel, "일러스트 원본은 부드럽게 축소한다(현행 유지)");
  ok(Math.abs(big.size-77*0.98)<1e-9, `일러스트 크기는 예전 그대로 ts*0.98 (${big.size.toFixed(1)})`);

  const px=R.heroDrawSpec(32,77);
  ok(px.smooth===false && px.pixel, "픽셀 원본은 최근접(스무딩 끔)으로 그린다");
  ok(px.size%32===0, `픽셀 크기는 32의 정수배다 (${px.size})`);

  // 뷰포트가 흔들려도 크기가 튀지 않아야 한다 — 반올림이면 여기서 64↔96을 오간다.
  const sizes=[68,77,83].map(ts=>R.heroDrawSpec(32,ts).size);
  ok(new Set(sizes).size===1 && sizes[0]===64, `실측 타일 대역 68~83에서 크기가 64로 일정하다 (${sizes.join(",")})`);
  // 스프라이트가 타일을 넘지 않아야 한다(넘으면 이웃 칸을 덮는다)
  ok([68,77,83].every(ts=>R.heroDrawSpec(32,ts).size<=ts), "픽셀 스프라이트가 타일 크기를 넘지 않는다");
  // 아주 큰 화면에서는 3배로 올라간다
  ok(R.heroDrawSpec(32,110).size===96, `타일이 커지면 96으로 올라간다 (${R.heroDrawSpec(32,110).size})`);

  /* ⚠️ 32 말고 다른 칸 크기도 **원본의 정수배**여야 한다. 32 배수로 고정하면 48·64 원본에서
     1.33배 같은 소수배가 나와 도트가 울퉁불퉁해진다(원본 디테일이 32칸에 안 들어가 48~64를 쓸 참이다). */
  for(const src of [32,48,64]){
    const sp=R.heroDrawSpec(src,77);
    ok(sp.size%src===0 && sp.size>0, `칸 ${src}px → 그리기 ${sp.size}px = 정수배(${sp.size/src}배)`);
    ok(sp.size<=77, `칸 ${src}px → 타일(77)을 안 넘는다 (${sp.size})`);
  }
  ok(R.heroDrawSpec(64,77).size===64, `64px 칸은 1:1로 그려진다 — 가장 또렷하다 (${R.heroDrawSpec(64,77).size})`);
  // 아직 로드 안 된 이미지(naturalWidth 0)는 일러스트 취급 = 지금 동작 유지
  ok(R.heroDrawSpec(0,77).smooth===true, "원본 크기를 모르면 안전하게 현행(부드럽게) 동작한다");
}

console.log("\n[기술 설명 — 배우기/잊기/전투 메뉴가 쓰는 한 줄]");
// 예전엔 jsdom으로 dist를 통째로 띄워 검사했다(movedesc_test.js). moveDesc/moveSummary가
// 규칙 계층으로 내려온 뒤로는 브라우저가 전혀 필요 없다 — 같은 커버리지를 여기서 즉시 돌린다.
{
  const cases=[
    ["flare",["불","위력 58","화상","PP"]],        // 공격 + 상태이상
    ["growl",["노말","공격↓","PP"]],                // 상대 랭크 하락
    ["agility",["속도↑","자신","PP"]],              // 자신 랭크 상승
    ["furyswipe",["위력 17","연타","PP"]],          // 연속기
    ["recover",["회복","PP"]],                      // 회복
    ["absorb",["흡수","PP"]],                       // 흡수
    ["quickjab",["선제","PP"]],                     // 선제공격
    ["reflect",["물리 피해","PP"]],                  // 장막
    ["leechseed",["씨뿌리기","PP"]],                // 씨앗
    ["toxic",["독","PP"]],                          // 상태이상
    ["sunnyday",["쨍쨍","PP"]],                     // 날씨
    ["stealthrock",["바위 설치","PP"]],             // 함정
    ["headbutt",["풀죽음","PP"]],                   // 풀죽음
  ];
  for(const [mv,needles] of cases){ const t=R.moveSummary(mv);
    ok(needles.every(n=>t.includes(n)), `${mv} → "${t}"`); }
  ok(R.moveSummary("__nope__")==="__nope__", "미정의 기술도 안전(키 그대로)");
  // 변화기도 정체가 드러나야 한다 — 위력만 보고 "변화"로 뭉뚱그리면 UI가 무의미해진다
  ok(R.moveDesc("agility").length>0 && R.moveDesc("toxic").length>0, "변화기도 설명이 비지 않는다");
}

console.log("\n[종 데이터 · 개체 생성]");
// DEX/makeMon도 규칙 계층으로 내려왔다(legendary_test가 브라우저로 하던 검사).
{
  ok(R.DEX.length===114, `DEX 114종 (${R.DEX.length})`);
  const legends=R.DEX.filter(d=>d.legend);
  ok(legends.length===5 && legends.every(d=>d.tier===4), `전설 5종 전부 tier4 (${legends.length})`);
  const bst=d=>Object.values(d.base).reduce((a,b)=>a+b,0);
  const minLegend=Math.min(...legends.map(bst)), maxRegular=Math.max(...R.DEX.filter(d=>!d.legend).map(bst));
  ok(minLegend>maxRegular, `전설 최소 종족값 > 일반 최강 (${minLegend} > ${maxRegular})`);
  ok(bst(R.byId("dawnwyrm"))>=260, `여명룡 종족값 대폭 상향 (${bst(R.byId("dawnwyrm"))})`);
  ok(R.makeMon("dawnwyrm",56).maxHp>=210, `여명룡 Lv56 HP 압도적 (${R.makeMon("dawnwyrm",56).maxHp})`);
  // makeMon 위생: 레벨 정수화(소수점 레벨 버그 재발 방지) + 학습셋/PP 채움
  const frac=R.makeMon("foxfire",12.7);
  ok(frac.level===12, `레벨은 항상 정수 (12.7 → ${frac.level})`);
  ok(frac.moves.length>0 && frac.moves.every(mv=>frac.pp[mv]>0), "학습 기술과 PP가 채워진다");
  ok(frac.moves.length<=4, `기술은 최대 4개 (${frac.moves.length})`);
  ok(R.byId("__nope__")===undefined, "없는 종은 undefined");
}

console.log("\n[학습셋 위생 — 죽은 콘텐츠 감지]");
// 왜 있나: DEX의 learn 배열이 중첩으로 깨져 있었다(`[16,"bite",[28,"nastyplot",[36,"roar"]]]`).
// makeMon은 `([lv,mv])`로 구조분해하므로 **첫 기술만 배우고 나머지는 영영 안 배워졌다** — 8종 13기술.
// 눈에 안 띄는 데이터 손상이라, 구조와 "모든 기술이 배울 수 있는가"를 둘 다 강제한다.
{
  const bad=[];
  for(const d of R.DEX){ for(const e of (d.learn||[])){
    if(!Array.isArray(e)||e.length!==2||typeof e[0]!=="number"||typeof e[1]!=="string")bad.push(d.id+":"+JSON.stringify(e)); } }
  ok(bad.length===0, `learn 항목은 전부 [레벨,기술] 2원소 (${bad.slice(0,2).join(" ")||"이상 없음"})`);

  const unknown=[];
  for(const d of R.DEX){ for(const mv of (d.moves||[]))if(!R.MOVES[mv])unknown.push(d.id+":"+mv);
    for(const [,mv] of (d.learn||[]))if(!R.MOVES[mv])unknown.push(d.id+":"+mv); }
  ok(unknown.length===0, `학습셋의 기술이 전부 MOVES에 실존 (${unknown.slice(0,2).join(" ")||"이상 없음"})`);

  // 학습셋은 레벨 오름차순이어야 사람이 읽고 고치기 쉽다(정렬이 깨지면 데이터 손상 신호)
  const unsorted=R.DEX.filter(d=>{ const lv=(d.learn||[]).map(e=>e[0]); return lv.some((v,i)=>i&&v<lv[i-1]); }).map(d=>d.id);
  ok(unsorted.length===0, `학습셋이 레벨 오름차순 (${unsorted.slice(0,3).join(",")||"이상 없음"})`);

  // 레벨업으로 실제로 기술이 늘어난다(구조가 깨지면 여기서 티가 난다)
  const grow=R.DEX.filter(d=>(d.learn||[]).length>=2).slice(0,12)
    .filter(d=>{ const hi=Math.max(...d.learn.map(e=>e[0]));
      return R.makeMon(d.id,hi).moves.length > R.makeMon(d.id,1).moves.length; });
  ok(grow.length>=10, `레벨업으로 기술이 실제로 늘어난다 (표본 12종 중 ${grow.length}종)`);
}

console.log("\n[기술 획득 경로 — 죽은 기술 감지]");
// ⚠️ 이 한 단정만 순수하지 않다: TM 목록은 아직 index.html의 ITEMS에 있어서 소스 텍스트를 읽는다.
//    그래도 여기 두는 이유 — 깨진 learn 배열을 처음 드러낸 게 바로 이 "아무도 못 배우는 기술" 목록이었다.
{
  const fs=require("fs"), path=require("path");
  const src=fs.readFileSync(path.join(__dirname,"..","src","index.html"),"utf8");
  const learnable=new Set();
  for(const d of R.DEX){ (d.moves||[]).forEach(m=>learnable.add(m)); (d.learn||[]).forEach(e=>learnable.add(e[1])); }
  const tms=new Set([...src.matchAll(/move:"([a-z]+)"/g)].map(m=>m[1]));
  const dead=Object.keys(R.MOVES).filter(k=>k!=="struggle"&&!learnable.has(k)&&!tms.has(k));
  ok(dead.length===0, `모든 기술에 획득 경로가 있다 — 학습셋 ${learnable.size} + TM ${tms.size} (죽은 기술: ${dead.join(",")||"없음"})`);
}

console.log("\n[성격 테이블 위생 — 물리/특수 나침반]");
/* ⚠️ 이 게임은 타입을 SPEC_TYPES로 **물리 5 : 특수 5**로 정확히 이등분해 물리/특수 판정을 걸어뒀고
   크리처에 spa·spDef 스탯도 있다. 그런데 성격 보정은 오랫동안 atk·def·spd에만 걸려 있었다 →
   **주 타입이 특수인 62/86종(72%)에게 성격이 사실상 무의미**했다(2026-08-06 실측).
   더 나쁜 건, spa가 테이블에 없다 보니 본가에서 spa를 깎는 성격 둘이 **다른 스탯으로 대체돼
   기존 성격과 완전 중복**이 됐다는 것이다(고집있는=외로운, 명랑한=겁쟁이 → 10개인데 고유 효과 7개).
   이건 "포켓몬에 있으니 넣자"가 아니라 **이미 설계해둔 물리/특수 분리를 성격이 절반만 따라간 배선 누락**이다.
   ⚠️ recalc는 `m[nat.up]*=1.1` 형태라 스탯 이름에 무관하게 동작한다 → 테이블만 고치면 된다. */
{
  const STATS=["atk","def","spa","spDef","spd"];
  const nats=R.NATURES;
  const bad=nats.filter(n=>(n.up&&!STATS.includes(n.up))||(n.down&&!STATS.includes(n.down)));
  ok(bad.length===0, `성격 보정 스탯이 전부 실존 (${bad.map(n=>n.k).join(",")||"이상 없음"})`);

  const halfNeutral=nats.filter(n=>(!n.up)!==(!n.down));
  ok(halfNeutral.length===0, `중립 성격은 up·down이 둘 다 없다 (${halfNeutral.map(n=>n.k).join(",")||"이상 없음"})`);

  // ⚠️ 핵심 단정: 다섯 스탯이 **전부** 오르는 성격과 내리는 성격을 하나씩은 가진다.
  //    하나라도 빠지면 그 스탯을 주력으로 쓰는 종에게 성격이라는 시스템이 통째로 없는 것과 같다.
  const ups=new Set(nats.map(n=>n.up).filter(Boolean));
  const downs=new Set(nats.map(n=>n.down).filter(Boolean));
  const noUp=STATS.filter(s=>!ups.has(s)), noDown=STATS.filter(s=>!downs.has(s));
  ok(noUp.length===0, `다섯 스탯 모두 올려주는 성격이 있다 (없는 스탯: ${noUp.join(",")||"없음"})`);
  ok(noDown.length===0, `다섯 스탯 모두 내리는 성격이 있다 (없는 스탯: ${noDown.join(",")||"없음"})`);

  // ⚠️ 중복 = 이름만 다르고 효과가 같은 성격. 뽑는 재미가 그만큼 묽어진다.
  const seen=new Map(), dup=[];
  nats.filter(n=>n.up).forEach(n=>{ const sig=n.up+">"+n.down;
    if(seen.has(sig))dup.push(`${n.k}=${seen.get(sig)}`); else seen.set(sig,n.k); });
  ok(dup.length===0, `효과가 겹치는 성격 없음 (${dup.join(" · ")||"이상 없음"})`);

  // 실제로 스탯에 반영되는가 — recalc가 스탯 이름 무관하게 도는지까지 본다(테이블만 고치면 되는 근거).
  const spaUp=nats.find(n=>n.up==="spa");
  if(spaUp){
    const base=R.makeMon("foxfire",50); base.nature="hardy"; R.recalc(base,null,true);
    const buff=R.makeMon("foxfire",50); buff.ivs=base.ivs; buff.evs=base.evs;
    buff.nature=spaUp.k; R.recalc(buff,null,true);
    ok(buff.spa>base.spa, `spa 상승 성격이 실제로 특수공격을 올린다 (${base.spa} → ${buff.spa})`);
  } else ok(false, "spa를 올리는 성격이 없어 반영 여부를 잴 수 없다");
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

console.log("\n[알 불변식 — recalc 근본 방어선]");
{ // 알(isEgg)은 부화 전이라 스탯이 없다 → recalc가 절대 알 maxHp를 성체 값으로 덮으면 안 된다.
  const egg={ isEgg:true, id:"racoonmon", level:1, hp:1, maxHp:1,
    nature:"hardy", ivs:{hp:31,atk:31,def:31,spa:31,spDef:31,spd:31} };
  R.recalc(egg);
  ok(egg.maxHp===1 && egg.hp===1, `recalc가 알을 건드리지 않는다 (maxHp=${egg.maxHp})`);
  // 대조군: 실제 정령은 recalc로 스탯이 잡힌다(가드가 정상 정령을 막지 않는다).
  const real={ id:"racoonmon", level:20, nature:"hardy", ivs:{hp:15,atk:15,def:15,spa:15,spDef:15,spd:15} };
  R.recalc(real);
  ok(real.maxHp>1, `일반 정령은 recalc로 스탯이 계산된다 (maxHp=${real.maxHp})`);
}

console.log(fail?`\n❌ 실패 ${fail}건`:"\n🎉 순수 규칙 단위 테스트 통과");
process.exit(fail?1:0);
