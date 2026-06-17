FactoryBot.define do
  factory :message do
    conversation
    role { "user" }
    content { "Hello, I would like to practice my pronunciation." }

    trait :assistant do
      role { "assistant" }
      content { "Hi! I'm your AI English tutor. What would you like to practice today?" }
    end
  end
end
