export const runtime = 'nodejs'

import { after } from 'next/server'
import { handlePrismaError, unauthorized, ok, validationError } from '@/lib/api-response'
import { login } from '@/lib/services/auth.service'
import { createAuditLog } from '@/lib/services/audit.service'
import { loginSchema } from '@/lib/validations/auth.schema'

export async function POST(request: Request): Promise<Response> {
  try {
    const body = await request.json()
    const parsed = loginSchema.safeParse(body)
    if (!parsed.success) return validationError(parsed.error)

    const result = await login(parsed.data)
    if (!result.ok) return unauthorized('Zadaný e-mail nebo heslo nesedí.')

    after(() => createAuditLog({ userId: result.user.userId, action: 'login', tableName: 'users', recordId: result.user.userId }))

    return ok(result.user)
  } catch (e) {
    return handlePrismaError(e)
  }
}
