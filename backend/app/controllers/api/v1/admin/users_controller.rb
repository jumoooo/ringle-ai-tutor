module Api
  module V1
    module Admin
      class UsersController < ApplicationController
        before_action :require_admin!

        def index
          users = User.includes(memberships: :plan).order(:id)
          render json: { data: users.map { |user| serialize_admin_user(user) } }
        end

        private

        def serialize_admin_user(user)
          membership = user.memberships.current.first

          {
            id: user.id,
            name: user.name,
            email: user.email,
            membership: membership ? {
              status: membership.status,
              plan_name: membership.plan.name,
              expires_at: membership.expires_at.iso8601
            } : nil
          }
        end
      end
    end
  end
end
