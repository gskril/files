import { defineMiddleware } from 'astro:middleware'

// Workers Cache serves cached responses without invoking the Worker, which
// would skip the auth check below. Responses without Cache-Control are cached
// heuristically (2h for a 200), so API responses must opt out explicitly.
const API_HEADERS = {
  'Content-Type': 'application/json',
  'Cache-Control': 'private, no-store',
}

export const onRequest = defineMiddleware(async (context, next) => {
  if (!context.url.pathname.startsWith('/api/')) return next()

  const secret = context.request.headers.get('x-admin-secret')
  const { env } = await import('cloudflare:workers')

  if (!env.ADMIN_SECRET) {
    return new Response(JSON.stringify({ error: 'Server misconfigured' }), {
      status: 503,
      headers: API_HEADERS,
    })
  }

  if (secret !== env.ADMIN_SECRET) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: API_HEADERS,
    })
  }

  const response = await next()
  response.headers.set('Cache-Control', API_HEADERS['Cache-Control'])
  return response
})
