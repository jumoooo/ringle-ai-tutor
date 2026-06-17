import { z } from "zod"

export const UserSchema = z.object({
  id: z.number(),
  name: z.string(),
  email: z.email()
})

export const UserArraySchema = z.array(UserSchema)

export type User = z.infer<typeof UserSchema>
