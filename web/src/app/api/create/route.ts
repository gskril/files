import { getRequestContext } from '@cloudflare/next-on-pages'
import ipfsHash from 'ipfs-only-hash'
import { NextRequest, NextResponse } from 'next/server'
import { zfd } from 'zod-form-data'

export const runtime = 'edge'

const Schema = zfd.formData({
  file: zfd.file(),
  title: zfd.text(),
})

export async function POST(req: NextRequest) {
  const formData = await req.formData()
  const safeParse = Schema.safeParse(formData)

  if (!safeParse.success) {
    return NextResponse.json(
      { success: false, error: 'Invalid request' },
      { status: 400 }
    )
  }

  const { title, file } = safeParse.data

  const buffer = await file.arrayBuffer()
  const fileHash = await ipfsHash.of(new Uint8Array(buffer))
  const r2 = getRequestContext().env.R2

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
