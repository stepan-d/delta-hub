import { ok, serverError } from '@/lib/api-response'
import { requireAuth } from '@/lib/services/auth.service'

export async function GET(): Promise<Response> {
  try {
    const result = await requireAuth()
    if (result instanceof Response) return result
    return ok(result)
  } catch {
    return serverError()
  }
}
