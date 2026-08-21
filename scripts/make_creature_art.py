#!/usr/bin/env python3
"""정령 픽셀 아트 반입 — 생성형 픽셀 그림 → 게임이 먹는 단일 스프라이트.

  python3 scripts/make_creature_art.py                         # art_inbox/creatures → assets/art/creatures
  python3 scripts/make_creature_art.py --size 80 --colors 22   # 더 굵은 도트로

왜 있나
    주인공·NPC는 픽셀인데 정령 86종만 페인터리라 한 화면에서 화풍이 갈렸다(스타일 바이블 참조:
    outputs/production/2026-08-12_spirit-grove_creature-pixel-style-bible.md).
    정령을 픽셀로 "다시 뽑아" 같은 계열로 맞춘다.

    ⚠️ 기존 페인터리를 자동 축소하는 pixelize_creatures.py 는 두 번 "모자이크"로 실패했다.
       이 스크립트는 **목적 생성된 픽셀 아트**를 반입하는 용도다(생성기 → 여기 → 게임).

무엇을 하나 (make_hero_sheet.py 의 함수를 그대로 재사용 — 규칙이 두 벌이 되면 갈라진다)
    1) 배경이 색으로 채워져 있으면 테두리 flood-fill 로 제거(캐릭터 안 같은 색은 보존).
    2) 구워진 반투명 그림자를 제거(게임에서 정령은 떠 있어 그림자가 없다).
    3) 정사각 캔버스에 **중앙 정렬**(주인공과 달리 발을 아래 끝에 붙이지 않는다).
    4) 논리 해상도로 줄이고 팔레트를 줄여 도트화(알파는 딱 끊는다).

⚠️ 원본을 덮어쓰지 않는다. 입력 art_inbox/creatures, 출력 assets/art/creatures.
   페인터리 원본은 art_inbox/creatures_src 에 86종 보존돼 있다(되돌리려면 거기서 복사).
⚠️ 파일명 = dex.js 의 정령 id. manifest.json 의 "paint" 목록과 대조해 미상 이름을 경고한다
   (오타 id 를 넣으면 게임은 폴백만 보여 원인을 못 찾는다). 매니페스트 수정은 불필요 —
   id 가 이미 paint 에 있으므로 build.py 가 자동으로 새 파일을 인라인한다.
"""
import argparse, json, sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from PIL import Image
from make_hero_sheet import strip_background, drop_soft_alpha, dotize

ROOT = Path(__file__).resolve().parent.parent


def valid_ids():
    """게임에 실제로 존재하는 정령 id (manifest 의 paint 키). 오타 반입 방지용."""
    m = json.loads((ROOT / "assets/manifest.json").read_text())
    return set(m.get("paint", []))


def to_square_center(sp, margin=0.06):
    """정사각 캔버스에 스프라이트를 **중앙** 배치. 전투에서 정령은 떠 있어 접지가 없다.

    margin 은 사방 여백 비율 — object-fit:contain + 부유/런지 애니에 정령이 잘리지 않게 둔다.
    """
    bb = sp.getbbox()
    if bb:
        sp = sp.crop(bb)
    side = max(1, round(max(sp.size) / (1 - 2 * margin)))
    sq = Image.new("RGBA", (side, side), (0, 0, 0, 0))
    sq.alpha_composite(sp, ((side - sp.width) // 2, (side - sp.height) // 2))
    return sq


def convert(src, dst, size, colors, bgthresh, margin):
    im = drop_soft_alpha(strip_background(Image.open(src).convert("RGBA"), bgthresh))
    out = dotize(to_square_center(im, margin), size, colors)
    dst.parent.mkdir(parents=True, exist_ok=True)
    out.save(dst, "WEBP", lossless=True)
    n = len(out.convert("RGB").getcolors(maxcolors=10 ** 6) or [])
    try:
        shown = dst.relative_to(ROOT)
    except ValueError:
        shown = dst
    print(f"     → {shown}  {out.width}x{out.height} · 색 {n}종")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--src", default="art_inbox/creatures")
    ap.add_argument("--out", default="assets/art/creatures")
    ap.add_argument("--size", type=int, default=96, help="논리 해상도(정사각 변). 96 기본 — 표시 104~118px에 ≈1:1")
    ap.add_argument("--colors", type=int, default=24)
    ap.add_argument("--bgthresh", type=int, default=45, help="배경 flood-fill 허용 오차")
    ap.add_argument("--margin", type=float, default=0.06, help="사방 여백 비율")
    a = ap.parse_args()

    src, out = ROOT / a.src, ROOT / a.out
    if src.resolve() == out.resolve():
        sys.exit("❌ --src 와 --out 이 같다 — 원본을 덮어쓰면 되돌릴 수 없다.")
    if out.resolve() == (ROOT / "art_inbox/creatures_src").resolve():
        sys.exit("❌ 출력이 creatures_src 다 — 페인터리 원본 백업을 덮어쓰면 안 된다.")
    if not src.is_dir():
        sys.exit(f"❌ 원본 폴더가 없다: {src}\n   생성한 정령 픽셀 그림을 여기에 (파일명=정령 id) 넣을 것")

    files = sorted(f for f in src.iterdir()
                   if f.suffix.lower() in (".png", ".webp", ".jpg", ".jpeg"))
    if not files:
        sys.exit(f"❌ {src} 에 이미지가 없다.")

    ids = valid_ids()
    ok, unknown = [], []
    for f in files:
        cid = f.stem
        print(f"\n▶ {f.name}  (정령 {cid})")
        if ids and cid not in ids:
            unknown.append(cid)
            print(f"  ⚠️ manifest 의 paint 에 없는 id 다 — 오타면 게임에서 폴백만 보인다. 확인할 것.")
        convert(f, out / f"{cid}.webp", a.size, a.colors, a.bgthresh, a.margin)
        ok.append(cid)

    print(f"\n{'='*54}")
    print(f"변환 {len(ok)}종 · 칸 {a.size}px · 색 {a.colors} 이내" +
          (f" · 이름 미상 {len(unknown)}개" if unknown else ""))
    print("   다음: python3 scripts/build.py   (매니페스트 수정 불필요 — paint 에 이미 있음)")
    if unknown:
        print(f"\n⚠️ 미상 id: {', '.join(unknown)}")
        sys.exit(1)


if __name__ == "__main__":
    main()
