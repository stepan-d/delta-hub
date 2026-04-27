import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'
import * as dotenv from 'dotenv'

dotenv.config()

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('Seeding database...')

  // Clean up existing data (order matters due to FK constraints)
  await prisma.memeComment.deleteMany()
  await prisma.memeLike.deleteMany()
  await prisma.memeTag.deleteMany()
  await prisma.userReport.deleteMany()
  await prisma.meme.deleteMany()
  await prisma.user.deleteMany()
  await prisma.memeCategory.deleteMany()

  // Users
  const admin = await prisma.user.create({
    data: {
      username: 'delta_admin',
      email: 'admin@delta.cz',
      passwordHash: '$2b$10$hashedpassword_admin',
      role: 'Admin',
      schoolYear: 2020,
    },
  })

  const mod = await prisma.user.create({
    data: {
      username: 'delta_mod',
      email: 'mod@delta.cz',
      passwordHash: '$2b$10$hashedpassword_mod',
      role: 'Moderator',
      schoolYear: 2021,
    },
  })

  const user = await prisma.user.create({
    data: {
      username: 'delta_user',
      email: 'user@delta.cz',
      passwordHash: '$2b$10$hashedpassword_user',
      role: 'User',
      schoolYear: 2023,
    },
  })

  console.log(`Created users: ${admin.username}, ${mod.username}, ${user.username}`)

  // Categories
  const [catKlasika, catCsharp, catWifi, catExam] = await Promise.all([
    prisma.memeCategory.create({
      data: { name: 'Delta klasika', description: 'Klasické deltácké memy' },
    }),
    prisma.memeCategory.create({
      data: { name: 'C# starosti', description: 'Bolesti C# programátorů' },
    }),
    prisma.memeCategory.create({
      data: { name: 'WiFi problémy', description: 'Síť, která nikdy nefunguje' },
    }),
    prisma.memeCategory.create({
      data: { name: 'Exam Stress', description: 'Zkoušky a jejich hrůzy' },
    }),
  ])

  console.log('Created categories')

  // Memes
  const meme1 = await prisma.meme.create({
    data: {
      userId: admin.userId,
      categoryId: catKlasika.categoryId,
      title: 'Kdy konečně opraví projektor v B305?',
      imageUrl: 'https://fake.cdn/memes/projektor.jpg',
      tags: { keywords: ['projektor', 'třída', 'tma'] },
    },
  })

  const meme2 = await prisma.meme.create({
    data: {
      userId: mod.userId,
      categoryId: catCsharp.categoryId,
      title: 'NullReferenceException: Object reference not set',
      imageUrl: 'https://fake.cdn/memes/nullref.jpg',
      tags: { keywords: ['csharp', 'null', 'panic'] },
    },
  })

  const meme3 = await prisma.meme.create({
    data: {
      userId: user.userId,
      categoryId: catWifi.categoryId,
      title: 'WiFi heslo dne: delta2024 (nefunguje stejně)',
      imageUrl: 'https://fake.cdn/memes/wifi.jpg',
      tags: { keywords: ['wifi', 'internet', 'frustrace'] },
    },
  })

  const meme4 = await prisma.meme.create({
    data: {
      userId: user.userId,
      categoryId: catExam.categoryId,
      title: 'Já o 3 ráno před maturitou',
      imageUrl: 'https://fake.cdn/memes/maturita.jpg',
      tags: { keywords: ['maturita', 'studium', 'kava'] },
    },
  })

  const meme5 = await prisma.meme.create({
    data: {
      userId: admin.userId,
      categoryId: catKlasika.categoryId,
      title: 'Obědová fronta v jídelně o 11:45',
      imageUrl: 'https://fake.cdn/memes/jidelna.jpg',
      tags: { keywords: ['jidelna', 'obed', 'fronta'] },
    },
  })

  console.log('Created 5 memes')

  // Likes
  await prisma.$transaction([
    prisma.memeLike.create({ data: { memeId: meme1.memeId, userId: mod.userId } }),
    prisma.meme.update({ where: { memeId: meme1.memeId }, data: { likeCount: { increment: 1 } } }),

    prisma.memeLike.create({ data: { memeId: meme1.memeId, userId: user.userId } }),
    prisma.meme.update({ where: { memeId: meme1.memeId }, data: { likeCount: { increment: 1 } } }),

    prisma.memeLike.create({ data: { memeId: meme2.memeId, userId: admin.userId } }),
    prisma.meme.update({ where: { memeId: meme2.memeId }, data: { likeCount: { increment: 1 } } }),

    prisma.memeLike.create({ data: { memeId: meme3.memeId, userId: admin.userId } }),
    prisma.meme.update({ where: { memeId: meme3.memeId }, data: { likeCount: { increment: 1 } } }),

    prisma.memeLike.create({ data: { memeId: meme3.memeId, userId: mod.userId } }),
    prisma.meme.update({ where: { memeId: meme3.memeId }, data: { likeCount: { increment: 1 } } }),

    prisma.memeLike.create({ data: { memeId: meme4.memeId, userId: mod.userId } }),
    prisma.meme.update({ where: { memeId: meme4.memeId }, data: { likeCount: { increment: 1 } } }),
  ])

  console.log('Created likes')

  // Comments
  await prisma.memeComment.createMany({
    data: [
      { memeId: meme1.memeId, userId: mod.userId, text: 'Zlatá klasika 😂' },
      { memeId: meme1.memeId, userId: user.userId, text: 'Tohle je přesně naše třída' },
      { memeId: meme2.memeId, userId: user.userId, text: 'Každý C# projekt v prvním ročníku' },
      { memeId: meme3.memeId, userId: admin.userId, text: 'Zkusil jsem 5 hesel, nic nefungovalo' },
      { memeId: meme4.memeId, userId: admin.userId, text: 'Každý rok to samé 💀' },
      { memeId: meme5.memeId, userId: user.userId, text: 'Kdo jde dřív, ten má schnitzle' },
    ],
  })

  console.log('Created comments')
  console.log('Seed complete!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
