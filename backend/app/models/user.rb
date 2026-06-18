class User < ApplicationRecord
  ALLOWED_ROLES = %w[admin].freeze

  has_many :memberships, dependent: :destroy
  has_many :payment_logs, dependent: :destroy
  has_many :conversations, dependent: :destroy

  validates :name, presence: true
  validates :email, presence: true, uniqueness: true
  validates :role, inclusion: { in: ALLOWED_ROLES }, allow_nil: true

  def admin?
    role == "admin"
  end
end
