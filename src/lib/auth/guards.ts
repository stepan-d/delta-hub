import { forbidden, unauthorized } from '@/lib/api-response'
import { getSession, type SessionUser } from './session'

type RouteContext = { params: Promise<Record<string, string>> }
type AuthedHandler = (req: Request, ctx: RouteContext, user: SessionUser) => Promise<Response>

export function requireAuth(handler: AuthedHandler) {
  return async (req: Request, ctx: RouteContext): Promise<Response> => {
    const user = await getSession()
    if (!user) return unauthorized()
    return handler(req, ctx, user)
  }
}

export function requireRole(role: string, handler: AuthedHandler) {
  return async (req: Request, ctx: RouteContext): Promise<Response> => {
    const user = await getSession()
    if (!user) return unauthorized()
    if (user.role !== role) return forbidden()
    return handler(req, ctx, user)
  }
}
