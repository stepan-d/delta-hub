import { badRequest, created, notFound, ok, serverError } from '@/lib/api-response'
import { getCurrentUser, requireAuth } from '@/lib/services/auth.service'
import { getMemeById } from '@/lib/services/meme.service'
import { getCommentsByMeme, createComment } from '@/lib/services/comment.service'
import { createAuditLog } from '@/lib/services/audit.service'
import { createCommentSchema } from '@/lib/validations/comment.schema'

type Ctx = { params: Promise<{ memeId: string }> }

function parseMemeId(raw: string): number | null {
  const id = parseInt(raw, 10)
  return isNaN(id) ? null : id
}

export async function GET(_req: Request, { params }: Ctx): Promise<Response> {
  try {
    const { memeId: raw } = await params
    const memeId = parseMemeId(raw)
    if (!memeId) return badRequest('Invalid memeId')

    const meme = await getMemeById(memeId)
    if (!meme) return notFound('Meme')

    const comments = await getCommentsByMeme(memeId)
    return ok(comments)
  } catch {
    return serverError()
  }
}

export async function POST(req: Request, { params }: Ctx): Promise<Response> {
  try {
    const result = await requireAuth()
    if (result instanceof Response) return result
    const session = result

    const { memeId: raw } = await params
    const memeId = parseMemeId(raw)
    if (!memeId) return badRequest('Invalid memeId')

    const meme = await getMemeById(memeId)
    if (!meme) return notFound('Meme')

    const body = await req.json()
    const parsed = createCommentSchema.safeParse(body)
    if (!parsed.success) return badRequest(parsed.error.issues[0].message)

    const comment = await createComment(memeId, session.userId, parsed.data)
    createAuditLog({ userId: session.userId, action: 'create_comment', tableName: 'meme_comments', recordId: comment.commentId })

    return created(comment)
  } catch {
    return serverError()
  }
}
