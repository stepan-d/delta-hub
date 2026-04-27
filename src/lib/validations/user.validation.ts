import { z } from 'zod'

export const registerSchema = z.object({
  username: z.string().min(3).max(50).regex(/^[a-zA-Z0-9_]+$/),
  email: z.string().email().max(100),
  password: z.string().min(8).max(72),
  schoolYear: z.number().int().min(1).max(4).optional(),
  favoriteSubject: z.string().max(100).optional(),
})

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

export const updateUserSchema = z.object({
  username: z.string().min(3).max(50).regex(/^[a-zA-Z0-9_]+$/).optional(),
  email: z.string().email().max(100).optional(),
  schoolYear: z.number().int().min(1).max(4).nullable().optional(),
  favoriteSubject: z.string().max(100).nullable().optional(),
}).refine((data) => Object.keys(data).length > 0, { message: 'At least one field is required' })

export type RegisterInput = z.infer<typeof registerSchema>
export type LoginInput = z.infer<typeof loginSchema>
export type UpdateUserInput = z.infer<typeof updateUserSchema>
