import { getRequestContext } from '@cloudflare/next-on-pages'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const headers = request.headers
  const secret = headers.get('x-admin-secret')

  if (secret !== getRequestContext().env.ADMIN_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  return NextResponse.next()
}

export const config = {
  matcher: '/api/:path*',
}
