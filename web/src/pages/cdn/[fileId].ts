import type { APIRoute } from 'astro'
import { env } from 'cloudflare:workers'

import { fileIdSchema } from '../../schemas/fileId'
import {
  CONTENT_TYPE_SNIFF_BYTE_LENGTH,
  hasStoredContentType,
  resolveContentType,
} from '../../utils'

function inlineContentDisposition(filename: string): string {
  const safeAsciiFilename =
    filename
      .replace(/[\r\n"\\]/g, '_')
      .replace(/[^\x20-\x7e]/g, '_')
      .slice(0, 180) || 'file'
  const encodedFilename = encodeURIComponent(filename)
    .replace(/'/g, '%27')
    .replace(/\(/g, '%28')
    .replace(/\)/g, '%29')
    .replace(/\*/g, '%2A')

  return `inline; filename="${safeAsciiFilename}"; filename*=UTF-8''${encodedFilename}`
}

export const GET: APIRoute = async (context) => {
  const safeParse = fileIdSchema.safeParse(context.params)

  if (!safeParse.success) {
    return new Response('Not found', { status: 404 })
  }

  const { fileId } = safeParse.data
  const requestedRange = context.request.headers.get('Range')
  const file = await env.R2.get(
    fileId,
    requestedRange ? { range: context.request.headers } : undefined
  )

  if (!file) {
    return new Response(JSON.stringify({ error: 'File not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const declared = file.httpMetadata?.contentType
  let contentType: string

  if (hasStoredContentType(declared)) {
    contentType = resolveContentType(
      declared,
      new ArrayBuffer(0),
      file.customMetadata?.filename
    )
  } else {
    const prefix = await env.R2.get(fileId, {
      range: { offset: 0, length: CONTENT_TYPE_SNIFF_BYTE_LENGTH },
    })
    contentType = resolveContentType(
      declared,
      await prefix!.arrayBuffer(),
      file.customMetadata?.filename
    )
  }

  const headers = new Headers({
    'Content-Type': contentType,
    'Cache-Control': 'public, max-age=31536000',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Range',
    'Access-Control-Allow-Methods': 'GET',
    'Access-Control-Expose-Headers':
      'Accept-Ranges, Content-Length, Content-Range',
    'Access-Control-Max-Age': '86400',
    'Accept-Ranges': 'bytes',
    'X-Content-Type-Options': 'nosniff',
  })

  let status = 200
  if (requestedRange && file.range) {
    const offset =
      'suffix' in file.range
        ? Math.max(file.size - file.range.suffix, 0)
        : (file.range.offset ?? 0)
    const length =
      'suffix' in file.range
        ? Math.min(file.range.suffix, file.size)
        : (file.range.length ?? file.size - offset)

    headers.set(
      'Content-Range',
      `bytes ${offset}-${offset + length - 1}/${file.size}`
    )
    headers.set('Content-Length', String(length))
    status = 206
  } else {
    headers.set('Content-Length', String(file.size))
  }

  let responseFilename = file.customMetadata?.filename
  if (!responseFilename) {
    const fallbackFilename =
      contentType === 'application/pdf'
        ? 'document.pdf'
        : contentType === 'application/json'
          ? 'data.json'
          : contentType === 'text/csv'
            ? 'data.csv'
            : undefined
    responseFilename = fallbackFilename
  }

  if (responseFilename) {
    headers.set(
      'Content-Disposition',
      inlineContentDisposition(responseFilename)
    )
  }

  if (contentType === 'text/html') {
    headers.set('Content-Security-Policy', 'sandbox allow-scripts')
  }

  return new Response(file.body, {
    status,
    headers,
  })
}
