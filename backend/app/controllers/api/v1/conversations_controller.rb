module Api
  module V1
    class ConversationsController < ApplicationController
      FIRST_MESSAGE = "Hi! I'm your AI English tutor. What would you like to practice today?"

      before_action :require_user!
      before_action :require_talk_access!, only: :create

      def create
        conversation = @current_user.conversations.create!(status: "active")
        first_message = Message.create!(
          conversation: conversation,
          role: "assistant",
          content: FIRST_MESSAGE
        )

        render json: {
          data: {
            id: conversation.id,
            status: conversation.status,
            first_message: {
              role: first_message.role,
              content: first_message.content
            }
          }
        }, status: :created
      end

      def show
        conversation = @current_user.conversations.find(params[:id])
        messages = conversation.messages.order(created_at: :asc)

        render json: {
          data: {
            id: conversation.id,
            status: conversation.status,
            messages: messages.map do |message|
              {
                id: message.id,
                role: message.role,
                content: message.content,
                created_at: message.created_at.iso8601
              }
            end
          }
        }, status: :ok
      end
    end
  end
end
