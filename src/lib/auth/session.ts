import { cookies } from 'next/headers'
import { SignJWT, jwtVerify } from 'jose'
import type { JWTPayload } from 'jose'

export type SessionUser = {
  userId: number
  username: string
  email: string
  role: string
}

type JwtClaims = SessionUser & JWTPayload

const ALGORITHM = 'HS256'
const EXPIRATION = '7d'

function getSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET
  if (!secret) throw new Error('JWT_SECRET environment variable is not set')
  return new TextEncoder().encode(secret)
}

export async function signJwt(user: SessionUser): Promise<string> {
  return new SignJWT(user as JwtClaims)
    .setProtectedHeader({ alg: ALGORITHM })
    .setIssuedAt()
    .setExpirationTime(EXPIRATION)
    .sign(getSecret())
}

export async function verifyJwt(token: string): Promise<SessionUser | null> {
  const secret = getSecret() // misconfiguration → záměrně propaguje chybu výše
  try {
    const { payload } = await jwtVerify<JwtClaims>(token, secret)
    return {
      userId: payload.userId,
      username: payload.username,
      email: payload.email,
      role: payload.role,
    }
  } catch {
    // ExpiredTokenError, JWSInvalidSignature, JWTClaimValidationFailed atd.
    return null
  }
}

export async function getSession(): Promise<SessionUser | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get('session')?.value
  if (!token) return null
  return verifyJwt(token)
}
