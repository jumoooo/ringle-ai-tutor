# API 엔드포인트 전체 명세

> 작성일: 2026-06-17  
> Base URL: `http://localhost:3000`  
> Prefix: `/api/v1`  
> 모든 요청에 `X-User-Id: {user_id}` 헤더 포함 (어드민 제외)

---

## 공통 응답 구조

```json
// 성공
{ "data": { ... } }

// 실패
{ "error": "메시지", "code": "snake_case_code" }
```

### 공통 에러 코드

| HTTP | code | 상황 |
|---|---|---|
| 400 | `bad_request` | 파라미터 오류 |
| 403 | `forbidden` | 멤버십 없음/만료/권한 없음 |
| 404 | `not_found` | 리소스 없음 |
| 422 | `invalid_record` | 유효성 검사 실패 |
| 429 | `rate_limit_exceeded` | Rate Limit 초과 |
| 500 | `internal_error` | 서버 오류 |

---

## 1. 헬스체크

### GET /api/v1/health

헤더 불필요. 서버 상태 확인.

**Response 200:**
```json
{
  "data": {
    "status": "ok",
    "timestamp": "2026-06-17T12:00:00+09:00",
    "version": "1.0.0"
  }
}
```

---

## 2. 유저

### GET /api/v1/users

드롭다운용 전체 유저 목록.

**Request Headers:** 없음

**Response 200:**
```json
{
  "data": [
    { "id": 1, "name": "Alice Kim", "email": "alice@example.com" },
    { "id": 2, "name": "Bob Lee",   "email": "bob@example.com" }
  ]
}
```

---

### GET /api/v1/users/:id

특정 유저 정보.

**Request Headers:** `X-User-Id: 1`

**Response 200:**
```json
{
  "data": {
    "id": 1,
    "name": "Alice Kim",
    "email": "alice@example.com"
  }
}
```

---

## 3. 멤버십

### GET /api/v1/memberships/current

현재 유저의 활성 멤버십. 홈 화면 + 프론트 폴링용.

**Request Headers:** `X-User-Id: 1`

**Response 200 (활성):**
```json
{
  "data": {
    "id": 3,
    "status": "active",
    "expires_at": "2026-07-17T12:00:00+09:00",
    "plan": {
      "id": 3,
      "name": "standard",
      "monthly_price": 19900,
      "can_learn": true,
      "can_talk": true,
      "can_analyze": false
    }
  }
}
```

**Response 200 (멤버십 없음):**
```json
{ "data": null }
```

---

### POST /api/v1/memberships/purchase

플랜 구매 (Mock PG).

**Request Headers:** `X-User-Id: 1`

**Request Body:**
```json
{ "plan_id": 3, "card_token": "mock_token" }
```

**Response 200:**
```json
{
  "data": {
    "membership": {
      "id": 5,
      "status": "active",
      "expires_at": "2026-07-17T12:00:00+09:00",
      "plan": { "id": 3, "name": "standard", "monthly_price": 19900 }
    },
    "transaction_id": "uuid-1234"
  }
}
```

**Response 422:**
```json
{ "error": "Invalid plan", "code": "invalid_record" }
```

---

### POST /api/v1/memberships/upgrade

플랜 업그레이드. 잔여 기간 이어받기.

**Request Headers:** `X-User-Id: 1`

**Request Body:**
```json
{ "plan_id": 4, "card_token": "mock_token" }
```

**Response 200:** (purchase와 동일 구조)

**Response 422:**
```json
{ "error": "Cannot downgrade via this endpoint", "code": "invalid_record" }
```

---

## 4. AI — STT

### POST /api/v1/stt

음성 파일을 텍스트로 변환. Whisper-1 사용.

**Request Headers:**
```
X-User-Id: 1
Content-Type: multipart/form-data
```

**Request Body:** `audio` (File, webm 형식)

**Rate Limit:** user_id 기준 10 req/min

**Response 200:**
```json
{
  "data": {
    "transcript": "Hello, I would like to practice my pronunciation.",
    "duration_ms": 2340
  }
}
```

**Response 200 (빈 발화):**
```json
{
  "data": {
    "transcript": "",
    "duration_ms": 100
  }
}
```

> 프론트가 빈 transcript를 확인하고 사용자에게 재시도 안내.

**Response 403:**
```json
{ "error": "Talk permission required", "code": "forbidden" }
```

---

## 5. AI — 대화 (SSE 스트리밍)

### POST /api/v1/chat

SSE 스트리밍 응답. gpt-4o 사용.

**Request Headers:**
```
X-User-Id: 1
Content-Type: application/json
Accept: text/event-stream
```

**Rate Limit:** user_id 기준 10 req/min

**Request Body:**
```json
{
  "conversation_id": 7,
  "message": "Hello, I would like to practice my pronunciation."
}
```

**SSE Event 스트림:**
```
data: {"type":"delta","content":"Sure"}

data: {"type":"delta","content":"! Let"}

data: {"type":"delta","content":"'s practice"}

data: {"type":"sentence","content":"Sure! Let's practice."}

data: {"type":"done","conversation_id":7,"turn_count":3}
```

> `type: sentence` 이벤트를 받으면 프론트가 TTS 요청 시작.  
> `type: done` 이벤트를 받으면 스트리밍 종료 처리.

**Response 403:**
```json
{ "error": "Talk permission required", "code": "forbidden" }
```

**Response 429:**
```json
{ "error": "Rate limit exceeded", "code": "rate_limit_exceeded" }
```

---

### GET /api/v1/conversations/:id

대화 내역 조회 (새로고침 복원용).

**Request Headers:** `X-User-Id: 1`

**Response 200:**
```json
{
  "data": {
    "id": 7,
    "status": "active",
    "messages": [
      {
        "id": 1,
        "role": "assistant",
        "content": "Hi! I'm your AI English tutor. What would you like to practice today?",
        "created_at": "2026-06-17T12:00:00+09:00"
      },
      {
        "id": 2,
        "role": "user",
        "content": "Hello, I would like to practice my pronunciation.",
        "created_at": "2026-06-17T12:00:05+09:00"
      }
    ]
  }
}
```

---

### POST /api/v1/conversations

새 대화 시작.

**Request Headers:** `X-User-Id: 1`

**Response 201:**
```json
{
  "data": {
    "id": 8,
    "status": "active",
    "first_message": {
      "role": "assistant",
      "content": "Hi! I'm your AI English tutor. What would you like to practice today?"
    }
  }
}
```

---

## 6. AI — TTS

### POST /api/v1/tts

텍스트를 음성으로 변환. nova 음성, 0.95 속도.

**Request Headers:**
```
X-User-Id: 1
Content-Type: application/json
```

**Rate Limit:** user_id 기준 20 req/min

**Request Body:**
```json
{ "text": "Sure! Let's practice." }
```

**Response 200:**
```
Content-Type: audio/mpeg
Body: binary audio data
```

**Response 403:**
```json
{ "error": "Talk permission required", "code": "forbidden" }
```

---

## 7. 어드민

> 모든 어드민 엔드포인트는 `X-Admin-Key` 헤더 필수.  
> `X-User-Id` 헤더 불필요.

### GET /api/v1/admin/users

전체 유저 목록 + 멤버십 현황.

**Request Headers:** `X-Admin-Key: {ADMIN_KEY}`

**Response 200:**
```json
{
  "data": [
    {
      "id": 1,
      "name": "Alice Kim",
      "email": "alice@example.com",
      "membership": {
        "status": "active",
        "plan_name": "standard",
        "expires_at": "2026-07-17T12:00:00+09:00"
      }
    }
  ]
}
```

---

### POST /api/v1/admin/users/:user_id/memberships

특정 유저에게 멤버십 부여.

**Request Headers:** `X-Admin-Key: {ADMIN_KEY}`

**Request Body:**
```json
{ "plan_id": 3, "duration_days": 30 }
```

**Response 201:**
```json
{
  "data": {
    "membership": {
      "id": 9,
      "status": "active",
      "expires_at": "2026-07-17T12:00:00+09:00",
      "plan": { "id": 3, "name": "standard" }
    }
  }
}
```

---

### DELETE /api/v1/admin/users/:user_id/memberships/current

현재 유저의 멤버십 즉시 삭제 (expires_at = now, status = expired).

**Request Headers:** `X-Admin-Key: {ADMIN_KEY}`

**Response 200:**
```json
{ "data": { "revoked": true } }
```

---

## 8. 플랜 목록

### GET /api/v1/plans

구매 화면용 플랜 목록.

**Response 200:**
```json
{
  "data": [
    { "id": 1, "name": "free",     "monthly_price": 0,     "can_learn": false, "can_talk": false, "can_analyze": false, "duration_days": 0 },
    { "id": 2, "name": "basic",    "monthly_price": 9900,  "can_learn": true,  "can_talk": false, "can_analyze": false, "duration_days": 30 },
    { "id": 3, "name": "standard", "monthly_price": 19900, "can_learn": true,  "can_talk": true,  "can_analyze": false, "duration_days": 30 },
    { "id": 4, "name": "premium",  "monthly_price": 39900, "can_learn": true,  "can_talk": true,  "can_analyze": true,  "duration_days": 30 }
  ]
}
```

---

## 9. Routes 요약 (Rails)

```ruby
Rails.application.routes.draw do
  namespace :api do
    namespace :v1 do
      get  'health', to: 'health#show'

      resources :users, only: %i[index show]
      resources :plans, only: %i[index]

      # 멤버십
      scope :memberships do
        get    'current',  to: 'memberships#current'
        post   'purchase', to: 'memberships#purchase'
        post   'upgrade',  to: 'memberships#upgrade'
      end

      # AI
      post 'stt', to: 'stt#create'
      post 'tts', to: 'tts#create'
      post 'chat', to: 'chat_streams#create'

      # 대화 내역
      resources :conversations, only: %i[create show]

      # 어드민
      namespace :admin do
        resources :users, only: %i[index] do
          resources :memberships, only: %i[create] do
            collection { delete 'current', to: 'memberships#revoke' }
          end
        end
      end
    end
  end
end
```
