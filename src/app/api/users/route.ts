import { ok, serverError } from '@/lib/api-response'
import { requireAdmin } from '@/lib/services/auth.service'
import { listUsers } from '@/lib/services/user.service'

export async function GET(): Promise<Response> {
  try {
    const result = await requireAdmin()
    if (result instanceof Response) return result

    const users = await listUsers()
    return ok(users)
  } catch {
    return serverError()
  }
}
