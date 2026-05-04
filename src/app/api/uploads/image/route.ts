export const runtime = 'nodejs'

import { badRequest, created, serverError } from '@/lib/api-response'
import { requireAuth } from '@/lib/services/auth.service'
import { isUploadError, uploadMemeImage } from '@/lib/services/storage.service'

export async function POST(req: Request): Promise<Response> {
  try {
    const result = await requireAuth()
    if (result instanceof Response) return result

    const formData = await req.formData()
    const file = formData.get('file')

    if (!(file instanceof File)) {
      return badRequest('Nahraj obrázek v poli "file".', 'FILE_REQUIRED')
    }

    const uploaded = await uploadMemeImage(file)
    return created(uploaded)
  } catch (error) {
    if (isUploadError(error)) {
      if (error.status >= 500) {
        return serverError(error.message)
      }

      return badRequest(error.message, error.code)
    }

    return serverError()
  }
}
