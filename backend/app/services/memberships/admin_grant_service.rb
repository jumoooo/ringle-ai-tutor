module Memberships
  class AdminGrantService
    def initialize(user:, plan:, duration_days:)
      @user = user
      @plan = plan
      @duration_days = duration_days
    end

    def call
      @user.memberships.current.update_all(status: "expired", expires_at: Time.current)

      membership = @user.memberships.create!(
        plan: @plan,
        status: "active",
        starts_at: Time.current,
        expires_at: Time.current + @duration_days.days
      )

      PaymentLog.create!(
        user: @user,
        plan: @plan,
        action: "grant",
        result: { membership_id: membership.id, granted_by: "admin" }
      )

      membership
    end
  end
end
