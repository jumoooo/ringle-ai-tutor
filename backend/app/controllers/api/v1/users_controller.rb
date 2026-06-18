module Api
  module V1
    class UsersController < ApplicationController
      before_action :require_user!, only: :me

      def index
        render json: { data: User.order(:id).map { |user| serialize_user(user) } }
      end

      def show
        user = User.find(params[:id])
        render json: { data: serialize_user(user) }
      end

      def me
        render json: {
          data: {
            id: @current_user.id,
            name: @current_user.name,
            email: @current_user.email,
            role: @current_user.role
          }
        }
      end

      private

      def serialize_user(user)
        {
          id: user.id,
          name: user.name,
          email: user.email
        }
      end
    end
  end
end
