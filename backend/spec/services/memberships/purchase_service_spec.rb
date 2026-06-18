require "rails_helper"

RSpec.describe Memberships::PurchaseService, type: :service do
  let(:user) { create(:user) }
  let(:plan) { create(:plan, :standard) }
  let(:transaction_id) { "txn_purchase_spec" }

  around do |example|
    travel_to(Time.zone.parse("2026-06-18 15:00:00")) do
      example.run
    end
  end

  describe "#call" do
    before do
      allow(Payments::MockPaymentService).to receive(:charge).and_return(
        { success: true, transaction_id: transaction_id }
      )
    end

    it "신규 구매 시 active 멤버십과 결제 로그를 생성한다" do
      service = described_class.new(user: user, plan: plan)

      expect { @result = service.call }
        .to change(Membership, :count).by(1)
        .and change(PaymentLog, :count).by(1)

      membership = @result[:membership]

      aggregate_failures do
        expect(membership.status).to eq("active")
        expect(membership.plan).to eq(plan)
        expect(membership.starts_at).to eq(Time.current)
        expect(membership.expires_at).to eq(Time.current + plan.duration_days.days)
        expect(@result[:transaction_id]).to eq(transaction_id)
      end
    end

    it "기존 active 멤버십이 다른 플랜이면 만료시키고 새 멤버십을 생성한다" do
      previous_plan = create(:plan, :basic)
      previous_membership = create(
        :membership,
        user: user,
        plan: previous_plan,
        status: "active",
        starts_at: 5.days.ago,
        expires_at: 25.days.from_now
      )

      service = described_class.new(user: user, plan: plan)

      expect { @result = service.call }
        .to change(Membership, :count).by(1)
        .and change(PaymentLog, :count).by(1)

      previous_membership.reload
      replacement_membership = @result[:membership]

      aggregate_failures do
        expect(previous_membership.status).to eq("expired")
        expect(previous_membership.expires_at).to eq(Time.current)
        expect(replacement_membership.status).to eq("active")
        expect(replacement_membership.plan).to eq(plan)
        expect(replacement_membership.expires_at).to eq(Time.current + plan.duration_days.days)
      end
    end
  end
end
