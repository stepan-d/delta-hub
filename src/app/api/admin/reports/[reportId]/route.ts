export const runtime = 'nodejs'

import { after } from 'next/server'
import { badRequest, notFound, ok, handlePrismaError, validationError } from '@/lib/api-response'
import { requireModerator } from '@/lib/services/auth.service'
import { getReportById, updateReportStatus } from '@/lib/services/report.service'
import { createAuditLog } from '@/lib/services/audit.service'
import { updateReportStatusSchema } from '@/lib/validations/report.schema'

type Ctx = { params: Promise<{ reportId: string }> }

export async function PATCH(req: Request, { params }: Ctx): Promise<Response> {
  try {
    const result = await requireModerator()
    if (result instanceof Response) return result
    const session = result

    const { reportId: raw } = await params
    const reportId = parseInt(raw, 10)
    if (isNaN(reportId) || reportId <= 0) return badRequest('Invalid reportId')

    const existing = await getReportById(reportId)
    if (!existing) return notFound('Report')

    const body = await req.json()
    const parsed = updateReportStatusSchema.safeParse(body)
    if (!parsed.success) return validationError(parsed.error)

    const report = await updateReportStatus(reportId, parsed.data.status)
    after(() => createAuditLog({ userId: session.userId, action: 'admin_update_report', tableName: 'user_reports', recordId: reportId }))

    return ok(report)
  } catch (e) {
    return handlePrismaError(e)
  }
}
