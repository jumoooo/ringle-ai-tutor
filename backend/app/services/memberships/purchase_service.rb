module Memberships
  class PurchaseService
    def initialize(user:, plan:, card_number:, expiry:, cvc:)
      @user = user
      @plan = plan
      @card_number = card_number
      @expiry = expiry
      @cvc = cvc
    end

    def call
      payment = PaymentGateway.charge(
        user: @user,
        plan: @plan,
        card_number: @card_number,
        expiry: @expiry,
        cvc: @cvc
      )
      raise ActiveRecord::RecordInvalid.new(payment_log_record), "Payment failed" unless payment[:success]

      membership = upsert_membership
      log_payment(payment[:transaction_id], membership, "purchase")

      { membership: membership, transaction_id: payment[:transaction_id] }
    end

    private

    def upsert_membership
      current_membership = @user.memberships.current.first

      if current_membership&.active? && current_membership.plan_id == @plan.id
        current_membership.update!(expires_at: current_membership.expires_at + @plan.duration_days.days)
        current_membership
      elsif current_membership&.active?
        current_membership.update!(status: "expired", expires_at: Time.current)
        create_active_membership
      else
        create_active_membership
      end
    end

    def create_active_membership
      @user.memberships.create!(
        plan: @plan,
        status: "active",
        starts_at: Time.current,
        expires_at: Time.current + @plan.duration_days.days
      )
    end

    def log_payment(transaction_id, membership, action)
      PaymentLog.create!(
        user: @user,
        plan: @plan,
        action: action,
        transaction_id: transaction_id,
        result: { membership_id: membership.id, status: membership.status }
      )
    end

    def payment_log_record
      PaymentLog.new(user: @user, plan: @plan, action: "purchase")
    end
  end
end
