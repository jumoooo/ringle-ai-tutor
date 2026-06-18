import { z } from "zod"

export const PlanSchema = z.object({
  id: z.number(),
  name: z.string(),
  monthly_price: z.number(),
  can_learn: z.boolean(),
  can_talk: z.boolean(),
  can_analyze: z.boolean(),
  duration_days: z.number()
})

export const MembershipStatusSchema = z.union([
  z.literal("trial"),
  z.literal("active"),
  z.literal("expired")
])

export const MembershipSchema = z.object({
  id: z.number(),
  status: MembershipStatusSchema,
  expires_at: z.string(),
  plan: PlanSchema
})

export type Plan = z.infer<typeof PlanSchema>
export type Membership = z.infer<typeof MembershipSchema>
