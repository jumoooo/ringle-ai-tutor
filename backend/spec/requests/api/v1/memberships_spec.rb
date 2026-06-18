require "rails_helper"

RSpec.describe "Memberships API", type: :request do
  let(:user) { create(:user) }
  let(:basic_plan) { create(:plan, :basic) }

  describe "GET /api/v1/memberships/current" do
    context "활성 멤버십이 있을 때" do
      before do
        create(:membership, user: user, plan: basic_plan, status: "active", expires_at: 30.days.from_now)
      end

      it "멤버십 정보를 반환한다" do
        get "/api/v1/memberships/current", headers: { "X-User-Id" => user.id }

        expect(response).to have_http_status(:ok)
        payload = JSON.parse(response.body)
        expect(payload.dig("data", "status")).to eq("active")
        expect(payload.dig("data", "plan", "name")).to eq("베이직")
      end
    end

    context "멤버십이 없을 때" do
      it "data null을 반환한다" do
        get "/api/v1/memberships/current", headers: { "X-User-Id" => user.id }

        expect(response).to have_http_status(:ok)
        expect(JSON.parse(response.body)["data"]).to be_nil
      end
    end

    context "만료된 멤버십만 있을 때" do
      before do
        create(:membership, :expired, user: user, plan: basic_plan)
      end

      it "data null을 반환한다" do
        get "/api/v1/memberships/current", headers: { "X-User-Id" => user.id }

        expect(response).to have_http_status(:ok)
        expect(JSON.parse(response.body)["data"]).to be_nil
      end
    end

    context "유저 헤더가 없을 때" do
      it "403을 반환한다" do
        get "/api/v1/memberships/current"

        expect(response).to have_http_status(:forbidden)
      end
    end
  end

  describe "POST /api/v1/memberships/purchase" do
    it "구매 성공 시 active 멤버십을 반환한다" do
      post "/api/v1/memberships/purchase",
           params: { plan_id: basic_plan.id, card_token: "mock_token" }.to_json,
           headers: { "X-User-Id" => user.id, "Content-Type" => "application/json" }

      expect(response).to have_http_status(:ok)
      payload = JSON.parse(response.body)
      expect(payload.dig("data", "membership", "status")).to eq("active")
      expect(payload.dig("data", "transaction_id")).to be_present
    end

    it "같은 active 멤버십이 있으면 기간을 연장한다" do
      membership = create(:membership, user: user, plan: basic_plan, status: "active", expires_at: 30.days.from_now)
      original_expiration = membership.expires_at

      post "/api/v1/memberships/purchase",
           params: { plan_id: basic_plan.id, card_token: "mock_token" }.to_json,
           headers: { "X-User-Id" => user.id, "Content-Type" => "application/json" }

      expect(response).to have_http_status(:ok)
      expect(membership.reload.expires_at).to be > original_expiration
    end

    it "존재하지 않는 플랜이면 404를 반환한다" do
      post "/api/v1/memberships/purchase",
           params: { plan_id: 999999, card_token: "mock_token" }.to_json,
           headers: { "X-User-Id" => user.id, "Content-Type" => "application/json" }

      expect(response).to have_http_status(:not_found)
    end
  end

  describe "POST /api/v1/memberships/upgrade" do
    let(:premium_plan) { create(:plan, :premium) }

    it "업그레이드에 성공한다" do
      create(:membership, user: user, plan: basic_plan, status: "active", expires_at: 30.days.from_now)

      post "/api/v1/memberships/upgrade",
           params: { plan_id: premium_plan.id, card_token: "mock_token" }.to_json,
           headers: { "X-User-Id" => user.id, "Content-Type" => "application/json" }

      expect(response).to have_http_status(:ok)
      payload = JSON.parse(response.body)
      expect(payload.dig("data", "membership", "plan", "name")).to eq("프리미엄 플러스")
    end

    it "다운그레이드 시도면 422를 반환한다" do
      create(:membership, user: user, plan: premium_plan, status: "active", expires_at: 30.days.from_now)

      post "/api/v1/memberships/upgrade",
           params: { plan_id: basic_plan.id, card_token: "mock_token" }.to_json,
           headers: { "X-User-Id" => user.id, "Content-Type" => "application/json" }

      expect(response).to have_http_status(422)
    end

    it "활성 멤버십이 없으면 422를 반환한다" do
      post "/api/v1/memberships/upgrade",
           params: { plan_id: premium_plan.id, card_token: "mock_token" }.to_json,
           headers: { "X-User-Id" => user.id, "Content-Type" => "application/json" }

      expect(response).to have_http_status(422)
    end
  end
end
