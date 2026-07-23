#!/usr/bin/env bash
# 한 줄 배포: 빌드 검증 → 소스 스냅샷을 GitHub main에 push → Actions가 자동 빌드·배포.
# 사용:  bash scripts/deploy.sh
#
# ⚠️ 이 환경은 git-over-HTTPS push가 막혀 SSH 원격만 됨(origin = git@github.com:...).
# ⚠️ 로컬 .git이 479MB라 전체 이력 push는 비현실적 → orphan 단일 스냅샷을 main에 올린다.
#    로컬 main의 전체 커밋 이력은 건드리지 않는다(CLAUDE.md가 이력을 중요시함).
set -e
cd "$(dirname "$0")/.."

echo "▶ 1/4 빌드 검증 (서버가 같은 걸 돌린다)"
python3 scripts/build.py >/dev/null
echo "  ✅ 빌드 OK"

echo "▶ 2/4 소스 스냅샷 커밋 (orphan)"
BR="_deploy_$$"
git checkout -q --orphan "$BR"
git add -A
git commit -q -m "배포 스냅샷"

echo "▶ 3/4 GitHub push (SSH)"
git push -q origin "$BR:main" --force
echo "  ✅ push 완료"

echo "▶ 4/4 로컬 정리"
git checkout -q main
git branch -D "$BR" >/dev/null
# ⚠️ checkout main이 로컬 dist/index.html을 main 커밋 상태로 되돌린다. 최신 소스로 다시 빌드해
#    로컬 산출물이 방금 배포한 것과 일치하게 한다(안 그러면 로컬 테스트가 옛 dist로 헛돈다 — 실제로 겪음).
python3 scripts/build.py >/dev/null 2>&1 || true

echo ""
echo "🎉 push 완료 — GitHub Actions가 1~2분 뒤 자동 배포한다."
echo "   진행:  gh run watch   ·  https://github.com/ereneren-lab/spirit-grove/actions"
echo "   주소:  https://ereneren-lab.github.io/spirit-grove/"
