module Api
  module V1
    class TtsController < ApplicationController
      before_action :require_user!
      before_action :require_talk_access!

      def create
        audio_binary = Ai::TtsService.new(text: params[:text].to_s.strip).call
        send_data audio_binary, type: "audio/mpeg", disposition: "inline"
      end
    end
  end
end
