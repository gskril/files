import { getRequestContext } from '@cloudflare/next-on-pages'
import ipfsHash from 'ipfs-only-hash'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

export const runtime = 'edge'

const Schema = z.object({
  file: z.any(),
  title: z.string(),
})

type Params = z.infer<typeof Schema>

// I think this might only work for files <315mb, which should be fine for compressed video files
// If you need to support larger files, upload to R2 directly via any S3-compatible tool
// Example: https://gist.github.com/gskril/f81fc6ae44aad64213f2e3acc99a6e31
export async function POST(req: NextRequest, { params }: { params: Params }) {
  const body = (await req.json()) || {}
  const safeParse = Schema.safeParse({ ...body, ...params })

  if (!safeParse.success) {
    return NextResponse.json(safeParse.error, { status: 400 })
  }

  const { title, file } = safeParse.data

  const buffer = Buffer.from(file)
  const fileHash = await ipfsHash.of(buffer)
  const r2 = getRequestContext().env.R2
  const fileExists = await r2.get(fileHash)

  if (fileExists) {
    return NextResponse.json(
      { success: false, error: 'File already exists' },
      { status: 400 }
    )
  }

  try {
    await r2.put(fileHash, buffer, {
      customMetadata: { title },
    })

    return NextResponse.json({ success: true, key: fileHash })
  } catch (err) {
    return NextResponse.json(
      { success: false, error: 'Failed to create file' },
      { status: 500 }
    )
  }
}
