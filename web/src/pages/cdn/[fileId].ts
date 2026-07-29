import type { APIRoute } from 'astro'
import { env } from 'cloudflare:workers'

import { parseByteRange } from '../../httpRange'
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

function fallbackFilenameForContentType(
  contentType: string
): string | undefined {
  switch (contentType) {
    case 'image/png':
      return 'image.png'
    case 'image/jpeg':
      return 'image.jpg'
    case 'image/gif':
      return 'image.gif'
    case 'image/webp':
      return 'image.webp'
    case 'image/avif':
      return 'image.avif'
    case 'video/mp4':
      return 'video.mp4'
    case 'video/webm':
      return 'video.webm'
    case 'video/quicktime':
      return 'video.mov'
    case 'audio/mpeg':
      return 'audio.mp3'
    case 'audio/mp4':
      return 'audio.m4a'
    case 'audio/aac':
      return 'audio.aac'
    case 'audio/wav':
      return 'audio.wav'
    case 'audio/flac':
      return 'audio.flac'
    case 'audio/ogg':
      return 'audio.ogg'
    case 'text/html':
      return 'document.html'
    case 'application/pdf':
      return 'document.pdf'
    case 'application/json':
      return 'data.json'
    case 'text/csv':
      return 'data.csv'
    default:
      return undefined
  }
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

  const headers = new Headers({
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
  const rangeResult = requestedRange
    ? parseByteRange(requestedRange, file.size)
    : { kind: 'ignore' as const }

  if (rangeResult.kind === 'unsatisfiable') {
    await file.body.cancel()
    headers.set('Content-Range', `bytes */${file.size}`)
    headers.set('Content-Length', '0')
    return new Response(null, { status: 416, headers })
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

  headers.set('Content-Type', contentType)

  let status = 200
  if (rangeResult.kind === 'range' && file.range) {
    headers.set(
      'Content-Range',
      `bytes ${rangeResult.offset}-${rangeResult.offset + rangeResult.length - 1}/${file.size}`
    )
    headers.set('Content-Length', String(rangeResult.length))
    status = 206
  } else {
    headers.set('Content-Length', String(file.size))
  }

  const responseFilename =
    file.customMetadata?.filename ?? fallbackFilenameForContentType(contentType)

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
