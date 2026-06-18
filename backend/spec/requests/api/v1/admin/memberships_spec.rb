require "rails_helper"

RSpec.describe "Admin Memberships API", type: :request do
  let(:admin_key) { AppConfig.admin_key }
  let(:user) { create(:user) }
  let(:premium_plan) { create(:plan, :premium) }

  describe "POST /api/v1/admin/users/:user_id/memberships" do
    it "멤버십 부여에 성공한다" do
      post "/api/v1/admin/users/#{user.id}/memberships",
           params: { plan_id: premium_plan.id, duration_days: 30 }.to_json,
           headers: { "X-Admin-Key" => admin_key, "Content-Type" => "application/json" }

      expect(response).to have_http_status(:created)
      payload = JSON.parse(response.body)
      expect(payload.dig("data", "membership", "status")).to eq("active")
    end

    it "기존 활성 멤버십이 있으면 만료 처리 후 교체한다" do
      old_membership = create(:membership, user: user, plan: create(:plan, :basic), status: "active", expires_at: 30.days.from_now)

      post "/api/v1/admin/users/#{user.id}/memberships",
           params: { plan_id: premium_plan.id, duration_days: 30 }.to_json,
           headers: { "X-Admin-Key" => admin_key, "Content-Type" => "application/json" }

      expect(old_membership.reload.status).to eq("expired")
    end

    it "키가 없으면 403을 반환한다" do
      post "/api/v1/admin/users/#{user.id}/memberships",
           params: { plan_id: premium_plan.id }.to_json,
           headers: { "Content-Type" => "application/json" }

      expect(response).to have_http_status(:forbidden)
    end
  end

  describe "DELETE /api/v1/admin/users/:user_id/memberships/current" do
    it "현재 멤버십을 즉시 회수한다" do
      create(:membership, user: user, plan: premium_plan, status: "active", expires_at: 30.days.from_now)

      delete "/api/v1/admin/users/#{user.id}/memberships/current",
             headers: { "X-Admin-Key" => admin_key }

      expect(response).to have_http_status(:ok)
      expect(JSON.parse(response.body).dig("data", "revoked")).to be(true)
      expect(user.memberships.current).to be_empty
    end
  end
end
