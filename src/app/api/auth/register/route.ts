export const runtime = 'nodejs'

import { after } from 'next/server'
import { conflict, created, handlePrismaError, validationError } from '@/lib/api-response'
import { register } from '@/lib/services/auth.service'
import { createAuditLog } from '@/lib/services/audit.service'
import { registerSchema } from '@/lib/validations/auth.schema'

export async function POST(request: Request): Promise<Response> {
  try {
    const body = await request.json()
    const parsed = registerSchema.safeParse(body)
    if (!parsed.success) return validationError(parsed.error)

    const result = await register(parsed.data)
    if (!result.ok) {
      return conflict(
        result.conflict === 'email'
          ? 'Tento e-mail už v komunitě používá jiný účet.'
          : 'Tohle uživatelské jméno je už obsazené.',
      )
    }

    after(() => createAuditLog({ userId: result.user.userId, action: 'register', tableName: 'users', recordId: result.user.userId }))

    return created(result.user)
  } catch (e) {
    return handlePrismaError(e)
  }
}
