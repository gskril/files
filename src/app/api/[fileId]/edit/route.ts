import { getRequestContext } from '@cloudflare/next-on-pages'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

export const runtime = 'edge'

const Schema = z.object({
  fileId: z.string().length(46),
  title: z.string(),
})

type Params = z.infer<typeof Schema>

export async function POST(req: NextRequest, { params }: { params: Params }) {
  const body = (await req.json()) || {}
  const safeParse = Schema.safeParse({ ...body, ...params })

  if (!safeParse.success) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  const { fileId, title } = safeParse.data

  const r2 = getRequestContext().env.R2
  const file = await r2.get(fileId)

  if (!file) {
    return NextResponse.json({ error: 'File not found' }, { status: 404 })
  }

  await r2.put(fileId, await file.blob(), {
    customMetadata: { title },
  })

  return NextResponse.json({ success: true })
}
