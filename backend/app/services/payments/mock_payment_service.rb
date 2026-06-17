module Payments
  class MockPaymentService
    def self.charge(user:, plan:, card_token: "mock_token")
      { success: true, transaction_id: SecureRandom.uuid }
    end

    def self.refund(transaction_id:)
      { success: true }
    end
  end
end
