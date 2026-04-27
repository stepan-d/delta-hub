import { prisma } from '@/lib/prisma'

interface CreateAuditLogInput {
  userId?: number
  action: string
  tableName?: string
  recordId?: number
}

interface AuditLogQuery {
  page: number
  limit: number
  userId?: number
  action?: string
}

const userSelect = {
  userId: true,
  username: true,
  email: true,
  role: true,
  schoolYear: true,
  favoriteSubject: true,
  createdAt: true,
} as const

export async function createAuditLog(input: CreateAuditLogInput): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        userId: input.userId ?? null,
        action: input.action,
        tableName: input.tableName ?? null,
        recordId: input.recordId ?? null,
      },
    })
  } catch {
    // Logging must never break the main action
  }
}

export async function getAuditLogs(query: AuditLogQuery) {
  const { page, limit, userId, action } = query
  const skip = (page - 1) * limit

  const where = {
    ...(userId !== undefined && { userId }),
    ...(action !== undefined && { action }),
  }

  const [logs, total] = await prisma.$transaction([
    prisma.auditLog.findMany({
      where,
      skip,
      take: limit,
      orderBy: { timestamp: 'desc' },
      include: { user: { select: userSelect } },
    }),
    prisma.auditLog.count({ where }),
  ])

  return { logs, total, page, limit, totalPages: Math.ceil(total / limit) }
}
