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
  svg: 'image/svg+xml',
  mp4: 'video/mp4',
  webm: 'video/webm',
  mov: 'video/quicktime',
}

function contentTypeFromFilename(filename: string): string | undefined {
  const ext = filename.split('.').pop()?.toLowerCase()
  return ext ? EXTENSION_CONTENT_TYPES[ext] : undefined
}

function sniffContentType(buffer: ArrayBuffer): string | undefined {
  const bytes = new Uint8Array(buffer.slice(0, 16))

  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47
  ) {
    return 'image/png'
  }

  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
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

  if (bytes.length >= 12 && bytes[4] === 0x66 && bytes[5] === 0x74 && bytes[6] === 0x79 && bytes[7] === 0x70) {
    return 'video/mp4'
  }

  if (bytes.length >= 4 && bytes[0] === 0x1a && bytes[1] === 0x45 && bytes[2] === 0xdf && bytes[3] === 0xa3) {
    return 'video/webm'
  }

  return undefined
}

const SNIFF_BYTE_LENGTH = 16

export function hasStoredContentType(
  contentType: string | undefined,
): contentType is string {
  return !!contentType && contentType !== 'application/octet-stream'
}

export function needsContentTypeSniff(contentType: string | undefined): boolean {
  return !hasStoredContentType(contentType)
}

export function resolveContentType(
  declared: string | undefined,
  buffer: ArrayBuffer,
  filename?: string,
): string {
  if (declared && declared !== 'application/octet-stream') {
    return declared
  }

  return (
    sniffContentType(buffer) ??
    (filename ? contentTypeFromFilename(filename) : undefined) ??
    declared ??
    'application/octet-stream'
  )
}

export function contentTypeForUpload(file: File, buffer: ArrayBuffer): string {
  return resolveContentType(file.type, buffer, file.name)
}

/** Read at most the first 16 bytes from R2 when stored metadata is missing or generic. */
export async function resolveR2ContentType(
  r2: R2Bucket,
  fileId: string,
  declared: string | undefined,
): Promise<string> {
  if (hasStoredContentType(declared)) {
    return declared
  }

  const head = await r2.get(fileId, {
    range: { offset: 0, length: SNIFF_BYTE_LENGTH },
  })
  const buffer = head ? await head.arrayBuffer() : new ArrayBuffer(0)

  return resolveContentType(declared, buffer)
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
