import { badRequest, conflict, forbidden, notFound, noContent, ok, serverError } from '@/lib/api-response'
import { requireAuth, requireAdmin } from '@/lib/services/auth.service'
import { getUserById, updateUser, deleteUser } from '@/lib/services/user.service'
import { updateUserSchema } from '@/lib/validations/user.validation'

type Ctx = { params: Promise<{ userId: string }> }

function parseUserId(raw: string): number | null {
  const id = parseInt(raw, 10)
  return isNaN(id) ? null : id
}

export async function GET(_req: Request, { params }: Ctx): Promise<Response> {
  try {
    const result = await requireAuth()
    if (result instanceof Response) return result
    const session = result

    const { userId: raw } = await params
    const userId = parseUserId(raw)
    if (!userId) return badRequest('Invalid userId')

    if (session.userId !== userId && session.role !== 'Admin') return forbidden()

    const user = await getUserById(userId)
    if (!user) return notFound('User')

    return ok(user)
  } catch {
    return serverError()
  }
}

export async function PATCH(req: Request, { params }: Ctx): Promise<Response> {
  try {
    const result = await requireAuth()
    if (result instanceof Response) return result
    const session = result

    const { userId: raw } = await params
    const userId = parseUserId(raw)
    if (!userId) return badRequest('Invalid userId')

    if (session.userId !== userId && session.role !== 'Admin') return forbidden()

    const body = await req.json()
    const parsed = updateUserSchema.safeParse(body)
    if (!parsed.success) return badRequest(parsed.error.issues[0].message)

    const existing = await getUserById(userId)
    if (!existing) return notFound('User')

    const updated = await updateUser(userId, parsed.data)
    if (!updated.ok) {
      return conflict(
        updated.conflict === 'email' ? 'Email is already taken' : 'Username is already taken',
      )
    }

    return ok(updated.user)
  } catch {
    return serverError()
  }
}

export async function DELETE(_req: Request, { params }: Ctx): Promise<Response> {
  try {
    const result = await requireAdmin()
    if (result instanceof Response) return result

    const { userId: raw } = await params
    const userId = parseUserId(raw)
    if (!userId) return badRequest('Invalid userId')

    const existing = await getUserById(userId)
    if (!existing) return notFound('User')

    await deleteUser(userId)
    return noContent()
  } catch {
    return serverError()
  }
}
