require "rails_helper"

RSpec.describe Ai::ChatStreamService, type: :service do
  let(:stream) { double("stream") }
  let(:conversation) { create(:conversation) }
  let(:messages) { [{ role: "user", content: "Hello" }] }
  let(:service) do
    described_class.new(
      messages: messages,
      stream: stream,
      conversation: conversation
    )
  end

  before do
    allow(stream).to receive(:write)
  end

  describe "#call" do
    it "delta, sentence, done 이벤트를 순서대로 쓰고 assistant 메시지를 저장한다" do
      create(:message, conversation: conversation, role: "user", content: "Hello")

      stub_request(:post, "https://api.openai.com/v1/chat/completions")
        .to_return(
          status: 200,
          headers: { "Content-Type" => "text/event-stream" },
          body: [
            %(data: {"choices":[{"delta":{"content":"Hello"}}]}\n\n),
            %(data: {"choices":[{"delta":{"content":" world."}}]}\n\n),
            %(data: {"choices":[{"delta":{"content":" How are you?"}}]}\n\n),
            "data: [DONE]\n\n"
          ].join
        )

      service.call

      writes = []
      expect(stream).to have_received(:write).at_least(:once) do |payload|
        writes << payload
      end

      aggregate_failures do
        expect(writes[0]).to include('"type":"delta"')
        expect(writes[1]).to include('"type":"delta"')
        expect(writes).to include(%(data: {"type":"sentence","content":"Hello world."}\n\n))
        expect(writes).to include(%(data: {"type":"sentence","content":"How are you?"}\n\n))
        expect(writes.last).to include('"type":"done"')
        expect(writes.last).to include('"turn_count":1')
        expect(conversation.messages.order(:created_at).last.role).to eq("assistant")
        expect(conversation.messages.order(:created_at).last.content).to eq("Hello world. How are you?")
      end
    end

    it "OpenAI 오류를 예외로 전파한다" do
      stub_request(:post, "https://api.openai.com/v1/chat/completions")
        .to_return(
          status: 500,
          headers: { "Content-Type" => "application/json" },
          body: { error: { message: "upstream failed" } }.to_json
        )

      expect { service.call }.to raise_error(Faraday::ServerError)
    end
  end
end
