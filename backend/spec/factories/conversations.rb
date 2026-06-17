FactoryBot.define do
  factory :conversation do
    user
    status { "active" }
  end
end
