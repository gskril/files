import { getRequestContext } from '@cloudflare/next-on-pages'
import { notFound } from 'next/navigation'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

export const runtime = 'edge'

const Schema = z.object({
  fileId: z.string().length(46),
})

type Params = z.infer<typeof Schema>

export async function GET(_req: NextRequest, { params }: { params: Params }) {
  const safeParse = Schema.safeParse(params)

  if (!safeParse.success) {
    return notFound()
  }

  const { fileId } = safeParse.data
  const r2 = getRequestContext().env.R2
  const file = await r2.get(fileId)

  if (!file) {
    return NextResponse.json({ error: 'File not found' }, { status: 404 })
  }

  return new NextResponse(await file.arrayBuffer(), {
    headers: {
      'Content-Type': file.httpMetadata?.contentType!,
      'Cache-Control': 'public, max-age=31536000',
    },
  })
}
