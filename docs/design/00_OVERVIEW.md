# ringle-ai-tutor 전체 기획 개요

> 작성일: 2026-06-17  
> 기준: 과제 원문 + 전체 결정 세션 완료 후 확정판  
> 이 문서는 Phase 2~7 구현의 단일 진실 공급원(SoT)입니다.

---

## 1. 프로젝트 목표

링글 AI 튜터 — 멤버십 기반 영어 회화 AI 앱.  
실제 업무 수준의 코드 품질, 테스트, 설계를 목표로 합니다.  
과제 누락 없음이 최우선이고, 구현 복잡성으로 기능을 빼지 않습니다.

---

## 2. 핵심 제약

| 항목 | 내용 |
|---|---|
| 인증 | 없음. X-User-Id 헤더로 사용자 구분 |
| LLM/STT/TTS | 실제 OpenAI API 연동 필수 (Mock 금지) |
| 결제 | Mock PG만 (실카드 연동 없음) |
| AI 키 | 절대 프론트 노출 금지. 모든 AI 호출은 백엔드 경유 |
| 배포 | 로컬 실행만. localhost 기준 시연 영상 촬영 |

---

## 3. 화면 구성

```
/               홈 화면 — 유저 선택 드롭다운 + 멤버십 카드 + 플랜 구매
/chat           AI 대화 화면 — 멤버십 권한 체크 후 진입
/learn          학습 화면 — 베이직 멤버십 전용 (stub: "준비 중" 안내)
/admin          어드민 화면 — X-Admin-Key 보호, 유저별 멤버십 관리
```

---

## 4. 멤버십 흐름 요약

```
유저 선택 드롭다운
    ↓ X-User-Id 헤더
홈 화면 — 현재 멤버십 표시
    ↓ 구매 버튼 또는 어드민 부여
멤버십 획득 (expires_at 기준 유효)
    ↓ can_talk == true 확인
대화 화면 진입
    ↓ 만료 시 (expires_at < now)
홈으로 리다이렉트 + 안내
```

---

## 5. AI 대화 파이프라인 요약

```
마이크 ON
    → VAD (@ricky0123/vad-web) — 발화 구간 감지
    → Waveform 시각화 (Web Audio API AnalyserNode)
답변완료 버튼
    → VAD blob → POST /api/v1/stt (Whisper-1) → transcript
    → transcript 빈 문자열이면 무시
    → POST /api/v1/chat (SSE, gpt-4o) → 스트리밍 텍스트
    → 문장 완성마다 → POST /api/v1/tts (nova, 0.95x) → audio blob
    → TTS 큐 → 순차 재생
    → AI/유저 발화 버블마다 재생 버튼
```

---

## 6. 상세 문서 목록

| 파일 | 내용 |
|---|---|
| `01_DECISIONS.md` | 전체 결정 사항 (충돌 해소 포함) |
| `02_DOMAIN_MODEL.md` | DB 스키마, 모델 로직 |
| `03_API_SPEC.md` | 전체 API 엔드포인트 명세 |
| `04_AI_PIPELINE.md` | AI 파이프라인 상세 설계 |
| `05_FRONTEND_SPEC.md` | 화면별 컴포넌트, 상태, UX 상세 |
| `06_TEST_STRATEGY.md` | RSpec + Vitest + Capybara 전략 |
| `07_ASSUMPTIONS.md` | 가정 처리 목록 (README 기재용) |
