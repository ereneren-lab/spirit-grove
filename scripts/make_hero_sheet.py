#!/usr/bin/env python3
"""
주인공 걷기 스프라이트 시트 만들기 — 생성형 아트 → 게임이 먹는 3×3 시트.

  python3 scripts/make_hero_sheet.py <원본.png> <출력.webp> --front r1c1 --back r2c2 --side r3c4

왜 있나
  이미지 생성기는 (실측 2회) **32px 격자도, 걷기 프레임 일관성도 못 맞춘다.**
  대신 "같은 캐릭터를 여러 시점으로" 는 잘 뽑는다. 그래서 역할을 나눈다:
    생성기 = 시점별 정지 그림     ·     이 스크립트 = 도트화 + 걷기 프레임 + 시트 조립

무엇을 하나
  1) 원본에서 알파 여백으로 격자를 자동 감지해 rNcM 으로 칸을 지목할 수 있게 한다.
  2) 고른 3칸(정면/뒷모습/옆모습)을 정사각으로 맞추고 **발을 아래 끝에** 붙인다.
  3) 지정 크기로 줄이고 팔레트를 줄여 도트화한다(알파는 딱 끊는다 — 반투명 가장자리가 도트를 흐린다).
  4) 정지 프레임에서 **걸음 A/B를 파생**시킨다: 몸통 1px 올리고 좌우 발을 반대로 1~2px 어긋낸다.
  5) 3열(정지/A/B) × 3행(아래/위/옆) 로 붙여 저장한다.

⚠️ 칸 크기는 게임의 `heroDrawSpec`이 **원본의 정수배로 내려서** 그린다.
   64면 화면에 1:1(가장 또렷), 32면 2배. 실측상 이 아트의 디테일은 32칸에 안 들어간다 → 기본 64.
"""
import argparse, re, sys
from PIL import Image
import numpy as np


def detect_grid(im, thr=16, minlen=8):
    """알파가 비는 구간으로 행/열 경계를 찾는다. 생성기가 칸을 균등하게 안 줘도 동작한다."""
    a = np.array(im)[:, :, 3]
    def spans(v):
        out, s = [], None
        for i, x in enumerate(v):
            if x > 2 and s is None: s = i
            elif x <= 2 and s is not None: out.append((s, i - 1)); s = None
        if s is not None: out.append((s, len(v) - 1))
        return [(x, y) for x, y in out if y - x >= minlen]
    return spans((a > thr).sum(axis=0)), spans((a > thr).sum(axis=1))


def cell(im, cols, rows, ref):
    m = re.fullmatch(r"[rR](\d+)[cC](\d+)", ref)
    if not m: sys.exit(f"❌ 칸 지정이 이상하다: {ref} (예: r1c1)")
    r, c = int(m.group(1)) - 1, int(m.group(2)) - 1
    if not (0 <= r < len(rows) and 0 <= c < len(cols)):
        sys.exit(f"❌ {ref} 는 격자 범위 밖이다 (감지된 격자: {len(rows)}행 × {len(cols)}열)")
    x0, x1 = cols[c]; y0, y1 = rows[r]
    sp = im.crop((x0, y0, x1 + 1, y1 + 1))
    bb = sp.getbbox()
    return sp.crop(bb) if bb else sp


def to_square_feet_bottom(sp, side):
    """정사각 캔버스(변 = side) + 발바닥을 아래 끝에. 게임이 이미지 아래 끝을 접지면으로 본다.

    ⚠️ `side`는 **시트 전체가 공유**해야 한다. 칸마다 제 크기로 정사각을 만들면
       다리를 벌린 프레임일수록 캔버스가 커져서 축소 후 캐릭터가 작아진다 →
       걸을 때 몸이 커졌다 작아졌다 **펄떡인다**. 실제로 그렇게 나왔다.
    """
    sq = Image.new("RGBA", (side, side), (0, 0, 0, 0))
    sq.alpha_composite(sp, ((side - sp.width) // 2, side - sp.height))
    return sq


def dotize(sq, size, colors):
    small = sq.resize((size, size), Image.LANCZOS)
    alpha = small.getchannel("A").point(lambda v: 255 if v >= 110 else 0)
    rgb = small.convert("RGB").quantize(colors=colors, method=Image.MEDIANCUT).convert("RGB")
    out = rgb.convert("RGBA"); out.putalpha(alpha)
    return out


def step_frame(idle, phase, bob=1, sway=1):
    """걸음 프레임을 **합성**한다 — 원본에 걷는 자세가 없을 때만 쓴다.

    ⚠️ 스프라이트를 잘라 다리만 어긋내는 방법을 먼저 썼는데 **허리·부츠에 투명한 틈**이 생겼다
       (몸통과 발을 다른 양만큼 옮기면 반드시 벌어진다). 도트가 아니라 그려진 그림이라 잘린 단면이
       그대로 드러난다. → **자르지 않는다.** 스프라이트 전체를 1px 올리고 좌우로 1px 흔든다.
       이음매가 원천적으로 없고, 초당 8위상에서 걷는 것처럼 읽힌다.
    ⚠️ 원본에 진짜 걷는 자세가 있으면 그걸 쓰는 게 훨씬 낫다 — `--side r3c1,r3c4,r4c3` 처럼 3칸을 준다.
    """
    w, h = idle.size
    out = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    out.alpha_composite(idle, (sway if phase == 0 else -sway, -bob))
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("src"); ap.add_argument("out")
    ap.add_argument("--front", required=True, help="정면. 1칸(합성) 또는 3칸 'r1c1,r1c2,r1c3'(정지,A,B)")
    ap.add_argument("--back", required=True, help="뒷모습. 1칸 또는 3칸")
    ap.add_argument("--side", required=True, help="옆모습 — **오른쪽을 보는 것**. 1칸 또는 3칸")
    ap.add_argument("--cell", type=int, default=64)
    ap.add_argument("--colors", type=int, default=22)
    ap.add_argument("--bob", type=int, default=1)
    ap.add_argument("--sway", type=int, default=1)
    a = ap.parse_args()

    im = Image.open(a.src).convert("RGBA")
    cols, rows = detect_grid(im)
    print(f"격자 감지: {len(rows)}행 × {len(cols)}열")

    C = a.cell
    ROW_KO = ["아래(정면)", "위(뒷모습)", "옆(오른쪽)"]
    specs = []
    for row, spec in enumerate([a.front, a.back, a.side]):
        refs = [s.strip() for s in spec.split(",") if s.strip()]
        if len(refs) not in (1, 3):
            sys.exit(f"❌ {ROW_KO[row]}: 칸을 1개 또는 3개로 줄 것 (받은 값 {len(refs)}개)")
        specs.append(refs)

    # 시트 전체가 **한 배율**을 쓰도록 가장 큰 스프라이트에 맞춘 공통 정사각 변을 먼저 구한다.
    sprites = {r: cell(im, cols, rows, r) for refs in specs for r in refs}
    SIDE = max(max(s.size) for s in sprites.values())
    print(f"공통 정사각 변: {SIDE}px (가장 큰 스프라이트 기준) — 프레임 간 크기 펄떡임 방지")

    sheet = Image.new("RGBA", (C * 3, C * 3), (0, 0, 0, 0))
    for row, refs in enumerate(specs):
        dots = [dotize(to_square_feet_bottom(sprites[r], SIDE), C, a.colors) for r in refs]
        if len(dots) == 3:
            frames, how = dots, "원본 3칸"
        else:
            frames = [dots[0], step_frame(dots[0], 0, a.bob, a.sway), step_frame(dots[0], 1, a.bob, a.sway)]
            how = "정지 1칸 + 걸음 합성"
        for c, f in enumerate(frames):
            sheet.alpha_composite(f, (c * C, row * C))
        print(f"  행{row} {ROW_KO[row]:10} ← {','.join(refs):22} ({how})")

    sheet.save(a.out, "WEBP", lossless=True)
    n = len(sheet.convert("RGB").getcolors(maxcolors=10 ** 6) or [])
    print(f"✅ {a.out}  {sheet.width}x{sheet.height} (칸 {C}) · 색 {n}종")
    print("   ⚠️ 게임에 실으려면 assets/manifest.json 의 \"hero_sheet\" 에 키를 넣을 것")


if __name__ == "__main__":
    main()
