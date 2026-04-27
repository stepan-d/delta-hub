import { badRequest, ok, serverError } from '@/lib/api-response'
import { requireAdmin } from '@/lib/services/auth.service'
import { getAuditLogs } from '@/lib/services/audit.service'
import { z } from 'zod'

const auditLogQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  userId: z.coerce.number().int().positive().optional(),
  action: z.string().min(1).optional(),
})

export async function GET(req: Request): Promise<Response> {
  try {
    const result = await requireAdmin()
    if (result instanceof Response) return result

    const { searchParams } = new URL(req.url)
    const raw = Object.fromEntries(searchParams)
    const parsed = auditLogQuerySchema.safeParse(raw)
    if (!parsed.success) return badRequest(parsed.error.issues[0].message)

    const data = await getAuditLogs(parsed.data)
    return ok(data)
  } catch {
    return serverError()
  }
}
