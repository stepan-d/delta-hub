import { ok, serverError } from '@/lib/api-response'
import { requireAdmin } from '@/lib/services/auth.service'
import { getAllReports } from '@/lib/services/report.service'

export async function GET(req: Request): Promise<Response> {
  try {
    const result = await requireAdmin()
    if (result instanceof Response) return result

    const reports = await getAllReports()
    return ok(reports)
  } catch {
    return serverError()
  }
}
