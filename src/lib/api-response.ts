import { Prisma } from '@prisma/client'
import type { ZodError } from 'zod'
import { logger } from '@/lib/logger'

type SuccessBody<T> = { data: T; message?: string }
type ErrorBody = { error: string; code?: string; details?: { path: string; message: string }[] }

function json<T>(body: T, status: number): Response {
  return Response.json(body, { status })
}

export function ok<T>(data: T, message?: string): Response {
  return json<SuccessBody<T>>({ data, ...(message && { message }) }, 200)
}

export function created<T>(data: T): Response {
  return json<SuccessBody<T>>({ data }, 201)
}

export function noContent(): Response {
  return new Response(null, { status: 204 })
}

export function badRequest(error: string, code?: string): Response {
  return json<ErrorBody>({ error, ...(code && { code }) }, 400)
}

export function validationError(error: ZodError): Response {
  const details = error.issues.map((i) => ({
    path: i.path.join('.') || '(root)',
    message: i.message,
  }))
  return json<ErrorBody>({ error: 'Validation error', details }, 400)
}

export function unauthorized(error = 'Unauthorized'): Response {
  return json<ErrorBody>({ error }, 401)
}

export function forbidden(error = 'Forbidden'): Response {
  return json<ErrorBody>({ error }, 403)
}

export function notFound(resource = 'Resource'): Response {
  return json<ErrorBody>({ error: `${resource} not found` }, 404)
}

export function conflict(error: string): Response {
  return json<ErrorBody>({ error }, 409)
}

export function serverError(error = 'Internal server error'): Response {
  return json<ErrorBody>({ error }, 500)
}

export function handlePrismaError(e: unknown, resource = 'Resource'): Response {
  if (e instanceof Prisma.PrismaClientKnownRequestError) {
    if (e.code === 'P2025') return notFound(resource)
    if (e.code === 'P2002') return conflict('Resource already exists')
  }
  logger.error('Unhandled error in route', e)
  return serverError()
}
