/* 순수 수학 헬퍼 — 브라우저/node 양쪽에서 그대로 쓰인다 */
const rand=(a,b)=>Math.random()*(b-a)+a;
const ri=(a,b)=>Math.floor(rand(a,b+1));
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
