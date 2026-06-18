require "rails_helper"

RSpec.describe User, type: :model do
  describe "#admin?" do
    it "role이 admin이면 true를 반환한다" do
      user = build(:user, :admin)

      expect(user.admin?).to be(true)
    end

    it "role이 nil이면 false를 반환한다" do
      user = build(:user, role: nil)

      expect(user.admin?).to be(false)
    end
  end

  describe "role validation" do
    it "admin role을 허용한다" do
      user = build(:user, role: "admin")

      expect(user).to be_valid
    end

    it "nil role을 허용한다" do
      user = build(:user, role: nil)

      expect(user).to be_valid
    end

    it "허용되지 않은 role은 거부한다" do
      user = build(:user, role: "teacher")

      expect(user).not_to be_valid
      expect(user.errors[:role]).to include("is not included in the list")
    end
  end
end
