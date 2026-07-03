import type { APIRoute } from 'astro'
import { env } from 'cloudflare:workers'
import { z } from 'zod'
import { zfd } from 'zod-form-data'

import { sha256Hex, contentTypeForUpload } from '../../utils'

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
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    )
  }

  const { title, file } = safeParse.data
  const buffer = await file.arrayBuffer()
  const fileHash = await sha256Hex(buffer)
  const contentType = contentTypeForUpload(file, buffer)

  try {
    await env.R2.put(fileHash, buffer, {
      // The share page and /cdn route rely on contentType to render the file.
      httpMetadata: { contentType },
      customMetadata: { title },
    })

    return new Response(JSON.stringify({ success: true, key: fileHash }), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(
      JSON.stringify({ success: false, error: 'Failed to create file' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}
