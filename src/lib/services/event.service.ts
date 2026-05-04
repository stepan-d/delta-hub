import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'
import type { CreateEventInput, UpdateEventInput, EventListQuery } from '@/lib/validations/event.schema'

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Object.prototype.toString.call(value) === '[object Object]'
}

function toPrismaJsonValue(value: unknown): Prisma.InputJsonValue {
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return value
  }

  if (Array.isArray(value)) {
    return value.map((item) => (item === null ? null : toPrismaJsonValue(item)))
  }

  if (isPlainObject(value)) {
    const jsonObject: Record<string, Prisma.InputJsonValue | null> = {}

    for (const [key, item] of Object.entries(value)) {
      jsonObject[key] = item === null ? null : toPrismaJsonValue(item)
    }

    return jsonObject
  }

  throw new TypeError('detailsJson must contain only valid JSON values')
}

function toDetailsJsonInput(detailsJson: CreateEventInput['detailsJson']): Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput {
  if (detailsJson === null) return Prisma.DbNull
  return toPrismaJsonValue(detailsJson)
}

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
      ...(input.detailsJson !== undefined && { detailsJson: toDetailsJsonInput(input.detailsJson) }),
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
        detailsJson: toDetailsJsonInput(input.detailsJson),
      }),
    },
  })
}

export async function deleteEvent(eventId: number): Promise<void> {
  await prisma.schoolEvent.delete({ where: { eventId } })
}
