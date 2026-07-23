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

echo ""
echo "🎉 push 완료 — GitHub Actions가 1~2분 뒤 자동 배포한다."
echo "   진행:  gh run watch   ·  https://github.com/ereneren-lab/spirit-grove/actions"
echo "   주소:  https://ereneren-lab.github.io/spirit-grove/"
