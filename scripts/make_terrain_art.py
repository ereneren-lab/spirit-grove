#!/usr/bin/env python3
"""지형지물 아트 변환 — 건물·오브젝트 그림을 게임이 쓰는 정사각 webp로 만든다.

왜 따로 있나
    인물은 **3자세 시트**(`make_npc_sheet.py`)라 규격이 다르다. 지형은 방향이 없어서
    **정사각 한 장**이고, 대신 **접지선**이 중요하다.

⚠️ 접지선 0.92 — 이게 이 스크립트의 존재 이유다.
   게임은 절차적 건물의 그림자를 상자의 **92% 지점**에 그린다(`sy+ts*0.92`).
   그림 밑면을 캔버스 바닥(100%)에 붙이면 아트 건물만 8% 아래로 내려앉아
   **절차적 건물과 접지선이 어긋난다.** 그래서 바닥 8%를 비우고 앉힌다.

⚠️ 변환 규칙(배경 제거·반투명 제거·도트화)은 `make_hero_sheet.py`를 import해서 쓴다.
   규칙이 두 벌이 되면 반드시 갈라진다(이 저장소가 병렬 테이블로 여러 번 당했다).

쓰는 법
    python3 scripts/split_contact_sheet.py <대조표.png> --out art_inbox/terrain/_split --cols 1 \
            --names center,shop,hall,gym,dojo,home,altar
    python3 scripts/make_terrain_art.py --src art_inbox/terrain/_split --out assets/art/terrain

    파일 이름이 곧 아트 id다: center.png → assets/art/terrain/center.webp
    id 목록의 단일 출처는 게임 쪽 `TERRAIN_ART_ID`다(발주안 §2).
"""
import argparse, json, sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from PIL import Image
from make_hero_sheet import strip_background, drop_soft_alpha, dotize

# `TERRAIN_ART_ID`의 값들. 여기 없는 이름이 오면 경고하고 넘어간다 —
# 오타로 만든 아트가 조용히 매니페스트에 들어가면 게임에선 폴백만 보고 원인을 못 찾는다.
ART_IDS = ["center", "shop", "hall", "gym", "dojo", "home", "altar",
           "tree_s", "rock", "sign", "campfire", "tree_l"]

FOOT = 0.92        # 밑면이 앉는 높이(캔버스 비율). 게임의 그림자 위치와 같아야 한다.
TOP  = 0.10        # 꼭대기 한계. 절차적 건물의 실측 범위(0.12~0.90)에 맞춘다.
# ⚠️ TOP이 없으면 아트가 캔버스를 꽉 채워 **절차적 건물보다 12% 위로 더 뻗는다.**
#    건물 문 20곳 중 16곳은 바로 위 칸이 걸을 수 있는 풀밭이라(07-28 실측) 그만큼 덮는다 →
#    "갈 수 있는데 막힌 것처럼" 보인다. 발주안 §3의 제약을 코드로도 지킨다.


def convert(src: Path, out: Path, C=128, colors=48):
    im = drop_soft_alpha(strip_background(Image.open(src).convert("RGBA")))
    bb = im.getbbox()
    if not bb:
        print("  ❌ 내용이 비어 있다")
        return False
    sp = im.crop(bb)
    # ⚠️ 가로·세로 **둘 다** 상자에 들어가게 축소한다. 가로만 맞추면 높은 건물이 위로 넘친다 —
    #    발주안 §3의 "위로 뻗지 말 것"은 그림 쪽 요청이고, 여기선 코드로도 보장한다.
    box_w, box_h = C, C * (FOOT - TOP)
    k = min(box_w / sp.width, box_h / sp.height)
    nw, nh = max(1, round(sp.width * k)), max(1, round(sp.height * k))
    sp = sp.resize((nw, nh), Image.LANCZOS)
    cv = Image.new("RGBA", (C, C), (0, 0, 0, 0))
    cv.alpha_composite(sp, ((C - nw) // 2, round(C * FOOT) - nh))
    cv = dotize(cv, C, colors)
    out.parent.mkdir(parents=True, exist_ok=True)
    cv.save(out, "WEBP", lossless=True)
    print(f"     → {out}  {C}x{C} (원본 {sp.width}x{sp.height} · 접지 {FOOT} · 상한 {TOP})")
    return True


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--src", required=True)
    ap.add_argument("--out", required=True)
    ap.add_argument("--cell", type=int, default=128, help="출력 한 변(px)")
    ap.add_argument("--colors", type=int, default=48, help="팔레트 색 수 (인물보다 넉넉히 — 건물은 면이 많다)")
    a = ap.parse_args()

    src, out = Path(a.src), Path(a.out)
    if src.resolve() == out.resolve():
        sys.exit("❌ --src와 --out이 같다. 원본을 덮어쓰면 되돌릴 수 없다.")
    files = sorted(f for f in src.iterdir() if f.suffix.lower() in (".png", ".webp", ".jpg", ".jpeg"))
    if not files:
        sys.exit(f"❌ {src} 에 이미지가 없다.")

    ok, bad, unknown = [], [], []
    for f in files:
        aid = f.stem
        print(f"\n▶ {f.name}  (아트 {aid})")
        if aid not in ART_IDS:
            unknown.append(aid)
            print(f"  ⚠️ 알려진 아트 id가 아니다. 쓸 수 있는 것: {', '.join(ART_IDS)}")
        (ok if convert(f, out / f"{aid}.webp", a.cell, a.colors) else bad).append(aid)

    print(f"\n{'='*54}")
    print(f"변환 {len(ok)}장 성공 · {len(bad)}장 실패" + (f" · 이름 미상 {len(unknown)}개" if unknown else ""))
    if ok:
        print('\n⚠️ 게임에 실으려면 assets/manifest.json 의 "terrain" 에 넣을 것:')
        print("   " + json.dumps(sorted(ok), ensure_ascii=False))
    missing = [x for x in ART_IDS if x not in ok]
    if missing:
        print(f"\n📌 아직 없는 아트 {len(missing)}개 — 절차적 그림으로 폴백한다(정상):")
        print("   " + ", ".join(missing))
    sys.exit(1 if bad else 0)


if __name__ == "__main__":
    main()
