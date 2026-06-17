FactoryBot.define do
  factory :membership do
    user
    plan
    status { "active" }
    starts_at { Time.current }
    expires_at { 30.days.from_now }

    trait :trial do
      status { "trial" }
      expires_at { 100.years.from_now }
    end

    trait :expired do
      status { "expired" }
      expires_at { 1.day.ago }
    end
  end
end
