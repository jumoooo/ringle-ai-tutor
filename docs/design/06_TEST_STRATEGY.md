# 테스트 전략

> 작성일: 2026-06-17

---

## 1. 레이어별 도구

| 레이어 | 도구 | 목적 |
|---|---|---|
| Rails 요청 테스트 | RSpec 6 + request spec | API 엔드포인트 검증 |
| Rails 서비스/모델 | RSpec 6 + model/service spec | 비즈니스 로직 검증 |
| OpenAI API Mock | WebMock + VCR | 실제 API 호출 없이 응답 녹화/재생 |
| Rails E2E | Capybara | 브라우저 레벨 통합 테스트 |
| React 컴포넌트 | Vitest + @testing-library/react | 컴포넌트 렌더링/상호작용 |
| React 훅 | Vitest + renderHook | 커스텀 훅 로직 |
| 타입 검사 | tsc --noEmit | TypeScript 빌드 시 |

---

## 2. RSpec 설정

```ruby
# spec/rails_helper.rb 핵심 설정
require 'webmock/rspec'
require 'vcr'

VCR.configure do |config|
  config.cassette_library_dir = 'spec/fixtures/vcr_cassettes'
  config.hook_into :webmock
  config.filter_sensitive_data('<OPENAI_API_KEY>') { ENV['OPENAI_API_KEY'] }
  config.default_cassette_options = { record: :new_episodes }
end

RSpec.configure do |config|
  config.include FactoryBot::Syntax::Methods
  config.before(:each, type: :request) do
    # 모든 외부 HTTP 차단 (VCR 카세트 없으면 실패)
    WebMock.disable_net_connect!(allow_localhost: true)
  end
end
```

---

## 3. 테스트 커버리지 목표

| 레이어 | 커버리지 목표 |
|---|---|
| Services | 90%+ |
| Models | 85%+ |
| Request specs | 핵심 엔드포인트 100% |
| Frontend 컴포넌트 | 핵심 UI 70%+ |

---

## 4. 요청 테스트 예시

```ruby
# spec/requests/api/v1/memberships_spec.rb
RSpec.describe 'Memberships API', type: :request do
  let(:user) { create(:user) }
  let(:plan) { create(:plan, :standard) }

  describe 'GET /api/v1/memberships/current' do
    context '활성 멤버십이 있을 때' do
      before { create(:membership, user: user, plan: plan, status: 'active', expires_at: 30.days.from_now) }

      it '멤버십 정보를 반환한다' do
        get '/api/v1/memberships/current', headers: { 'X-User-Id' => user.id }
        expect(response).to have_http_status(:ok)
        data = JSON.parse(response.body)['data']
        expect(data['status']).to eq('active')
        expect(data['plan']['name']).to eq('standard')
      end
    end

    context '멤버십이 없을 때' do
      it 'null을 반환한다' do
        get '/api/v1/memberships/current', headers: { 'X-User-Id' => user.id }
        expect(response).to have_http_status(:ok)
        expect(JSON.parse(response.body)['data']).to be_nil
      end
    end
  end

  describe 'POST /api/v1/memberships/purchase' do
    it '구매 후 active 멤버십이 생성된다' do
      post '/api/v1/memberships/purchase',
           params: { plan_id: plan.id, card_token: 'mock_token' }.to_json,
           headers: { 'X-User-Id' => user.id, 'Content-Type' => 'application/json' }

      expect(response).to have_http_status(:ok)
      data = JSON.parse(response.body)['data']
      expect(data['membership']['status']).to eq('active')
      expect(data['transaction_id']).to be_present
    end
  end
end
```

---

## 5. VCR 카세트 사용 예시

```ruby
# spec/services/ai/transcription_service_spec.rb
RSpec.describe Ai::TranscriptionService do
  describe '#call' do
    it '음성 파일을 텍스트로 변환한다', vcr: { cassette_name: 'openai/transcription_success' } do
      audio_file = fixture_file_upload('spec/fixtures/audio/hello.webm', 'audio/webm')
      result = described_class.new(audio_file: audio_file).call

      expect(result[:transcript]).to be_a(String)
      expect(result[:transcript]).not_to be_empty
      expect(result[:duration_ms]).to be_positive
    end
  end
end
```

---

## 6. Factory 정의

```ruby
# spec/factories/users.rb
FactoryBot.define do
  factory :user do
    name  { Faker::Name.full_name }
    email { Faker::Internet.unique.email }
  end
end

# spec/factories/plans.rb
FactoryBot.define do
  factory :plan do
    name          { 'standard' }
    monthly_price { 19900 }
    can_learn     { true }
    can_talk      { true }
    can_analyze   { false }
    duration_days { 30 }

    trait :free do
      name          { 'free' }
      monthly_price { 0 }
      can_learn     { false }
      can_talk      { false }
      duration_days { 0 }
    end

    trait :standard do
      name          { 'standard' }
      monthly_price { 19900 }
      can_talk      { true }
    end

    trait :premium do
      name          { 'premium' }
      monthly_price { 39900 }
      can_talk      { true }
      can_analyze   { true }
    end
  end
end

# spec/factories/memberships.rb
FactoryBot.define do
  factory :membership do
    user
    plan
    status     { 'active' }
    starts_at  { Time.current }
    expires_at { 30.days.from_now }
  end
end
```

---

## 7. 멤버십 모델 테스트

```ruby
# spec/models/membership_spec.rb
RSpec.describe Membership, type: :model do
  describe '#active?' do
    it '만료 전이고 status가 active이면 true' do
      m = build(:membership, status: 'active', expires_at: 1.day.from_now)
      expect(m.active?).to be true
    end

    it '만료됐으면 false' do
      m = build(:membership, status: 'active', expires_at: 1.day.ago)
      expect(m.active?).to be false
    end

    it 'status가 expired이면 false' do
      m = build(:membership, status: 'expired', expires_at: 1.day.from_now)
      expect(m.active?).to be false
    end
  end
end
```

---

## 8. Vitest 컴포넌트 테스트 예시

```typescript
// features/membership/components/__tests__/MembershipCard.test.tsx
import { render, screen } from '@testing-library/react'
import { MembershipCard } from '../MembershipCard'

const mockMembership = {
  id: 1,
  status: 'active' as const,
  expires_at: '2026-07-17T12:00:00+09:00',
  plan: {
    id: 3,
    name: 'standard',
    monthly_price: 19900,
    can_learn: true,
    can_talk: true,
    can_analyze: false,
  },
}

test('멤버십 카드가 플랜명과 만료일을 표시한다', () => {
  render(<MembershipCard membership={mockMembership} />)
  expect(screen.getByText('standard')).toBeInTheDocument()
  expect(screen.getByText(/2026-07-17/)).toBeInTheDocument()
})

test('멤버십이 null이면 "멤버십 없음" 텍스트를 표시한다', () => {
  render(<MembershipCard membership={null} />)
  expect(screen.getByText(/멤버십 없음/)).toBeInTheDocument()
})
```

---

## 9. 어드민 접근 테스트

```ruby
# spec/requests/api/v1/admin/users_spec.rb
RSpec.describe 'Admin Users API', type: :request do
  describe 'GET /api/v1/admin/users' do
    context 'Admin Key가 올바를 때' do
      it '유저 목록을 반환한다' do
        get '/api/v1/admin/users', headers: { 'X-Admin-Key' => ENV['ADMIN_KEY'] }
        expect(response).to have_http_status(:ok)
      end
    end

    context 'Admin Key가 없거나 틀릴 때' do
      it '403을 반환한다' do
        get '/api/v1/admin/users'
        expect(response).to have_http_status(:forbidden)
      end
    end
  end
end
```

---

## 10. Rate Limit 테스트

```ruby
# spec/requests/api/v1/stt_spec.rb (rate limit 부분)
RSpec.describe 'STT Rate Limit', type: :request do
  let(:user) { create(:user) }

  it '11번째 요청은 429를 반환한다' do
    11.times do |i|
      post '/api/v1/stt',
           params: { audio: fixture_audio },
           headers: { 'X-User-Id' => user.id }
      if i < 10
        expect(response).not_to have_http_status(:too_many_requests)
      else
        expect(response).to have_http_status(:too_many_requests)
      end
    end
  end
end
```

---

## 11. Capybara E2E 테스트 (핵심 플로우)

```ruby
# spec/system/membership_purchase_spec.rb
RSpec.describe '멤버십 구매 플로우', type: :system do
  let(:user) { create(:user) }

  before do
    create(:plan, :standard)
    visit '/'
    # 유저 선택
    select user.name, from: 'user-select'
  end

  it '플랜 구매 후 대화 시작 버튼이 활성화된다' do
    click_button 'Standard 구매'
    expect(page).to have_text('멤버십이 활성화되었습니다')
    expect(page).to have_button('대화 시작', disabled: false)
  end
end
```
