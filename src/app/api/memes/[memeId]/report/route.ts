import { badRequest, created, notFound, serverError } from '@/lib/api-response'
import { requireAuth } from '@/lib/services/auth.service'
import { getMemeById } from '@/lib/services/meme.service'
import { createReport } from '@/lib/services/report.service'
import { createAuditLog } from '@/lib/services/audit.service'
import { createReportSchema } from '@/lib/validations/report.schema'

type Ctx = { params: Promise<{ memeId: string }> }

export async function POST(req: Request, { params }: Ctx): Promise<Response> {
  try {
    const result = await requireAuth()
    if (result instanceof Response) return result
    const session = result

    const { memeId: raw } = await params
    const memeId = parseInt(raw, 10)
    if (isNaN(memeId)) return badRequest('Invalid memeId')

    const meme = await getMemeById(memeId)
    if (!meme) return notFound('Meme')

    const body = await req.json()
    const parsed = createReportSchema.safeParse(body)
    if (!parsed.success) return badRequest(parsed.error.issues[0].message)

    const report = await createReport(memeId, session.userId, parsed.data.reason)
    createAuditLog({ userId: session.userId, action: 'report_meme', tableName: 'user_reports', recordId: report.reportId })

    return created(report)
  } catch {
    return serverError()
  }
}
