module Ai
  class TranscriptionService
    def initialize(audio_file:)
      @audio_file = audio_file
    end

    def call
      Retryable.retryable(tries: 3, on: StandardError, sleep: lambda { |attempt| 2**attempt }) do
        client = OpenAI::Client.new(access_token: AppConfig.openai_api_key)
        response = client.audio.transcribe(
          parameters: {
            model: "whisper-1",
            file: upload_file,
            response_format: "verbose_json"
          }
        )

        {
          transcript: response["text"].to_s.strip,
          duration_ms: ((response["duration"] || 0) * 1000).to_i
        }
      end
    end

    private

    def upload_file
      return @audio_file.tempfile if @audio_file.respond_to?(:tempfile)

      @audio_file
    end
  end
end
