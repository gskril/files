import type { APIRoute } from 'astro'
import { env } from 'cloudflare:workers'
import { z } from 'zod'

const Schema = z.object({
  fileId: z.string().length(46),
})

export const GET: APIRoute = async (context) => {
  const safeParse = Schema.safeParse(context.params)

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

  return new Response(await file.arrayBuffer(), {
    headers: {
      'Content-Type': file.httpMetadata?.contentType!,
      'Cache-Control': 'public, max-age=31536000',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Allow-Methods': 'GET',
      'Access-Control-Max-Age': '86400',
    },
  })
}
