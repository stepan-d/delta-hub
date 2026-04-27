import { prisma } from '@/lib/prisma'
import type { UpdateUserInput } from '@/lib/validations/user.validation'

export type CreateUserInput = {
  username: string
  email: string
  passwordHash: string
  schoolYear?: number
  favoriteSubject?: string
}

const safeSelect = {
  userId: true,
  username: true,
  email: true,
  role: true,
  schoolYear: true,
  favoriteSubject: true,
  createdAt: true,
} as const

export async function listUsers() {
  return prisma.user.findMany({
    select: safeSelect,
    orderBy: { createdAt: 'asc' },
  })
}

export async function getUserById(userId: number) {
  return prisma.user.findUnique({
    where: { userId },
    select: safeSelect,
  })
}

export async function getUserByEmail(email: string) {
  return prisma.user.findUnique({ where: { email } })
}

export async function getUserByUsername(username: string) {
  return prisma.user.findUnique({ where: { username } })
}

export async function createUser(input: CreateUserInput) {
  return prisma.user.create({ data: input })
}

export type UpdateUserConflict = 'username' | 'email'

export async function updateUser(
  userId: number,
  input: UpdateUserInput,
): Promise<
  | { ok: true; user: Awaited<ReturnType<typeof getUserById>> }
  | { ok: false; conflict: UpdateUserConflict }
> {
  if (input.username) {
    const existing = await getUserByUsername(input.username)
    if (existing && existing.userId !== userId) return { ok: false, conflict: 'username' }
  }
  if (input.email) {
    const existing = await getUserByEmail(input.email)
    if (existing && existing.userId !== userId) return { ok: false, conflict: 'email' }
  }

  const user = await prisma.user.update({
    where: { userId },
    data: input,
    select: safeSelect,
  })
  return { ok: true, user }
}

export async function deleteUser(userId: number): Promise<void> {
  await prisma.user.delete({ where: { userId } })
}
