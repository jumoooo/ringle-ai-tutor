class Plan < ApplicationRecord
  has_many :memberships, dependent: :restrict_with_error
  has_many :payment_logs, dependent: :restrict_with_error

  validates :name, presence: true, uniqueness: true
  validates :monthly_price, presence: true, numericality: { greater_than_or_equal_to: 0 }
  validates :duration_days, presence: true, numericality: { greater_than_or_equal_to: 0 }
end
