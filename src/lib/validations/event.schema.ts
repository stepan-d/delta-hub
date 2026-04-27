import { z } from 'zod'

export const createEventSchema = z.object({
  name: z.string().min(1).max(150),
  date: z.string().date().nullable().optional(),
  detailsJson: z.record(z.string(), z.unknown()).nullable().optional(),
})

export const updateEventSchema = z.object({
  name: z.string().min(1).max(150).optional(),
  date: z.string().date().nullable().optional(),
  detailsJson: z.record(z.string(), z.unknown()).nullable().optional(),
}).refine((d) => Object.keys(d).length > 0, { message: 'At least one field is required' })

export const eventListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
})

export type CreateEventInput = z.infer<typeof createEventSchema>
export type UpdateEventInput = z.infer<typeof updateEventSchema>
export type EventListQuery = z.infer<typeof eventListQuerySchema>
