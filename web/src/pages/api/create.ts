import type { APIRoute } from 'astro'
import { env } from 'cloudflare:workers'
import ipfsHash from 'ipfs-only-hash'
import { z } from 'zod'
import { zfd } from 'zod-form-data'

const Schema = zfd.formData({
  file: zfd.file(),
  title: zfd.text(z.string().default('')),
})

export const POST: APIRoute = async (context) => {
  const formData = await context.request.formData()
  const safeParse = Schema.safeParse(formData)

  if (!safeParse.success) {
    return new Response(
      JSON.stringify({ success: false, error: 'Invalid request' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } },
    )
  }

  const { title, file } = safeParse.data
  const buffer = await file.arrayBuffer()
  const fileHash = await ipfsHash.of(new Uint8Array(buffer))

  try {
    await env.R2.put(fileHash, buffer, {
      customMetadata: { title },
    })

    return new Response(JSON.stringify({ success: true, key: fileHash }), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(
      JSON.stringify({ success: false, error: 'Failed to create file' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    )
  }
}
