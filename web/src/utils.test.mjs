import assert from 'node:assert/strict'
import test from 'node:test'

import { resolveContentType } from './utils.ts'

function buffer(...bytes) {
  return Uint8Array.from(bytes).buffer
}

function isoBaseMediaFile(brand) {
  return buffer(
    0,
    0,
    0,
    24,
    ...Buffer.from('ftyp'),
    ...Buffer.from(brand),
    0,
    0,
    0,
    0
  )
}

function ebmlFile(docType) {
  return buffer(
    0x1a,
    0x45,
    0xdf,
    0xa3,
    0x42,
    0x82,
    0x80 | docType.length,
    ...Buffer.from(docType)
  )
}

test('detects ISO base media formats by major brand', () => {
  assert.equal(
    resolveContentType(undefined, isoBaseMediaFile('isom')),
    'video/mp4'
  )
  assert.equal(
    resolveContentType(undefined, isoBaseMediaFile('qt  ')),
    'video/quicktime'
  )
  assert.equal(
    resolveContentType(undefined, isoBaseMediaFile('avif')),
    'image/avif'
  )
  assert.equal(
    resolveContentType(undefined, isoBaseMediaFile('heic')),
    'image/heic'
  )
})

test('does not treat every ISO base media file as MP4', () => {
  assert.equal(
    resolveContentType(undefined, isoBaseMediaFile('mif1')),
    'application/octet-stream'
  )
})

test('distinguishes WebM from other EBML formats', () => {
  assert.equal(resolveContentType(undefined, ebmlFile('webm')), 'video/webm')
  assert.equal(
    resolveContentType(undefined, ebmlFile('matroska')),
    'application/octet-stream'
  )
})

test('checks the complete PNG signature', () => {
  assert.equal(
    resolveContentType(undefined, buffer(0x89, 0x50, 0x4e, 0x47)),
    'application/octet-stream'
  )
  assert.equal(
    resolveContentType(
      undefined,
      buffer(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a)
    ),
    'image/png'
  )
})

test('prefers a specific declared type and falls back to the filename', () => {
  assert.equal(resolveContentType('image/jpeg', buffer()), 'image/jpeg')
  assert.equal(resolveContentType('', buffer(), 'clip.mov'), 'video/quicktime')
})

test('preserves declared HTML without inferring it from untrusted content', () => {
  const html = buffer(...Buffer.from('<!doctype html><title>Test</title>'))

  assert.equal(resolveContentType('text/html', html, 'index.html'), 'text/html')
  assert.equal(
    resolveContentType(undefined, html, 'index.html'),
    'application/octet-stream'
  )
})
