#!/usr/bin/env python3
"""사마귀 라인(mantlet/scythel/reapmantis) 절차적 픽셀 스프라이트 생성 — 플레이 가능한 플레이스홀더.

강철 라인(make_steel_line_art.py)과 같은 목적: GPT 손그림이 오기 전까지 게임이 먹는 규격의
'플레이 가능 + 교체 대상' 스프라이트를 코드로 찍는다. 사마귀는 삼각 머리·세운 낫팔·가는 몸통이라
기하로도 실루엣이 읽힌다. 스타일 바이블 톤(투명 배경·도트·3톤 셰이딩)에 맞춘다.
규격: 256x256 RGBA webp, 투명 배경, 중앙 부유. 로직 64px에서 그린 뒤 nearest 확대.
"""
from pathlib import Path
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "assets/art/creatures"
L = 64

# 사마귀 팔레트 (아웃라인/그림자/중간/하이라이트) + 낫팔 하이라이트 + 노란 눈
OUTLINE = (26, 40, 26, 255)
SHADOW  = (58, 104, 60, 255)
MID     = (96, 158, 92, 255)
HI      = (150, 200, 130, 255)
SPEC    = (208, 232, 176, 255)
BLADE   = (196, 220, 170, 255)   # 낫팔 밝은 날
EYE     = (240, 208, 72, 255)    # 노란 겹눈
EYEHI   = (255, 244, 190, 255)


def new():
    im = Image.new("RGBA", (L, L), (0, 0, 0, 0))
    return im, ImageDraw.Draw(im)


def outline_pass(im):
    px = im.load(); base = im.copy(); bp = base.load()
    for y in range(L):
        for x in range(L):
            if bp[x, y][3] != 0:
                continue
            for dx, dy in ((1,0),(-1,0),(0,1),(0,-1),(1,1),(-1,1),(1,-1),(-1,-1)):
                nx, ny = x+dx, y+dy
                if 0 <= nx < L and 0 <= ny < L and bp[nx, ny][3] != 0 and bp[nx, ny] != OUTLINE:
                    px[x, y] = OUTLINE; break
    return im


def shade_block(d, x0, y0, x1, y1):
    for y in range(y0, y1+1):
        t = (y - y0) / max(1, (y1 - y0))
        col = HI if t < 0.28 else (MID if t < 0.68 else SHADOW)
        d.line([(x0, y), (x1, y)], fill=col)


def head(d, px, cx, top, w, h, eye_dx=2):
    """삼각형 사마귀 머리 + 노란 겹눈 두 개."""
    d.polygon([(cx-w, top), (cx+w, top), (cx, top+h)], fill=MID)
    d.polygon([(cx-w, top), (cx+w, top), (cx, top+h)], fill=None)
    for ex in (cx-eye_dx-1, cx+eye_dx):
        d.ellipse([ex-1, top+1, ex+1, top+3], fill=EYE)
        px[ex, top+2] = EYEHI


def scythe(d, sx, sy, dirx, scale=1.0):
    """세운 낫팔: 상완(대각) + 낫날(꺾인 삼각)."""
    ex = sx + int(6*scale)*dirx; ey = sy - int(5*scale)
    d.line([(sx, sy), (ex, ey)], fill=SHADOW, width=2)          # 상완
    tipx = ex + int(5*scale)*dirx; tipy = ey - int(7*scale)
    d.line([(ex, ey), (tipx, tipy)], fill=MID, width=2)          # 전완
    d.polygon([(ex, ey), (tipx, tipy), (tipx-2*dirx, tipy+2)], fill=BLADE)  # 낫날


def finish(im, cid):
    im = outline_pass(im)
    big = im.resize((256, 256), Image.NEAREST)
    OUT.mkdir(parents=True, exist_ok=True)
    big.save(OUT / f"{cid}.webp", "WEBP", lossless=True)
    print("  wrote", cid)


def mantlet():
    """1단 애사마귀 — 작고 여린 새끼. 몸통 작고 낫팔도 작다."""
    im, d = new(); px = im.load()
    d.ellipse([28, 30, 38, 50], fill=MID); shade_block(d, 29, 31, 37, 49)   # 가는 몸통
    d.ellipse([28, 30, 38, 50], fill=None)
    head(d, px, 33, 22, 5, 8)
    scythe(d, 30, 34, -1, 0.8); scythe(d, 36, 34, +1, 0.8)                   # 작은 낫팔
    d.line([(30, 50), (28, 56)], fill=SHADOW, width=1)                       # 다리
    d.line([(36, 50), (38, 56)], fill=SHADOW, width=1)
    finish(im, "mantlet")


def scythel():
    """2단 낫사마귀 — 낫팔이 두 자루 낫으로 자랐다."""
    im, d = new(); px = im.load()
    d.ellipse([26, 26, 40, 52], fill=MID); shade_block(d, 27, 27, 39, 51)    # 몸통↑
    d.ellipse([26, 26, 40, 52], fill=None)
    d.point([(30, 30)], fill=SPEC)
    head(d, px, 33, 16, 6, 10)
    scythe(d, 28, 30, -1, 1.3); scythe(d, 38, 30, +1, 1.3)                   # 큰 낫팔
    for lx, ldx in ((28, -1), (38, +1)):                                     # 다리 두 쌍
        d.line([(lx, 50), (lx+3*ldx, 57)], fill=SHADOW, width=1)
        d.line([(lx, 46), (lx+4*ldx, 52)], fill=SHADOW, width=1)
    finish(im, "scythel")


def reapmantis():
    """3단 대검사마귀 — 큰 낫을 세운 검귀. 크고 진한 녹색."""
    im, d = new(); px = im.load()
    d.ellipse([24, 22, 42, 54], fill=SHADOW); shade_block(d, 25, 24, 41, 52)  # 큰 몸통(진녹)
    d.ellipse([24, 22, 42, 54], fill=None)
    d.line([(33, 26), (33, 50)], fill=OUTLINE)                                # 등 능선
    head(d, px, 33, 10, 7, 12, eye_dx=3)
    d.rectangle([31, 8, 35, 10], fill=SHADOW)                                 # 목
    scythe(d, 26, 26, -1, 1.9); scythe(d, 40, 26, +1, 1.9)                    # 대검 낫팔
    for lx, ldx in ((26, -1), (40, +1)):
        d.line([(lx, 52), (lx+5*ldx, 60)], fill=SHADOW, width=2)
        d.line([(lx, 46), (lx+6*ldx, 54)], fill=SHADOW, width=1)
        d.line([(lx, 40), (lx+5*ldx, 46)], fill=SHADOW, width=1)
    finish(im, "reapmantis")


if __name__ == "__main__":
    print("사마귀 라인 절차적 스프라이트:")
    mantlet(); scythel(); reapmantis()
    print("완료 → assets/art/creatures/")
