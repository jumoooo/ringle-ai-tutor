require "rails_helper"

RSpec.describe "GET /api/v1/health", type: :request do
  it "returns ok status" do
    get "/api/v1/health"

    expect(response).to have_http_status(:ok)

    response_body = JSON.parse(response.body)

    expect(response_body.dig("data", "status")).to eq("ok")
    expect(response_body.dig("data", "timestamp")).to be_present
  end
end
