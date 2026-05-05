import { z } from 'zod'

export const createMemeSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  imageUrl: z.string().min(1).max(500),
  categoryId: z.number().int().positive().optional(),
  tags: z.record(z.string(), z.unknown()).optional(),
})

export const updateMemeSchema = z.object({
  title: z.string().min(1).max(200).nullable().optional(),
  categoryId: z.number().int().positive().nullable().optional(),
  tags: z.record(z.string(), z.unknown()).optional(),
}).refine((d) => Object.keys(d).length > 0, { message: 'At least one field is required' })

export const memeListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  categoryId: z.coerce.number().int().positive().optional(),
  userId: z.coerce.number().int().positive().optional(),
  search: z.string().min(1).max(100).optional(),
  tag: z.string().min(1).max(50).optional(),
  sort: z.enum(['newest', 'oldest', 'mostLiked']).default('newest'),
})

export type CreateMemeInput = z.infer<typeof createMemeSchema>
export type UpdateMemeInput = z.infer<typeof updateMemeSchema>
export type MemeListQuery = z.infer<typeof memeListQuerySchema>
