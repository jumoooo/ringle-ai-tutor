require "rails_helper"

RSpec.describe "Admin Users API", type: :request do
  let(:admin_key) { AppConfig.admin_key }

  describe "GET /api/v1/admin/users" do
    it "올바른 키면 유저 목록을 반환한다" do
      create(:user)

      get "/api/v1/admin/users", headers: { "X-Admin-Key" => admin_key }

      expect(response).to have_http_status(:ok)
      payload = JSON.parse(response.body)
      expect(payload["data"]).not_to be_empty
      expect(payload["data"].first.keys).to include("id", "name", "membership")
    end

    it "키가 없으면 403을 반환한다" do
      get "/api/v1/admin/users"

      expect(response).to have_http_status(:forbidden)
    end

    it "키가 틀리면 403을 반환한다" do
      get "/api/v1/admin/users", headers: { "X-Admin-Key" => "wrong-key" }

      expect(response).to have_http_status(:forbidden)
    end
  end
end
