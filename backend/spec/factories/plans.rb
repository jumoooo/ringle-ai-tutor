FactoryBot.define do
  factory :plan do
    sequence(:name) { |index| "plan_#{index}" }
    monthly_price { 19_900 }
    can_learn { true }
    can_talk { true }
    can_analyze { false }
    duration_days { 30 }
    features { {} }

    initialize_with { Plan.find_or_initialize_by(name: name) }

    trait :free do
      name { "free" }
      monthly_price { 0 }
      can_learn { false }
      can_talk { false }
      can_analyze { false }
      duration_days { 0 }
    end

    trait :basic do
      name { "basic" }
      monthly_price { 9_900 }
      can_learn { true }
      can_talk { false }
      can_analyze { false }
      duration_days { 30 }
    end

    trait :standard do
      name { "standard" }
      monthly_price { 19_900 }
      can_learn { true }
      can_talk { true }
      can_analyze { false }
      duration_days { 30 }
    end

    trait :premium do
      name { "premium" }
      monthly_price { 39_900 }
      can_learn { true }
      can_talk { true }
      can_analyze { true }
      duration_days { 30 }
    end
  end
end
