export const runtime = 'nodejs'

import { ok, handlePrismaError } from '@/lib/api-response'
import { requireAdmin } from '@/lib/services/auth.service'
import { getAdminComments } from '@/lib/services/comment.service'

export async function GET(): Promise<Response> {
  try {
    const result = await requireAdmin()
    if (result instanceof Response) return result

    const comments = await getAdminComments()
    return ok(comments)
  } catch (error) {
    return handlePrismaError(error)
  }
}
