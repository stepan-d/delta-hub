import { randomUUID } from 'node:crypto'
import sharp from 'sharp'
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { logger } from '@/lib/logger'

const MAX_UPLOAD_BYTES = 12 * 1024 * 1024
const ALLOWED_IMAGE_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/avif',
  'image/tiff',
])

type ImageProcessingPreset = {
  maxDimension: number
  quality: number
}

export type UploadedImage = {
  imageUrl: string
  objectKey: string
  contentType: 'image/webp'
  width: number
  height: number
  size: number
}

class UploadError extends Error {
  status: number
  code: string

  constructor(message: string, status = 400, code = 'UPLOAD_ERROR') {
    super(message)
    this.name = 'UploadError'
    this.status = status
    this.code = code
  }
}

type StorageConfig = {
  bucket: string
  publicBaseUrl: string
  client: S3Client
}

function getRequiredEnv(name: string): string {
  const value = process.env[name]?.trim()
  if (!value) {
    throw new UploadError(`Missing required environment variable: ${name}`, 500, 'STORAGE_NOT_CONFIGURED')
  }
  return value
}

function getStorageConfig(): StorageConfig {
  const endpoint = getRequiredEnv('MINIO_ENDPOINT')
  const region = process.env.MINIO_REGION?.trim() || 'us-east-1'
  const bucket = getRequiredEnv('MINIO_BUCKET')
  const accessKeyId = getRequiredEnv('MINIO_ACCESS_KEY')
  const secretAccessKey = getRequiredEnv('MINIO_SECRET_KEY')
  const publicBaseUrl = getRequiredEnv('MINIO_PUBLIC_BASE_URL').replace(/\/+$/, '')
  const forcePathStyle = process.env.MINIO_FORCE_PATH_STYLE?.trim() !== 'false'

  return {
    bucket,
    publicBaseUrl,
    client: new S3Client({
      endpoint,
      region,
      forcePathStyle,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    }),
  }
}

function sanitizeFileBaseName(fileName: string): string {
  const withoutExtension = fileName.replace(/\.[^.]+$/, '')
  const ascii = withoutExtension.normalize('NFKD').replace(/[^\x00-\x7F]/g, '')
  const slug = ascii
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

  return slug || 'image'
}

function choosePreset(fileSize: number): ImageProcessingPreset {
  if (fileSize > 8 * 1024 * 1024) {
    return { maxDimension: 1800, quality: 70 }
  }

  if (fileSize > 4 * 1024 * 1024) {
    return { maxDimension: 2048, quality: 74 }
  }

  if (fileSize > 2 * 1024 * 1024) {
    return { maxDimension: 2400, quality: 78 }
  }

  return { maxDimension: 2560, quality: 82 }
}

function assertValidImageFile(file: File): void {
  if (!file.size) {
    throw new UploadError('Soubor je prázdný.', 400, 'EMPTY_FILE')
  }

  if (file.size > MAX_UPLOAD_BYTES) {
    throw new UploadError('Soubor je příliš velký. Maximum je 12 MB.', 400, 'FILE_TOO_LARGE')
  }

  if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
    throw new UploadError('Povolené jsou jen běžné rastrové obrázky.', 400, 'INVALID_FILE_TYPE')
  }
}

async function transformToWebp(file: File): Promise<{
  body: Buffer
  width: number
  height: number
}> {
  const inputBuffer = Buffer.from(await file.arrayBuffer())
  const preset = choosePreset(file.size)

  try {
    const pipeline = sharp(inputBuffer, { failOn: 'error' }).rotate()
    const metadata = await pipeline.metadata()

    const resized = pipeline.resize({
      width: preset.maxDimension,
      height: preset.maxDimension,
      fit: 'inside',
      withoutEnlargement: true,
    })

    const { data, info } = await resized
      .webp({
        quality: preset.quality,
        effort: 4,
      })
      .toBuffer({ resolveWithObject: true })

    return {
      body: data,
      width: info.width || metadata.width || preset.maxDimension,
      height: info.height || metadata.height || preset.maxDimension,
    }
  } catch {
    throw new UploadError('Soubor se nepodařilo zpracovat jako podporovaný obrázek.', 400, 'IMAGE_PROCESSING_FAILED')
  }
}

export function isUploadError(error: unknown): error is UploadError {
  return error instanceof UploadError
}

export async function uploadMemeImage(file: File): Promise<UploadedImage> {
  assertValidImageFile(file)

  const { bucket, publicBaseUrl, client } = getStorageConfig()
  const transformed = await transformToWebp(file)
  const now = new Date()
  const fileBaseName = sanitizeFileBaseName(file.name)
  const objectKey = [
    'memes',
    String(now.getUTCFullYear()),
    String(now.getUTCMonth() + 1).padStart(2, '0'),
    `${Date.now()}-${randomUUID()}-${fileBaseName}.webp`,
  ].join('/')

  try {
    await client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: objectKey,
        Body: transformed.body,
        ContentType: 'image/webp',
        CacheControl: 'public, max-age=31536000, immutable',
      }),
    )
  } catch (error) {
    logger.error('Image upload to object storage failed', error)
    throw new UploadError('Obrázek se nepodařilo uložit do úložiště.', 500, 'STORAGE_UPLOAD_FAILED')
  }

  return {
    imageUrl: `${publicBaseUrl}/${objectKey}`,
    objectKey,
    contentType: 'image/webp',
    width: transformed.width,
    height: transformed.height,
    size: transformed.body.byteLength,
  }
}
