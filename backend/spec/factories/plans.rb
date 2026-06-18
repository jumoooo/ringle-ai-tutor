FactoryBot.define do
  factory :plan do
    sequence(:name) { |index| "plan_#{index}" }
    monthly_price { 39_900 }
    can_learn { true }
    can_talk { true }
    can_analyze { true }
    duration_days { 60 }
    features { {} }

    initialize_with { Plan.find_or_initialize_by(name: name) }

    trait :free do
      name { "무료" }
      monthly_price { 0 }
      can_learn { false }
      can_talk { false }
      can_analyze { false }
      duration_days { 0 }
    end

    trait :basic do
      name { "베이직" }
      monthly_price { 9_900 }
      can_learn { true }
      can_talk { false }
      can_analyze { false }
      duration_days { 30 }
    end

    trait :premium do
      name { "프리미엄 플러스" }
      monthly_price { 39_900 }
      can_learn { true }
      can_talk { true }
      can_analyze { true }
      duration_days { 60 }
    end
  end
end
