module Api
  module V1
    module Admin
      class MembershipsController < ApplicationController
        before_action :require_admin!
        before_action :set_target_user

        def create
          plan = Plan.find(params[:plan_id])
          duration_days = params[:duration_days]&.to_i || plan.duration_days
          membership = Memberships::AdminGrantService.new(
            user: @target_user,
            plan: plan,
            duration_days: duration_days
          ).call

          render json: { data: { membership: serialize_membership(membership) } }, status: :created
        end

        def revoke
          result = Memberships::AdminRevokeService.new(user: @target_user).call
          render json: { data: result }
        end

        private

        def set_target_user
          @target_user = User.find(params[:user_id])
        end

        def serialize_membership(membership)
          {
            id: membership.id,
            status: membership.status,
            expires_at: membership.expires_at.iso8601,
            plan: {
              id: membership.plan.id,
              name: membership.plan.name,
              monthly_price: membership.plan.monthly_price,
              can_learn: membership.plan.can_learn,
              can_talk: membership.plan.can_talk,
              can_analyze: membership.plan.can_analyze,
              duration_days: membership.plan.duration_days
            }
          }
        end
      end
    end
  end
end
