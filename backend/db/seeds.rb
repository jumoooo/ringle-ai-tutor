free_plan = Plan.find_or_create_by!(name: "무료") do |plan|
  plan.monthly_price = 0
  plan.can_learn = false
  plan.can_talk = false
  plan.can_analyze = false
  plan.duration_days = 0
  plan.features = {}
end

Plan.find_or_create_by!(name: "베이직") do |plan|
  plan.monthly_price = 9_900
  plan.can_learn = true
  plan.can_talk = false
  plan.can_analyze = false
  plan.duration_days = 30
  plan.features = {}
end

Plan.find_or_create_by!(name: "프리미엄 플러스") do |plan|
  plan.monthly_price = 39_900
  plan.can_learn = true
  plan.can_talk = true
  plan.can_analyze = true
  plan.duration_days = 60
  plan.features = {}
end

seed_users = [
  { name: "Alice Kim", email: "alice@example.com", role: "admin" },
  { name: "Bob Lee", email: "bob@example.com", role: nil },
  { name: "Carol Park", email: "carol@example.com", role: nil }
]

seed_users.each do |user_attributes|
  user = User.find_or_create_by!(email: user_attributes[:email]) do |record|
    record.name = user_attributes[:name]
  end

  user.update!(role: user_attributes[:role])

  next if user.memberships.current.exists?

  user.memberships.create!(
    plan: free_plan,
    status: "trial",
    starts_at: Time.current,
    expires_at: 100.years.from_now
  )
end

puts "Seeded: #{Plan.count} plans, #{User.count} users"
