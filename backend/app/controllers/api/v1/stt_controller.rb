module Api
  module V1
    class SttController < ApplicationController
      before_action :require_user!
      before_action :require_talk_access!
      before_action :validate_audio_presence!
      before_action :validate_audio_size!

      def create
        result = Ai::TranscriptionService.new(audio_file: params[:audio]).call
        render json: { data: result }, status: :ok
      end

      private

      def validate_audio_presence!
        return if params[:audio].is_a?(ActionDispatch::Http::UploadedFile)

        render json: { error: "Audio file is required", code: "audio_missing" }, status: 422
      end

      def validate_audio_size!
        return unless params[:audio].size > MAX_AUDIO_SIZE_BYTES

        render json: { error: "Audio file too large", code: "audio_too_large" }, status: 422
      end
    end
  end
end
