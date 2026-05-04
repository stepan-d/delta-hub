import { prisma } from '@/lib/prisma'
import type { CreateCommentInput, UpdateCommentInput } from '@/lib/validations/comment.schema'

const authorSelect = {
  userId: true,
  username: true,
  email: true,
  role: true,
  schoolYear: true,
  favoriteSubject: true,
  createdAt: true,
} as const

function formatComment<
  TUser extends { userId: number },
  T extends { user: TUser; userId: number }
>(comment: T) {
  const { user, userId: _userId, ...rest } = comment
  return { ...rest, author: user }
}

export async function getCommentsByMeme(memeId: number) {
  const comments = await prisma.memeComment.findMany({
    where: { memeId },
    orderBy: { createdAt: 'asc' },
    include: { user: { select: authorSelect } },
  })
  return comments.map(formatComment)
}

export async function getAdminComments() {
  const comments = await prisma.memeComment.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      user: { select: authorSelect },
      meme: {
        select: {
          memeId: true,
          title: true,
          imageUrl: true,
          createdAt: true,
        },
      },
    },
  })

  return comments.map((comment) => {
    const { user, userId: _userId, ...rest } = comment
    return { ...rest, author: user }
  })
}

export async function getCommentById(commentId: number) {
  const comment = await prisma.memeComment.findUnique({
    where: { commentId },
    include: { user: { select: authorSelect } },
  })
  if (!comment) return null
  return formatComment(comment)
}

export async function createComment(memeId: number, userId: number, input: CreateCommentInput) {
  const comment = await prisma.memeComment.create({
    data: { memeId, userId, text: input.text },
    include: { user: { select: authorSelect } },
  })
  return formatComment(comment)
}

export async function updateComment(commentId: number, input: UpdateCommentInput) {
  const comment = await prisma.memeComment.update({
    where: { commentId },
    data: { text: input.text },
    include: { user: { select: authorSelect } },
  })
  return formatComment(comment)
}

export async function deleteComment(commentId: number): Promise<void> {
  await prisma.memeComment.delete({ where: { commentId } })
}
