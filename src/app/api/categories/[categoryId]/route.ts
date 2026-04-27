import { badRequest, conflict, noContent, notFound, ok, serverError } from '@/lib/api-response'
import { requireAdmin } from '@/lib/services/auth.service'
import {
  getCategoryById,
  getCategoryByName,
  updateCategory,
  deleteCategory,
} from '@/lib/services/category.service'
import { createAuditLog } from '@/lib/services/audit.service'
import { updateCategorySchema } from '@/lib/validations/category.schema'

type Ctx = { params: Promise<{ categoryId: string }> }

function parseCategoryId(raw: string): number | null {
  const id = parseInt(raw, 10)
  return isNaN(id) ? null : id
}

export async function PATCH(req: Request, { params }: Ctx): Promise<Response> {
  try {
    const result = await requireAdmin()
    if (result instanceof Response) return result
    const session = result

    const { categoryId: raw } = await params
    const categoryId = parseCategoryId(raw)
    if (!categoryId) return badRequest('Invalid categoryId')

    const existing = await getCategoryById(categoryId)
    if (!existing) return notFound('Category')

    const body = await req.json()
    const parsed = updateCategorySchema.safeParse(body)
    if (!parsed.success) return badRequest(parsed.error.issues[0].message)

    if (parsed.data.name && parsed.data.name !== existing.name) {
      const nameConflict = await getCategoryByName(parsed.data.name)
      if (nameConflict) return conflict('Category name already exists')
    }

    const category = await updateCategory(categoryId, parsed.data)
    createAuditLog({ userId: session.userId, action: 'update_category', tableName: 'meme_categories', recordId: categoryId })

    return ok(category)
  } catch {
    return serverError()
  }
}

export async function DELETE(_req: Request, { params }: Ctx): Promise<Response> {
  try {
    const result = await requireAdmin()
    if (result instanceof Response) return result
    const session = result

    const { categoryId: raw } = await params
    const categoryId = parseCategoryId(raw)
    if (!categoryId) return badRequest('Invalid categoryId')

    const existing = await getCategoryById(categoryId)
    if (!existing) return notFound('Category')

    await deleteCategory(categoryId)
    createAuditLog({ userId: session.userId, action: 'delete_category', tableName: 'meme_categories', recordId: categoryId })

    return noContent()
  } catch {
    return serverError()
  }
}
