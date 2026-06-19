# 도메인 모델 및 DB 스키마

> 작성일: 2026-06-17  
> 기준: 01_DECISIONS.md 확정 사항 반영

---

## 1. ERD 개요

```
users
  └── has_many :memberships
  └── has_many :payment_logs
  └── has_many :conversations
        └── has_many :messages

plans
  └── has_many :memberships
  └── has_many :payment_logs
```

---

## 2. 테이블 스키마

### 2-1. users

```sql
CREATE TABLE users (
  id          BIGSERIAL PRIMARY KEY,
  name        VARCHAR(100) NOT NULL,
  email       VARCHAR(255) NOT NULL UNIQUE,
  created_at  TIMESTAMP(6) NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMP(6) NOT NULL DEFAULT NOW()
);
```

> 비밀번호 없음. X-User-Id 헤더만으로 식별.

---

### 2-2. plans

```sql
CREATE TABLE plans (
  id             BIGSERIAL PRIMARY KEY,
  name           VARCHAR(50)  NOT NULL UNIQUE,   -- 'free', 'basic', 'standard', 'premium'
  monthly_price  INTEGER      NOT NULL DEFAULT 0, -- 원 단위
  can_learn      BOOLEAN      NOT NULL DEFAULT FALSE,
  can_talk       BOOLEAN      NOT NULL DEFAULT FALSE,
  can_analyze    BOOLEAN      NOT NULL DEFAULT FALSE,
  duration_days  INTEGER      NOT NULL DEFAULT 30,
  features       JSONB        NOT NULL DEFAULT '{}',
  created_at     TIMESTAMP(6) NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMP(6) NOT NULL DEFAULT NOW()
);
```

**seed 데이터:**

| name | monthly_price | can_learn | can_talk | can_analyze | duration_days |
|---|---|---|---|---|---|
| free | 0 | false | false | false | 0 |
| basic | 9900 | true | false | false | 30 |
| standard | 19900 | true | true | false | 30 |
| premium | 39900 | true | true | true | 30 |

---

### 2-3. memberships

```sql
CREATE TABLE memberships (
  id          BIGSERIAL PRIMARY KEY,
  user_id     BIGINT       NOT NULL REFERENCES users(id),
  plan_id     BIGINT       NOT NULL REFERENCES plans(id),
  status      VARCHAR(20)  NOT NULL DEFAULT 'trial',
                            -- 'trial' | 'active' | 'expired'
  starts_at   TIMESTAMP(6) NOT NULL DEFAULT NOW(),
  expires_at  TIMESTAMP(6) NOT NULL,
  created_at  TIMESTAMP(6) NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMP(6) NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_memberships_user_id ON memberships(user_id);
CREATE INDEX idx_memberships_expires_at ON memberships(expires_at);
```

**주요 모델 로직:**

```ruby
class Membership < ApplicationRecord
  belongs_to :user
  belongs_to :plan

  scope :current, -> { where(status: %w[trial active]).order(created_at: :desc) }

  def active?
    (status == 'active' || status == 'trial') && expires_at > Time.current
  end

  def expired?
    !active?
  end
end
```

---

### 2-4. payment_logs

```sql
CREATE TABLE payment_logs (
  id              BIGSERIAL PRIMARY KEY,
  user_id         BIGINT       NOT NULL REFERENCES users(id),
  plan_id         BIGINT       NOT NULL REFERENCES plans(id),
  action          VARCHAR(50)  NOT NULL, -- 'purchase', 'upgrade', 'refund', 'revoke'
  transaction_id  VARCHAR(100),          -- Mock PG가 발급하는 UUID
  result          JSONB        NOT NULL DEFAULT '{}',
  created_at      TIMESTAMP(6) NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_payment_logs_user_id ON payment_logs(user_id);
```

> 실카드 번호, CVV 등 민감 결제 정보는 절대 저장하지 않음.

---

### 2-5. conversations

```sql
CREATE TABLE conversations (
  id          BIGSERIAL PRIMARY KEY,
  user_id     BIGINT       NOT NULL REFERENCES users(id),
  status      VARCHAR(20)  NOT NULL DEFAULT 'active', -- 'active' | 'ended'
  created_at  TIMESTAMP(6) NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMP(6) NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_conversations_user_id ON conversations(user_id);
```

---

### 2-6. messages

```sql
CREATE TABLE messages (
  id              BIGSERIAL PRIMARY KEY,
  conversation_id BIGINT       NOT NULL REFERENCES conversations(id),
  role            VARCHAR(20)  NOT NULL, -- 'user' | 'assistant'
  content         TEXT         NOT NULL,
  created_at      TIMESTAMP(6) NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
```

> `audio_url` 컬럼 없음. 유저 발화 오디오는 STT 처리 후 서버에 저장하지 않음 (transcript만 저장).  
> 유저 발화 재생 버튼용 blob URL은 브라우저 메모리에만 유지 (새로고침 시 소멸).

---

## 3. 멤버십 상태 전이

```
없음 ──────────→ trial (Free 플랜 자동 부여, seed에서 처리)
trial ─────────→ active (구매 시)
active ────────→ active (재구매: expires_at 연장)
active ────────→ active (업그레이드: 잔여 기간 이어받기)
active ────────→ expired (만료 또는 어드민 삭제)
expired ───────→ active (재구매)
```

**재구매 로직 (기간 연장):**
```ruby
membership.update!(expires_at: membership.expires_at + plan.duration_days.days)
```

**업그레이드 로직 (잔여 기간 이어받기):**
```ruby
base = [membership.expires_at, Time.current].max
new_expires_at = base + new_plan.duration_days.days
membership.update!(plan: new_plan, expires_at: new_expires_at)
```

**어드민 삭제 로직:**
```ruby
membership.update!(status: 'expired', expires_at: Time.current)
```

**어드민 부여 로직 (기존 교체):**
```ruby
# 1. 기존 active/trial 멤버십 모두 expired로 전환
user.memberships.current.update_all(status: 'expired', expires_at: Time.current)
# 2. 새 멤버십 생성
user.memberships.create!(
  plan: plan,
  status: 'active',
  starts_at: Time.current,
  expires_at: Time.current + duration_days.days
)
```

---

## 4. 접근 권한 판단 순서

AI 대화 화면 진입 시 3단계 체크:

```ruby
# 1. 멤버십 존재 여부
membership = user.memberships.current.first
return 403 unless membership

# 2. 유효 기간
return 403 unless membership.active?

# 3. 플랜 권한
return 403 unless membership.plan.can_talk
```

---

## 5. Seed 데이터

```ruby
# db/seeds.rb
Plan.find_or_create_by!(name: 'free')     { |p| p.monthly_price = 0;     p.can_learn = false; p.can_talk = false; p.can_analyze = false; p.duration_days = 0 }
Plan.find_or_create_by!(name: 'basic')    { |p| p.monthly_price = 9900;  p.can_learn = true;  p.can_talk = false; p.can_analyze = false; p.duration_days = 30 }
Plan.find_or_create_by!(name: 'standard') { |p| p.monthly_price = 19900; p.can_learn = true;  p.can_talk = true;  p.can_analyze = false; p.duration_days = 30 }
Plan.find_or_create_by!(name: 'premium')  { |p| p.monthly_price = 39900; p.can_learn = true;  p.can_talk = true;  p.can_analyze = true;  p.duration_days = 30 }

# 테스트용 유저 seed (드롭다운에서 선택)
[
  { name: 'Alice Kim',   email: 'alice@example.com' },
  { name: 'Bob Lee',     email: 'bob@example.com' },
  { name: 'Carol Park',  email: 'carol@example.com' },
].each do |attrs|
  user = User.find_or_create_by!(email: attrs[:email]) { |u| u.name = attrs[:name] }
  # Free 플랜 trial 멤버십 자동 부여
  unless user.memberships.current.exists?
    free_plan = Plan.find_by!(name: 'free')
    user.memberships.create!(plan: free_plan, status: 'trial', starts_at: Time.current, expires_at: 100.years.from_now)
  end
end
```
