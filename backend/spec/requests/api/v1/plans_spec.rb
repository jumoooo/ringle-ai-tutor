require "rails_helper"

RSpec.describe "Plans API", type: :request do
  describe "GET /api/v1/plans" do
    it "플랜 목록을 반환한다" do
      create(:plan, :basic)
      create(:plan, :premium)

      get "/api/v1/plans"

      expect(response).to have_http_status(:ok)
      payload = JSON.parse(response.body)
      expect(payload["data"]).not_to be_empty
      expect(payload["data"].first.keys).to include("id", "name", "monthly_price", "can_talk")
    end
  end
end
