export const runtime = 'nodejs'

import { noContent, handlePrismaError } from '@/lib/api-response'
import { logout } from '@/lib/services/auth.service'

export async function POST(): Promise<Response> {
  try {
    await logout()
    return noContent()
  } catch (e) {
    return handlePrismaError(e)
  }
}
