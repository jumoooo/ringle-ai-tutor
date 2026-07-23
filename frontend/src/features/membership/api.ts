import { z } from "zod"
import { apiClient } from "@/api/client"
import { API_ENDPOINTS } from "@/config/api"
import {
  DEMO_MODE,
  getDemoMembership,
  getDemoPlans,
  getSelectedDemoUserId,
  purchaseDemoPlan
} from "@/demo/store"
import { MembershipSchema, PlanSchema } from "@/types/membership"
import type { CardData } from "@/types/payment"

export async function fetchCurrentMembership() {
  if (DEMO_MODE) {
    const userId = getSelectedDemoUserId()
    return userId !== null ? getDemoMembership(userId) : null
  }

  const response = await apiClient.get(API_ENDPOINTS.membershipCurrent)
  const membershipPayload = response.data.data

  if (membershipPayload === null) {
    return null
  }

  return MembershipSchema.parse(membershipPayload)
}

export async function fetchPlans() {
  if (DEMO_MODE) {
    return getDemoPlans()
  }

  const response = await apiClient.get(API_ENDPOINTS.plans)
  return z.array(PlanSchema).parse(response.data.data)
}

export async function purchasePlan({
  planId,
  cardData
}: {
  planId: number
  cardData: CardData
}) {
  if (DEMO_MODE) {
    const userId = getSelectedDemoUserId()

    if (userId === null) {
      throw new Error("No demo user selected")
    }

    return purchaseDemoPlan(userId, planId)
  }

  const response = await apiClient.post(API_ENDPOINTS.membershipPurchase, {
    plan_id: planId,
    card_number: cardData.card_number,
    expiry: cardData.expiry,
    cvc: cardData.cvc
  })

  return MembershipSchema.parse(response.data.data.membership)
}
