export const runtime = 'nodejs'

import { ok, handlePrismaError } from '@/lib/api-response'
import { getCurrentUserProfile, requireAuth } from '@/lib/services/auth.service'

export async function GET(): Promise<Response> {
  try {
    const result = await requireAuth()
    if (result instanceof Response) return result

    const profile = await getCurrentUserProfile()
    return ok(profile ?? result)
  } catch (e) {
    return handlePrismaError(e)
  }
}
