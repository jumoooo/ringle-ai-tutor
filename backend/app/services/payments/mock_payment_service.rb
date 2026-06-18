module Payments
  class MockPaymentService
    def self.charge(user:, plan:, card_number:, expiry:, cvc:)
      { success: true, transaction_id: SecureRandom.uuid }
    end

    def self.refund(transaction_id:)
      { success: true }
    end
  end
end
