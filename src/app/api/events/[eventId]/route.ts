import { badRequest, noContent, notFound, ok, serverError } from '@/lib/api-response'
import { requireAdmin } from '@/lib/services/auth.service'
import { getEventById, updateEvent, deleteEvent } from '@/lib/services/event.service'
import { createAuditLog } from '@/lib/services/audit.service'
import { updateEventSchema } from '@/lib/validations/event.schema'

type Ctx = { params: Promise<{ eventId: string }> }

function parseEventId(raw: string): number | null {
  const id = parseInt(raw, 10)
  return isNaN(id) ? null : id
}

export async function GET(_req: Request, { params }: Ctx): Promise<Response> {
  try {
    const { eventId: raw } = await params
    const eventId = parseEventId(raw)
    if (!eventId) return badRequest('Invalid eventId')

    const event = await getEventById(eventId)
    if (!event) return notFound('Event')

    return ok(event)
  } catch {
    return serverError()
  }
}

export async function PATCH(req: Request, { params }: Ctx): Promise<Response> {
  try {
    const result = await requireAdmin()
    if (result instanceof Response) return result
    const session = result

    const { eventId: raw } = await params
    const eventId = parseEventId(raw)
    if (!eventId) return badRequest('Invalid eventId')

    const existing = await getEventById(eventId)
    if (!existing) return notFound('Event')

    const body = await req.json()
    const parsed = updateEventSchema.safeParse(body)
    if (!parsed.success) return badRequest(parsed.error.issues[0].message)

    const event = await updateEvent(eventId, parsed.data)
    createAuditLog({ userId: session.userId, action: 'update_event', tableName: 'school_events', recordId: eventId })

    return ok(event)
  } catch {
    return serverError()
  }
}

export async function DELETE(_req: Request, { params }: Ctx): Promise<Response> {
  try {
    const result = await requireAdmin()
    if (result instanceof Response) return result
    const session = result

    const { eventId: raw } = await params
    const eventId = parseEventId(raw)
    if (!eventId) return badRequest('Invalid eventId')

    const existing = await getEventById(eventId)
    if (!existing) return notFound('Event')

    await deleteEvent(eventId)
    createAuditLog({ userId: session.userId, action: 'delete_event', tableName: 'school_events', recordId: eventId })

    return noContent()
  } catch {
    return serverError()
  }
}
