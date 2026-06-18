FactoryBot.define do
  factory :user do
    name { Faker::Name.unique.name }
    email { Faker::Internet.unique.email }

    trait :admin do
      role { "admin" }
    end
  end
end
