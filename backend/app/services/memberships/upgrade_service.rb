module Memberships
  class UpgradeService
    def initialize(user:, new_plan:, card_token: "mock_token")
      @user = user
      @new_plan = new_plan
      @card_token = card_token
    end

    def call
      current_membership = @user.memberships.current.first
      raise ActiveRecord::RecordInvalid.new(membership_record), "No active membership to upgrade" unless current_membership&.active?
      raise ActiveRecord::RecordInvalid.new(membership_record), "Cannot downgrade via this endpoint" if @new_plan.monthly_price < current_membership.plan.monthly_price

      payment = Payments::MockPaymentService.charge(user: @user, plan: @new_plan, card_token: @card_token)
      raise ActiveRecord::RecordInvalid.new(payment_log_record), "Payment failed" unless payment[:success]

      base_time = [current_membership.expires_at, Time.current].max
      current_membership.update!(
        plan: @new_plan,
        status: "active",
        expires_at: base_time + @new_plan.duration_days.days
      )

      PaymentLog.create!(
        user: @user,
        plan: @new_plan,
        action: "upgrade",
        transaction_id: payment[:transaction_id],
        result: { membership_id: current_membership.id }
      )

      { membership: current_membership.reload, transaction_id: payment[:transaction_id] }
    end

    private

    def membership_record
      Membership.new(user: @user, plan: @new_plan)
    end

    def payment_log_record
      PaymentLog.new(user: @user, plan: @new_plan, action: "upgrade")
    end
  end
end
