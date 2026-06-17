module Ai
  class ChatStreamService
    SYSTEM_PROMPT = <<~PROMPT.freeze
      You are a friendly and encouraging English conversation tutor.
      Help the user practice their English naturally.
      If the user writes in a language other than English, respond with:
      "Please speak in English. Let's practice together!"
      Keep responses concise and conversational.
    PROMPT

    MAX_TOKENS = 1000

    def initialize(messages:, stream:, conversation:)
      @messages = messages
      @stream = stream
      @conversation = conversation
    end

    def call
      client = OpenAI::Client.new(access_token: AppConfig.openai_api_key)
      sentence_buffer = +""
      full_response = +""

      client.chat(
        parameters: {
          model: "gpt-4o",
          messages: [{ role: "system", content: SYSTEM_PROMPT }] + @messages,
          max_tokens: MAX_TOKENS,
          stream: proc do |chunk, _bytesize|
            delta = chunk.dig("choices", 0, "delta", "content").to_s
            next if delta.empty?

            full_response << delta
            sentence_buffer << delta
            @stream.write("data: #{JSON.generate({ type: "delta", content: delta })}\n\n")

            next unless sentence_buffer.match?(/[.?!]\s*$/)

            @stream.write("data: #{JSON.generate({ type: "sentence", content: sentence_buffer.strip })}\n\n")
            sentence_buffer.clear
          end
        }
      )

      if sentence_buffer.strip.present?
        @stream.write("data: #{JSON.generate({ type: "sentence", content: sentence_buffer.strip })}\n\n")
      end

      if full_response.present?
        Message.create!(conversation: @conversation, role: "assistant", content: full_response)
      end

      turn_count = @conversation.messages.reload.count / 2
      @stream.write("data: #{JSON.generate({ type: "done", conversation_id: @conversation.id, turn_count: turn_count })}\n\n")
    end
  end
end
