export async function sha256Hex(buffer: ArrayBuffer): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', buffer)
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
}

const EXTENSION_CONTENT_TYPES: Record<string, string> = {
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  gif: 'image/gif',
  webp: 'image/webp',
  avif: 'image/avif',
  heic: 'image/heic',
  heif: 'image/heif',
  svg: 'image/svg+xml',
  mp4: 'video/mp4',
  webm: 'video/webm',
  mov: 'video/quicktime',
  mp3: 'audio/mpeg',
  m4a: 'audio/mp4',
  aac: 'audio/aac',
  wav: 'audio/wav',
  flac: 'audio/flac',
  ogg: 'audio/ogg',
  oga: 'audio/ogg',
  pdf: 'application/pdf',
  json: 'application/json',
  csv: 'text/csv',
}

function contentTypeFromFilename(filename: string): string | undefined {
  const ext = filename.split('.').pop()?.toLowerCase()
  return ext ? EXTENSION_CONTENT_TYPES[ext] : undefined
}

export const CONTENT_TYPE_SNIFF_BYTE_LENGTH = 64

export function normalizeContentType(
  contentType: string | undefined
): string | undefined {
  const normalized = contentType?.split(';', 1)[0]?.trim().toLowerCase()

  if (normalized === 'text/json' || normalized === 'application/x-json') {
    return 'application/json'
  }
  if (
    normalized === 'application/csv' ||
    normalized === 'text/comma-separated-values' ||
    normalized === 'text/x-csv'
  ) {
    return 'text/csv'
  }

  return normalized || undefined
}

const ISO_BASE_MEDIA_CONTENT_TYPES: Record<string, string> = {
  isom: 'video/mp4',
  iso2: 'video/mp4',
  iso3: 'video/mp4',
  iso4: 'video/mp4',
  iso5: 'video/mp4',
  iso6: 'video/mp4',
  mp41: 'video/mp4',
  mp42: 'video/mp4',
  avc1: 'video/mp4',
  'M4V ': 'video/mp4',
  'M4A ': 'audio/mp4',
  'qt  ': 'video/quicktime',
  avif: 'image/avif',
  avis: 'image/avif',
  heic: 'image/heic',
  heix: 'image/heic',
  hevc: 'image/heic',
  hevx: 'image/heic',
}

function asciiAt(bytes: Uint8Array, offset: number, length: number): string {
  return String.fromCharCode(...bytes.subarray(offset, offset + length))
}

function hasEbmlDocType(bytes: Uint8Array, docType: string): boolean {
  const encoded = Array.from(docType, (character) => character.charCodeAt(0))

  for (let index = 4; index < bytes.length - encoded.length - 2; index += 1) {
    if (
      bytes[index] === 0x42 &&
      bytes[index + 1] === 0x82 &&
      bytes[index + 2] === (0x80 | encoded.length) &&
      encoded.every((byte, offset) => bytes[index + 3 + offset] === byte)
    ) {
      return true
    }
  }

  return false
}

function isHtml(bytes: Uint8Array): boolean {
  const prefix = new TextDecoder()
    .decode(bytes)
    .replace(/^\uFEFF/, '')
    .trimStart()
    .toLowerCase()

  return (
    /^<!doctype\s+html(?:\s|>)/.test(prefix) || /^<html(?:\s|>)/.test(prefix)
  )
}

function sniffContentType(buffer: ArrayBuffer): string | undefined {
  const bytes = new Uint8Array(buffer.slice(0, CONTENT_TYPE_SNIFF_BYTE_LENGTH))

  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  ) {
    return 'image/png'
  }

  if (
    bytes.length >= 3 &&
    bytes[0] === 0xff &&
    bytes[1] === 0xd8 &&
    bytes[2] === 0xff
  ) {
    return 'image/jpeg'
  }

  if (
    bytes.length >= 6 &&
    bytes[0] === 0x47 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x38
  ) {
    return 'image/gif'
  }

  if (
    bytes.length >= 12 &&
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  ) {
    return 'image/webp'
  }

  if (
    bytes.length >= 12 &&
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x41 &&
    bytes[10] === 0x56 &&
    bytes[11] === 0x45
  ) {
    return 'audio/wav'
  }

  if (
    bytes.length >= 4 &&
    bytes[0] === 0x66 &&
    bytes[1] === 0x4c &&
    bytes[2] === 0x61 &&
    bytes[3] === 0x43
  ) {
    return 'audio/flac'
  }

  if (
    bytes.length >= 3 &&
    bytes[0] === 0x49 &&
    bytes[1] === 0x44 &&
    bytes[2] === 0x33
  ) {
    return 'audio/mpeg'
  }

  if (
    bytes.length >= 3 &&
    bytes[0] === 0xff &&
    (bytes[1] & 0xe0) === 0xe0 &&
    (bytes[1] & 0x06) !== 0 &&
    (bytes[2] & 0xf0) !== 0xf0 &&
    (bytes[2] & 0x0c) !== 0x0c
  ) {
    return 'audio/mpeg'
  }

  if (
    bytes.length >= 2 &&
    bytes[0] === 0xff &&
    (bytes[1] === 0xf1 || bytes[1] === 0xf9)
  ) {
    return 'audio/aac'
  }

  if (
    bytes.length >= 12 &&
    bytes[4] === 0x66 &&
    bytes[5] === 0x74 &&
    bytes[6] === 0x79 &&
    bytes[7] === 0x70
  ) {
    return ISO_BASE_MEDIA_CONTENT_TYPES[asciiAt(bytes, 8, 4)]
  }

  if (
    bytes.length >= 4 &&
    bytes[0] === 0x1a &&
    bytes[1] === 0x45 &&
    bytes[2] === 0xdf &&
    bytes[3] === 0xa3 &&
    hasEbmlDocType(bytes, 'webm')
  ) {
    return 'video/webm'
  }

  if (
    bytes.length >= 5 &&
    bytes[0] === 0x25 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x44 &&
    bytes[3] === 0x46 &&
    bytes[4] === 0x2d
  ) {
    return 'application/pdf'
  }

  if (isHtml(bytes)) {
    return 'text/html'
  }

  return undefined
}

export function hasStoredContentType(
  contentType: string | undefined
): contentType is string {
  const normalized = normalizeContentType(contentType)
  return !!normalized && normalized !== 'application/octet-stream'
}

export function resolveContentType(
  declared: string | undefined,
  buffer: ArrayBuffer,
  filename?: string
): string {
  const normalizedDeclared = normalizeContentType(declared)
  const filenameContentType = filename
    ? contentTypeFromFilename(filename)
    : undefined

  if (
    (normalizedDeclared === 'text/plain' ||
      normalizedDeclared === 'application/vnd.ms-excel') &&
    (filenameContentType === 'application/json' ||
      filenameContentType === 'text/csv')
  ) {
    return filenameContentType
  }

  if (normalizedDeclared && normalizedDeclared !== 'application/octet-stream') {
    return normalizedDeclared
  }

  return (
    sniffContentType(buffer) ??
    filenameContentType ??
    normalizedDeclared ??
    'application/octet-stream'
  )
}

export function contentTypeForUpload(file: File, buffer: ArrayBuffer): string {
  return resolveContentType(file.type, buffer, file.name)
}

// https://www.builder.io/blog/relative-time
export function getRelativeTimeString(date: Date | number): string {
  // Allow dates or times to be passed
  const timeMs = typeof date === 'number' ? date : date.getTime()

  // Get the amount of seconds between the given date and now
  const deltaSeconds = Math.round((timeMs - Date.now()) / 1000)

  // Array representing one minute, hour, day, week, month, etc in seconds
  const cutoffs = [
    60,
    3600,
    86400,
    86400 * 7,
    86400 * 30,
    86400 * 365,
    Infinity,
  ]

  // Array equivalent to the above but in the string representation of the units
  const units: Intl.RelativeTimeFormatUnit[] = [
    'second',
    'minute',
    'hour',
    'day',
    'week',
    'month',
    'year',
  ]

  // Grab the ideal cutoff unit
  const unitIndex = cutoffs.findIndex(
    (cutoff) => cutoff > Math.abs(deltaSeconds)
  )

  // Get the divisor to divide from the seconds. E.g. if our unit is "day" our divisor
  // is one day in seconds, so we can divide our seconds by this to get the # of days
  const divisor = unitIndex ? cutoffs[unitIndex - 1] : 1

  // Intl.RelativeTimeFormat do its magic
  const rtf = new Intl.RelativeTimeFormat('en-US', { numeric: 'auto' })
  return rtf.format(Math.floor(deltaSeconds / divisor), units[unitIndex])
}
