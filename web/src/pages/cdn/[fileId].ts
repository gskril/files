import type { APIRoute } from 'astro'
import { env } from 'cloudflare:workers'

import { fileIdSchema } from '../../schemas/fileId'
import { resolveContentType } from '../../utils'

export const GET: APIRoute = async (context) => {
  const safeParse = fileIdSchema.safeParse(context.params)

  if (!safeParse.success) {
    return new Response('Not found', { status: 404 })
  }

  const { fileId } = safeParse.data
  const file = await env.R2.get(fileId)

  if (!file) {
    return new Response(JSON.stringify({ error: 'File not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const buffer = await file.arrayBuffer()
  const contentType = resolveContentType(file.httpMetadata?.contentType, buffer)

  return new Response(buffer, {
    headers: {
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=31536000',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Allow-Methods': 'GET',
      'Access-Control-Max-Age': '86400',
    },
  })
}
