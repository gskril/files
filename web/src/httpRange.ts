export type ByteRangeResult =
  | { kind: 'ignore' }
  | { kind: 'unsatisfiable' }
  | { kind: 'range'; offset: number; length: number }

export function parseByteRange(header: string, size: number): ByteRangeResult {
  const match = /^bytes=(\d*)-(\d*)$/i.exec(header.trim())

  if (!match || (!match[1] && !match[2])) {
    return { kind: 'ignore' }
  }

  if (size === 0) {
    return { kind: 'unsatisfiable' }
  }

  const fileSize = BigInt(size)

  if (!match[1]) {
    const requestedLength = BigInt(match[2])

    if (requestedLength === 0n) {
      return { kind: 'unsatisfiable' }
    }

    const length = Number(
      requestedLength < fileSize ? requestedLength : fileSize
    )
    return { kind: 'range', offset: size - length, length }
  }

  const requestedOffset = BigInt(match[1])
  const requestedEnd = match[2] ? BigInt(match[2]) : fileSize - 1n

  if (requestedOffset >= fileSize || requestedEnd < requestedOffset) {
    return { kind: 'unsatisfiable' }
  }

  const offset = Number(requestedOffset)
  const end = Number(requestedEnd < fileSize ? requestedEnd : fileSize - 1n)
  return { kind: 'range', offset, length: end - offset + 1 }
}
