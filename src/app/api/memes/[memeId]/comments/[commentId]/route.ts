export const runtime = 'nodejs'

import { after } from 'next/server'
import { badRequest, forbidden, noContent, notFound, ok, handlePrismaError, validationError } from '@/lib/api-response'
import { requireAuth } from '@/lib/services/auth.service'
import { getMemeById } from '@/lib/services/meme.service'
import { getCommentById, updateComment, deleteComment } from '@/lib/services/comment.service'
import { createAuditLog } from '@/lib/services/audit.service'
import { updateCommentSchema } from '@/lib/validations/comment.schema'

type Ctx = { params: Promise<{ memeId: string; commentId: string }> }

function parseId(raw: string): number | null {
  const id = parseInt(raw, 10)
  return isNaN(id) || id <= 0 ? null : id
}

export async function PATCH(req: Request, { params }: Ctx): Promise<Response> {
  try {
    const result = await requireAuth()
    if (result instanceof Response) return result
    const session = result

    const { memeId: rawMeme, commentId: rawComment } = await params
    const memeId = parseId(rawMeme)
    const commentId = parseId(rawComment)
    if (!memeId) return badRequest('Invalid memeId')
    if (!commentId) return badRequest('Invalid commentId')

    const meme = await getMemeById(memeId)
    if (!meme) return notFound('Meme')

    const comment = await getCommentById(commentId)
    if (!comment) return notFound('Comment')
    if (comment.author.userId !== session.userId && session.role !== 'Admin') return forbidden()

    const body = await req.json()
    const parsed = updateCommentSchema.safeParse(body)
    if (!parsed.success) return validationError(parsed.error)

    const updated = await updateComment(commentId, parsed.data)
    return ok(updated)
  } catch (e) {
    return handlePrismaError(e)
  }
}

export async function DELETE(_req: Request, { params }: Ctx): Promise<Response> {
  try {
    const result = await requireAuth()
    if (result instanceof Response) return result
    const session = result

    const { memeId: rawMeme, commentId: rawComment } = await params
    const memeId = parseId(rawMeme)
    const commentId = parseId(rawComment)
    if (!memeId) return badRequest('Invalid memeId')
    if (!commentId) return badRequest('Invalid commentId')

    const meme = await getMemeById(memeId)
    if (!meme) return notFound('Meme')

    const comment = await getCommentById(commentId)
    if (!comment) return notFound('Comment')
    if (comment.author.userId !== session.userId && session.role !== 'Admin') return forbidden()

    await deleteComment(commentId)
    after(() => createAuditLog({ userId: session.userId, action: 'delete_comment', tableName: 'meme_comments', recordId: commentId }))

    return noContent()
  } catch (e) {
    return handlePrismaError(e)
  }
}
