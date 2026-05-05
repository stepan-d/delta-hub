export const runtime = 'nodejs'

import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3'

function getClient() {
  return new S3Client({
    endpoint: process.env.MINIO_ENDPOINT!,
    region: process.env.MINIO_REGION || 'us-east-1',
    forcePathStyle: process.env.MINIO_FORCE_PATH_STYLE !== 'false',
    credentials: {
      accessKeyId: process.env.MINIO_ACCESS_KEY!,
      secretAccessKey: process.env.MINIO_SECRET_KEY!,
    },
  })
}

type Ctx = { params: Promise<{ key: string[] }> }

export async function GET(_req: Request, { params }: Ctx): Promise<Response> {
  const { key } = await params
  const objectKey = key.join('/')

  try {
    const result = await getClient().send(
      new GetObjectCommand({ Bucket: process.env.MINIO_BUCKET!, Key: objectKey }),
    )

    if (!result.Body) return new Response('Not found', { status: 404 })

    return new Response(result.Body.transformToWebStream(), {
      headers: {
        'Content-Type': result.ContentType || 'image/webp',
        'Cache-Control': result.CacheControl || 'public, max-age=31536000, immutable',
        ...(result.ContentLength ? { 'Content-Length': String(result.ContentLength) } : {}),
      },
    })
  } catch {
    return new Response('Not found', { status: 404 })
  }
}
