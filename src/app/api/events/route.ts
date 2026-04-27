import { badRequest, created, ok, serverError } from '@/lib/api-response'
import { requireAdmin } from '@/lib/services/auth.service'
import { getEvents, createEvent } from '@/lib/services/event.service'
import { createAuditLog } from '@/lib/services/audit.service'
import { eventListQuerySchema, createEventSchema } from '@/lib/validations/event.schema'

export async function GET(req: Request): Promise<Response> {
  try {
    const { searchParams } = new URL(req.url)
    const raw = Object.fromEntries(searchParams)
    const parsed = eventListQuerySchema.safeParse(raw)
    if (!parsed.success) return badRequest(parsed.error.issues[0].message)

    const result = await getEvents(parsed.data)
    return ok(result)
  } catch {
    return serverError()
  }
}

export async function POST(req: Request): Promise<Response> {
  try {
    const result = await requireAdmin()
    if (result instanceof Response) return result
    const session = result

    const body = await req.json()
    const parsed = createEventSchema.safeParse(body)
    if (!parsed.success) return badRequest(parsed.error.issues[0].message)

    const event = await createEvent(parsed.data)
    createAuditLog({ userId: session.userId, action: 'create_event', tableName: 'school_events', recordId: event.eventId })

    return created(event)
  } catch {
    return serverError()
  }
}
