import { noContent, serverError } from '@/lib/api-response'
import { logout } from '@/lib/services/auth.service'

export async function POST(): Promise<Response> {
  try {
    await logout()
    return noContent()
  } catch {
    return serverError()
  }
}
