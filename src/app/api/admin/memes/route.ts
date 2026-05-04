export const runtime = 'nodejs'

import { ok, handlePrismaError } from '@/lib/api-response'
import { requireAdmin } from '@/lib/services/auth.service'
import { getAdminMemes } from '@/lib/services/meme.service'

export async function GET(): Promise<Response> {
  try {
    const result = await requireAdmin()
    if (result instanceof Response) return result

    const memes = await getAdminMemes()
    return ok(memes)
  } catch (error) {
    return handlePrismaError(error)
  }
}
