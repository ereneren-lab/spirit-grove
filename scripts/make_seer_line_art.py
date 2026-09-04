#!/usr/bin/env python3
"""에스퍼 예지 라인(mystorb/seergaze/omniseer) 절차적 픽셀 스프라이트 — 플레이 가능 플레이스홀더.

강철·사마귀·고스트 라인과 같은 목적. 떠 있는 점술 구슬 → 큰 눈이 뜬 천리안 → 여러 눈을 두른 심안자.
규격: 256x256 RGBA webp, 투명 배경, 중앙 부유. 로직 64px → nearest 확대.
"""
from pathlib import Path
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "assets/art/creatures"
L = 64

# 수정 구슬(연보라~청보라) + 금빛 테두리 + 홍채(에스퍼 핑크) + 눈불 흰자
OUTLINE = (44, 32, 60, 255)
GLASSSH = (96, 84, 150, 255)    # 구슬 그림자
GLASSMID= (150, 140, 208, 255)  # 구슬 중간(연보라)
GLASSHI = (204, 198, 240, 255)  # 구슬 하이라이트
SPEC    = (244, 242, 255, 255)
GOLD    = (226, 190, 96, 255)   # 금테
GOLDHI  = (248, 226, 150, 255)
IRIS    = (226, 118, 200, 255)  # 에스퍼 핑크 홍채
PUPIL   = (52, 30, 64, 255)
SCLERA  = (238, 232, 250, 255)  # 흰자


def new():
    im = Image.new("RGBA", (L, L), (0, 0, 0, 0)); return im, ImageDraw.Draw(im)


def outline_pass(im):
    px = im.load(); base = im.copy(); bp = base.load()
    for y in range(L):
        for x in range(L):
            if bp[x, y][3] != 0: continue
            for dx, dy in ((1,0),(-1,0),(0,1),(0,-1),(1,1),(-1,1),(1,-1),(-1,-1)):
                nx, ny = x+dx, y+dy
                if 0 <= nx < L and 0 <= ny < L and bp[nx, ny][3] != 0 and bp[nx, ny] != OUTLINE:
                    px[x, y] = OUTLINE; break
    return im


def orb(d, px, cx, cy, r):
    """수정 구슬: 3톤 셰이딩 + 좌상 하이라이트 스팟."""
    d.ellipse([cx-r, cy-r, cx+r, cy+r], fill=GLASSMID)
    for yy in range(cy-r, cy+r+1):
        t = (yy-(cy-r))/(2*r)
        col = GLASSHI if t < 0.32 else (GLASSMID if t < 0.66 else GLASSSH)
        import math
        half = int((r*r - (yy-cy)**2) ** 0.5) if abs(yy-cy) <= r else 0
        d.line([(cx-half, yy), (cx+half, yy)], fill=col)
    d.ellipse([cx-r+2, cy-r+2, cx-r+7, cy-r+6], fill=GLASSHI)
    px[cx-r+4, cy-r+4] = SPEC


def eye(d, px, cx, cy, w, h):
    """아몬드 눈 + 핑크 홍채 + 동공 + 흰 반짝임."""
    d.ellipse([cx-w, cy-h, cx+w, cy+h], fill=SCLERA)
    d.ellipse([cx-w, cy-h, cx+w, cy+h], outline=OUTLINE)
    d.ellipse([cx-3, cy-3, cx+3, cy+3], fill=IRIS)
    d.ellipse([cx-1, cy-1, cx+1, cy+1], fill=PUPIL)
    px[cx-1, cy-1] = SPEC


def gold_ring(d, cx, cy, r):
    """구슬을 감싼 금테 아치(위쪽 반원)."""
    d.arc([cx-r-2, cy-r-2, cx+r+2, cy+r+2], 200, 340, fill=GOLD, width=2)
    d.point([(cx, cy-r-2)]); # top notch handled by outline


def finish(im, cid):
    im = outline_pass(im)
    big = im.resize((256, 256), Image.NEAREST)
    OUT.mkdir(parents=True, exist_ok=True)
    big.save(OUT / f"{cid}.webp", "WEBP", lossless=True)
    print("  wrote", cid)


def mystorb():
    """1단 점술구슬 — 작은 수정 구슬 하나. 안개 낀 표면."""
    im, d = new(); px = im.load()
    orb(d, px, 32, 32, 13)
    # 안개 소용돌이(연한 흰 획)
    d.arc([26, 30, 40, 40], 20, 200, fill=GLASSHI)
    # 작은 금테 받침
    d.line([(24, 44), (40, 44)], fill=GOLD)
    px[28, 45] = GOLDHI; px[36, 45] = GOLDHI
    finish(im, "mystorb")


def seergaze():
    """2단 천리안 — 구슬 한가운데 큰 눈이 떠졌다."""
    im, d = new(); px = im.load()
    orb(d, px, 32, 30, 16)
    eye(d, px, 32, 30, 8, 6)
    # 금테 아치
    d.arc([14, 12, 50, 48], 200, 340, fill=GOLD, width=2)
    # 아래로 흐르는 사이킥 자락 두 점
    for sx in (24, 40):
        d.line([(sx, 46), (sx, 52)], fill=IRIS)
    finish(im, "seergaze")


def omniseer():
    """3단 심안자 — 큰 구슬 + 주위를 두른 여러 작은 눈."""
    im, d = new(); px = im.load()
    orb(d, px, 32, 32, 18)
    eye(d, px, 32, 32, 9, 7)
    # 주위 작은 눈 6개(원형 배치)
    import math
    for k in range(6):
        a = math.radians(60*k - 90)
        ex = int(32 + 24*math.cos(a)); ey = int(32 + 24*math.sin(a))
        d.ellipse([ex-3, ey-2, ex+3, ey+2], fill=SCLERA)
        d.ellipse([ex-1, ey-1, ex+1, ey+1], fill=IRIS)
        px[ex, ey] = PUPIL
    # 금테 링
    d.arc([10, 10, 54, 54], 0, 360, fill=GOLD, width=1)
    finish(im, "omniseer")


if __name__ == "__main__":
    print("에스퍼 예지 라인 절차적 스프라이트:")
    mystorb(); seergaze(); omniseer()
    print("완료 → assets/art/creatures/")
