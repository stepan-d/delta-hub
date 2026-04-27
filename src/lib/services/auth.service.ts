import bcrypt from 'bcryptjs'
import { cookies } from 'next/headers'
import { forbidden, unauthorized } from '@/lib/api-response'
import { signJwt, getSession, type SessionUser } from '@/lib/auth/session'
import { getUserByEmail, getUserByUsername, createUser } from '@/lib/services/user.service'
import type { RegisterInput, LoginInput } from '@/lib/validations/auth.schema'

const COOKIE_NAME = 'session'
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7 // 7 days

type SafeUser = Omit<
  Awaited<ReturnType<typeof getUserByEmail>>,
  'passwordHash'
> & { passwordHash?: never }

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

export async function register(input: RegisterInput): Promise<
  { ok: true; user: SafeUser } | { ok: false; conflict: 'username' | 'email' }
> {
  const [existingByEmail, existingByUsername] = await Promise.all([
    getUserByEmail(input.email),
    getUserByUsername(input.username),
  ])

  if (existingByEmail) return { ok: false, conflict: 'email' }
  if (existingByUsername) return { ok: false, conflict: 'username' }

  const passwordHash = await bcrypt.hash(input.password, 12)
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

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { passwordHash: _ph, ...safeUser } = created
  return { ok: true, user: safeUser as SafeUser }
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

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { passwordHash: _ph, ...safeUser } = user
  return { ok: true, user: safeUser as SafeUser }
}

export async function logout(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(COOKIE_NAME)
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  return getSession()
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
