export const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === "true"

export const DEMO_AI_DISABLED_MESSAGE =
  "이 데모에서는 AI 음성 대화 기능을 제공하지 않아요."

export const DEMO_TUTOR_FIRST_MESSAGE =
  "Hi! What would you like to talk about today?"

interface DemoUser {
  id: number
  name: string
  email: string
  role: "admin" | "user"
}

const demoUsers: DemoUser[] = [
  { id: 1, name: "Alice Kim", email: "alice@example.com", role: "admin" },
  { id: 2, name: "Bob Lee", email: "bob@example.com", role: "user" }
]

const demoPlans = [
  {
    id: 1,
    name: "Basic",
    monthly_price: 9900,
    can_learn: true,
    can_talk: false,
    can_analyze: false,
    duration_days: 30
  },
  {
    id: 2,
    name: "Standard",
    monthly_price: 19900,
    can_learn: true,
    can_talk: true,
    can_analyze: false,
    duration_days: 30
  },
  {
    id: 3,
    name: "Premium Plus",
    monthly_price: 29900,
    can_learn: true,
    can_talk: true,
    can_analyze: true,
    duration_days: 30
  }
] as const

type DemoPlan = (typeof demoPlans)[number]

interface DemoMembership {
  id: number
  status: "trial" | "active" | "expired"
  expires_at: string
  plan: DemoPlan
}

const demoMembershipStore = new Map<number, DemoMembership | null>([
  [
    1,
    {
      id: 1001,
      status: "active",
      expires_at: new Date(
        Date.now() + 30 * 24 * 60 * 60 * 1000
      ).toISOString(),
      plan: demoPlans[2]
    }
  ],
  [2, null]
])

let nextMembershipId = 2000

export function getDemoUsers() {
  return demoUsers
}

export function getDemoUserById(userId: number) {
  return demoUsers.find((user) => user.id === userId) ?? null
}

export function getSelectedDemoUserId() {
  const stored = window.localStorage.getItem("selectedUserId")
  return stored ? Number.parseInt(stored, 10) : null
}

export function getDemoPlans(): DemoPlan[] {
  return [...demoPlans]
}

export function getDemoMembership(userId: number): DemoMembership | null {
  return demoMembershipStore.get(userId) ?? null
}

function buildMembership(planId: number, durationDays: number): DemoMembership {
  const plan = demoPlans.find((candidate) => candidate.id === planId)
  if (!plan) {
    throw new Error("Unknown demo plan")
  }

  nextMembershipId += 1

  return {
    id: nextMembershipId,
    status: "active",
    expires_at: new Date(
      Date.now() + durationDays * 24 * 60 * 60 * 1000
    ).toISOString(),
    plan
  }
}

export function purchaseDemoPlan(userId: number, planId: number) {
  const plan = demoPlans.find((candidate) => candidate.id === planId)
  const membership = buildMembership(planId, plan?.duration_days ?? 30)
  demoMembershipStore.set(userId, membership)
  return membership
}

export function grantDemoMembership(
  userId: number,
  planId: number,
  durationDays: number
) {
  const membership = buildMembership(planId, durationDays)
  demoMembershipStore.set(userId, membership)
  return membership
}

export function revokeDemoMembership(userId: number) {
  demoMembershipStore.set(userId, null)
}

export function listDemoAdminUsers() {
  return demoUsers.map((user) => {
    const membership = demoMembershipStore.get(user.id) ?? null

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      membership: membership
        ? {
            status: membership.status,
            plan_name: membership.plan.name,
            expires_at: membership.expires_at
          }
        : null
    }
  })
}
