require "rails_helper"

RSpec.describe "Admin Users API", type: :request do
  describe "GET /api/v1/admin/users" do
    let!(:member_user) { create(:user) }

    it "admin 유저면 유저 목록을 반환한다" do
      admin_user = create(:user, :admin)

      get "/api/v1/admin/users", headers: { "X-User-Id" => admin_user.id.to_s }

      expect(response).to have_http_status(:ok)
      payload = JSON.parse(response.body)
      expect(payload["data"]).not_to be_empty
      expect(payload["data"].first.keys).to include("id", "name", "membership")
    end

    it "일반 유저면 403을 반환한다" do
      user = create(:user)

      get "/api/v1/admin/users", headers: { "X-User-Id" => user.id.to_s }

      expect(response).to have_http_status(:forbidden)
    end

    it "헤더가 없으면 403을 반환한다" do
      get "/api/v1/admin/users"

      expect(response).to have_http_status(:forbidden)
      expect(JSON.parse(response.body)).to include(
        "error" => "User not found",
        "code" => "forbidden"
      )
    end
  end
end
