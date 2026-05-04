export const runtime = 'nodejs'

import { ok, handlePrismaError } from '@/lib/api-response'
import { requireModerator } from '@/lib/services/auth.service'
import { getAllReports } from '@/lib/services/report.service'

export async function GET(req: Request): Promise<Response> {
  try {
    const result = await requireModerator()
    if (result instanceof Response) return result

    const reports = await getAllReports()
    return ok(reports)
  } catch (e) {
    return handlePrismaError(e)
  }
}
