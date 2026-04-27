import { prisma } from '@/lib/prisma'

export async function toggleLike(memeId: number, userId: number): Promise<{ liked: boolean; likeCount: number }> {
  const existing = await prisma.memeLike.findUnique({
    where: { memeId_userId: { memeId, userId } },
  })

  if (existing) {
    const [, meme] = await prisma.$transaction([
      prisma.memeLike.delete({ where: { memeId_userId: { memeId, userId } } }),
      prisma.meme.update({ where: { memeId }, data: { likeCount: { decrement: 1 } }, select: { likeCount: true } }),
    ])
    return { liked: false, likeCount: meme.likeCount }
  }

  const [, meme] = await prisma.$transaction([
    prisma.memeLike.create({ data: { memeId, userId } }),
    prisma.meme.update({ where: { memeId }, data: { likeCount: { increment: 1 } }, select: { likeCount: true } }),
  ])
  return { liked: true, likeCount: meme.likeCount }
}
