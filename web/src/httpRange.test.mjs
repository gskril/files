import assert from 'node:assert/strict'
import test from 'node:test'

import { parseByteRange } from './httpRange.ts'

test('parses bounded, open-ended, and suffix byte ranges', () => {
  assert.deepEqual(parseByteRange('bytes=2-5', 10), {
    kind: 'range',
    offset: 2,
    length: 4,
  })
  assert.deepEqual(parseByteRange('bytes=7-', 10), {
    kind: 'range',
    offset: 7,
    length: 3,
  })
  assert.deepEqual(parseByteRange('bytes=-4', 10), {
    kind: 'range',
    offset: 6,
    length: 4,
  })
})

test('clamps ranges and suffixes to the file size', () => {
  assert.deepEqual(parseByteRange('bytes=7-20', 10), {
    kind: 'range',
    offset: 7,
    length: 3,
  })
  assert.deepEqual(parseByteRange('bytes=-20', 10), {
    kind: 'range',
    offset: 0,
    length: 10,
  })
  assert.deepEqual(parseByteRange('bytes=-999999999999999999999', 10), {
    kind: 'range',
    offset: 0,
    length: 10,
  })
  assert.deepEqual(parseByteRange('bytes=7-999999999999999999999', 10), {
    kind: 'range',
    offset: 7,
    length: 3,
  })
})

test('rejects unsatisfiable byte ranges', () => {
  assert.deepEqual(parseByteRange('bytes=10-', 10), {
    kind: 'unsatisfiable',
  })
  assert.deepEqual(parseByteRange('bytes=5-2', 10), {
    kind: 'unsatisfiable',
  })
  assert.deepEqual(parseByteRange('bytes=-0', 10), {
    kind: 'unsatisfiable',
  })
  assert.deepEqual(parseByteRange('bytes=0-0', 0), {
    kind: 'unsatisfiable',
  })
})

test('ignores malformed and unsupported range requests', () => {
  assert.deepEqual(parseByteRange('items=0-1', 10), { kind: 'ignore' })
  assert.deepEqual(parseByteRange('bytes=0-0,2-2', 10), { kind: 'ignore' })
  assert.deepEqual(parseByteRange('garbage', 10), { kind: 'ignore' })
})
