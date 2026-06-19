# 설계 결정 사항 전체 목록

> 작성일: 2026-06-17  
> 이 문서는 OPEN_QUESTIONS.md의 충돌 해소 결과를 포함한 **최종 확정판**입니다.  
> 이 문서가 충돌 시 항상 우선합니다.

---

## A. 실행 환경

| 결정 항목 | 결정 내용 | 이유 |
|---|---|---|
| 실행 방식 | 로컬 직접 설치 | Docker 없이 단순하게 |
| Ruby 버전 | 3.3.x (RubyInstaller) | 현재 설치 기준 |
| Rails 버전 | 7.1.x API mode | 스캐폴딩 기준 |
| PostgreSQL | 16 (winget 설치) | 로컬 직접 설치 |
| Frontend | React 19 + TypeScript + Vite (port 5173) | 스캐폴딩 기준 (package.json ^19.1.1) |
| 패키지 매니저 | pnpm | 스캐폴딩 기준 |

---

## B. 인증 및 사용자 식별

| 결정 항목 | 결정 내용 | 상세 |
|---|---|---|
| 인증 방식 | X-User-Id 헤더 | 실제 JWT 없음 (과제 제외) |
| 유저 선택 방법 | 홈 화면 드롭다운 | 미리 생성된 유저 seed 목록에서 선택 |
| 상태 저장 | localStorage | 새로고침 후에도 선택 유지 |
| conversation_id 저장 | localStorage | 마지막 conversation_id를 저장. 새로고침 시 복원 |
| 어드민 보호 | X-Admin-Key 헤더 | `.env`의 `ADMIN_KEY` 값과 일치 여부 검증 |

**X-User-Id 흐름:**
```
홈 화면 드롭다운에서 유저 선택
    → localStorage에 저장 (key: 'selectedUserId')
    → 모든 API 요청에 X-User-Id: {id} 헤더 자동 포함
    → 백엔드 ApplicationController#set_current_user가 @current_user_id 설정
```

---

## C. 멤버십 도메인

| 결정 항목 | 결정 내용 | 상세 |
|---|---|---|
| 만료 판단 기준 | expires_at < Time.current 단일 기준 | 세션 횟수 없음 |
| total_sessions / used_sessions | **제거됨** | 복잡도 대비 과제 요구사항 불명확 |
| 재구매 동작 | 기간 연장 | `expires_at += plan.duration_days.days` |
| 업그레이드 동작 | 남은 기간 이어받기 | `new_expires_at = [old_expires_at, Time.current].max + plan.duration_days.days` |
| 어드민 삭제 후 | 다음 API 호출 시 403 반환 | 실시간 즉시 차단 |
| 만료 프론트 감지 | 클라이언트 타이머 | 홈/대화 화면 진입 시 `expires_at`을 받아 `setTimeout`으로 만료 순간 즉시 처리. 폴링 없음 |

**멤버십 status 값:**
```
trial    → 기본 무료 플랜 (can_talk: false)
active   → 유효 멤버십 (can_talk: true)
expired  → 만료됨
```

**접근 판단 로직:**
```ruby
membership.active? && membership.plan.can_talk
# active? = (status == 'active' || status == 'trial') && expires_at > Time.current
# trial 상태도 유효 기간 안에 있으면 active? = true
# 단, Free 플랜은 can_talk: false이므로 AI 대화는 차단됨
```

---

## D. 플랜 종류

| 플랜명 | monthly_price | can_learn | can_talk | can_analyze | duration_days |
|---|---|---|---|---|---|
| Free | 0 | false | false | false | 0 |
| Basic | 9,900 | true | false | false | 30 |
| Standard | 19,900 | true | true | false | 30 |
| Premium | 39,900 | true | true | true | 30 |

> `can_analyze: true`인 Premium 플랜은 분석 기능 권한 구조만 유지, UI는 추후 구현.

---

## E. AI 대화 설계

| 결정 항목 | 결정 내용 |
|---|---|
| AI 첫 메시지 | 고정 문장: "Hi! I'm your AI English tutor. What would you like to practice today?" |
| 첫 메시지 TTS | 즉시 재생 (대화 화면 진입 시 자동) |
| 대화 언어 | 영어만. 한국어 입력 시 "Please speak in English." 응답 |
| 최대 턴 수 | 20턴. 1턴 = 유저 발화 1회 + AI 응답 1회. 메시지 총 40개 |
| 컨텍스트 전략 | Sliding window — 최근 20턴(메시지 40개)만 LLM 컨텍스트에 포함 |
| 스트리밍 방식 | Rails SSE (ActionController::Live) |
| LLM 모델 | gpt-4o |
| max_tokens | 1000 per turn |
| 시스템 프롬프트 | 영어 회화 튜터 역할, 자연스럽고 친절한 피드백 유도 |

---

## F. VAD / STT 설계

| 결정 항목 | 결정 내용 |
|---|---|
| VAD 라이브러리 | @ricky0123/vad-web |
| 무음 threshold | 1.5초 |
| 최소 발화 길이 | 200ms (너무 짧은 잡음 필터) |
| 답변완료 버튼 | 필수 — VAD로만 제출하지 않음 |
| 빈 transcript 처리 | 무시. 안내 메시지 표시 후 재도전 유도 |
| 오디오 포맷 | webm (MediaRecorder 기본) |
| STT 모델 | Whisper-1 |
| 마이크 자동 OFF | 3분 무활동 시 자동 OFF + 안내 토스트 |

---

## G. TTS 설계

| 결정 항목 | 결정 내용 |
|---|---|
| TTS 모델 | tts-1 |
| 음성 | nova |
| 속도 | 0.95 |
| 청크 단위 | 문장 단위 (마침표/물음표/느낌표 기준 분리) |
| 재생 방식 | TTS 큐 — 순차 재생, 중복 방지 |
| 재생 버튼 | AI 발화 + 유저 발화 버블마다 표시 |
| 실패 시 재시도 | 최대 3회 자동 재시도, 이후 에러 토스트 |

---

## H. UI/UX 설계

| 결정 항목 | 결정 내용 |
|---|---|
| 디자인 레퍼런스 | Ringle 앱 유사 (디자인 별도 제공 예정) |
| 반응형 | 필수 (모바일/데스크탑) |
| Waveform | Web Audio API AnalyserNode 기반 시각화 |
| 메시지 시간 | HH:MM 포맷 |
| 학습 기능 | "준비 중" 안내 화면 stub (라우트만 등록, 기능 없음) |
| 분석 기능 | 권한 구조만 유지, UI는 추후 구현 |
| 연결 끊김 처리 | SSE 재연결 최대 3회 시도, 이후 에러 배너 |

---

## I. Rate Limit

| 엔드포인트 | 기준 | 한도 |
|---|---|---|
| POST /api/v1/stt | user_id | 10 req/min |
| POST /api/v1/chat (SSE) | user_id | 10 req/min |
| POST /api/v1/tts | user_id | 20 req/min |

> IP 기준은 로그인 엔드포인트에만 사용. AI 경로는 user_id 기준.

---

## J. 어드민 기능

| 기능 | 상세 |
|---|---|
| 접근 보호 | X-Admin-Key 헤더 검증 |
| 유저 목록 | 전체 유저 + 현재 멤버십 상태 표시 |
| 멤버십 부여 | 기존 active 멤버십이 있으면 expired로 전환 후 새 멤버십 생성 (교체) |
| 멤버십 삭제 | 즉시 비활성화 (다음 API 호출 시 403) |
| 어드민 UI 라우트 | `/admin` |

---

## K. 테스트 전략

| 레이어 | 도구 |
|---|---|
| Rails 요청/모델/서비스 | RSpec 6 |
| OpenAI API Mock | WebMock + VCR |
| Rails E2E | Capybara |
| React 컴포넌트 | Vitest + @testing-library/react |

---

## L. 보안 / 민감 정보

| 항목 | 결정 |
|---|---|
| OpenAI API 키 | 절대 프론트 노출 금지. 백엔드 AppConfig로만 접근 |
| AI 에이전틱 자산 | .ai/, .claude/, .codex/, .harness/, CLAUDE.md, AGENTS.md → .gitignore, 커밋 금지 |
| .env | .gitignore 대상. .env.example 으로 키 목록만 공개 |
| master.key | .gitignore 대상 |
| 로그 필터 | password, token, api_key, audio_content, transcript |
| 실카드 정보 | 코드 어디에도 없음 (Mock PG만) |

---

## M. 기타 확정 사항

| 항목 | 결정 |
|---|---|
| API 버전 prefix | /api/v1/ |
| 성공 응답 구조 | `{ data: ... }` |
| 에러 응답 구조 | `{ error: "...", code: "snake_case" }` |
| CORS 허용 origin | http://localhost:5173 |
| 환경변수 접근 | 반드시 AppConfig 경유. ENV 직접 접근 금지 |
| 컨트롤러 비즈니스 로직 | 금지. Services/ 폴더로 위임 |
