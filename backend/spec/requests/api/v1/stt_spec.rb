require "rails_helper"

RSpec.describe "STT API", type: :request do
  let(:user) { create(:user) }
  let(:premium_plan) { create(:plan, :premium) }

  describe "POST /api/v1/stt" do
    context "talk 권한 없는 유저" do
      before do
        create(:membership, :trial, user: user, plan: create(:plan, :free))
      end

      it "403을 반환한다" do
        post "/api/v1/stt",
             params: { audio: fixture_file_upload("spec/fixtures/audio/hello.webm", "audio/webm") },
             headers: { "X-User-Id" => user.id }

        expect(response).to have_http_status(:forbidden)
        expect(JSON.parse(response.body)["code"]).to eq("forbidden")
      end
    end

    context "talk 권한 있는 유저" do
      before do
        create(:membership, user: user, plan: premium_plan, status: "active", expires_at: 30.days.from_now)
        stub_request(:post, /api\.openai\.com\/v1\/audio\/transcriptions/).to_return(
          status: 200,
          body: { text: "Hello, I would like to practice my pronunciation.", duration: 2.34 }.to_json,
          headers: { "Content-Type" => "application/json" }
        )
      end

      it "200과 transcript를 반환한다" do
        post "/api/v1/stt",
             params: { audio: fixture_file_upload("spec/fixtures/audio/hello.webm", "audio/webm") },
             headers: { "X-User-Id" => user.id }

        expect(response).to have_http_status(:ok)
        payload = JSON.parse(response.body)
        expect(payload.dig("data", "transcript")).to eq("Hello, I would like to practice my pronunciation.")
        expect(payload.dig("data", "duration_ms")).to eq(2340)
      end
    end

    context "만료된 멤버십" do
      before do
        create(:membership, user: user, plan: premium_plan,
               status: "active", expires_at: 1.minute.ago)
      end

      it "403을 반환한다" do
        post "/api/v1/stt",
             params: { audio: fixture_file_upload("spec/fixtures/audio/hello.webm", "audio/webm") },
             headers: { "X-User-Id" => user.id }

        expect(response).to have_http_status(:forbidden)
      end
    end

    context "X-User-Id 없을 때" do
      it "403을 반환한다" do
        post "/api/v1/stt"

        expect(response).to have_http_status(:forbidden)
      end
    end
  end
end
