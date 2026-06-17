module Ai
  class TtsService
    VOICE = "nova"
    SPEED = 0.95

    def initialize(text:)
      @text = text
    end

    def call
      Retryable.retryable(tries: 3, on: StandardError, sleep: lambda { |attempt| 2**attempt }) do
        client = OpenAI::Client.new(access_token: AppConfig.openai_api_key)
        client.audio.speech(
          parameters: {
            model: "tts-1",
            input: @text,
            voice: VOICE,
            speed: SPEED,
            response_format: "mp3"
          }
        )
      end
    end
  end
end
