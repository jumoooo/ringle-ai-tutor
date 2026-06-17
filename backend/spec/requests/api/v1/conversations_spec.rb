require "rails_helper"

RSpec.describe "Conversations API", type: :request do
  let(:user) { create(:user) }
  let(:standard_plan) { create(:plan, :standard) }

  describe "POST /api/v1/conversations" do
    context "talk 권한 없는 유저" do
      before do
        create(:membership, :trial, user: user, plan: create(:plan, :free))
      end

      it "403을 반환한다" do
        post "/api/v1/conversations",
             headers: { "X-User-Id" => user.id }

        expect(response).to have_http_status(:forbidden)
      end
    end

    context "talk 권한 있는 유저" do
      before do
        create(:membership, user: user, plan: standard_plan, status: "active", expires_at: 30.days.from_now)
      end

      it "201과 first_message를 반환한다" do
        post "/api/v1/conversations",
             headers: { "X-User-Id" => user.id }

        expect(response).to have_http_status(:created)
        payload = JSON.parse(response.body)
        expect(payload.dig("data", "status")).to eq("active")
        expect(payload.dig("data", "first_message", "role")).to eq("assistant")
        expect(payload.dig("data", "first_message", "content")).to include("Hi! I'm your AI English tutor")
      end
    end
  end

  describe "GET /api/v1/conversations/:id" do
    let!(:conversation) { create(:conversation, user: user) }
    let!(:message) { create(:message, :assistant, conversation: conversation) }

    it "대화 내역을 반환한다" do
      get "/api/v1/conversations/#{conversation.id}",
          headers: { "X-User-Id" => user.id }

      expect(response).to have_http_status(:ok)
      payload = JSON.parse(response.body)
      expect(payload.dig("data", "id")).to eq(conversation.id)
      expect(payload.dig("data", "messages").length).to eq(1)
      expect(payload.dig("data", "messages", 0, "role")).to eq("assistant")
    end

    it "다른 유저 대화는 404를 반환한다" do
      other_user = create(:user)

      get "/api/v1/conversations/#{conversation.id}",
          headers: { "X-User-Id" => other_user.id }

      expect(response).to have_http_status(:not_found)
    end
  end
end
