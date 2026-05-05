export type EventDetailsForm = {
  location: string
  type: string
  audience: string
  speaker: string
  capacity: string
  prize: string
  agenda: string
  description: string
}

export type EventDetailEntry = {
  label: string
  value: string
}

export function createEmptyEventDetailsForm(): EventDetailsForm {
  return {
    location: '',
    type: '',
    audience: '',
    speaker: '',
    capacity: '',
    prize: '',
    agenda: '',
    description: '',
  }
}

function readStringValue(value: unknown): string {
  return typeof value === 'string' ? value : ''
}

function readAgendaValue(value: unknown): string {
  if (typeof value === 'string') return value
  if (!Array.isArray(value)) return ''

  return value
    .filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
    .join('\n')
}

export function detailsJsonToForm(detailsJson?: Record<string, unknown> | null): EventDetailsForm {
  if (!detailsJson) {
    return createEmptyEventDetailsForm()
  }

  return {
    location: readStringValue(detailsJson.location),
    type: readStringValue(detailsJson.type),
    audience: readStringValue(detailsJson.audience),
    speaker: readStringValue(detailsJson.speaker),
    capacity:
      typeof detailsJson.capacity === 'number' && Number.isFinite(detailsJson.capacity)
        ? String(detailsJson.capacity)
        : '',
    prize: readStringValue(detailsJson.prize),
    agenda: readAgendaValue(detailsJson.agenda),
    description: readStringValue(detailsJson.description),
  }
}

export function eventDetailsFormToJson(details: EventDetailsForm): Record<string, unknown> | undefined {
  const location = details.location.trim()
  const type = details.type.trim()
  const audience = details.audience.trim()
  const speaker = details.speaker.trim()
  const prize = details.prize.trim()
  const description = details.description.trim()
  const agenda = details.agenda
    .split('\n')
    .map((item) => item.trim())
    .filter(Boolean)
  const capacityValue = details.capacity.trim()
  const capacity = capacityValue ? Number(capacityValue) : undefined

  const result: Record<string, unknown> = {}

  if (location) result.location = location
  if (type) result.type = type
  if (audience) result.audience = audience
  if (speaker) result.speaker = speaker
  if (Number.isInteger(capacity) && (capacity as number) > 0) result.capacity = capacity
  if (prize) result.prize = prize
  if (agenda.length > 0) result.agenda = agenda
  if (description) result.description = description

  return Object.keys(result).length > 0 ? result : undefined
}

export function getEventDetailEntries(detailsJson?: Record<string, unknown> | null): EventDetailEntry[] {
  const form = detailsJsonToForm(detailsJson)
  const entries: EventDetailEntry[] = []

  if (form.location) entries.push({ label: 'Místo', value: form.location })
  if (form.type) entries.push({ label: 'Typ', value: form.type })
  if (form.audience) entries.push({ label: 'Publikum', value: form.audience })
  if (form.speaker) entries.push({ label: 'Speaker', value: form.speaker })
  if (form.capacity) entries.push({ label: 'Kapacita', value: form.capacity })
  if (form.prize) entries.push({ label: 'Cena', value: form.prize })
  if (form.agenda) entries.push({ label: 'Agenda', value: form.agenda.replace(/\n+/g, ', ') })
  if (form.description) entries.push({ label: 'Poznámka', value: form.description })

  return entries
}
