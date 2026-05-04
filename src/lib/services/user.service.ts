import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'
import type { UpdateUserInput } from '@/lib/validations/user.validation'
import { publicUserSelect, privateUserSelect } from '@/lib/db/selects'

export { publicUserSelect, privateUserSelect }

export type CreateUserInput = {
  username: string
  email: string
  passwordHash: string
  schoolYear?: number
  favoriteSubject?: string
}

const authUserSelect = {
  userId: true,
  username: true,
  email: true,
  role: true,
  schoolYear: true,
  favoriteSubject: true,
  createdAt: true,
  passwordHash: true,
} as const

export async function listUsers() {
  return prisma.user.findMany({
    select: privateUserSelect,
    orderBy: { createdAt: 'asc' },
  })
}

export async function getUserById(userId: number) {
  return prisma.user.findUnique({
    where: { userId },
    select: privateUserSelect,
  })
}

export async function getUserByEmail(email: string) {
  return prisma.user.findUnique({
    where: { email },
    select: authUserSelect,
  })
}

export async function getUserByUsername(username: string) {
  return prisma.user.findUnique({
    where: { username },
    select: { userId: true, username: true },
  })
}

export async function createUser(input: CreateUserInput) {
  return prisma.user.create({
    data: input,
    select: privateUserSelect,
  })
}

export type UpdateUserConflict = 'username' | 'email'

function detectConflictField(e: Prisma.PrismaClientKnownRequestError): UpdateUserConflict {
  const target = e.meta?.target
  const str = Array.isArray(target) ? target.join(',') : String(target ?? '')
  return str.includes('email') ? 'email' : 'username'
}

export async function updateUser(
  userId: number,
  input: UpdateUserInput,
): Promise<
  | { ok: true; user: NonNullable<Awaited<ReturnType<typeof getUserById>>> }
  | { ok: false; conflict: UpdateUserConflict }
  | { ok: false; notFound: true }
> {
  try {
    const user = await prisma.user.update({
      where: { userId },
      data: input,
      select: privateUserSelect,
    })
    return { ok: true, user }
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError) {
      if (e.code === 'P2002') return { ok: false, conflict: detectConflictField(e) }
      if (e.code === 'P2025') return { ok: false, notFound: true }
    }
    throw e
  }
}

export async function deleteUser(userId: number): Promise<void> {
  await prisma.user.delete({ where: { userId } })
}
