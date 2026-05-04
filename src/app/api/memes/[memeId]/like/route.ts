export const runtime = 'nodejs'

import { badRequest, notFound, ok, handlePrismaError } from '@/lib/api-response'
import { requireAuth } from '@/lib/services/auth.service'
import { getMemeById } from '@/lib/services/meme.service'
import { toggleLike } from '@/lib/services/like.service'

type Ctx = { params: Promise<{ memeId: string }> }

export async function POST(_req: Request, { params }: Ctx): Promise<Response> {
  try {
    const result = await requireAuth()
    if (result instanceof Response) return result
    const session = result

    const { memeId: raw } = await params
    const memeId = parseInt(raw, 10)
    if (isNaN(memeId) || memeId <= 0) return badRequest('Invalid memeId')

    const meme = await getMemeById(memeId)
    if (!meme) return notFound('Meme')

    const data = await toggleLike(memeId, session.userId)
    return ok(data)
  } catch (e) {
    return handlePrismaError(e)
  }
}
