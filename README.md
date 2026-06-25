# Ringle AI Tutor

영어 회화 AI 튜터 풀스택 과제 구현물입니다.  
멤버십 기반 접근 제어 + 실시간 음성 대화(VAD → STT → Chat SSE → TTS) 파이프라인을 포함합니다.

---

## 사용 AI

| 역할 | 도구 |
|---|---|
| 요구사항 정리 / 계획 / 핸드오프 생성 / Final Check | Claude (claude-sonnet-4-6) |
| 구현 / 수정 / 리팩터 / 커밋 | Codex (OpenAI) |
| 계획 초안 외부 리뷰 | Gemini CLI |

---

## 기술 스택

| 영역 | 기술 |
|---|---|
| Backend | Ruby 3.3 / Rails 7.1 (API mode) / PostgreSQL |
| Frontend | React 19 / TypeScript / Vite / pnpm |
| AI | OpenAI Whisper-1 (STT), GPT-4o (Chat SSE), TTS-1 nova (TTS) |
| VAD | @ricky0123/vad-web (Silero VAD, 브라우저 실행) |
| 상태 관리 | TanStack Query (서버 상태), useState/useRef (로컬 상태) |
| 입력 검증 | Zod |
| Rate Limit | Rack::Attack |
| 테스트 | RSpec / Vitest + Testing Library |

---

## 실행 방법

### 사전 요구사항

- Ruby 3.3+
- Node.js 20+
- pnpm 10+
- PostgreSQL 14+
- OpenAI API Key (크레딧 필요)

### 1. 환경 변수 설정

**Backend** (`backend/.env` 파일 생성):

```
OPENAI_API_KEY=sk-...          # 필수 — STT·Chat·TTS 전체 파이프라인에 사용
DATABASE_URL=                  # 생략 시 config/database.yml 기본값 사용
CORS_ORIGIN=http://localhost:5173
```

**Frontend** (`frontend/.env` 파일 생성):

```
VITE_API_BASE_URL=http://localhost:3000
```

### 2. Backend 실행

```bash
cd backend
bundle install
rails db:create db:migrate db:seed
rails server
# → http://localhost:3000
```

`db:seed`로 샘플 유저 3명과 Plan 3종(무료·베이직·프리미엄 플러스)이 생성됩니다.

### 3. Frontend 실행

```bash
cd frontend
pnpm install
pnpm dev
# → http://localhost:5173
```

### 4. 사용 흐름

1. **홈(`/`)** — 유저 선택 후 멤버십 현황 확인 및 플랜 구매
2. **어드민(`/admin`)** — 유저 선택 화면에서 **Alice Kim** 계정 선택 시 어드민 접근 (role 기반)
3. **대화(`/chat`)** — 프리미엄 플러스 멤버십 보유 시 AI 튜터와 영어 음성 대화

> 브라우저 마이크 권한은 Chrome 설정(`chrome://settings/content/microphone`)에서 `localhost:5173`을 허용해주세요.

---

## 설계 및 기술 선정 배경

### 멤버십 도메인

`Plan` (학습·대화·분석 권한 정의) + `Membership` (유저별 상태·만료일·잔여 세션) 두 모델로 분리했습니다.  
기능 접근 판단은 `membership.active? && plan.can_talk && sessions_remaining?` 세 조건의 AND로 처리합니다. 현재 세션 수 제한은 없으며 `total_sessions`가 `nil`이면 무제한으로 취급합니다.  
결제는 실 PG사 연동 없이 `MockPaymentService`가 항상 성공 응답을 반환하며, 결제 로그는 `payment_logs` 테이블에 기록합니다.

### AI 파이프라인 분리 원칙

| 단계 | 실행 위치 | 이유 |
|---|---|---|
| VAD (발화 감지) | 브라우저 | 마이크 raw 오디오를 서버로 상시 전송하면 비용·지연 모두 불리 |
| STT (음성 → 텍스트) | 백엔드 (Whisper-1) | OpenAI API Key 노출 방지 |
| Chat (텍스트 → 응답) | 백엔드 SSE | 동일한 보안 이유 + 스트리밍으로 응답 지연 체감 최소화 |
| TTS (텍스트 → 음성) | 백엔드 (TTS-1) | 동일한 보안 이유 |

### SSE 스트리밍 방식

`EventSource`는 GET 전용이라 `conversation_id`와 메시지 body를 함께 전송할 수 없습니다.  
`fetch + ReadableStream` 수동 파싱으로 POST SSE를 구현해 응답 첫 토큰부터 화면에 즉시 표시합니다.  
SSE는 문장 구분자(`.`, `?`, `!`) 기준으로 청크를 잘라 `onSentence` 콜백을 트리거하고, TTS 큐에 문장 단위로 순차 투입합니다.

### TTS 재생 안정화

`new Audio().play()`는 COOP/COEP 헤더(`Cross-Origin-Embedder-Policy: require-corp`, VAD WASM 스레드에 필요) 환경에서 gesture activation 만료 시 `NotAllowedError`로 조용히 실패합니다.  
`AudioContext` singleton을 사용하면 한 번 `resume()` 된 후에는 gesture 없이도 계속 재생 가능합니다.  
TTS Blob은 `text → Blob` 캐시(`blobCacheRef`)에 보관해, 재생 버튼 클릭 시 API 재호출 없이 즉시 재생합니다.

### VAD 설정 (`@ricky0123/vad-web`)

Silero VAD legacy 모델 사용. 주요 파라미터:

| 파라미터 | 값 | 이유 |
|---|---|---|
| `positiveSpeechThreshold` | 0.3 | 조용한 환경에서도 발화 감지 |
| `minSpeechMs` | 400 | 짧은 잡음 필터 |
| `redemptionMs` | 1400 | 문장 중간 멈춤 허용 |
| `preSpeechPadMs` | 800 | 발화 시작 직전 오디오 포함 |
| `submitUserSpeechOnPause` | false | 수동 제출(답변 완료 버튼) 방식 사용 |

### 오남용 방지

`Rack::Attack`으로 `X-User-Id` 헤더 기준 rate limit을 적용합니다:

- STT: 10회/분
- Chat: 10회/분  
- TTS: 20회/분

마이크 3분 무응답 시 VAD 자동 일시정지, 세션당 최대 20턴 제한도 적용됩니다.

### 가정 사항 (불명확한 요구사항 처리)

| 항목 | 처리 방식 |
|---|---|
| 인증 | 없음 — `X-User-Id` 헤더로 유저 구분 (과제 명시 제외) |
| 대화 세션 관리 | `localStorage` + `GET /conversations/:id`로 새로고침 복원 지원 |
| 어드민 인증 | `user.role == "admin"` 기반 — seed 데이터의 Alice Kim 계정이 어드민 (과제 단순화) |
| STT 언어 | `language: "en"` 고정 (영어 튜터이므로) |
| TTS 음성 | `nova` 모델 (자연스러운 영어 발화에 적합) |
| Chat 모델 | `gpt-4o` (대화 맥락 유지 및 교육적 응답 품질) |

---

## 테스트 및 검증 방법

### Backend (RSpec)

```bash
cd backend
bundle exec rspec
# 65 examples, 0 failures
```

주요 테스트 범위:

| 파일 | 내용 |
|---|---|
| `spec/requests/api/v1/memberships_spec.rb` | 현재 멤버십 조회, 구매, 업그레이드 |
| `spec/requests/api/v1/admin/memberships_spec.rb` | 어드민 멤버십 부여·삭제 |
| `spec/requests/api/v1/stt_spec.rb` | STT 업로드, 오디오 미첨부·2MB 초과 검증 (WebMock으로 OpenAI 격리) |
| `spec/requests/api/v1/chat_streams_spec.rb` | SSE 스트리밍 응답, 입력 길이 422 검증 |
| `spec/requests/api/v1/tts_spec.rb` | TTS 음성 생성, 만료 멤버십 403 |
| `spec/models/membership_spec.rb` | 만료 여부·세션 잔량 모델 로직 |
| `spec/services/memberships/purchase_service_spec.rb` | 구매 서비스 |
| `spec/services/memberships/upgrade_service_spec.rb` | 업그레이드 서비스 (기간 보존 로직) |
| `spec/services/ai/chat_stream_service_spec.rb` | Chat 스트리밍 서비스 |

### Frontend (Vitest)

```bash
cd frontend
pnpm test
# 20 test files, 119 passed
```

주요 테스트 범위:

| 파일 | 내용 |
|---|---|
| `src/features/tutor/hooks/__tests__/useVad.test.ts` | VAD 발화 시간 30초 제한 |
| `src/features/tutor/components/__tests__/VoiceInput.test.tsx` | 마이크·답변완료 버튼 hover |
| `src/features/tutor/components/__tests__/ChatBubble.test.tsx` | 채팅 버블 렌더링·재생 버튼 hover |
| `src/features/tutor/components/__tests__/TurnLimitBanner.test.tsx` | 20턴 제한 배너 |
| `src/features/membership/components/__tests__/MembershipCard.test.tsx` | 멤버십 카드 표시 |
| `src/features/membership/components/__tests__/PaymentModal.test.tsx` | 결제 모달 입력·카드번호 분할 |
| `src/features/membership/components/__tests__/PlanSelector.test.tsx` | 플랜 선택·구매 버튼 |
| `src/features/membership/components/__tests__/UpgradePromptModal.test.tsx` | 업그레이드 안내 팝업 |
| `src/features/admin/components/__tests__/AdminButton.test.tsx` | 어드민 버튼 variant·hover |
| `src/components/__tests__/Layout.test.tsx` | 네비게이션 조건부 표시 |
| `src/components/__tests__/UserDropdown.test.tsx` | 유저 선택 드롭다운 |
| `src/components/__tests__/AdminGuard.test.tsx` | admin role 라우트 보호 |
| `src/components/ui/__tests__/Button.test.tsx` | 공용 Button 컴포넌트 |
| `src/pages/__tests__/HomePage.test.tsx` | 홈 화면 멤버십·모달 흐름 |
| `src/pages/__tests__/PlansPage.test.tsx` | 플랜 구매 페이지 |
| `src/pages/__tests__/AdminPage.test.tsx` | 어드민 캐시 무효화 |
| `src/hooks/__tests__/useCurrentUser.test.ts` | 유저 선택 훅 |
| `src/hooks/__tests__/useCurrentUserProfile.test.ts` | 유저 프로필 훅 |
| `src/utils/__tests__/audio.test.ts` | WAV 인코딩 유틸리티 |
| `src/test/health.test.ts` | 테스트 환경 sanity check |

### AI 파이프라인 실검증

STT → Chat SSE → TTS 전체 파이프라인은 **OpenAI API 유료 크레딧($10)을 충전해 실환경에서 직접 검증**했습니다.

- Whisper-1 STT: 영어 발화 → 영어 텍스트 정상 변환 확인
- GPT-4o Chat SSE: 스트리밍 응답 실시간 표시 확인
- TTS-1 nova: 문장 단위 음성 자동 재생 확인
- 재생 버튼: Blob 캐시 hit으로 API 재호출 없이 즉시 재생 확인

> 단위 테스트(RSpec)에서는 WebMock으로 OpenAI API를 격리하므로 크레딧 없이 실행 가능합니다.

### 수동 테스트 체크리스트

```
[ ] 홈: 유저 선택 → 멤버십 없음 표시 확인
[ ] 홈: 플랜 구매 → 프리미엄 플러스 멤버십 활성화
[ ] 어드민: Alice Kim 선택 → /admin 접근 → 유저에게 멤버십 부여
[ ] 대화: 프리미엄 플러스 미만 멤버십으로 /chat 접근 시 홈 리다이렉트
[ ] 대화: 마이크 켜기 → 권한 팝업 → 파형 표시 확인
[ ] 대화: 영어로 발화 → 답변 완료 → 영어 텍스트 변환 확인
[ ] 대화: AI 응답 SSE 스트리밍 → TTS 자동 재생 확인
[ ] 대화: 재생 버튼 → 즉시 음성 재생 (캐시 hit)
[ ] 대화: 20턴 도달 → 입력 비활성화 확인
```
