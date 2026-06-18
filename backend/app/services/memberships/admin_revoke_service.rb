module Memberships
  class AdminRevokeService
    def initialize(user:)
      @user = user
    end

    def call
      revoked_count = @user.memberships.current.update_all(status: "expired", expires_at: Time.current)

      PaymentLog.create!(
        user: @user,
        plan: @user.memberships.order(created_at: :desc).first&.plan || Plan.find_by!(name: "무료"),
        action: "revoke",
        result: { revoked_count: revoked_count, revoked_by: "admin" }
      )

      { revoked: true }
    end
  end
end
