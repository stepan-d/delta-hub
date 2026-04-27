import { prisma } from '@/lib/prisma'
import type { Prisma } from '@prisma/client'
import type { CreateEventInput, UpdateEventInput, EventListQuery } from '@/lib/validations/event.schema'

export async function getEvents(query: EventListQuery) {
  const { page, limit } = query
  const skip = (page - 1) * limit

  const [events, total] = await prisma.$transaction([
    prisma.schoolEvent.findMany({ skip, take: limit, orderBy: { eventId: 'asc' } }),
    prisma.schoolEvent.count(),
  ])

  return { events, total, page, limit, totalPages: Math.ceil(total / limit) }
}

export async function getEventById(eventId: number) {
  return prisma.schoolEvent.findUnique({ where: { eventId } })
}

export async function createEvent(input: CreateEventInput) {
  return prisma.schoolEvent.create({
    data: {
      name: input.name,
      date: input.date ? new Date(input.date) : null,
      detailsJson: (input.detailsJson ?? null) as Prisma.InputJsonValue | null,
    },
  })
}

export async function updateEvent(eventId: number, input: UpdateEventInput) {
  return prisma.schoolEvent.update({
    where: { eventId },
    data: {
      ...(input.name !== undefined && { name: input.name }),
      ...(input.date !== undefined && { date: input.date ? new Date(input.date) : null }),
      ...(input.detailsJson !== undefined && {
        detailsJson: (input.detailsJson ?? null) as Prisma.InputJsonValue | null,
      }),
    },
  })
}

export async function deleteEvent(eventId: number): Promise<void> {
  await prisma.schoolEvent.delete({ where: { eventId } })
}
