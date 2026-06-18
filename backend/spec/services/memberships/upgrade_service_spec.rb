require "rails_helper"

RSpec.describe Memberships::UpgradeService, type: :service do
  let(:user) { create(:user) }
  let(:current_plan) { create(:plan, :basic) }
  let(:premium_plan) { create(:plan, :premium) }
  let(:transaction_id) { "txn_upgrade_spec" }
  let(:card_params) { { card_number: "1234567890123456", expiry: "12/27", cvc: "123" } }

  around do |example|
    travel_to(Time.zone.parse("2026-06-18 20:00:00")) do
      example.run
    end
  end

  before do
    allow(PaymentGateway).to receive(:charge).and_return(
      { success: true, transaction_id: transaction_id }
    )
  end

  describe "#call" do
    it "expires_at이 미래면 남은 기간을 보존하며 업그레이드한다" do
      current_membership = create(
        :membership,
        user: user,
        plan: current_plan,
        status: "active",
        expires_at: 20.days.from_now
      )

      service = described_class.new(user: user, new_plan: premium_plan, **card_params)

      expect { @result = service.call }
        .to change(PaymentLog, :count).by(1)
        .and change(Membership, :count).by(0)

      current_membership.reload
      payment_log = PaymentLog.order(:created_at).last

      aggregate_failures do
        expect(current_membership.plan).to eq(premium_plan)
        expect(current_membership.expires_at).to eq(80.days.from_now)
        expect(@result[:membership]).to eq(current_membership)
        expect(@result[:transaction_id]).to eq(transaction_id)
        expect(payment_log.action).to eq("upgrade")
        expect(payment_log.plan).to eq(premium_plan)
      end
    end

    it "만료된 멤버십이면 업그레이드를 거부한다" do
      create(
        :membership,
        user: user,
        plan: current_plan,
        status: "active",
        expires_at: 1.day.ago
      )

      service = described_class.new(user: user, new_plan: premium_plan, **card_params)

      expect { service.call }.to raise_error(ActiveRecord::RecordInvalid)
    end

    it "다운그레이드 시도면 예외를 발생시킨다" do
      create(
        :membership,
        user: user,
        plan: premium_plan,
        status: "active",
        expires_at: 20.days.from_now
      )
      service = described_class.new(user: user, new_plan: current_plan, **card_params)

      expect { service.call }.to raise_error(ActiveRecord::RecordInvalid)
    end

    it "활성 멤버십이 없으면 예외를 발생시킨다" do
      service = described_class.new(user: user, new_plan: premium_plan, **card_params)

      expect { service.call }.to raise_error(ActiveRecord::RecordInvalid)
    end

    it "동일 가격의 다른 플랜은 현재 구현에서 허용한다" do
      same_price_plan = create(
        :plan,
        name: "basic_same_price",
        monthly_price: current_plan.monthly_price,
        can_learn: true,
        can_talk: true,
        can_analyze: true,
        duration_days: 45
      )
      current_membership = create(
        :membership,
        user: user,
        plan: current_plan,
        status: "active",
        expires_at: 10.days.from_now
      )

      service = described_class.new(user: user, new_plan: same_price_plan, **card_params)

      expect { service.call }.not_to raise_error

      current_membership.reload
      expect(current_membership.plan).to eq(same_price_plan)
    end
  end
end
