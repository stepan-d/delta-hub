export const runtime = 'nodejs'

import { after } from 'next/server'
import { badRequest, created, ok, handlePrismaError, validationError } from '@/lib/api-response'
import { getCurrentUser, requireAuth } from '@/lib/services/auth.service'
import { getMemes, createMeme } from '@/lib/services/meme.service'
import { createAuditLog } from '@/lib/services/audit.service'
import { memeListQuerySchema, createMemeSchema } from '@/lib/validations/meme.schema'

export async function GET(req: Request): Promise<Response> {
  try {
    const { searchParams } = new URL(req.url)
    const raw = Object.fromEntries(searchParams)
    const parsed = memeListQuerySchema.safeParse(raw)
    if (!parsed.success) return validationError(parsed.error)

    const currentUser = await getCurrentUser()
    const memes = await getMemes(parsed.data, currentUser?.userId)
    return ok(memes)
  } catch (e) {
    return handlePrismaError(e)
  }
}

export async function POST(req: Request): Promise<Response> {
  try {
    const result = await requireAuth()
    if (result instanceof Response) return result
    const session = result

    const body = await req.json()
    const parsed = createMemeSchema.safeParse(body)
    if (!parsed.success) return validationError(parsed.error)

    const meme = await createMeme(parsed.data, session.userId)
    after(() => createAuditLog({ userId: session.userId, action: 'create_meme', tableName: 'memes', recordId: meme.memeId }))

    return created(meme)
  } catch (e) {
    return handlePrismaError(e)
  }
}
