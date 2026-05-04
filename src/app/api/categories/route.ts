export const runtime = 'nodejs'

import { after } from 'next/server'
import { badRequest, conflict, created, ok, handlePrismaError, validationError } from '@/lib/api-response'
import { requireAdmin } from '@/lib/services/auth.service'
import { getCategories, getCategoryByName, createCategory } from '@/lib/services/category.service'
import { createAuditLog } from '@/lib/services/audit.service'
import { createCategorySchema } from '@/lib/validations/category.schema'

export async function GET(): Promise<Response> {
  try {
    const categories = await getCategories()
    return ok(categories)
  } catch (e) {
    return handlePrismaError(e)
  }
}

export async function POST(req: Request): Promise<Response> {
  try {
    const result = await requireAdmin()
    if (result instanceof Response) return result
    const session = result

    const body = await req.json()
    const parsed = createCategorySchema.safeParse(body)
    if (!parsed.success) return validationError(parsed.error)

    const existing = await getCategoryByName(parsed.data.name)
    if (existing) return conflict('Category name already exists')

    const category = await createCategory(parsed.data)
    after(() => createAuditLog({ userId: session.userId, action: 'create_category', tableName: 'meme_categories', recordId: category.categoryId }))

    return created(category)
  } catch (e) {
    return handlePrismaError(e)
  }
}
