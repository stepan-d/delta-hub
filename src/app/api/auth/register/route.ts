import { badRequest, conflict, created, serverError } from '@/lib/api-response'
import { register } from '@/lib/services/auth.service'
import { createAuditLog } from '@/lib/services/audit.service'
import { registerSchema } from '@/lib/validations/auth.schema'

export async function POST(request: Request): Promise<Response> {
  try {
    const body = await request.json()
    const parsed = registerSchema.safeParse(body)
    if (!parsed.success) return badRequest(parsed.error.issues[0].message)

    const result = await register(parsed.data)
    if (!result.ok) {
      return conflict(
        result.conflict === 'email'
          ? 'Email is already taken'
          : 'Username is already taken',
      )
    }

    createAuditLog({ userId: result.user.userId, action: 'register', tableName: 'users', recordId: result.user.userId })

    return created(result.user)
  } catch {
    return serverError()
  }
}
