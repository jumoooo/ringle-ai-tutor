import { z } from "zod"

export const MessageRoleSchema = z.union([
  z.literal("user"),
  z.literal("assistant")
])

export const MessageSchema = z.object({
  id: z.number(),
  role: MessageRoleSchema,
  content: z.string(),
  created_at: z.string()
})

export const InitialMessageSchema = z.object({
  role: MessageRoleSchema,
  content: z.string()
})

export const ConversationSchema = z.object({
  id: z.number(),
  status: z.string(),
  messages: z.array(MessageSchema).optional()
})

export const ConversationCreateSchema = z.object({
  id: z.number(),
  status: z.string(),
  first_message: InitialMessageSchema
})

export type Message = z.infer<typeof MessageSchema>
export type InitialMessage = z.infer<typeof InitialMessageSchema>
export type Conversation = z.infer<typeof ConversationSchema>
export type ConversationCreate = z.infer<typeof ConversationCreateSchema>
