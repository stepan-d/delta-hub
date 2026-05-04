import bcrypt from 'bcryptjs'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient, type Prisma } from '@prisma/client'
import * as dotenv from 'dotenv'

dotenv.config()

const connectionString = process.env.DATABASE_URL

if (!connectionString) {
  throw new Error('DATABASE_URL is required to run the seed script.')
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
})

const DEMO_PASSWORD = process.env.DEMO_SEED_PASSWORD ?? 'DeltaHubDemo123!'

const demoUsers = [
  {
    username: 'delta_admin',
    email: 'admin@delta-hub.demo',
    role: 'Admin',
    schoolYear: 2020,
    favoriteSubject: 'Architektura softwaru',
  },
  {
    username: 'terka_ui',
    email: 'terka@delta-hub.demo',
    role: 'User',
    schoolYear: 2024,
    favoriteSubject: 'UX design',
  },
  {
    username: 'roman_mod',
    email: 'moderator@delta-hub.demo',
    role: 'Moderator',
    schoolYear: 2023,
    favoriteSubject: 'Kyberbezpecnost',
  },
  {
    username: 'vojta_backend',
    email: 'vojta@delta-hub.demo',
    role: 'User',
    schoolYear: 2023,
    favoriteSubject: 'Databaze',
  },
  {
    username: 'misa_memes',
    email: 'misa@delta-hub.demo',
    role: 'User',
    schoolYear: 2022,
    favoriteSubject: 'Matematika',
  },
  {
    username: 'anet_events',
    email: 'anet@delta-hub.demo',
    role: 'User',
    schoolYear: 2021,
    favoriteSubject: 'Marketing',
  },
] as const

const demoCategories = [
  {
    name: 'Ze zivota DELTY',
    description: 'Kazdodenni skola, chodby, ucebny a vsechny male katastrofy mezi hodinami.',
  },
  {
    name: 'Programatorske bolesti',
    description: 'Bugy, buildy, terminal a radosti, ktere pochopi kazdy student IT.',
  },
  {
    name: 'Maturita mode',
    description: 'Stres, kofein a posledni zachrana pred odevzdanim nebo zkouskou.',
  },
  {
    name: 'Skolni akce',
    description: 'Meetupy, workshopy, hackathony a momenty z komunitniho zivota.',
  },
] as const

const demoMemes = [
  {
    authorEmail: 'terka@delta-hub.demo',
    categoryName: 'Ze zivota DELTY',
    title: 'Kdyz ucitel rekne, ze projektor uz dneska urcite pojede',
    imageUrl:
      'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80',
    tags: ['projektor', 'ucebna', 'klasika'],
  },
  {
    authorEmail: 'vojta@delta-hub.demo',
    categoryName: 'Programatorske bolesti',
    title: 'Deploy v 16:59 v patek byl pry skvely napad',
    imageUrl:
      'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?auto=format&fit=crop&w=1200&q=80',
    tags: ['deploy', 'backend', 'panic'],
  },
  {
    authorEmail: 'misa@delta-hub.demo',
    categoryName: 'Maturita mode',
    title: 'Ja po treti kave, kdyz zjistim, ze termin odevzdani byl vcera',
    imageUrl:
      'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=1200&q=80',
    tags: ['maturita', 'kava', 'deadline'],
  },
  {
    authorEmail: 'anet@delta-hub.demo',
    categoryName: 'Skolni akce',
    title: 'Kdyz na skolni meetup prijde vic alumni nez bylo zidli',
    imageUrl:
      'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1200&q=80',
    tags: ['meetup', 'alumni', 'komunita'],
  },
  {
    authorEmail: 'admin@delta-hub.demo',
    categoryName: 'Ze zivota DELTY',
    title: 'Fronta na obed vypada jak launch nove konzole',
    imageUrl:
      'https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?auto=format&fit=crop&w=1200&q=80',
    tags: ['jidelna', 'obed', 'fronta'],
  },
  {
    authorEmail: 'admin@delta-hub.demo',
    categoryName: 'Programatorske bolesti',
    title: 'Kdyz Wi-Fi funguje jen dokud ji nikdo nepotrebuje',
    imageUrl:
      'https://images.unsplash.com/photo-1520869562399-e772f042f422?auto=format&fit=crop&w=1200&q=80',
    tags: ['wifi', 'sit', 'frustrace'],
  },
] as const

const demoLikes = [
  { memeTitle: 'Kdyz ucitel rekne, ze projektor uz dneska urcite pojede', userEmail: 'vojta@delta-hub.demo' },
  { memeTitle: 'Kdyz ucitel rekne, ze projektor uz dneska urcite pojede', userEmail: 'misa@delta-hub.demo' },
  { memeTitle: 'Deploy v 16:59 v patek byl pry skvely napad', userEmail: 'admin@delta-hub.demo' },
  { memeTitle: 'Deploy v 16:59 v patek byl pry skvely napad', userEmail: 'anet@delta-hub.demo' },
  { memeTitle: 'Ja po treti kave, kdyz zjistim, ze termin odevzdani byl vcera', userEmail: 'terka@delta-hub.demo' },
  { memeTitle: 'Ja po treti kave, kdyz zjistim, ze termin odevzdani byl vcera', userEmail: 'admin@delta-hub.demo' },
  { memeTitle: 'Kdyz na skolni meetup prijde vic alumni nez bylo zidli', userEmail: 'terka@delta-hub.demo' },
  { memeTitle: 'Kdyz na skolni meetup prijde vic alumni nez bylo zidli', userEmail: 'vojta@delta-hub.demo' },
  { memeTitle: 'Fronta na obed vypada jak launch nove konzole', userEmail: 'misa@delta-hub.demo' },
  { memeTitle: 'Kdyz Wi-Fi funguje jen dokud ji nikdo nepotrebuje', userEmail: 'vojta@delta-hub.demo' },
] as const

const demoComments = [
  {
    memeTitle: 'Kdyz ucitel rekne, ze projektor uz dneska urcite pojede',
    userEmail: 'admin@delta-hub.demo',
    text: 'Tohle je presne ta minuta, kdy vsichni instinktivne sahnou po HDMI redukci.',
  },
  {
    memeTitle: 'Kdyz ucitel rekne, ze projektor uz dneska urcite pojede',
    userEmail: 'misa@delta-hub.demo',
    text: 'A pak se stejne jede plan B: screenshoty do Discordu.',
  },
  {
    memeTitle: 'Deploy v 16:59 v patek byl pry skvely napad',
    userEmail: 'terka@delta-hub.demo',
    text: 'Nejvetsi confidence boost pred vikendem.',
  },
  {
    memeTitle: 'Ja po treti kave, kdyz zjistim, ze termin odevzdani byl vcera',
    userEmail: 'vojta@delta-hub.demo',
    text: 'Klasicke "jen jeste jednu upravu" ve 2:13 rano.',
  },
  {
    memeTitle: 'Kdyz na skolni meetup prijde vic alumni nez bylo zidli',
    userEmail: 'admin@delta-hub.demo',
    text: 'To je presne ten problem, ktery chceme mit kazdy rok.',
  },
  {
    memeTitle: 'Fronta na obed vypada jak launch nove konzole',
    userEmail: 'anet@delta-hub.demo',
    text: 'Jestli dneska vyjde rizek, tak to bylo worth it.',
  },
  {
    memeTitle: 'Kdyz Wi-Fi funguje jen dokud ji nikdo nepotrebuje',
    userEmail: 'terka@delta-hub.demo',
    text: 'Signal plny, internet zadny. Tradice.',
  },
] as const

const demoReports = [
  {
    memeTitle: 'Deploy v 16:59 v patek byl pry skvely napad',
    reporterEmail: 'misa@delta-hub.demo',
    reason: 'Příspěvek je hodně interní a bez kontextu může působit nejasně pro širší komunitu.',
    status: 'reviewed',
  },
  {
    memeTitle: 'Kdyz Wi-Fi funguje jen dokud ji nikdo nepotrebuje',
    reporterEmail: 'anet@delta-hub.demo',
    reason: 'Obsah je v pořádku, ale hlásím ho jako ukázku běžného moderátorského podnětu od komunity.',
    status: 'pending',
  },
  {
    memeTitle: 'Fronta na obed vypada jak launch nove konzole',
    reporterEmail: 'vojta@delta-hub.demo',
    reason: 'Obrázek i text sedí, jen ověřuji, jak vypadá uzavřené nahlášení po vyřešení.',
    status: 'resolved',
  },
] as const

const demoEvents = [
  {
    name: 'DELTA Alumni Meetup 2026',
    date: '2026-05-21',
    detailsJson: {
      location: 'Atrium DELTA',
      type: 'meetup',
      audience: 'alumni, studenti, partneri',
      agenda: ['networking', 'mini talks', 'aftermovie z hackathonu'],
    },
  },
  {
    name: 'Workshop: Jak prezit maturitni tyden',
    date: '2026-05-27',
    detailsJson: {
      location: 'Ucebna B204',
      type: 'workshop',
      speaker: 'Skolni mentor team',
      capacity: 40,
    },
  },
  {
    name: 'Studentsky meme contest finale',
    date: '2026-06-03',
    detailsJson: {
      location: 'Aula',
      type: 'community',
      prize: 'DELTA merch a eternal glory',
    },
  },
] as const

const demoAuditActions = [
  'seed_demo_users',
  'seed_demo_categories',
  'seed_demo_memes',
  'seed_demo_reports',
  'seed_demo_events',
  'seed_demo_refresh',
] as const

function tagsToJson(tags: readonly string[]): Prisma.InputJsonObject {
  const entries = tags.map((tag) => [tag, 1] as const)
  return Object.fromEntries(entries) as Prisma.InputJsonObject
}

async function upsertDemoUser(
  passwordHash: string,
  user: (typeof demoUsers)[number],
) {
  const existing = await prisma.user.findMany({
    where: {
      OR: [{ email: user.email }, { username: user.username }],
    },
    orderBy: { userId: 'asc' },
  })

  await deleteDuplicatesByIds(
    existing.map((item) => item.userId),
    (idsToDelete) => prisma.user.deleteMany({ where: { userId: { in: idsToDelete } } }),
  )

  const firstMatch = existing[0]

  if (firstMatch) {
    return prisma.user.update({
      where: { userId: firstMatch.userId },
      data: {
        username: user.username,
        email: user.email,
        passwordHash,
        role: user.role,
        schoolYear: user.schoolYear,
        favoriteSubject: user.favoriteSubject,
      },
    })
  }

  return prisma.user.create({
    data: {
      username: user.username,
      email: user.email,
      passwordHash,
      role: user.role,
      schoolYear: user.schoolYear,
      favoriteSubject: user.favoriteSubject,
    },
  })
}

async function upsertCategory(category: (typeof demoCategories)[number]) {
  return prisma.memeCategory.upsert({
    where: { name: category.name },
    update: { description: category.description },
    create: category,
  })
}

async function deleteDuplicatesByIds<T extends number>(
  ids: T[],
  remover: (idsToDelete: T[]) => Promise<unknown>,
) {
  if (ids.length <= 1) return
  await remover(ids.slice(1))
}

async function upsertDemoMeme(input: {
  authorId: number
  categoryId: number
  title: string
  imageUrl: string
  tags: readonly string[]
}) {
  const existing = await prisma.meme.findMany({
    where: {
      userId: input.authorId,
      title: input.title,
    },
    orderBy: { memeId: 'asc' },
  })

  await deleteDuplicatesByIds(
    existing.map((item) => item.memeId),
    (idsToDelete) => prisma.meme.deleteMany({ where: { memeId: { in: idsToDelete } } }),
  )

  const firstMatch = existing[0]
  const tagJson = tagsToJson(input.tags)

  const meme = firstMatch
    ? await prisma.meme.update({
        where: { memeId: firstMatch.memeId },
        data: {
          categoryId: input.categoryId,
          imageUrl: input.imageUrl,
          tags: tagJson,
        },
      })
    : await prisma.meme.create({
        data: {
          userId: input.authorId,
          categoryId: input.categoryId,
          title: input.title,
          imageUrl: input.imageUrl,
          tags: tagJson,
        },
      })

  await prisma.memeTag.deleteMany({ where: { memeId: meme.memeId } })
  await prisma.memeTag.createMany({
    data: input.tags.map((tagName) => ({
      memeId: meme.memeId,
      tagName,
      weight: 1,
    })),
  })

  return meme
}

async function upsertDemoEvent(event: (typeof demoEvents)[number]) {
  const existing = await prisma.schoolEvent.findMany({
    where: { name: event.name },
    orderBy: { eventId: 'asc' },
  })

  await deleteDuplicatesByIds(
    existing.map((item) => item.eventId),
    (idsToDelete) => prisma.schoolEvent.deleteMany({ where: { eventId: { in: idsToDelete } } }),
  )

  const firstMatch = existing[0]

  if (firstMatch) {
    return prisma.schoolEvent.update({
      where: { eventId: firstMatch.eventId },
      data: {
        date: event.date ? new Date(event.date) : null,
        detailsJson: event.detailsJson,
      },
    })
  }

  return prisma.schoolEvent.create({
    data: {
      name: event.name,
      date: event.date ? new Date(event.date) : null,
      detailsJson: event.detailsJson,
    },
  })
}

async function main() {
  console.log('Seeding demo database...')

  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12)

  const users = await Promise.all(demoUsers.map((user) => upsertDemoUser(passwordHash, user)))
  const userByEmail = new Map(users.map((user) => [user.email, user]))

  const categories = await Promise.all(demoCategories.map(upsertCategory))
  const categoryByName = new Map(categories.map((category) => [category.name, category]))

  const memes: Awaited<ReturnType<typeof upsertDemoMeme>>[] = []
  for (const meme of demoMemes) {
    const author = userByEmail.get(meme.authorEmail)
    const category = categoryByName.get(meme.categoryName)

    if (!author) {
      throw new Error(`Missing seeded author for ${meme.authorEmail}`)
    }
    if (!category) {
      throw new Error(`Missing seeded category for ${meme.categoryName}`)
    }

    memes.push(
      await upsertDemoMeme({
        authorId: author.userId,
        categoryId: category.categoryId,
        title: meme.title,
        imageUrl: meme.imageUrl,
        tags: meme.tags,
      }),
    )
  }

  const memeByTitle = new Map(memes.map((meme) => [meme.title ?? '', meme]))
  const demoMemeIds = memes.map((meme) => meme.memeId)
  const demoUserIds = users.map((user) => user.userId)

  await prisma.memeLike.deleteMany({
    where: {
      memeId: { in: demoMemeIds },
      userId: { in: demoUserIds },
    },
  })

  await prisma.memeLike.createMany({
    data: demoLikes.map((like) => {
      const meme = memeByTitle.get(like.memeTitle)
      const user = userByEmail.get(like.userEmail)

      if (!meme) throw new Error(`Missing meme for like: ${like.memeTitle}`)
      if (!user) throw new Error(`Missing user for like: ${like.userEmail}`)

      return {
        memeId: meme.memeId,
        userId: user.userId,
      }
    }),
    skipDuplicates: true,
  })

  for (const meme of memes) {
    const likeCount = await prisma.memeLike.count({ where: { memeId: meme.memeId } })
    await prisma.meme.update({
      where: { memeId: meme.memeId },
      data: { likeCount },
    })
  }

  await prisma.memeComment.deleteMany({
    where: {
      memeId: { in: demoMemeIds },
      userId: { in: demoUserIds },
    },
  })

  await prisma.memeComment.createMany({
    data: demoComments.map((comment) => {
      const meme = memeByTitle.get(comment.memeTitle)
      const user = userByEmail.get(comment.userEmail)

      if (!meme) throw new Error(`Missing meme for comment: ${comment.memeTitle}`)
      if (!user) throw new Error(`Missing user for comment: ${comment.userEmail}`)

      return {
        memeId: meme.memeId,
        userId: user.userId,
        text: comment.text,
      }
    }),
  })

  await prisma.userReport.deleteMany({
    where: {
      memeId: { in: demoMemeIds },
      reporterId: { in: demoUserIds },
    },
  })

  const seededReports: Awaited<ReturnType<typeof prisma.userReport.create>>[] = []
  for (const report of demoReports) {
    const meme = memeByTitle.get(report.memeTitle)
    const reporter = userByEmail.get(report.reporterEmail)

    if (!meme) throw new Error(`Missing meme for report: ${report.memeTitle}`)
    if (!reporter) throw new Error(`Missing reporter for report: ${report.reporterEmail}`)

    seededReports.push(
      await prisma.userReport.create({
        data: {
          memeId: meme.memeId,
          reporterId: reporter.userId,
          reason: report.reason,
          status: report.status,
        },
      }),
    )
  }

  const seededEvents: Awaited<ReturnType<typeof upsertDemoEvent>>[] = []
  for (const event of demoEvents) {
    seededEvents.push(await upsertDemoEvent(event))
  }

  await prisma.auditLog.deleteMany({
    where: {
      userId: { in: demoUserIds },
      action: { in: [...demoAuditActions] },
    },
  })

  await prisma.auditLog.createMany({
    data: [
      {
        userId: userByEmail.get('admin@delta-hub.demo')?.userId ?? null,
        action: 'seed_demo_refresh',
        tableName: 'users',
      },
      ...users.map((user) => ({
        userId: user.userId,
        action: 'seed_demo_users',
        tableName: 'users',
        recordId: user.userId,
      })),
      ...categories.map((category) => ({
        userId: userByEmail.get('admin@delta-hub.demo')?.userId ?? null,
        action: 'seed_demo_categories',
        tableName: 'meme_categories',
        recordId: category.categoryId,
      })),
      ...memes.map((meme) => ({
        userId: meme.userId,
        action: 'seed_demo_memes',
        tableName: 'memes',
        recordId: meme.memeId,
      })),
      ...seededReports.map((report) => ({
        userId: report.reporterId,
        action: 'seed_demo_reports',
        tableName: 'user_reports',
        recordId: report.reportId,
      })),
      ...seededEvents.map((event) => ({
        userId: userByEmail.get('admin@delta-hub.demo')?.userId ?? null,
        action: 'seed_demo_events',
        tableName: 'school_events',
        recordId: event.eventId,
      })),
    ],
  })

  console.log(`Demo password: ${DEMO_PASSWORD}`)
  console.log(`Seeded ${users.length} users, ${categories.length} categories, ${memes.length} memes.`)
  console.log(
    `Seeded ${demoLikes.length} likes, ${demoComments.length} comments, ${seededReports.length} reports, ${seededEvents.length} events.`,
  )
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
