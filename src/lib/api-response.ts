type SuccessBody<T> = { data: T; message?: string }
type ErrorBody = { error: string; code?: string }

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
