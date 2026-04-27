import { z } from 'zod'

export const createMemeSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  imageUrl: z.string().url().max(500),
  categoryId: z.number().int().positive().optional(),
  tags: z.record(z.string(), z.unknown()).optional(),
})

export const updateMemeSchema = createMemeSchema.partial()

export const memeListQuerySchema = z.object({
  categoryId: z.coerce.number().int().positive().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
})

export type CreateMemeInput = z.infer<typeof createMemeSchema>
export type UpdateMemeInput = z.infer<typeof updateMemeSchema>
export type MemeListQuery = z.infer<typeof memeListQuerySchema>
