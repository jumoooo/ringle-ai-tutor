import { z } from "zod"
import { apiClient } from "@/api/client"
import { API_ENDPOINTS } from "@/config/api"
import { MembershipSchema, PlanSchema } from "@/types/membership"

export async function fetchCurrentMembership() {
  const response = await apiClient.get(API_ENDPOINTS.membershipCurrent)
  const membershipPayload = response.data.data

  if (membershipPayload === null) {
    return null
  }

  return MembershipSchema.parse(membershipPayload)
}

export async function fetchPlans() {
  const response = await apiClient.get(API_ENDPOINTS.plans)
  return z.array(PlanSchema).parse(response.data.data)
}

export async function purchasePlan(planId: number) {
  const response = await apiClient.post(API_ENDPOINTS.membershipPurchase, {
    plan_id: planId,
    card_token: "mock_token"
  })

  return MembershipSchema.parse(response.data.data.membership)
}

export async function upgradePlan(planId: number) {
  const response = await apiClient.post(API_ENDPOINTS.membershipUpgrade, {
    plan_id: planId,
    card_token: "mock_token"
  })

  return MembershipSchema.parse(response.data.data.membership)
}
