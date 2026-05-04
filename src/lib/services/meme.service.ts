import { prisma } from '@/lib/prisma'
import type { Prisma } from '@prisma/client'
import type { CreateMemeInput, UpdateMemeInput, MemeListQuery } from '@/lib/validations/meme.schema'
import { publicUserSelect as authorSelect } from '@/lib/db/selects'

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

function formatMeme<
  TUser extends { userId: number },
  T extends {
    userId: number
    user: TUser
    _count: { memeComments: number }
    memeLikes?: Array<unknown>
  }
>(meme: T, currentUserId?: number) {
  const { user, _count, memeLikes, userId: _userId, ...rest } = meme
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

export async function getAdminMemes() {
  const memes = await prisma.meme.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      user: { select: authorSelect },
      category: { select: categorySelect },
      _count: { select: { memeComments: true } },
    },
  })

  return memes.map((meme) => formatMeme(meme))
}

function tagsToRows(tags: Record<string, unknown>): Array<{ tagName: string; weight: number }> {
  return Object.entries(tags).map(([tagName, weight]) => ({
    tagName,
    weight: typeof weight === 'number' ? weight : 1,
  }))
}

export async function createMeme(input: CreateMemeInput, userId: number) {
  const tags = (input.tags ?? {}) as Record<string, unknown>
  const tagRows = tagsToRows(tags)

  return prisma.$transaction(async (tx) => {
    const meme = await tx.meme.create({
      data: {
        userId,
        title: input.title,
        imageUrl: input.imageUrl,
        categoryId: input.categoryId ?? null,
        tags: tags as Prisma.InputJsonObject,
      },
      include: {
        user: { select: authorSelect },
        category: { select: categorySelect },
        _count: { select: { memeComments: true } },
        memeLikes: { where: { userId }, select: { userId: true } },
      },
    })

    if (tagRows.length > 0) {
      await tx.memeTag.createMany({
        data: tagRows.map((r) => ({ memeId: meme.memeId, ...r })),
      })
    }

    return formatMeme(meme, userId)
  })
}

export async function updateMeme(memeId: number, input: UpdateMemeInput, currentUserId: number) {
  return prisma.$transaction(async (tx) => {
    const meme = await tx.meme.update({
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

    if (input.tags !== undefined) {
      await tx.memeTag.deleteMany({ where: { memeId } })
      const tagRows = tagsToRows(input.tags as Record<string, unknown>)
      if (tagRows.length > 0) {
        await tx.memeTag.createMany({
          data: tagRows.map((r) => ({ memeId, ...r })),
        })
      }
    }

    return formatMeme(meme, currentUserId)
  })
}

export async function deleteMeme(memeId: number): Promise<void> {
  await prisma.meme.delete({ where: { memeId } })
}
