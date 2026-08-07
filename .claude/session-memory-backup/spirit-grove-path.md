---
name: spirit-grove-path
description: 정령의 숲 저장소는 2026-08-04에 Desktop/spirit-grove → Desktop/_보관/게임프로젝트/spirit-grove 로 옮겨졌다
metadata: 
  node_type: memory
  type: project
  originSessionId: ba056fff-6f57-4948-a464-3171316f0818
  modified: 2026-08-04T05:24:28.884Z
---

정령의 숲 저장소의 실제 경로는 **`~/Desktop/_보관/게임프로젝트/spirit-grove`** 다.

옛 경로 `~/Desktop/spirit-grove/`는 **`.claude` 폴더만 남은 빈 껍데기**다(`.git`도 없다).
그 경로에서 `git` 명령을 쓰면 상위의 `~/Desktop/.git`(데스크톱 자체가 git 저장소다)으로 올라가
**엉뚱한 저장소를 건드린다** — 실제로 `git status`가 `../sa up/ANALYSIS.md`를 보여줬다.

**Why:** 2026-08-04 세션 중 유저가 데스크톱을 정리하면서(`_보관/` 아래 개발자료·게임프로젝트·문서·이미지)
프로젝트를 옮겼다. 세션 도중에 옮겨져서 `ls scripts/`가 갑자기 실패했고, 잠깐 유실로 보였다.
작업은 하나도 안 잃었다(옮긴 폴더에 커밋 이력 그대로 + GitHub `origin/main`·`origin/history`에 push돼 있었다).

**How to apply:** 이 프로젝트에서 셸 명령을 쓸 때 경로를 가정하지 말고 먼저 확인한다.
`ls`가 "No such file or directory"를 내면 삭제가 아니라 **이동을 먼저 의심**하고
`~/Desktop/_보관/` 아래를 본다. [[worklog-handoff]]의 WORKLOG.md도 이 새 경로에 있다.
