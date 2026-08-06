/* 순수 수학 헬퍼 — 브라우저/node 양쪽에서 그대로 쓰인다 */
const rand=(a,b)=>Math.random()*(b-a)+a;
const ri=(a,b)=>Math.floor(rand(a,b+1));
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
/* 주인공 스프라이트를 어떻게 그릴지. **원본 크기 하나로 갈린다** — 플래그 데이는 없다.
   · 픽셀 스프라이트(원본 ≤ PIXEL_SRC_MAX): 최근접 확대 + 크기를 32의 정수배로 내림.
     정수배가 아니면 어떤 도트는 2칸, 어떤 도트는 3칸이 되어 격자가 울퉁불퉁해진다.
     ⚠️ 반올림이 아니라 **내림**이다 — 반올림하면 뷰포트에 따라 64↔96을 오가며 크기가 50% 튄다
        (실측 타일 68~83px). 내림이면 그 대역 전체에서 64로 안정되고, 스프라이트가 타일을 안 넘는다.
   · 일러스트(원본이 크다): 지금처럼 부드럽게 축소한다. 스무딩을 끄면 고해상도 축소가 거칠어진다.
   ⚠️ 이 함수는 DOM을 모른다 — `hero_sprite_test`가 브라우저 없이 이걸 직접 잰다. */
const PIXEL_SRC_MAX=64;
function heroDrawSpec(srcW, ts){
  const fit=ts*0.98;
  if(!(srcW>0) || srcW>PIXEL_SRC_MAX) return {size:fit, smooth:true, pixel:false};
  return {size:32*Math.max(2,Math.floor(fit/32)), smooth:false, pixel:true};
}
