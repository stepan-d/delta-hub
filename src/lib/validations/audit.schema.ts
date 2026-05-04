import { z } from 'zod'

export const auditLogQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  userId: z.coerce.number().int().positive().optional(),
  action: z.string().min(1).optional(),
})

export type AuditLogQuery = z.infer<typeof auditLogQuerySchema>
