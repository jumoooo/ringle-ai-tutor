# 프론트엔드 화면별 상세 설계

> 작성일: 2026-06-17  
> 기술 스택: React 18, TypeScript, Vite, TanStack Query, Zod, react-router-dom v7

---

## 1. 폴더 구조

```
frontend/src/
├── pages/
│   ├── HomePage.tsx
│   ├── ChatPage.tsx
│   ├── LearnPage.tsx
│   └── AdminPage.tsx
├── features/
│   ├── tutor/
│   │   ├── components/
│   │   │   ├── ChatBubble.tsx
│   │   │   ├── VoiceInput.tsx
│   │   │   ├── Waveform.tsx
│   │   │   └── TurnLimitBanner.tsx
│   │   ├── hooks/
│   │   │   ├── useVad.ts
│   │   │   ├── useChatStream.ts
│   │   │   └── useTtsQueue.ts
│   │   └── api.ts
│   ├── membership/
│   │   ├── components/
│   │   │   ├── MembershipCard.tsx
│   │   │   └── PlanSelector.tsx
│   │   ├── hooks/
│   │   │   └── useMembership.ts
│   │   └── api.ts
│   └── admin/
│       ├── components/
│       │   └── UserMembershipTable.tsx
│       └── api.ts
├── components/
│   ├── UserDropdown.tsx
│   ├── Toast.tsx
│   └── Layout.tsx
├── hooks/
│   └── useCurrentUser.ts
├── api/
│   └── client.ts
├── config/
│   └── api.ts
├── types/
│   ├── user.ts
│   ├── membership.ts
│   └── message.ts
└── utils/
    └── audio.ts
```

---

## 2. 전역 상태

### 유저 선택 (localStorage)

```typescript
// hooks/useCurrentUser.ts
export function useCurrentUser() {
  const [userId, setUserId] = useState<number | null>(() => {
    const stored = localStorage.getItem('selectedUserId')
    return stored ? parseInt(stored) : null
  })

  function selectUser(id: number) {
    localStorage.setItem('selectedUserId', String(id))
    setUserId(id)
  }

  return { userId, selectUser }
}
```

### API 클라이언트

```typescript
// api/client.ts
import axios from 'axios'
import { BASE_URL } from '@/config/api'

export const apiClient = axios.create({ baseURL: BASE_URL })

// X-User-Id 자동 주입 인터셉터
apiClient.interceptors.request.use((config) => {
  const userId = localStorage.getItem('selectedUserId')
  if (userId) config.headers['X-User-Id'] = userId
  return config
})
```

---

## 3. 라우팅

```typescript
// App.tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"       element={<HomePage />} />
        <Route path="/chat"   element={<ChatPage />} />
        <Route path="/learn"  element={<LearnPage />} />
        <Route path="/admin"  element={<AdminPage />} />
      </Routes>
    </BrowserRouter>
  )
}
```

---

## 4. 홈 화면 (`/`)

### 4-1. 기능

| UI 요소 | 동작 |
|---|---|
| 유저 선택 드롭다운 | `GET /api/v1/users` → 목록 표시. 선택 시 localStorage 저장 |
| 멤버십 카드 | `GET /api/v1/memberships/current` → 플랜명, 만료일, 기능 목록 표시 |
| 대화 시작 버튼 | `can_talk == true` 이면 `/chat`으로 이동. 아니면 업그레이드 안내 |
| 학습 시작 버튼 | `can_learn == true` 이면 `/learn`으로 이동. 아니면 업그레이드 안내 |
| 플랜 구매 섹션 | `GET /api/v1/plans` → 플랜 카드 목록. 구매 버튼 → `POST /api/v1/memberships/purchase` |
| 업그레이드 버튼 | 현재 플랜보다 상위 플랜만 선택 가능 → `POST /api/v1/memberships/upgrade` |

### 4-2. 만료 타이머 (폴링 없음)

```typescript
// 홈 화면 진입 시 expires_at 기준으로 setTimeout 설정
useEffect(() => {
  if (!membership?.expires_at) return
  const remaining = new Date(membership.expires_at).getTime() - Date.now()
  if (remaining <= 0) {
    handleExpiry()
    return
  }
  const timer = setTimeout(() => {
    handleExpiry()
  }, remaining)
  return () => clearTimeout(timer)
}, [membership?.expires_at])

function handleExpiry() {
  // 멤버십 만료 → 구매 유도 배너 표시, 대화 진입 버튼 비활성화
  showBanner('멤버십이 만료되었습니다. 플랜을 구매하세요.')
  invalidateCurrentMembership()
}
```

### 4-3. 유저 미선택 상태

드롭다운에서 유저를 선택하지 않으면 "유저를 선택해주세요" 안내 배너 표시.  
멤버십 카드와 대화 시작 버튼은 비활성화.

---

## 5. 대화 화면 (`/chat`)

### 5-1. 진입 조건 체크

```typescript
// ChatPage.tsx 진입 시
useEffect(() => {
  if (!membership?.active || !membership?.plan?.can_talk) {
    navigate('/')
    showToast('대화 기능을 이용하려면 Standard 이상 멤버십이 필요합니다.')
  }
}, [membership])
```

### 5-2. 대화 화면 레이아웃

```
┌─────────────────────────────────────────────────────┐
│ 헤더: "AI 튜터 대화" | 남은 턴: 17/20 | 마이크 아이콘 │
├─────────────────────────────────────────────────────┤
│                                                     │
│  [AI] Hi! I'm your AI English tutor...   12:00  ▶  │
│                                                     │
│       Hello, I'd like to practice.  12:01  ▶  [Me] │
│                                                     │
│  [AI] Great! Let's start with...        12:01  ▶   │
│                                                     │
├─────────────────────────────────────────────────────┤
│  🌊 Waveform 시각화 영역                             │
├─────────────────────────────────────────────────────┤
│  [마이크 ON/OFF]        [답변완료 버튼]              │
└─────────────────────────────────────────────────────┘
```

### 5-3. 메시지 버블 컴포넌트

```typescript
interface ChatBubbleProps {
  role: 'user' | 'assistant'
  content: string
  createdAt: string      // ISO8601 → HH:MM 포맷으로 표시
  audioBlobUrl?: string  // 유저 발화 blob URL (브라우저 메모리, 새로고침 시 소멸)
}
```

**시간 포맷:**
```typescript
function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false })
}
```

### 5-4. 대화 흐름 상태 머신

```
idle
  → recording (마이크 ON + VAD 활성화)
  → processing (답변완료 클릭 → STT → Chat 전송)
  → streaming (SSE 수신 중 — AI 버블 실시간 업데이트)
  → speaking (TTS 큐 재생 중)
  → idle (TTS 완료 후 마이크 자동 ON)
```

### 5-5. 20턴 제한

```typescript
// turn_count가 20에 도달하면
if (turnCount >= 20) {
  showBanner('최대 대화 횟수(20턴)에 도달했습니다. 새 대화를 시작하세요.')
  setIsInputDisabled(true)
}
```

### 5-6. 새 대화 시작

헤더의 "새 대화" 버튼 → `POST /api/v1/conversations` → conversation_id 갱신 → 버블 초기화.

### 5-7. conversation_id 복원 (localStorage)

```typescript
// 대화 화면 진입 시
const storedId = localStorage.getItem('lastConversationId')
const [conversationId, setConversationId] = useState<number | null>(
  storedId ? parseInt(storedId) : null
)

// conversation_id가 있으면 GET /api/v1/conversations/:id로 메시지 복원
// 없으면 POST /api/v1/conversations 로 새 대화 생성

// 새 conversation_id 저장
function startNewConversation(id: number) {
  localStorage.setItem('lastConversationId', String(id))
  setConversationId(id)
}
```

> 유저 선택이 바뀌면 `lastConversationId`를 초기화 (다른 유저의 대화를 보지 않도록).

### 5-8. 대화 화면 만료 타이머

```typescript
// 대화 화면에서도 동일한 타이머 적용
useEffect(() => {
  if (!membership?.expires_at) return
  const remaining = new Date(membership.expires_at).getTime() - Date.now()
  if (remaining <= 0) {
    setIsInputDisabled(true)
    showBanner('멤버십이 만료되었습니다. 홈에서 플랜을 구매하세요.')
    return
  }
  const timer = setTimeout(() => {
    setIsInputDisabled(true)
    showBanner('멤버십이 만료되었습니다. 홈에서 플랜을 구매하세요.')
  }, remaining)
  return () => clearTimeout(timer)
}, [membership?.expires_at])
```

---

## 6. 학습 화면 (`/learn`)

### 6-1. stub 구현

```typescript
// pages/LearnPage.tsx
export default function LearnPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-2xl font-bold text-foreground">학습 기능</h1>
      <p className="text-muted-foreground mt-4">
        준비 중입니다. 곧 만나요! 🎓
      </p>
      <button onClick={() => navigate('/')} className="mt-6 btn-primary">
        홈으로 돌아가기
      </button>
    </div>
  )
}
```

**진입 조건:** `can_learn == true`인 멤버십 필요. 아니면 홈으로 리다이렉트.

---

## 7. 어드민 화면 (`/admin`)

### 7-1. Admin Key 입력

어드민 화면 첫 진입 시 Admin Key 입력 모달 표시.  
입력값을 sessionStorage에 저장 → 이후 요청에 `X-Admin-Key` 헤더로 포함.

```typescript
// features/admin/api.ts
export const adminClient = axios.create({ baseURL: BASE_URL })
adminClient.interceptors.request.use((config) => {
  const key = sessionStorage.getItem('adminKey')
  if (key) config.headers['X-Admin-Key'] = key
  return config
})
```

### 7-2. 어드민 기능 목록

| 기능 | UI | API |
|---|---|---|
| 유저 목록 | 테이블 (이름, 이메일, 멤버십 상태, 만료일) | GET /api/v1/admin/users |
| 멤버십 부여 | 유저 행 > "부여" 버튼 > 플랜 선택 모달 | POST /api/v1/admin/users/:id/memberships |
| 멤버십 삭제 | 유저 행 > "삭제" 버튼 > 확인 모달 | DELETE /api/v1/admin/users/:id/memberships/current |

### 7-3. Admin Key 인증 실패

```typescript
// 403 응답 시
if (response.status === 403) {
  sessionStorage.removeItem('adminKey')
  navigate('/admin')  // 키 입력 모달 다시 표시
}
```

---

## 8. 공통 컴포넌트

### Toast

```typescript
interface ToastProps {
  message: string
  type: 'info' | 'error' | 'success'
  duration?: number  // ms, default 3000
}
```

### Layout

```typescript
// components/Layout.tsx
// 헤더: 로고 + 현재 유저 드롭다운 + 네비게이션 (홈, 어드민)
// 푸터: 없음
```

---

## 9. Zod 스키마 (외부 입력 검증)

```typescript
// types/membership.ts
import { z } from 'zod'

export const MembershipSchema = z.object({
  id: z.number(),
  status: z.enum(['trial', 'active', 'expired']),
  expires_at: z.string(),
  plan: z.object({
    id: z.number(),
    name: z.string(),
    monthly_price: z.number(),
    can_learn: z.boolean(),
    can_talk: z.boolean(),
    can_analyze: z.boolean(),
  }),
})

export type Membership = z.infer<typeof MembershipSchema>
```

---

## 10. 환경 변수

```
# frontend/.env.example
VITE_API_BASE_URL=http://localhost:3000
```

```typescript
// config/api.ts
export const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000'
export const API_ENDPOINTS = {
  health:     `${BASE_URL}/api/v1/health`,
  users:      `${BASE_URL}/api/v1/users`,
  plans:      `${BASE_URL}/api/v1/plans`,
  membership: `${BASE_URL}/api/v1/memberships`,
  stt:        `${BASE_URL}/api/v1/stt`,
  chat:       `${BASE_URL}/api/v1/chat`,
  tts:        `${BASE_URL}/api/v1/tts`,
  conversations: `${BASE_URL}/api/v1/conversations`,
  admin:      `${BASE_URL}/api/v1/admin`,
} as const
```
