class User < ApplicationRecord
  has_many :memberships, dependent: :destroy
  has_many :payment_logs, dependent: :destroy
  has_many :conversations, dependent: :destroy

  validates :name, presence: true
  validates :email, presence: true, uniqueness: true
end
