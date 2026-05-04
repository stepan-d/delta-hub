import { prisma } from '@/lib/prisma'

const reporterSelect = {
  userId: true,
  username: true,
  email: true,
  role: true,
  schoolYear: true,
  favoriteSubject: true,
  createdAt: true,
} as const

const memeSelect = {
  memeId: true,
  title: true,
  imageUrl: true,
  createdAt: true,
} as const

export async function createReport(memeId: number, reporterId: number, reason: string) {
  return prisma.userReport.create({
    data: { memeId, reporterId, reason },
  })
}

export async function getAllReports() {
  return prisma.userReport.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      meme: { select: memeSelect },
      reporter: { select: reporterSelect },
    },
  })
}

export async function getReportById(reportId: number) {
  return prisma.userReport.findUnique({
    where: { reportId },
    include: {
      meme: { select: memeSelect },
      reporter: { select: reporterSelect },
    },
  })
}

export async function updateReportStatus(reportId: number, status: string) {
  return prisma.userReport.update({
    where: { reportId },
    data: { status },
    include: {
      meme: { select: memeSelect },
      reporter: { select: reporterSelect },
    },
  })
}
