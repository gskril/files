import type { APIRoute } from 'astro'
import { env } from 'cloudflare:workers'

import { resolveContentType } from '../../utils'

export const GET: APIRoute = async () => {
  const list = await env.R2.list({
    include: ['httpMetadata', 'customMetadata'],
  })

  return new Response(
    JSON.stringify({
      truncated: list.truncated,
      objects: list.objects.map((obj) => ({
        key: obj.key,
        size: obj.size,
        uploaded: obj.uploaded,
        httpMetadata: {
          ...obj.httpMetadata,
          contentType: resolveContentType(
            obj.httpMetadata?.contentType,
            new ArrayBuffer(0),
            obj.customMetadata?.filename
          ),
        },
        customMetadata: obj.customMetadata,
      })),
    }),
    { headers: { 'Content-Type': 'application/json' } }
  )
}
