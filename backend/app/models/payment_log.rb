class PaymentLog < ApplicationRecord
  belongs_to :user
  belongs_to :plan

  validates :action, presence: true
end
