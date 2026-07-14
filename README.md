# 정령의 숲 — VS Code + Claude Code 세팅

이 폴더를 그대로 VS Code로 열면 지금까지의 개발 맥락(파이프라인·규칙·현재 상태)이 `CLAUDE.md`에 담겨 있어서, Claude Code가 첫 프롬프트부터 이어받아.

## 준비물
- **Anthropic 계정** (Pro / Max / Team / Enterprise 중 하나 — 무료 플랜은 Claude Code 미포함)
- **VS Code** (또는 Cursor 등 VS Code 계열)
- **Python 3** + 파이프라인 라이브러리 (아트 처리용)
- (게임 확인용) 브라우저

## 1. Claude Code 설치
공식 안내: https://docs.claude.com/en/docs/claude-code/overview

- **권장(네이티브, Node 불필요)** — macOS / Linux / WSL:
  ```bash
  curl -fsSL https://claude.ai/install.sh | bash
  ```
  Windows 네이티브: https://claude.ai/download 에서 설치 (또는 WSL2 안에서 위 명령).
- **npm 대안** (Node.js 22+ 필요, sudo 금지):
  ```bash
  npm install -g @anthropic-ai/claude-code
  ```
- **VS Code 확장**: 마켓플레이스에서 "Claude Code" 설치 → 통합 터미널에서 실행되고 변경사항을 diff로 보여줌.

첫 실행 시 `claude` 입력 → 브라우저 로그인(OAuth).

## 2. 파이프라인 라이브러리
```bash
pip install opencv-python-headless numpy Pillow
```
(권한 문제 시 시스템에 맞춰 `--user` 또는 가상환경 사용)

## 3. 프로젝트 열기
```bash
cd spirit-grove
code .          # VS Code로 열기
```
VS Code 통합 터미널에서 `claude` 실행 → 대화 시작. (git 저장소는 이미 초기화돼 있음)

## 구조
```
src/index.html   ← 편집용 소스 (440KB). 게임 코드는 전부 여기.
assets/art/      ← 크리처 86종 + 주인공 아트 (.webp 낱장 파일)
dist/            ← 빌드 결과물. 브라우저로 여는 건 이 파일 (직접 편집 금지)
```

## 개발 루프
1. 외부(ChatGPT 등)에서 아트 생성 → PNG를 `art_inbox/`에 저장
2. 파이프라인으로 처리 (→ `assets/art/**.webp` 저장):
   ```bash
   python3 scripts/process_art.py creature  art_inbox/foxfire.png=foxfire
   python3 scripts/process_art.py hero      art_inbox/rio.png=0        # 주인공 정면 (0~3)
   python3 scripts/process_art.py hero_back art_inbox/rio_back.png=0   # 주인공 뒷모습
   ```
3. 빌드 + 검증:
   ```bash
   python3 scripts/build.py
   bash scripts/verify.sh
   ```
4. 게임 확인:
   ```bash
   python3 -m http.server 8000   # → http://localhost:8000/dist/spirit_grove_3d.html
   ```
5. 커밋:
   ```bash
   git add -A && git commit -m "art: 배치 X 반영"
   ```

Claude Code한테는 "art_inbox에 넣었어, 파이프라인 돌리고 검증해줘" 처럼 말하면 위 과정을 대신 실행해줘.

## 다음 단계 추천
1. **브라우저 자동화 MCP**(Playwright 등) 붙이기 → Claude Code가 게임을 실제로 띄워 스크린샷으로 검증(HP바·헤일로·주인공 접지 등 눈으로 확인).
2. 온보딩/튜토리얼, 게임필 폴리시 (로드맵 2순위).

자세한 프로젝트 규칙은 `CLAUDE.md` 참고.
