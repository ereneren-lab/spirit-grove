#!/usr/bin/env python3
"""대조표 한 장(원형 여러 개가 격자로 깔린 그림)을 **원형당 파일 1개**로 쪼갠다.

왜 있나
    2026-08-11에 NPC 원형 12종을 받았는데, 문서가 요청한 "원형당 한 장"이 아니라
    **12원형 × 3자세가 전부 담긴 대조표 한 장**(1536×1024, 라벨 인쇄됨)으로 왔다.
    생성 AI에게 12번 따로 시키면 화풍이 갈리므로 한 장에 몰아 뽑는 게 오히려 낫다 →
    **이쪽(코드)이 쪼개는 게 맞다.**

⚠️ 왜 `detect_grid`로 못 쪼개나 (실측)
    `detect_grid`는 이미지 전체의 행/열 프로파일을 본다. 대조표는 4행이 겹쳐 있어서
    열 프로파일이 4행을 전부 합산한다 → 그룹 경계가 사라진다(실측 7행 × 5열로 나왔다).
    그래서 여기선 **연결 성분**으로 자세를 하나씩 찾는다.

⚠️ 왜 잘라서 그냥 저장하지 않고 **다시 깔아주나** (실측)
    miner 그룹은 2번 자세의 곡괭이가 3번 자세와 x축에서 3px 겹쳤다(349~351).
    그대로 저장하면 `detect_grid`가 두 자세를 한 덩어리로 읽어 **1행 × 2열**이 되고
    변환기가 거부한다. → 자세를 각각 떼어 **넉넉한 여백을 두고 다시 배치**한다.
    (여백을 넓히는 건 공짜다. 자세를 자를 때 크기·발밑을 건드리지 않으므로 화질 손실이 없다.)

📌 변환 규칙은 여기 없다. 배경 제거·그림자 처리·도트화·걷기 합성은 전부
   `make_hero_sheet.py` / `make_npc_sheet.py`가 한다. 이 스크립트는 **자르기만** 한다.
   (규칙이 두 벌이 되면 갈라진다 — 이 저장소가 병렬 테이블로 여러 번 당했다.)

쓰는 법
    python3 scripts/split_contact_sheet.py art_inbox/npc/<대조표>.png \
            --out art_inbox/npc/_split --cols 3 --names kid,bugkid,youth_f,...

    → art_inbox/npc/_split/kid.png ... 12장
    → 이어서  python3 scripts/make_npc_sheet.py --src art_inbox/npc/_split --out assets/art/npc_sheet
"""
import argparse, sys
from pathlib import Path

import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parent))
from PIL import Image
from make_hero_sheet import drop_soft_alpha, strip_background

GAP = 48          # 다시 깔 때 자세 사이 여백(px). detect_grid가 확실히 가르도록 넉넉히.
MIN_H = 60        # 이보다 낮은 성분은 라벨 글자·먼지로 본다(실측: 글자 ~15px, 자세 ~165px).


def components(mask):
    """행 단위 런 + union-find 연결 성분. (scipy가 이 맥에 없다 — 의존성을 늘리지 않는다.)

    반환: (라벨 배열, {루트id: bbox})  — bbox만으론 부족하다. §`crop_masked` 주석 참조.
    """
    par = {}

    def find(x):
        while par[x] != x:
            par[x] = par[par[x]]
            x = par[x]
        return x

    def uni(a, b):
        a, b = find(a), find(b)
        if a != b:
            par[b] = a

    runs, prev = [], []
    for y in range(mask.shape[0]):
        idx = np.flatnonzero(np.diff(np.concatenate(([0], mask[y].view(np.int8), [0]))))
        cur = []
        for x0, x1 in zip(idx[0::2], idx[1::2]):
            rid = len(runs)
            par[rid] = rid
            runs.append((y, int(x0), int(x1) - 1, rid))
            cur.append((int(x0), int(x1) - 1, rid))
            for px0, px1, pid in prev:
                if px0 <= x1 - 1 and x0 <= px1:
                    uni(rid, pid)
        prev = cur
    box, lab = {}, np.zeros(mask.shape, np.int32)
    for y, x0, x1, rid in runs:
        r = find(rid) + 1                      # 0은 "배경"으로 비워 둔다
        lab[y, x0:x1 + 1] = r
        b = box.get(r)
        box[r] = (min(b[0], x0), min(b[1], y), max(b[2], x1), max(b[3], y)) if b else (x0, y, x1, y)
    return lab, box


def crop_masked(im, lab, root, bb, extras):
    """자세 하나를 **그 성분에 속한 픽셀만** 남기고 잘라낸다.

    ⚠️ bbox로 그냥 자르면 **이웃 자세가 같이 딸려온다.** 실측: miner 2번 자세의 곡괭이가
       3번 자세 bbox를 3px 침범해(x349~351) 3번 시트 왼쪽에 검은 파편이 박혔다.
       라벨도 마찬가지다 — guard 1번 자세 bbox 위쪽 2px에 라벨 알약이 걸쳤다.
    ⚠️ 그렇다고 성분 하나만 남기면 **떨어져 있는 부속이 사라진다**(낚싯대 토막·머리 장식 점 등
       실측 8개). → bbox에 **완전히 들어오는** 작은 성분은 같이 살린다.
       라벨은 자세보다 넓어 bbox를 삐져나가므로 이 규칙에서 자동으로 걸러진다.
    """
    keep = lab == root
    for er, eb in extras:
        if bb[0] <= eb[0] and eb[2] <= bb[2] and bb[1] <= eb[1] and eb[3] <= bb[3]:
            keep |= lab == er
    a = np.array(im)
    a[:, :, 3] = np.where(keep, a[:, :, 3], 0)
    return Image.fromarray(a).crop((bb[0], bb[1], bb[2] + 1, bb[3] + 1))


def band_rows(items, tol=40):
    """세로로 겹치는 것끼리 묶어 행(band)을 만든다. 행 간격이 자세 높이보다 크다는 전제.

    items 는 (성분루트, bbox) 목록이다.
    """
    rows, cur = [], []
    for it in sorted(items, key=lambda it: it[1][1]):
        if cur and it[1][1] > max(c[1][3] for c in cur) - tol:
            rows.append(sorted(cur, key=lambda c: c[1][0]))
            cur = []
        cur.append(it)
    if cur:
        rows.append(sorted(cur, key=lambda c: c[1][0]))
    return rows


def group_by_gaps(row, per_group):
    """한 행을 `per_group`개씩 묶는다. **가장 큰 간격**을 그룹 경계로 쓴다.

    ⚠️ 등간격을 가정하지 않는다 — 생성 AI가 그룹 간격을 균등하게 안 준다.
       실측: 그룹 안 간격 ~35px, 그룹 사이 ~100px. 경계 개수는 정확히 (n/per_group - 1)개다.
    """
    n = len(row)
    if n % per_group:
        sys.exit(f"❌ 한 행의 자세가 {n}개 — {per_group}의 배수가 아니다. 성분 검출을 먼저 볼 것.")
    gaps = sorted(((row[i + 1][1][0] - row[i][1][2], i) for i in range(n - 1)), reverse=True)
    cuts = sorted(i for _, i in gaps[: n // per_group - 1])
    out, s = [], 0
    for c in cuts + [n - 1]:
        out.append(row[s:c + 1])
        s = c + 1
    bad = [g for g in out if len(g) != per_group]
    if bad:
        sys.exit(f"❌ 그룹이 {[len(g) for g in out]} 로 갈렸다 — {per_group}개씩이 아니다. "
                 f"자세가 붙어 한 성분으로 읽혔을 수 있다.")
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("src")
    ap.add_argument("--out", required=True)
    ap.add_argument("--cols", type=int, default=3, help="한 원형이 가진 자세 수 (기본 3: 정면·뒤·오른쪽옆)")
    ap.add_argument("--names", required=True, help="읽는 순서(왼→오, 위→아래)대로 원형 id, 쉼표 구분")
    a = ap.parse_args()

    names = [s.strip() for s in a.names.split(",") if s.strip()]
    im = drop_soft_alpha(strip_background(Image.open(a.src).convert("RGBA")))
    lab, box = components(np.array(im)[:, :, 3] >= 200)
    poses = [(r, b) for r, b in box.items() if b[3] - b[1] + 1 >= MIN_H]
    extras = [(r, b) for r, b in box.items() if b[3] - b[1] + 1 < MIN_H]
    rows = band_rows(poses)
    groups = [g for r in rows for g in group_by_gaps(r, a.cols)]
    print(f"자세 {len(poses)}개 · 작은 성분 {len(extras)}개(부속/라벨) · {len(rows)}행 · 원형 {len(groups)}개")
    if len(groups) != len(names):
        sys.exit(f"❌ 검출된 원형 {len(groups)}개 ≠ 준 이름 {len(names)}개. --names 를 맞출 것.")

    out = Path(a.out)
    out.mkdir(parents=True, exist_ok=True)
    for name, g in zip(names, groups):
        sp = [crop_masked(im, lab, r, b, extras) for r, b in g]
        # ⚠️ 발밑 정렬은 **아래 끝**으로 맞춘다. 대조표에서 자세마다 위로 솟은 소품(그물·곡괭이)
        #    때문에 bbox 높이가 다르다 — 위로 맞추면 지면이 어긋난다.
        h = max(s.height for s in sp)
        canvas = Image.new("RGBA", (sum(s.width for s in sp) + GAP * (len(sp) + 1), h + GAP * 2), (0, 0, 0, 0))
        x = GAP
        for s in sp:
            canvas.alpha_composite(s, (x, GAP + h - s.height))
            x += s.width + GAP
        canvas.save(out / f"{name}.png")
        print(f"  {name:9} ← {len(sp)}자세  " + " ".join(f"{s.width}x{s.height}" for s in sp))
    print(f"\n→ {out}  ({len(names)}장)")


if __name__ == "__main__":
    main()
