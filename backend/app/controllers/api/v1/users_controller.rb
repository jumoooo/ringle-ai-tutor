module Api
  module V1
    class UsersController < ApplicationController
      def index
        render json: { data: User.order(:id).map { |user| serialize_user(user) } }
      end

      def show
        user = User.find(params[:id])
        render json: { data: serialize_user(user) }
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
