---
name: project-spirit-grove-narrative
description: Spirit Grove (정령의 숲) 게임의 중간 서사 전략 — 목표 트래커가 실제 플롯 결말(숲의 군주/EPILOGUE)을 건너뛰고 리그로만 안내하는 구조적 갭을 발견, 재배선안(Bit 0)을 최우선 제안함
metadata:
  type: project
---

정령의 숲(브라우저 크리처 수집 RPG, 저장소 `/Users/jaesung/Desktop/spirit-grove`)은 시스템(전투·수집·밸런스)은 매우 깊게 구현돼 있지만 서사가 얇다는 유저 피드백이 있었다. 2026-08-04에 3단계(중간 서사 전략) 작업으로 `outputs/strategy/2026-08-04_spirit-grove_narrative-strategy.md`를 작성했다.

**핵심 발견**: 이 게임엔 완전히 분리된 두 결말이 이미 완성돼 있다.
1. 플롯 결말 — 체육관 4개 → 제단 → 숲의 군주(TRAINERS.X) 격파 → `EPILOGUE`(4p, playStory) → `showEnding()`
2. 메타 결말 — 체육관 4개 → 정령 리그 → 챔피언 격파 → `LEAGUE_WIN`(3p) → 명예의 전당

`currentGoal()`(목표 트래커, `src/index.html` L2904)이 4뱃지 이후 **①(숲의 군주)을 완전히 건너뛰고 ②(리그)로만** 안내한다. `HOME_LETTER`(아침 편지, 2단계에서 구현)는 편지로 "제단의 숲의 군주에게 닿으라"고 명시하는데, 정작 트래커도 `LEAGUE_WIN`도 `showEnding()`도 서로를 언급하지 않는다. → "서사가 얇다"는 체감의 근본 원인은 컷신 개수 부족이 아니라 **이미 쓰인 결말에 플레이어가 도달하지 못하는 라우팅 문제**였다.

제안한 최우선 안(Bit 0): `currentGoal()`의 사슬에 "4뱃지 → 숲의 군주 → 리그" 순서로 제단 단계를 끼워 넣는다. 신규 텍스트 제작이 사실상 0에 가깝고(EPILOGUE는 이미 있음) 임팩트가 가장 크다.

**Why**: 이 발견은 `docs/SPIRIT_GROVE_GUIDE.md`·`WORKLOG.md`와 `src/index.html`의 `playStory` 호출부(정확히 7곳)·`TRAINERS`·`currentGoal()`을 직접 grep/read해서 확인한 사실이며, WORKLOG.md에 이미 "숲의 군주는 목표 트래커 사슬 밖이라 봇이 안 간다"는 메모가 있었다(이 발견이 처음이 아니라 기존에도 관찰됐던 것).

**How to apply**: 다음에 이 프로젝트에서 서사/진행 관련 작업을 할 때는 이 전략 문서를 먼저 확인할 것. Bit 0(트래커 재배선)이 아직 유저 승인/구현 여부가 불확실하면, 그 상태부터 다시 확인해야 한다. [[feedback-spirit-grove-evidence-grounding]] 참조.
