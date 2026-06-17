# AI 협업 작업 기록 (Coding Agent Interaction History)

> **이 문서는 과제 제출 필수 산출물입니다.**  
> Claude + Codex 협업의 주요 작업 과정을 Phase별 narrative로 기록합니다.  
> 작성 주체: Claude (`/cm_run` 실행 시 자동 갱신)

---

## 문서 사용법

**이 파일**을 읽어 전체 작업 흐름과 설계 결정 이유를 파악합니다.

---

<!-- ================================================================ -->
<!-- 아래부터 Phase별 작업 기록이 /cm_run 실행 시 자동으로 추가됩니다. -->
<!-- ================================================================ -->

---

## Phase — Claude + Codex 하네스 부트스트랩 (2026-06-16)

**태스크 ID:** `ringle-ai-tutor-bootstrap`  
**handoff 파일:** `.ai/handoffs/2026-06-16_ringle-ai-tutor-bootstrap/work-order.md`  
**상태:** completed

### 작업 배경 및 목표

신규 `ringle-ai-tutor` 저장소에 Claude + Codex 멀티 LLM 하네스를 처음부터 설치하는 Phase 0 작업이다.
이전 프로젝트(서버-펄스, Next.js 기반)의 잔재를 이식하지 않고, 단일 저장소 Rails API + React/Vite 기준으로 완전히 재구성하는 것이 목표였다.
Phase 0 범위는 구조·콘텐츠·기능·프로토콜·보안 5개 1차 게이트(A~E) 검증까지였다.

### 주요 프롬프트 예시

> "신규 ringle-ai-tutor 저장소에 Claude + Codex 멀티 LLM 하네스를 설치해줘."  
> — 이전 프로젝트 에셋 미이식, 단일 저장소 기준으로만 재구성 요청

### 설계 결정 이유

| 결정 항목 | 선택 | 이유 |
|---|---|---|
| 이전 에셋 이식 금지 | 완전 재구성 | 다중 저장소 전제·이전 스택 잔재를 가져오면 후속 작업에서 충돌 발생 |
| 2차 게이트(앱 부팅·테스트) 제외 | Phase 1로 이관 | 앱 스캐폴딩 전이므로 부팅 검증 불가. 게이트 범위를 현실에 맞게 분리 |
| Rails API + React/Vite 기준 고정 | 단일 스택 | CLAUDE.md 에 명시된 스택으로 에이전트 설명·플레이북 전면 재작성 |
| pre_tool_policy 훅 설치 | 보안 레이어 우선 | 구현 시작 전에 시크릿 차단·scope 확인·분석-구현 분리 게이트를 먼저 세움 |

### 최종 결과 요약

| 게이트 | 항목 | 결과 |
|---|---|---|
| A (구조) | 필수 디렉토리 8개, Claude 훅 3개+1개, Codex 훅 4개, Guardian 4종 | ✅ 5/5 |
| B (콘텐츠) | 이전 스택 잔재 없음, CLAUDE.md 필수 섹션 존재, INTEGRATION_GATE 문서 완비 | ✅ 6/6 |
| C (기능) | 질문형 차단, 시크릿 패턴 차단, scope 훅 동작, settings.json 훅 경로 일치, config.toml 경로 정상 | ✅ 5/5 |
| D (프로토콜) | active-handoff 갱신 확인, work-order.json 필수 필드, git_state 정의 | ✅ 3/3 |
| E (보안) | .gitignore 필수 항목, 실제 키 패턴 없음, .env 미스테이징, active-handoff 민감정보 없음 | ✅ 4/4 |

- 검증 항목 23/23 PASS
- 커밋 없음 (`.claude/`, `.codex/`, `.ai/` 는 .gitignore 대상)

---

## Phase — Rails API + React/Vite SPA 스캐폴딩 (2026-06-16)

**태스크 ID:** `phase1-scaffold`  
**handoff 파일:** `.ai/handoffs/2026-06-16_phase1-scaffold/work-order.md`  
**상태:** completed

### 작업 배경 및 목표

하네스 부트스트랩(Phase 0) 완료 후 실제 앱 골격을 구축하는 Phase 1 작업이다.
Rails API 서버와 React/Vite SPA 양쪽이 로컬에서 부팅되고, Health check 엔드포인트를 통해 통신 가능한 상태를 목표로 했다.
Ruby 3.3.11, PostgreSQL 16.14, Node v22.21.0, pnpm v10.26.1은 이미 설치된 상태였고, Rails만 신규 설치가 필요했다.

### 주요 프롬프트 예시

> "Phase 1 스캐폴딩 시작해줘"  
> — Phase 0 완료 직후 실제 앱 골격 생성을 요청한 시작점

### 설계 결정 이유

| 결정 항목 | 선택 | 이유 |
|---|---|---|
| AppConfig 초기화 계층 | `config/initializers/app_config.rb` | CLAUDE.md §2-1: 컨트롤러 등 애플리케이션 코드는 직접 ENV 접근 금지 |
| ApplicationController 전역 rescue_from | `rescue_from` 두 개만 | CLAUDE.md §2-5: 각 액션에 begin/rescue 반복 금지, 전역 처리 집중 |
| X-User-Id 헤더 인증 | `set_current_user` before_action | 과제 조건: 실인증 없이 헤더로 사용자 구분 |
| Health check 응답 형식 | `{ data: { status, timestamp, version } }` | CLAUDE.md §2-6: 성공 응답은 `{ data: ... }` 형식 통일 |
| 프론트 환경변수 | `src/config/api.ts` 단일 파일 경유 | CLAUDE.md §4-2: 컴포넌트에서 `import.meta.env` 직접 읽기 금지 |

### 최종 결과 요약

| 항목 | 명령어 | 결과 |
|---|---|---|
| Health check | `curl http://localhost:3000/api/v1/health` | ✅ 200 OK |
| CORS 헤더 | Origin: http://localhost:5173 헤더 확인 | ✅ Access-Control-Allow-Origin 존재 |
| RSpec | `bundle exec rspec` | ✅ 1 example, 0 failures |
| 타입 검사 | `pnpm typecheck` | ✅ 0 errors |
| 프론트 테스트 | `pnpm test` | ✅ 1 passed |

- 완료 기준 5/5 PASS
- git commit: `feat(scaffold): Phase 1 Rails API + Vite SPA 스캐폴딩` (a91c14f 이전 커밋)

---

## Phase — CSS 변수 기반 디자인 시스템 셋업 (2026-06-17)

**태스크 ID:** `design-system-setup`  
**handoff 파일:** `.ai/handoffs/2026-06-17_design-system-setup/work-order.md`  
**상태:** completed

### 작업 배경 및 목표

실제 링글 앱 스크린샷 11장과 구매 페이지를 분석해 도출한 `docs/example/design-spec/design-spec.md`의 디자인 토큰을 CSS 변수로 프로젝트에 녹이는 작업이다.
컴포넌트 구현은 이번 범위가 아니며, 환경 설정(tokens.css + Pretendard 폰트 + 에이전트 경계 설정)만 수행했다.
이후 모든 UI 작업은 `design` 에이전트가 전담하도록 경계를 설정하는 것이 핵심 목표였다.

### 주요 프롬프트 예시

> "디자인 시스템 기반 셋업해줘"  
> — design-spec 도출 완료 후 토큰 → CSS 변수 적용 및 에이전트 경계 설정 요청

### 설계 결정 이유

| 결정 항목 | 선택 | 이유 |
|---|---|---|
| `tokens.css` 별도 파일 분리 | `frontend/src/styles/tokens.css` | index.css와 토큰 정의를 섞으면 에이전트 경계가 모호해짐. import 순서 보장도 필요 |
| Pretendard 폰트 패키지 | `@fontsource/pretendard` | CDN 의존 없이 번들에 폰트 내장. 실제 링글 앱 폰트 패밀리와 일치 |
| `fab-size-vad-max` 제외 | JS 상수로 처리 | 동적 scale 값은 CSS 변수가 아니라 컴포넌트 로직에서 계산해야 함 |
| `design.toml` 에이전트 생성 | `allowed_paths` prefix 기반 | `frontend/src/styles/**`, `frontend/src/components/ui/**` 전담. 컴포넌트 직접 생성 전 보고 의무화 |
| `frontend_orchestrator.toml` 경계 추가 | `style_boundary` 필드 명시 | 오케스트레이터가 design 에이전트 담당 경로를 건드리지 않도록 read-only / write 구분 명시 |

### 최종 결과 요약

| 항목 | 결과 |
|---|---|
| `tokens.css` 생성 (design-spec §1 전체 포함) | ✅ |
| `index.css` — Pretendard import + tokens.css import + 하드코딩 색상 제거 | ✅ |
| `App.tsx` import 경로 `./styles/index.css` 수정 | ✅ |
| `design.toml` 에이전트 생성 (allowed_paths 포함) | ✅ |
| `frontend_orchestrator.toml` style_boundary 추가 | ✅ |
| `pnpm dev` / `pnpm typecheck` / `pnpm build` 에러 없음 | ✅ |

- 수용 기준 11/11 충족
- git commit: `chore(design): 디자인 시스템 기반 셋업 - tokens.css + Pretendard` (a91c14f)

---

## Phase — 스킬 즉시 설치 3개 (2026-06-17)

**태스크 ID:** `2026-06-17_skill-install-3`  
**handoff 파일:** `.ai/handoffs/2026-06-17_skill-install-3/work-order.md`  
**계획 파일:** `.ai/plans/drafts/2026-06-17_skill-adoption.md`

### 작업 배경 및 목표

Codex Work 단계에서 실제 참조할 스킬을 선별해 설치하는 작업이다.
4차례 Codex 리뷰를 거쳐 코드 근거가 확인된 3개(tanstack-query, vitest, ruby-rails)만 즉시 설치하고,
`.codex/config.toml`에 명시 등록해 Codex Work 세션에서 실제 활성화되도록 한다.

### 주요 프롬프트 예시

> "해당 내용 외곡없고 누락 없이 /cm_run 해줘"  
> — 4차 Codex 리뷰까지 완료된 스킬 설치 계획을 핸드오프로 만들어달라는 요청

### 설계 결정 이유

| 결정 항목 | 선택 | 이유 |
|---|---|---|
| 즉시 설치 3개 / 조건부 2개 구분 | 코드 근거 있는 것만 선별 | package.json·Gemfile에 의존성 확인된 3개만 즉시. voice-agents·tailwind는 선행 조건 미충족 |
| 설치 전 config.toml path 고정 금지 | 실제 폴더명 불확실성 | npx skills add 결과 폴더명이 스킬 이름과 다를 수 있음. find-skills 선례는 있으나 3개는 미확정 |
| config.toml 명시 등록을 수용 기준에 추가 | 설치만으로 활성화 안 됨 | .codex/config.toml은 화이트리스트 명시 등록형. 2차 Codex 리뷰에서 확인 |

### 완료 화면

![Final Check PASS — 2026-06-17_skill-install-3](docs/2026-06-17_skill-install-3/2026-06-17_skill-install-3_done.png)

### 최종 결과 요약

| 항목 | 실제 폴더명 | config.toml path | skills-lock.json |
|---|---|---|---|
| tanstack-query | `tanstack-query` | `.agents/skills/tanstack-query` | ✅ 자동 반영 |
| vitest | `vitest` | `.agents/skills/vitest` | ✅ 자동 반영 |
| ruby-rails | `ruby-rails` | `.agents/skills/ruby-rails` | ✅ 자동 반영 |

- 수용 기준 13/13 충족
- 기존 `.agents/skills/` 9개 블록 보존
- git commit 없음 (`.agents/`, `.codex/` 는 .gitignore 대상)

---

## Phase — .codex/ 에이전트 시스템 재설계 (2026-06-17)

**태스크 ID:** `agent-redesign`  
**handoff 파일:** `.ai/handoffs/2026-06-17_agent-redesign/work-order.md`  
**회의 라운드:** Claude 1회 리뷰 + Codex 3차 회의 + Claude 최종 조율

### 작업 배경 및 목표

디자인 시스템 셋업 완료 후 Phase 2 UI 구현 진입 전, 에이전트 체계 전면 점검에서
운영 레이어 미연결·역할 공백·allowed_paths 비호환 등 6개 구조적 문제가 발견됐다.
이를 해소하고 실제 작동하는 에이전트 구조로 재설계하는 것이 목표다.

### 주요 프롬프트 예시

> "이거 CODEX 측에 물어볼꺼 있어? 의견 나누면서 회의 하게 프롬프트 줘봐"  
> — Claude 리뷰 후 Codex와 공동 검토를 요청한 시작점

> "한번더 회의 해보자" (3회 반복)  
> — 각 회의 결과를 반영해 재검토를 거듭하며 결정을 확정한 흐름

> "아주 깊게 생각후 상세하게 계획 세워보고 그다음 /cm_run 해줘"  
> — 3회 회의 완료 후 최종 핸드오프 작성 지시

> "그 테스크랑 coding_agent_interaction_history 반영하는건 왜 없니?"  
> — 이 기록 추가의 직접적인 트리거

### 설계 결정 이유

| 결정 항목 | 선택 | 이유 |
|---|---|---|
| allowed_paths 형식 | glob(`**`) 전부 제거 → trailing slash prefix 통일 | `pre_tool_policy.js`의 `isAllowed()`가 glob 미지원임을 코드 직접 확인 |
| frontend_orchestrator | read-only 유지 + `write_allowed_paths` 제거 | sandbox_mode=read-only와 설정 자기 모순 해소. frontend_feature로 구현 책임 분리 |
| ai_pipeline + chat_runtime | 통합 1개 | AI 코드 미존재 시점에서 분리 기준 없음. 코드 생기면 분리 |
| hooks/ 소유권 | `frontend_feature`에서 제거 → `ai_pipeline`이 prefix 전체 소유 | useVAD/useSSE/useTTS exact match는 미존재 파일이라 영구 차단됨. prefix 유일 해결책 |
| done 이벤트 payload | `{"type":"done","conversation_id":N}` | `turn_count`는 Message 모델 선행 필요 → Phase 2. 설계 문서 불일치는 handoff 우선 |
| B0 active-handoff 갱신 | pre_tool_policy.js 등록 전 첫 단계로 배치 | 등록 후 active-handoff가 구 범위면 B0 나머지 파일 수정이 즉시 차단됨 |
| hooks.json 예시 | partial → full merged 구조로 교체 | 기존 PS1 3개 블록 누락 방지. 구현자가 예시 그대로 쓸 수 있도록 완성형 제공 |
| B2 검증식 | regex → `test ! -f` 8개 직접 확인 | `git-ops.toml`, `github-issue.toml`은 정상 하이픈 파일. regex 오탐 방지 |

### 완료 화면

![Final Check PASS — 2026-06-17_agent-redesign](docs/2026-06-17_agent-redesign/2026-06-17_agent-redesign_done.png)

### 최종 결과 요약

| 배치 | 내용 | 결과 |
|------|------|------|
| B0 | active-handoff 갱신 + hooks.json full merge + session_start_context.js 수정 + design.toml prefix 변환 | ✅ |
| B1 | `.ai/plans/drafts/2026-06-17_codex-agent-redesign.md` 5섹션 작성 | ✅ |
| B2 | 하이픈 중복 에이전트 8개 삭제 (git-ops/github-issue 유지) | ✅ |
| B2.5 | `frontend_orchestrator.toml` `write_allowed_paths` 제거 | ✅ |
| B3 | `frontend_feature.toml` 신규 생성 (hooks/ 제외, prefix 기반) | ✅ |
| B4 | `ai_pipeline.toml` 신규 생성 (hooks/ prefix 소유, SSE 계약 명시) | ✅ |
| B5 | `codex-tdd-playbook.md` Vitest 패턴 + CSS grep + setup 점검 추가 | ✅ |

- 수용 기준 20/20 충족
- Final Check PASS (2026-06-17)
- 커밋 없음 (.codex/, .ai/ gitignored)

---

## Phase 2 — Backend 멤버십 도메인 (2026-06-17)

**태스크 ID:** `2026-06-17_phase2-membership-domain`  
**handoff 파일:** `.ai/handoffs/2026-06-17_phase2-membership-domain/work-order.md`

### 작업 배경 및 목표

Phase 1 스캐폴딩 완료 후 첫 번째 비즈니스 로직 구현 단계다.
AI 파이프라인과 프론트엔드 화면 모두 멤버십 권한 체크에 의존하므로,
DB 마이그레이션 → 모델 → 서비스 객체 → 컨트롤러 → Seed → RSpec 순서로
멤버십 도메인 전체를 Rails 백엔드에 구현하는 것이 목표다.
OpenAI 키 없이 순수 Rails + PostgreSQL만으로 완성 가능한 범위다.

### 주요 프롬프트 예시

> "그럼 준비는 완료 되었고 이제 Phase 2 깊게 읽어보고 깊게 생각해본다음 상세하게 계획 수립하고 /cm_run 해줘 누락, 오해 없이"

### 설계 결정 이유

| 결정 항목 | 선택 | 이유 |
|---|---|---|
| 만료 판단 기준 | expires_at 단일 기준 | 복잡도 제거 — 횟수+기간 이중 기준은 엣지케이스가 많고 과제 요구사항에 명시되지 않음 |
| 어드민 보호 방식 | X-Admin-Key 헤더 | 프론트 연동 편의 — React Axios 인터셉터로 쉽게 처리 가능. 과제에서 인증 제외 범위 |
| 멤버십 없음 응답 | 200 + data:null | 프론트 처리 편의 — 404는 에러 핸들러로 튀지만, 없음은 정상 상태이므로 200으로 통일 |

### 시작 화면

![작업 시작 — 2026-06-17_phase2-membership-domain](docs/2026-06-17_phase2-membership-domain/2026-06-17_phase2-membership-domain_start.png)

### 완료 화면

![Final Check PASS — 2026-06-17_phase2-membership-domain](docs/2026-06-17_phase2-membership-domain/2026-06-17_phase2-membership-domain_done.png)

### 최종 결과 요약

- 6개 마이그레이션 전부 up (users/plans/memberships/payment_logs/conversations/messages)
- RSpec 28 examples, 0 failures (Membership model spec + 5개 request spec)
- 9개 엔드포인트 정상 라우팅 확인 (일반 6개 + admin 3개)
- 서비스 5개 생성 (MockPaymentService, Purchase/Upgrade/AdminGrant/AdminRevokeService)
- rework_count: 1 (422 Rack deprecation — 심볼 → 숫자 코드로 수정)

---

## Phase 3 — Backend AI Pipeline (2026-06-17)

**태스크 ID:** `2026-06-17_phase3-ai-pipeline`  
**handoff 파일:** `.ai/handoffs/2026-06-17_phase3-ai-pipeline/work-order.md`

### 작업 배경 및 목표

멤버십 도메인(Phase 2) 위에 실제 AI 기능을 올리는 단계다.
STT(Whisper-1), Chat SSE 스트리밍(gpt-4o), TTS(tts-1/nova), 대화 생성/조회 5개 엔드포인트를 구현한다.
Rate Limit(Rack::Attack), 재시도 정책(retryable), 멤버십 can_talk 체크까지 포함한다.
프론트엔드와 연동 전 백엔드 AI 파이프라인 전체를 완성하는 것이 목표다.

### 주요 프롬프트 예시

> "응 깊게 문서 읽어보고 누락, 외곡 없이 아주 상세하게 계획 세워주고 그다음 /cm_run 해줘"

### 설계 결정 이유

| 결정 항목 | 선택 | 이유 |
|---|---|---|
| OpenAI API 테스트 격리 | WebMock 스텁 | OPENAI_API_KEY 없이 CI/로컬 모두 통과. VCR 카세트보다 단순 |
| SSE 구현 방식 | ActionController::Live | Rails 7.1 내장, 외부 의존 없음. Redis/ActionCable 불필요 |
| require_talk_access! 위치 | ApplicationController 헬퍼 | STT/Chat/TTS 3곳 공통 재사용. 컨트롤러마다 중복 금지 |

### 시작 화면

![작업 시작 — 2026-06-17_phase3-ai-pipeline](docs/2026-06-17_phase3-ai-pipeline/2026-06-17_phase3-ai-pipeline_start.png)

### 완료 화면

![Final Check PASS — 2026-06-17_phase3-ai-pipeline](docs/2026-06-17_phase3-ai-pipeline/2026-06-17_phase3-ai-pipeline_done.png)

### 최종 결과 요약

---

## Phase 4 — Frontend React/TypeScript 전체 구현 (2026-06-18)

**태스크 ID:** `phase4-frontend`  
**handoff 파일:** `.ai/handoffs/2026-06-18_phase4-frontend/work-order.md`

### 작업 배경 및 목표

Phase 1~3에서 Rails 백엔드 전체(멤버십, AI 파이프라인)가 완성됐고, 이제 과제 평가 핵심인 프론트엔드를 구현하는 단계다.  
React 18 + TypeScript + Vite로 홈(`/`), 대화(`/chat`), 어드민(`/admin`), 학습stub(`/learn`) 4개 화면을 완성한다.  
VAD + Waveform + SSE 스트리밍 + TTS 큐 전체 파이프라인을 브라우저에서 연결하는 것이 핵심 목표다.  
"유저 관점의 제품 완성도 최우선"이라는 과제 기준을 충족해야 한다.

### 주요 프롬프트 예시

> "응 4 해당 내용 깊게 읽어보고 깊게 생각후 계획 수립후 /cm_run 해줘"

### 설계 결정 이유

| 결정 항목 | 선택 | 이유 |
|---|---|---|
| POST SSE 수신 방식 | fetch + ReadableStream 수동 파싱 | EventSource는 GET 전용 — conversation_id·message를 body로 보내는 POST 요청에 사용 불가 |
| VAD 오디오 포맷 | Float32Array → WAV 직접 인코딩 | 헤더 44바이트 추가만으로 순수 JS로 변환 가능. webm 인코딩은 별도 라이브러리 필요 |
| 대화 복원 전략 | localStorage + GET /conversations/:id | 새로고침 내성 — 메모리 상태는 새로고침 시 소멸하므로 서버 데이터 재조회로 대화를 복원한다 |

### 시작 화면

![작업 시작 — 2026-06-18_phase4-frontend](docs/2026-06-18_phase4-frontend/2026-06-18_phase4-frontend_start.png)

### 완료 화면

![Final Check PASS — 2026-06-18_phase4-frontend](docs/2026-06-18_phase4-frontend/2026-06-18_phase4-frontend_done.png)

### 최종 결과 요약

- VAD 초기화, 마이크 권한, 음성 감지 정상 동작
- STT (Whisper-1) → WAV 업로드 → 텍스트 인식 완료
- Chat SSE 스트리밍 → AI 응답 버블 실시간 표시
- TTS (nova 음성) → 음성 자동 재생 완료
- 홈/어드민/대화 3개 화면 전체 수동 테스트 PASS
- 주요 버그 해결: vad-web CJS/Vite 충돌, StrictMode 이중 초기화, mjs 미들웨어 우회 서빙

---

- AI 라우트 5개 정상 등록 (POST stt/chat/tts, POST/GET conversations)
- RSpec 40 examples, 0 failures (WebMock 스텁으로 OpenAI API 격리 완료)
- Rack::Attack rate limit 3개 (STT 10/min, Chat 10/min, TTS 20/min) — `request.get_header("HTTP_X_USER_ID")` 기준
- 서비스 3개 생성 (TranscriptionService, ChatStreamService, TtsService) — retryable 3회 backoff 포함
- TTS 실제 연동 확인: 21KB MP3 다운로드 성공 (nova 음성, tts-1 모델)
- Chat SSE 동작 확인: OpenAI Tier 0 무료 한도(gpt-4o 429) 문제 — 코드 정상, API 크레딧 충전 필요
- rework_count: 0 (Codex 피드백 반영 4개: access_token:, tempfile, Rack::Attack discriminator, test isolation)
