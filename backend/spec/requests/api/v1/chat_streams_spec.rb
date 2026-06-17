require "rails_helper"

RSpec.describe "Chat Streams API", type: :request do
  let(:user) { create(:user) }
  let(:standard_plan) { create(:plan, :standard) }

  describe "POST /api/v1/chat" do
    context "talk 권한 없는 유저" do
      before do
        create(:membership, :trial, user: user, plan: create(:plan, :free))
      end

      it "403을 반환한다" do
        post "/api/v1/chat",
             params: { conversation_id: 1, message: "Hello" }.to_json,
             headers: { "X-User-Id" => user.id, "Content-Type" => "application/json" }

        expect(response).to have_http_status(:forbidden)
      end
    end

    context "talk 권한 있는 유저" do
      before do
        create(:membership, user: user, plan: standard_plan, status: "active", expires_at: 30.days.from_now)
      end

      it "존재하지 않는 conversation이면 SSE error 이벤트를 반환한다" do
        allow_any_instance_of(Ai::ChatStreamService).to receive(:call)

        post "/api/v1/chat",
             params: { conversation_id: 999_999, message: "Hello" }.to_json,
             headers: { "X-User-Id" => user.id, "Content-Type" => "application/json" }

        expect(response.body).to include('"type":"error"')
      end

      it "정상 요청은 text/event-stream을 반환한다" do
        conversation = create(:conversation, user: user)
        allow_any_instance_of(Ai::ChatStreamService).to receive(:call)

        post "/api/v1/chat",
             params: { conversation_id: conversation.id, message: "Hello" }.to_json,
             headers: { "X-User-Id" => user.id, "Content-Type" => "application/json" }

        expect(response).to have_http_status(:ok)
        expect(response.headers["Content-Type"]).to include("text/event-stream")
      end
    end
  end
end
