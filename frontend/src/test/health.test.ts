import { describe, expect, it } from "vitest"
import { BASE_URL } from "@/config/api"

describe("API 설정", () => {
  it("BASE_URL이 올바른 형식이어야 한다", () => {
    expect(BASE_URL).toMatch(/^https?:\/\//)
  })
})
