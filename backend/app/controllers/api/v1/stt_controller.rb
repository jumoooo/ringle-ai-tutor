module Api
  module V1
    class SttController < ApplicationController
      before_action :require_user!
      before_action :require_talk_access!

      def create
        result = Ai::TranscriptionService.new(audio_file: params[:audio]).call
        render json: { data: result }, status: :ok
      end
    end
  end
end
