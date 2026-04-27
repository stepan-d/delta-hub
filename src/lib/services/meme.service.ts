import { prisma } from '@/lib/prisma'
import type { Prisma } from '@prisma/client'
import type { CreateMemeInput, UpdateMemeInput, MemeListQuery } from '@/lib/validations/meme.schema'

const authorSelect = {
  userId: true,
  username: true,
  email: true,
  role: true,
  schoolYear: true,
  favoriteSubject: true,
  createdAt: true,
} as const

const categorySelect = {
  categoryId: true,
  name: true,
  description: true,
} as const

function buildOrderBy(sort: MemeListQuery['sort']): Prisma.MemeOrderByWithRelationInput {
  switch (sort) {
    case 'oldest': return { createdAt: 'asc' }
    case 'mostLiked': return { likeCount: 'desc' }
    default: return { createdAt: 'desc' }
  }
}

function formatMeme<T extends {
  user: object
  _count: { memeComments: number }
  memeLikes?: Array<unknown>
}>(meme: T, currentUserId?: number) {
  const { user, _count, memeLikes, ...rest } = meme
  return {
    ...rest,
    author: user,
    commentCount: _count.memeComments,
    ...(currentUserId !== undefined && {
      likedByCurrentUser: (memeLikes?.length ?? 0) > 0,
    }),
  }
}

export async function getMemes(query: MemeListQuery, currentUserId?: number) {
  const { page, limit, categoryId, userId, search, tag, sort } = query
  const skip = (page - 1) * limit

  const where: Prisma.MemeWhereInput = {
    ...(categoryId && { categoryId }),
    ...(userId && { userId }),
    ...(search && { title: { contains: search, mode: 'insensitive' } }),
    ...(tag && { memeTags: { some: { tagName: { equals: tag, mode: 'insensitive' } } } }),
  }

  const include = {
    user: { select: authorSelect },
    category: { select: categorySelect },
    _count: { select: { memeComments: true } },
    ...(currentUserId !== undefined && {
      memeLikes: { where: { userId: currentUserId }, select: { userId: true } },
    }),
  } satisfies Prisma.MemeInclude

  const [memes, total] = await prisma.$transaction([
    prisma.meme.findMany({ where, skip, take: limit, orderBy: buildOrderBy(sort), include }),
    prisma.meme.count({ where }),
  ])

  return {
    memes: memes.map((m) => formatMeme(m, currentUserId)),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  }
}

export async function getMemeById(memeId: number, currentUserId?: number) {
  const include = {
    user: { select: authorSelect },
    category: { select: categorySelect },
    _count: { select: { memeComments: true } },
    ...(currentUserId !== undefined && {
      memeLikes: { where: { userId: currentUserId }, select: { userId: true } },
    }),
  } satisfies Prisma.MemeInclude

  const meme = await prisma.meme.findUnique({ where: { memeId }, include })
  if (!meme) return null
  return formatMeme(meme, currentUserId)
}

export async function createMeme(input: CreateMemeInput, userId: number) {
  const meme = await prisma.meme.create({
    data: {
      userId,
      title: input.title,
      imageUrl: input.imageUrl,
      categoryId: input.categoryId ?? null,
      tags: (input.tags ?? {}) as Prisma.InputJsonObject,
    },
    include: {
      user: { select: authorSelect },
      category: { select: categorySelect },
      _count: { select: { memeComments: true } },
    },
  })
  return formatMeme(meme, userId)
}

export async function updateMeme(memeId: number, input: UpdateMemeInput, currentUserId: number) {
  const meme = await prisma.meme.update({
    where: { memeId },
    data: {
      ...(input.title !== undefined && { title: input.title }),
      ...(input.categoryId !== undefined && { categoryId: input.categoryId }),
      ...(input.tags !== undefined && { tags: input.tags as Prisma.InputJsonObject }),
    },
    include: {
      user: { select: authorSelect },
      category: { select: categorySelect },
      _count: { select: { memeComments: true } },
      memeLikes: { where: { userId: currentUserId }, select: { userId: true } },
    },
  })
  return formatMeme(meme, currentUserId)
}

export async function deleteMeme(memeId: number): Promise<void> {
  await prisma.meme.delete({ where: { memeId } })
}
