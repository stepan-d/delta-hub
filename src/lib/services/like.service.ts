import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'

export async function toggleLike(memeId: number, userId: number): Promise<{ liked: boolean; likeCount: number }> {
  try {
    const [, meme] = await prisma.$transaction([
      prisma.memeLike.create({ data: { memeId, userId } }),
      prisma.meme.update({ where: { memeId }, data: { likeCount: { increment: 1 } }, select: { likeCount: true } }),
    ])
    return { liked: true, likeCount: meme.likeCount }
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
      const [, meme] = await prisma.$transaction([
        prisma.memeLike.delete({ where: { memeId_userId: { memeId, userId } } }),
        prisma.meme.update({ where: { memeId }, data: { likeCount: { decrement: 1 } }, select: { likeCount: true } }),
      ])
      return { liked: false, likeCount: meme.likeCount }
    }
    throw e
  }
}
