import { z } from 'zod'

export const createCommentSchema = z.object({
  text: z.string().min(1).max(1000),
})

export type CreateCommentInput = z.infer<typeof createCommentSchema>
