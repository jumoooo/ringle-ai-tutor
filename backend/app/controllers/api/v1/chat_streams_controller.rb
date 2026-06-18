module Api
  module V1
    class ChatStreamsController < ApplicationController
      include ActionController::Live

      before_action :require_user!
      before_action :require_talk_access!
      before_action :validate_message_length!

      def create
        response.headers["Content-Type"] = "text/event-stream"
        response.headers["Cache-Control"] = "no-cache"
        response.headers["X-Accel-Buffering"] = "no"

        conversation = @current_user.conversations.find(params[:conversation_id])
        Message.create!(conversation: conversation, role: "user", content: params[:message])

        recent_messages = conversation.messages.order(created_at: :asc).last(40)
        context_messages = recent_messages.map { |message| { role: message.role, content: message.content } }

        Ai::ChatStreamService.new(
          messages: context_messages,
          stream: response.stream,
          conversation: conversation
        ).call
      rescue ActiveRecord::RecordNotFound => error
        response.stream.write("data: #{JSON.generate({ type: "error", message: error.message })}\n\n")
      rescue StandardError
        response.stream.write("data: #{JSON.generate({ type: "error", message: "Internal error" })}\n\n")
      ensure
        response.stream.close
      end

      private

      def validate_message_length!
        return unless params[:message].to_s.length > MAX_USER_INPUT_CHARS

        render json: { error: "Message too long", code: "message_too_long" }, status: 422
      end
    end
  end
end
