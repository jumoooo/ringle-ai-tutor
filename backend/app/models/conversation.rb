class Conversation < ApplicationRecord
  belongs_to :user
  has_many :messages, dependent: :destroy

  validates :status, inclusion: { in: %w[active ended] }
end
