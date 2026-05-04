import bcrypt from 'bcryptjs'
import { cookies } from 'next/headers'
import { Prisma } from '@prisma/client'
import { forbidden, unauthorized } from '@/lib/api-response'
import { signJwt, getSession, type SessionUser, COOKIE_NAME } from '@/lib/auth/session'
import { getUserByEmail, getUserById, createUser } from '@/lib/services/user.service'
import type { RegisterInput, LoginInput } from '@/lib/validations/auth.schema'

const COOKIE_MAX_AGE = 60 * 60 * 24 * 7 // 7 days
const MODERATION_ROLES = new Set(['Moderator', 'Admin'])

type AuthUser = NonNullable<Awaited<ReturnType<typeof getUserByEmail>>>
export type SafeUser = Omit<AuthUser, 'passwordHash'>

function conflictField(e: Prisma.PrismaClientKnownRequestError): 'email' | 'username' {
  const target = e.meta?.target
  const str = Array.isArray(target) ? target.join(',') : String(target ?? '')
  return str.includes('email') ? 'email' : 'username'
}

async function setSessionCookie(user: SessionUser): Promise<void> {
  const token = await signJwt(user)
  const cookieStore = await cookies()
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: COOKIE_MAX_AGE,
  })
}

function toSafeUser(user: AuthUser): SafeUser {
  const { passwordHash: _passwordHash, ...safeUser } = user
  return safeUser
}

export async function register(input: RegisterInput): Promise<
  { ok: true; user: SafeUser } | { ok: false; conflict: 'username' | 'email' }
> {
  const passwordHash = await bcrypt.hash(input.password, 12)
  try {
    const created = await createUser({
      username: input.username,
      email: input.email,
      passwordHash,
      schoolYear: input.schoolYear,
      favoriteSubject: input.favoriteSubject,
    })

    const sessionUser: SessionUser = {
      userId: created.userId,
      username: created.username,
      email: created.email,
      role: created.role,
    }
    await setSessionCookie(sessionUser)

    return { ok: true, user: created }
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
      return { ok: false, conflict: conflictField(e) }
    }
    throw e
  }
}

export async function login(input: LoginInput): Promise<
  { ok: true; user: SafeUser } | { ok: false }
> {
  const user = await getUserByEmail(input.email)
  if (!user) return { ok: false }

  const valid = await bcrypt.compare(input.password, user.passwordHash)
  if (!valid) return { ok: false }

  const sessionUser: SessionUser = {
    userId: user.userId,
    username: user.username,
    email: user.email,
    role: user.role,
  }
  await setSessionCookie(sessionUser)

  return { ok: true, user: toSafeUser(user) }
}

export async function logout(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(COOKIE_NAME)
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  return getSession()
}

export async function getCurrentUserProfile(): Promise<SafeUser | null> {
  const session = await getSession()
  if (!session) return null

  return getUserById(session.userId)
}

export async function requireAuth(): Promise<SessionUser | Response> {
  const user = await getSession()
  if (!user) return unauthorized()
  return user
}

export async function requireAdmin(): Promise<SessionUser | Response> {
  const user = await getSession()
  if (!user) return unauthorized()
  if (user.role !== 'Admin') return forbidden()
  return user
}

export async function requireModerator(): Promise<SessionUser | Response> {
  const user = await getSession()
  if (!user) return unauthorized()
  if (!MODERATION_ROLES.has(user.role)) return forbidden()
  return user
}

export function isModeratorRole(role: string): boolean {
  return MODERATION_ROLES.has(role)
}
