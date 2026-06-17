require "rails_helper"

RSpec.describe Membership, type: :model do
  describe "#active?" do
    it "만료 전이고 active 상태면 true를 반환한다" do
      membership = build(:membership, status: "active", expires_at: 1.day.from_now)

      expect(membership.active?).to be(true)
    end

    it "만료 전이고 trial 상태면 true를 반환한다" do
      membership = build(:membership, :trial, expires_at: 1.day.from_now)

      expect(membership.active?).to be(true)
    end

    it "만료 시간이 과거면 false를 반환한다" do
      membership = build(:membership, status: "active", expires_at: 1.day.ago)

      expect(membership.active?).to be(false)
    end

    it "expired 상태면 false를 반환한다" do
      membership = build(:membership, status: "expired", expires_at: 1.day.from_now)

      expect(membership.active?).to be(false)
    end
  end

  describe "#expired?" do
    it "active?가 false일 때 true를 반환한다" do
      membership = build(:membership, :expired)

      expect(membership.expired?).to be(true)
    end
  end

  describe ".current" do
    it "trial과 active만 반환한다" do
      user = create(:user)
      plan = create(:plan)
      active_membership = create(:membership, user: user, plan: plan, status: "active", expires_at: 30.days.from_now)
      trial_membership = create(:membership, :trial, user: user, plan: plan)
      expired_membership = create(:membership, :expired, user: user, plan: plan)

      expect(described_class.current).to include(active_membership, trial_membership)
      expect(described_class.current).not_to include(expired_membership)
    end
  end
end
