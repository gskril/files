import type { APIRoute } from 'astro'
import { env } from 'cloudflare:workers'

export const GET: APIRoute = async () => {
  const list = await env.R2.list({ include: ['customMetadata'] })

  return new Response(
    JSON.stringify({
      truncated: list.truncated,
      objects: list.objects.map((obj) => ({
        key: obj.key,
        size: obj.size,
        uploaded: obj.uploaded,
        customMetadata: obj.customMetadata,
      })),
    }),
    { headers: { 'Content-Type': 'application/json' } },
  )
}
