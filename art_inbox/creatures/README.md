# 정령 픽셀 아트 드롭인 폴더

생성한 정령 픽셀 그림을 여기에 넣는다. **파일명 = 정령 id**(예: `foxfire.png`, `krakentide.webp`).
프롬프트: `outputs/production/2026-08-12_spirit-grove_creature-pixel-prompts-phase1.md`
규격: `outputs/production/2026-08-12_spirit-grove_creature-pixel-style-bible.md`

## 반입
```
python3 scripts/make_creature_art.py     # 배경/그림자 제거 → 중앙정렬 → 도트화(기본 96px·24색)
python3 scripts/build.py                  # PAINT_ART 자동 재생성 (매니페스트 수정 불필요)
```
원본 페인터리는 `art_inbox/creatures_src/`에 86종 보존돼 있다(되돌리기 안전).
