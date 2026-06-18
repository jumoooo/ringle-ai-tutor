require "rails_helper"

RSpec.describe "TTS API", type: :request do
  let(:user) { create(:user) }
  let(:standard_plan) { create(:plan, :standard) }

  describe "POST /api/v1/tts" do
    context "talk 권한 없는 유저" do
      before do
        create(:membership, :trial, user: user, plan: create(:plan, :free))
      end

      it "403을 반환한다" do
        post "/api/v1/tts",
             params: { text: "Hello" }.to_json,
             headers: { "X-User-Id" => user.id, "Content-Type" => "application/json" }

        expect(response).to have_http_status(:forbidden)
      end
    end

    context "talk 권한 있는 유저" do
      before do
        create(:membership, user: user, plan: standard_plan, status: "active", expires_at: 30.days.from_now)
        stub_request(:post, /api\.openai\.com\/v1\/audio\/speech/).to_return(
          status: 200,
          body: "fake_audio_binary",
          headers: { "Content-Type" => "audio/mpeg" }
        )
      end

      it "200과 audio/mpeg를 반환한다" do
        post "/api/v1/tts",
             params: { text: "Sure! Let's practice." }.to_json,
             headers: { "X-User-Id" => user.id, "Content-Type" => "application/json" }

        expect(response).to have_http_status(:ok)
        expect(response.headers["Content-Type"]).to include("audio/mpeg")
      end
    end

    context "만료된 멤버십" do
      before do
        create(:membership, user: user, plan: standard_plan,
               status: "active", expires_at: 1.minute.ago)
      end

      it "403을 반환한다" do
        post "/api/v1/tts",
             params: { text: "Hello" }.to_json,
             headers: { "X-User-Id" => user.id, "Content-Type" => "application/json" }

        expect(response).to have_http_status(:forbidden)
      end
    end
  end
end
