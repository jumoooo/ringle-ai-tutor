require "rails_helper"

RSpec.describe "Users API", type: :request do
  describe "GET /api/v1/users" do
    it "유저 목록을 반환한다" do
      create_list(:user, 2)

      get "/api/v1/users"

      expect(response).to have_http_status(:ok)
      payload = JSON.parse(response.body)
      expect(payload["data"].length).to be >= 2
      expect(payload["data"].first.keys).to include("id", "name", "email")
    end
  end

  describe "GET /api/v1/users/:id" do
    let(:user) { create(:user) }

    it "특정 유저 정보를 반환한다" do
      get "/api/v1/users/#{user.id}"

      expect(response).to have_http_status(:ok)
      payload = JSON.parse(response.body)
      expect(payload.dig("data", "id")).to eq(user.id)
      expect(payload.dig("data", "email")).to eq(user.email)
    end

    it "존재하지 않으면 404를 반환한다" do
      get "/api/v1/users/999999"

      expect(response).to have_http_status(:not_found)
    end
  end

  describe "GET /api/v1/users/me" do
    it "admin 유저면 role을 포함한 프로필을 반환한다" do
      admin_user = create(:user, :admin)

      get "/api/v1/users/me", headers: { "X-User-Id" => admin_user.id.to_s }

      expect(response).to have_http_status(:ok)
      payload = JSON.parse(response.body)
      expect(payload.dig("data", "id")).to eq(admin_user.id)
      expect(payload.dig("data", "role")).to eq("admin")
    end

    it "일반 유저면 role이 null로 반환된다" do
      user = create(:user)

      get "/api/v1/users/me", headers: { "X-User-Id" => user.id.to_s }

      expect(response).to have_http_status(:ok)
      payload = JSON.parse(response.body)
      expect(payload.dig("data", "id")).to eq(user.id)
      expect(payload.dig("data", "role")).to be_nil
    end

    it "헤더가 없으면 403을 반환한다" do
      get "/api/v1/users/me"

      expect(response).to have_http_status(:forbidden)
      expect(JSON.parse(response.body)).to include(
        "error" => "User not found",
        "code" => "forbidden"
      )
    end
  end
end
