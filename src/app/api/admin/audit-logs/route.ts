export const runtime = 'nodejs'

import { badRequest, ok, handlePrismaError, validationError } from '@/lib/api-response'
import { requireAdmin } from '@/lib/services/auth.service'
import { getAuditLogs } from '@/lib/services/audit.service'
import { auditLogQuerySchema } from '@/lib/validations/audit.schema'

export async function GET(req: Request): Promise<Response> {
  try {
    const result = await requireAdmin()
    if (result instanceof Response) return result

    const { searchParams } = new URL(req.url)
    const raw = Object.fromEntries(searchParams)
    const parsed = auditLogQuerySchema.safeParse(raw)
    if (!parsed.success) return validationError(parsed.error)

    const data = await getAuditLogs(parsed.data)
    return ok(data)
  } catch (e) {
    return handlePrismaError(e)
  }
}
