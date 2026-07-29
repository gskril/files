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

test('detects HTML from its doctype', () => {
  const html = buffer(...Buffer.from('<!doctype html><title>Test</title>'))

  assert.equal(resolveContentType('text/html', html, 'index.html'), 'text/html')
  assert.equal(resolveContentType(undefined, html, 'index.html'), 'text/html')
  assert.equal(
    resolveContentType('application/octet-stream', html),
    'text/html'
  )
})

test('detects PDFs by signature and filename', () => {
  const pdf = buffer(...Buffer.from('%PDF-1.7'))

  assert.equal(resolveContentType(undefined, pdf), 'application/pdf')
  assert.equal(
    resolveContentType('application/octet-stream', buffer(), 'document.pdf'),
    'application/pdf'
  )
})

test('detects common audio formats by signature and filename', () => {
  assert.equal(
    resolveContentType(
      'application/octet-stream',
      buffer(...Buffer.from('ID3')),
      'track'
    ),
    'audio/mpeg'
  )
  assert.equal(
    resolveContentType('application/octet-stream', buffer(), 'track.mp3'),
    'audio/mpeg'
  )
  assert.equal(
    resolveContentType(
      undefined,
      buffer(...Buffer.from('RIFF'), 0, 0, 0, 0, ...Buffer.from('WAVE'))
    ),
    'audio/wav'
  )
  assert.equal(
    resolveContentType(undefined, buffer(...Buffer.from('fLaC'))),
    'audio/flac'
  )
})

test('detects JSON and CSV from filenames when clients send generic types', () => {
  assert.equal(
    resolveContentType('application/octet-stream', buffer(), 'data.json'),
    'application/json'
  )
  assert.equal(
    resolveContentType('text/plain', buffer(), 'report.csv'),
    'text/csv'
  )
})

test('normalizes JSON and CSV MIME aliases', () => {
  assert.equal(
    resolveContentType('text/json; charset=utf-8', buffer()),
    'application/json'
  )
  assert.equal(resolveContentType('application/csv', buffer()), 'text/csv')
  assert.equal(
    resolveContentType('application/x-json', buffer()),
    'application/json'
  )
  assert.equal(resolveContentType('text/x-csv', buffer()), 'text/csv')
  assert.equal(
    resolveContentType('application/vnd.ms-excel', buffer(), 'spreadsheet.csv'),
    'text/csv'
  )
})

test('requires the complete PDF signature', () => {
  assert.equal(
    resolveContentType(undefined, buffer(...Buffer.from('%PDF'))),
    'application/octet-stream'
  )
})

test('does not infer HTML from arbitrary markup', () => {
  const markup = buffer(...Buffer.from('<script>alert(1)</script>'))

  assert.equal(
    resolveContentType(undefined, markup),
    'application/octet-stream'
  )
})
