import assert from 'node:assert/strict'
import test from 'node:test'

import { parseCsv } from './dataPreview.ts'

test('parses CSV rows, escaped quotes, and quoted commas', () => {
  assert.deepEqual(
    parseCsv('name,notes\nAda,"First, programmer"\nGrace,"Said ""hello"""'),
    [
      ['name', 'notes'],
      ['Ada', 'First, programmer'],
      ['Grace', 'Said "hello"'],
    ]
  )
})

test('supports CRLF, multiline fields, BOMs, and trailing empty values', () => {
  assert.deepEqual(
    parseCsv('\uFEFFname,notes,extra\r\nLinus,"line one\r\nline two",'),
    [
      ['name', 'notes', 'extra'],
      ['Linus', 'line one\r\nline two', ''],
    ]
  )
})

test('does not add an empty row for a trailing newline', () => {
  assert.deepEqual(parseCsv('a,b\n1,2\n'), [
    ['a', 'b'],
    ['1', '2'],
  ])
})
