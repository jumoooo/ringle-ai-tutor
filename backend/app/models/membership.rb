class Membership < ApplicationRecord
  belongs_to :user
  belongs_to :plan

  STATUSES = %w[trial active expired].freeze

  validates :status, inclusion: { in: STATUSES }
  validates :starts_at, presence: true
  validates :expires_at, presence: true

  scope :current, -> { where(status: %w[trial active]).order(created_at: :desc) }

  def active?
    status.in?(%w[trial active]) && expires_at > Time.current
  end

  def expired?
    !active?
  end

  def sessions_remaining?
    total_sessions = self[:total_sessions]
    used_sessions = self[:used_sessions]

    total_sessions.nil? || used_sessions.to_i < total_sessions
  end
end
