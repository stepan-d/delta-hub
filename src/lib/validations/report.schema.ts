import { z } from 'zod'

export const createReportSchema = z.object({
  reason: z.string().min(1).max(1000),
})

export const updateReportStatusSchema = z.object({
  status: z.enum(['pending', 'reviewed', 'rejected', 'resolved']),
})

export type CreateReportInput = z.infer<typeof createReportSchema>
export type UpdateReportStatusInput = z.infer<typeof updateReportStatusSchema>
