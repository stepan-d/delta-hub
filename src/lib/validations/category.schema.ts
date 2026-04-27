import { z } from 'zod'

export const createCategorySchema = z.object({
  name: z.string().min(1).max(50),
  description: z.string().optional(),
})

export const updateCategorySchema = z.object({
  name: z.string().min(1).max(50).optional(),
  description: z.string().nullable().optional(),
}).refine((d) => Object.keys(d).length > 0, { message: 'At least one field is required' })

export type CreateCategoryInput = z.infer<typeof createCategorySchema>
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>
