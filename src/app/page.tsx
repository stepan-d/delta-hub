import { prisma } from '@/lib/prisma'

type MemeWithRelations = {
  memeId: number
  title: string | null
  imageUrl: string
  likeCount: number
  createdAt: Date
  user: { userId: number; username: string }
  category: { categoryId: number; name: string } | null
  _count: { memeLikes: number; memeComments: number }
}

async function getMemes(): Promise<MemeWithRelations[]> {
  return prisma.meme.findMany({
    include: {
      user: { select: { userId: true, username: true } },
      category: { select: { categoryId: true, name: true } },
      _count: { select: { memeLikes: true, memeComments: true } },
    },
    orderBy: { createdAt: 'desc' },
  })
}

export default async function Home() {
  const memes = await getMemes()

  return (
    <div className="min-h-screen bg-zinc-100 dark:bg-zinc-900">
      <header className="bg-white dark:bg-zinc-800 border-b border-zinc-200 dark:border-zinc-700 px-6 py-4">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
          Delta Alumni Meme Hub
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
          {memes.length} memů a přibývá
        </p>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        {memes.length === 0 ? (
          <p className="text-center text-zinc-500 py-16">Zatím žádné memy. Buď první!</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {memes.map((meme) => (
              <div
                key={meme.memeId}
                className="bg-white dark:bg-zinc-800 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-700 overflow-hidden flex flex-col"
              >
                <div className="bg-zinc-200 dark:bg-zinc-700 h-48 flex items-center justify-center text-zinc-400 dark:text-zinc-500 text-sm px-4 text-center">
                  {meme.imageUrl}
                </div>

                <div className="p-4 flex flex-col gap-2 flex-1">
                  <h2 className="font-semibold text-zinc-900 dark:text-zinc-50 leading-snug">
                    {meme.title ?? '(bez názvu)'}
                  </h2>

                  <div className="flex items-center gap-2 flex-wrap">
                    {meme.category && (
                      <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full">
                        {meme.category.name}
                      </span>
                    )}
                    <span className="text-xs text-zinc-400">@{meme.user.username}</span>
                  </div>

                  <div className="mt-auto pt-2 flex items-center gap-4 text-sm text-zinc-500 dark:text-zinc-400 border-t border-zinc-100 dark:border-zinc-700">
                    <span title="Likes">❤️ {meme.likeCount}</span>
                    <span title="Comments">💬 {meme._count.memeComments}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
