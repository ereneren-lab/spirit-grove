#!/usr/bin/env python3
"""학습셋 확장 코드젠 (평가 #2) — 종당 학습 기술 중앙값 4개 → 8~12개.

왜 필요한가:
  본가는 레벨업만으로 15~20개를 배운다. 4개면 Lv5~Lv50 내내 기술 구성이 사실상 고정이고,
  랭크·상태이상·앵콜/도발 같은 정교한 전투 시스템이 발현될 재료가 없다.
  `addMove`는 슬롯이 차면 4번 칸만 갈아치우므로, 학습셋이 길어지면
  **레벨업마다 "무엇을 버릴까" 선택 이벤트**가 생기는 것이 진짜 이득이다.

지켜야 하는 경계 (이걸 어기면 문서화된 밸런스 원칙이 깨진다):
  · **자연 학습 풀(71종)만 쓴다.** 지금 어떤 종의 초기기술/학습셋에 실존하는 기술만 후보다.
    TM 전용 37종(방어·날기·솔라빔·앵콜·도발·설치기·장막·날씨 + 이번에 추가한 공격기 13종)은
    "플레이어 전용 = 트레이너·야생이 못 씀 = 밸런스 불변"이라는 설계라 절대 학습셋에 넣지 않는다.
  · 레벨 오름차순 · [레벨,기술] 2원소 · MOVES 실존 (rules_unit_test의 학습셋 위생 4종)
  · 티어별 위력 상한 — t1이 최강기를 배우면 초반 커브가 무너진다.
  · 레벨별 위력 상한 — Lv8에 위력 78이 나오면 안 된다.

⚠️ 학습셋을 바꾸면 **트레이너·야생의 기술도 늘어난다** → 밸런스 재측정 필수.
"""
import re, sys, json, subprocess

DEX_PATH = "src/rules/dex.js"

# 규칙 계층에서 MOVES/DEX를 그대로 읽어온다(사본을 만들지 않는다 — 병렬 테이블 금지 원칙)
dump = subprocess.run(["node", "-e", """
const R=require("./scripts/rules_env.js");
const nat=new Set();
R.DEX.forEach(d=>{(d.moves||[]).forEach(m=>nat.add(m));(d.learn||[]).forEach(([l,m])=>nat.add(m));});
const mv={}; Object.entries(R.MOVES).forEach(([k,m])=>{ if(nat.has(k))mv[k]={type:m.type,power:m.power||0,pri:m.pri||0}; });
const dex=R.DEX.map(d=>({id:d.id,tier:d.tier,type:d.type,type2:d.type2||null,
  moves:d.moves||[],learn:(d.learn||[]).map(([l,m])=>[l,m])}));
console.log(JSON.stringify({mv,dex}));
"""], capture_output=True, text=True, check=True)
data = json.loads(dump.stdout)
MV, DEX = data["mv"], data["dex"]

TIER_POWER_CAP = {1: 62, 2: 74, 3: 999, 4: 999}
TARGET_TOTAL   = {1: 8,  2: 9,  3: 10, 4: 11}
LEVEL_POWER = lambda lv: 30 + lv * 1.15      # Lv8→39 · Lv20→53 · Lv40→76

def seed(s):                                  # 종별 결정적 셔플용(Math.random 금지 — 재현 가능해야 한다)
    h = 0
    for ch in s: h = (h * 131 + ord(ch)) & 0xFFFFFFFF
    return h

report = []
lines = open(DEX_PATH).read().split("\n")
by_id = {d["id"]: d for d in DEX}

for i, line in enumerate(lines):
    m = re.search(r'\{id:"([a-z]+)"', line)
    if not m or m.group(1) not in by_id: continue
    sp = by_id[m.group(1)]
    known = set(sp["moves"]) | {mv for _, mv in sp["learn"]}
    have  = len(known)
    target = TARGET_TOTAL.get(sp["tier"], 9)
    need = target - have
    if need <= 0:
        report.append((sp["id"], have, have, 0)); continue

    types = {sp["type"], sp["type2"], "normal"} - {None}
    cap = TIER_POWER_CAP.get(sp["tier"], 999)
    cand = [k for k, v in MV.items()
            if k not in known and v["type"] in types and v["power"] <= cap]
    # 결정적 정렬: 위력 오름차순(같으면 종별 해시로 흔들어 종마다 다른 조합이 나오게)
    h = seed(sp["id"])
    cand.sort(key=lambda k: (MV[k]["power"], (seed(k) ^ h) & 0xFFFF))

    used_lv = {lv for lv, _ in sp["learn"]}
    added = []
    # 레벨 슬롯을 8~46에 고르게 깔고, 위력 상한을 만족하는 후보를 낮은 위력부터 채운다
    slots = [8 + round(i * (46 - 8) / max(1, need)) for i in range(need)]
    pool = list(cand)
    for lv in slots:
        while lv in used_lv: lv += 1
        pick = next((k for k in pool if MV[k]["power"] <= LEVEL_POWER(lv)), None)
        if pick is None: break
        pool.remove(pick); used_lv.add(lv); added.append([lv, pick])

    if not added:
        report.append((sp["id"], have, have, 0)); continue

    merged = sorted(sp["learn"] + added, key=lambda e: e[0])
    arr = "[" + ",".join(f'[{lv},"{mv}"]' for lv, mv in merged) + "]"
    if "learn:[" in line:
        lines[i] = re.sub(r'learn:\[.*?\]\]', "learn:" + arr, line, count=1)
        if lines[i] == line:                       # learn이 한 항목뿐이라 패턴이 안 맞는 경우
            lines[i] = re.sub(r'learn:\[\[[^\]]*\]\]', "learn:" + arr, line, count=1)
    else:                                          # learn이 아예 없던 종
        lines[i] = line.replace("}", ",learn:" + arr + "}", 1) if line.rstrip().endswith("},") else line
        lines[i] = re.sub(r'(moves:\[[^\]]*\])', r'\1,learn:' + arr, line, count=1)
    report.append((sp["id"], have, have + len(added), len(added)))

open(DEX_PATH, "w").write("\n".join(lines))
tot_before = sum(r[1] for r in report); tot_after = sum(r[2] for r in report)
print(f"{len(report)}종 처리 · 학습 가능 기술 총 {tot_before} → {tot_after} (+{tot_after-tot_before})")
print("변경 없음:", sum(1 for r in report if r[3] == 0), "종")
