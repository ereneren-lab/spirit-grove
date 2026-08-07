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
  /* ⚠️ **원본 크기의 정수배**로 내린다(예전엔 32 배수로 고정이었다).
     32 원본이면 그대로 64(2배)라 결과가 같지만, 48·64 원본에선 32 배수가 정수배가 아니라
     도트가 울퉁불퉁해졌다 — 실측상 원본 디테일이 32칸에 안 들어가 48~64칸을 쓸 참이므로 일반화한다.
     내림이라 스프라이트가 타일을 절대 안 넘고, 뷰포트가 흔들려도 크기가 안 튄다. */
  return {size:srcW*Math.max(1,Math.floor(fit/srcW)), smooth:false, pixel:true};
}

/* ===== 주인공 걷기 스프라이트 시트 =====
   시트 한 장 = 한 캐릭터 전부. **3열 × 3행**, 칸은 정사각(칸 크기는 이미지 폭/3으로 잰다).
     열 = 0 정지 · 1 걸음A · 2 걸음B          행 = 0 아래(정면) · 1 위(뒷모습) · 2 옆
   ⚠️ 옆모습은 **오른쪽을 본다.** 왼쪽 이동은 좌우 반전이다(정지 이미지 시절과 같은 규약).
   ⚠️ 재생 순서는 [정지, A, 정지, B]다 — 걸음 사이에 정지가 끼어야 걷는 것처럼 보인다.
      이 박자(초당 8위상)는 **절차적 워커 `_walker`가 이미 쓰던 것과 같은 값**이다.
      아트가 없을 때 워커로 폴백해도 걸음 속도가 안 바뀐다 — 두 경로가 한 규약을 공유한다.
   ⚠️ 이 함수는 DOM을 모른다 — `rules_unit_test`가 브라우저 없이 직접 잰다. */
const HERO_ANIM_FPS=8;
const HERO_SHEET_COLS=3, HERO_SHEET_ROWS=3;
const HERO_FRAME_ORDER=[0,1,0,2];              // 위상 → 열
const HERO_DIR_ROW={down:0,up:1,left:2,right:2};
function heroSheetFrame(dir, moving, now){
  const row=HERO_DIR_ROW[dir]!=null?HERO_DIR_ROW[dir]:0;
  const col=moving?HERO_FRAME_ORDER[Math.floor(now*HERO_ANIM_FPS)%HERO_FRAME_ORDER.length]:0;
  return {col, row, flip:dir==="left"};
}
// 시트 이미지의 칸 크기. 3×3이 아니면(=정사각 칸이 안 나오면) null → 호출부가 시트로 안 쓴다.
function heroSheetCell(srcW, srcH){
  if(!(srcW>0)||!(srcH>0))return null;
  if(srcW%HERO_SHEET_COLS||srcH%HERO_SHEET_ROWS)return null;
  const cw=srcW/HERO_SHEET_COLS, chh=srcH/HERO_SHEET_ROWS;
  return cw===chh?cw:null;
}
