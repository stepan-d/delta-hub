export const runtime = 'nodejs'

import { after } from 'next/server'
import { badRequest, forbidden, noContent, notFound, ok, handlePrismaError, validationError } from '@/lib/api-response'
import { getCurrentUser, isModeratorRole, requireAuth } from '@/lib/services/auth.service'
import { getMemeById, updateMeme, deleteMeme } from '@/lib/services/meme.service'
import { createAuditLog } from '@/lib/services/audit.service'
import { updateMemeSchema } from '@/lib/validations/meme.schema'

type Ctx = { params: Promise<{ memeId: string }> }

function parseMemeId(raw: string): number | null {
  const id = parseInt(raw, 10)
  return isNaN(id) || id <= 0 ? null : id
}

export async function GET(req: Request, { params }: Ctx): Promise<Response> {
  try {
    const { memeId: raw } = await params
    const memeId = parseMemeId(raw)
    if (!memeId) return badRequest('Invalid memeId')

    const currentUser = await getCurrentUser()
    const meme = await getMemeById(memeId, currentUser?.userId)
    if (!meme) return notFound('Meme')

    return ok(meme)
  } catch (e) {
    return handlePrismaError(e)
  }
}

export async function PATCH(req: Request, { params }: Ctx): Promise<Response> {
  try {
    const result = await requireAuth()
    if (result instanceof Response) return result
    const session = result

    const { memeId: raw } = await params
    const memeId = parseMemeId(raw)
    if (!memeId) return badRequest('Invalid memeId')

    const existing = await getMemeById(memeId)
    if (!existing) return notFound('Meme')
    if (existing.author.userId !== session.userId && session.role !== 'Admin') return forbidden()

    const body = await req.json()
    const parsed = updateMemeSchema.safeParse(body)
    if (!parsed.success) return validationError(parsed.error)

    const meme = await updateMeme(memeId, parsed.data, session.userId)
    after(() => createAuditLog({ userId: session.userId, action: 'update_meme', tableName: 'memes', recordId: memeId }))

    return ok(meme)
  } catch (e) {
    return handlePrismaError(e)
  }
}

export async function DELETE(_req: Request, { params }: Ctx): Promise<Response> {
  try {
    const result = await requireAuth()
    if (result instanceof Response) return result
    const session = result

    const { memeId: raw } = await params
    const memeId = parseMemeId(raw)
    if (!memeId) return badRequest('Invalid memeId')

    const existing = await getMemeById(memeId)
    if (!existing) return notFound('Meme')
    if (existing.author.userId !== session.userId && !isModeratorRole(session.role)) return forbidden()

    await deleteMeme(memeId)
    after(() => createAuditLog({ userId: session.userId, action: 'delete_meme', tableName: 'memes', recordId: memeId }))

    return noContent()
  } catch (e) {
    return handlePrismaError(e)
  }
}
