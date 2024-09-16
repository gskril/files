import { getRequestContext } from '@cloudflare/next-on-pages'
import { NextResponse } from 'next/server'

export const runtime = 'edge'

export async function GET() {
  const r2 = getRequestContext().env.R2
  const list = await r2.list({ include: ['customMetadata'] })

  return NextResponse.json({
    truncated: list.truncated,
    objects: list.objects.map((obj) => ({
      key: obj.key,
      size: obj.size,
      uploaded: obj.uploaded,
      customMetadata: obj.customMetadata,
    })),
  })
}
