export type MemeAuthor = {
  userId: number;
  username: string;
  role: string;
  schoolYear?: number | null;
  favoriteSubject?: string | null;
  createdAt?: string;
};

export type MemeCategory = {
  categoryId: number;
  name: string;
  description?: string | null;
};

export type MemeItem = {
  memeId: number;
  title?: string | null;
  imageUrl: string;
  likeCount: number;
  commentCount: number;
  createdAt: string;
  categoryId?: number | null;
  category?: MemeCategory | null;
  author: MemeAuthor;
  tags?: Record<string, unknown> | null;
  likedByCurrentUser?: boolean;
};

export type SessionUser = {
  userId: number;
  username: string;
  email: string;
  role: string;
};

export type MemeComment = {
  commentId: number;
  memeId: number;
  text: string;
  createdAt: string;
  updatedAt: string;
  author: {
    userId: number;
    username: string;
    email: string;
    role: string;
    schoolYear?: number | null;
    favoriteSubject?: string | null;
    createdAt?: string;
  };
};

export type MemeListResponse = {
  memes: MemeItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export type LikeResponse = {
  liked: boolean;
  likeCount: number;
};

export type UploadedImageResponse = {
  imageUrl: string;
  objectKey: string;
  contentType: "image/webp";
  width: number;
  height: number;
  size: number;
};

export function readTagNames(tags: Record<string, unknown> | null | undefined) {
  if (!tags || typeof tags !== "object") return [];
  return Object.keys(tags);
}

export function tagsObjectToInput(tags: Record<string, unknown> | null | undefined) {
  return readTagNames(tags).join(",");
}

export function tagsInputToObject(raw: string) {
  return raw
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean)
    .reduce<Record<string, number>>((accumulator, tag) => {
      accumulator[tag] = 1;
      return accumulator;
    }, {});
}
