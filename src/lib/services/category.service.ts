import { prisma } from '@/lib/prisma'
import type { CreateCategoryInput, UpdateCategoryInput } from '@/lib/validations/category.schema'

export async function getCategories() {
  return prisma.memeCategory.findMany({ orderBy: { name: 'asc' } })
}

export async function getCategoryById(categoryId: number) {
  return prisma.memeCategory.findUnique({ where: { categoryId } })
}

export async function getCategoryByName(name: string) {
  return prisma.memeCategory.findUnique({ where: { name } })
}

export async function createCategory(input: CreateCategoryInput) {
  return prisma.memeCategory.create({
    data: { name: input.name, description: input.description },
  })
}

export async function updateCategory(categoryId: number, input: UpdateCategoryInput) {
  return prisma.memeCategory.update({
    where: { categoryId },
    data: {
      ...(input.name !== undefined && { name: input.name }),
      ...(input.description !== undefined && { description: input.description }),
    },
  })
}

export async function deleteCategory(categoryId: number): Promise<void> {
  await prisma.$transaction([
    prisma.meme.updateMany({
      where: { categoryId },
      data: { categoryId: null },
    }),
    prisma.memeCategory.delete({ where: { categoryId } }),
  ])
}
