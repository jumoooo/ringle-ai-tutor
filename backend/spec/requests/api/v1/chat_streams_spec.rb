require "rails_helper"

RSpec.describe "Chat Streams API", type: :request do
  let(:user) { create(:user) }
  let(:standard_plan) { create(:plan, :standard) }
  let(:json_headers) { { "X-User-Id" => user.id, "Content-Type" => "application/json" } }

  describe "POST /api/v1/chat" do
    context "권한 검증" do
      before do
        create(:membership, :trial, user: user, plan: create(:plan, :free))
      end

      it "403을 반환한다" do
        post "/api/v1/chat",
             params: { conversation_id: 1, message: "Hello" }.to_json,
             headers: json_headers

        expect(response).to have_http_status(:forbidden)
      end
    end

    context "입력 검증" do
      before do
        create(:membership, user: user, plan: standard_plan, status: "active", expires_at: 30.days.from_now)
      end

      it "2001자 메시지면 422와 에러 코드를 반환한다" do
        post "/api/v1/chat",
             params: { conversation_id: 1, message: "a" * 2001 }.to_json,
             headers: json_headers

        expect(response).to have_http_status(422)
        expect(JSON.parse(response.body)).to include(
          "error" => "Message too long",
          "code" => "message_too_long"
        )
      end
    end

    context "SSE 스트리밍" do
      before do
        create(:membership, user: user, plan: standard_plan, status: "active", expires_at: 30.days.from_now)
      end

      it "존재하지 않는 conversation이면 SSE error 이벤트를 반환한다" do
        allow_any_instance_of(Ai::ChatStreamService).to receive(:call)

        post "/api/v1/chat",
             params: { conversation_id: 999_999, message: "Hello" }.to_json,
             headers: json_headers

        expect(response.body).to include('"type":"error"')
      end

      it "정상 요청은 text/event-stream을 반환한다" do
        conversation = create(:conversation, user: user)
        allow_any_instance_of(Ai::ChatStreamService).to receive(:call)

        post "/api/v1/chat",
             params: { conversation_id: conversation.id, message: "Hello" }.to_json,
             headers: json_headers

        expect(response).to have_http_status(:ok)
        expect(response.headers["Content-Type"]).to include("text/event-stream")
      end
    end
  end
end
