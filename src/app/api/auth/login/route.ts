import { badRequest, serverError, unauthorized, ok } from '@/lib/api-response'
import { login } from '@/lib/services/auth.service'
import { createAuditLog } from '@/lib/services/audit.service'
import { loginSchema } from '@/lib/validations/auth.schema'

export async function POST(request: Request): Promise<Response> {
  try {
    const body = await request.json()
    const parsed = loginSchema.safeParse(body)
    if (!parsed.success) return badRequest(parsed.error.issues[0].message)

    const result = await login(parsed.data)
    if (!result.ok) return unauthorized('Invalid email or password')

    createAuditLog({ userId: result.user.userId, action: 'login', tableName: 'users', recordId: result.user.userId })

    return ok(result.user)
  } catch {
    return serverError()
  }
}
