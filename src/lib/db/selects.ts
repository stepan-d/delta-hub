export const publicUserSelect = {
  userId: true,
  username: true,
  role: true,
  schoolYear: true,
  favoriteSubject: true,
  createdAt: true,
} as const

export const privateUserSelect = {
  ...publicUserSelect,
  email: true,
} as const
