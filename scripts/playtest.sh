#!/bin/bash
# 실플레이 검증 — verify.sh(단위 회귀)와 달리 "실제로 게임을 돌려서" 확인한다.
#   1) reachability : 실제 walkable()로 지도를 BFS해 모든 콘텐츠에 정말 닿는지 증명
#   2) playthrough  : 내부 함수 호출 없이 진짜 키·클릭으로 타이틀→스타터→전투까지 플레이
#   3) monkey       : 무작위 실입력을 퍼부어 에러·영구잠금·상태오염 탐지
#   4) longrun      : 목표 트래커를 탭해 가며 실제로 진행, 난이도를 실측(레벨·전투수·전멸·회복약)
#   5) balance      : 게임의 진짜 전투 코드로 게이트 전투를 수천 판 돌려 승률 곡선을 낸다
#   6) league       : 리그는 회복 없는 5연전이라 따로 잰다(개별 승률의 곱보다 나쁘다)
#
# ⚠️ 각 테스트가 headless 브라우저를 띄우므로 무겁다. verify.sh와 같이 돌리면
#    브라우저 기동이 겹쳐 "Target page has been closed"가 난다 → 분리해서 순차 실행한다.
set -u
F="${1:-dist/spirit_grove_3d.html}"
SECS="${2:-40}"
LONG="${3:-70}"   # 장기 플레이스루 예산(초). 넉넉한 머신이면 240 이상 권장
[ -f "$F" ] || { echo "❌ 파일 없음: $F"; exit 1; }
if ! node -e "require.resolve('playwright')" 2>/dev/null; then
  echo "⏭️  playwright 미설치 — 건너뜀 (npm install playwright)"; exit 0
fi

fail=0
run(){ echo ""; echo "── $1 ──"; node "scripts/$2" "$F" "${@:3}" || fail=1; sleep 1.5; }

run "도달성 증명"      reachability_test.js
run "실입력 플레이스루" playthrough_test.js
run "몽키 퍼즈(${SECS}초)" monkey_test.js "$SECS"
run "장기 플레이스루(${LONG}초)" longrun_test.js "$LONG"
run "밸런스 실측" balance_test.js 300
run "리그 연속 관문 실측" league_test.js 250

echo ""
if [ $fail -eq 0 ]; then echo "🎉 실플레이 검증 전부 통과"; else echo "❌ 실플레이 검증 실패"; fi
exit $fail
