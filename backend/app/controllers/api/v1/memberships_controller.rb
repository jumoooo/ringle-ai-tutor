module Api
  module V1
    class MembershipsController < ApplicationController
      before_action :require_user!

      def current
        membership = @current_user.memberships.current.first
        return render json: { data: nil }, status: :ok unless membership&.active?

        render json: { data: serialize_membership(membership) }
      end

      def purchase
        plan = Plan.find(params[:plan_id])
        result = Memberships::PurchaseService.new(
          user: @current_user,
          plan: plan,
          card_number: params[:card_number].to_s,
          expiry: params[:expiry].to_s,
          cvc: params[:cvc].to_s
        ).call

        render json: {
          data: {
            membership: serialize_membership(result[:membership]),
            transaction_id: result[:transaction_id]
          }
        }
      end

      def upgrade
        plan = Plan.find(params[:plan_id])
        result = Memberships::UpgradeService.new(
          user: @current_user,
          new_plan: plan,
          card_number: params[:card_number].to_s,
          expiry: params[:expiry].to_s,
          cvc: params[:cvc].to_s
        ).call

        render json: {
          data: {
            membership: serialize_membership(result[:membership]),
            transaction_id: result[:transaction_id]
          }
        }
      end

      private

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
