module Api
  module V1
    class PlansController < ApplicationController
      def index
        render json: { data: Plan.order(:monthly_price, :id).map { |plan| serialize_plan(plan) } }
      end

      private

      def serialize_plan(plan)
        {
          id: plan.id,
          name: plan.name,
          monthly_price: plan.monthly_price,
          can_learn: plan.can_learn,
          can_talk: plan.can_talk,
          can_analyze: plan.can_analyze,
          duration_days: plan.duration_days
        }
      end
    end
  end
end
