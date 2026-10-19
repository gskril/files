#!/usr/bin/env bun
import { basename } from 'node:path'
import { parseArgs } from 'node:util'

const HELP = `Usage:
  files <file...> [--title <title>]   Upload files and print share links
  files list                          List uploaded files

Options:
  -t, --title   Title for the upload (defaults to empty)
  -h, --help    Show this help

Environment:
  FILES_SECRET  API secret (required)
  FILES_URL     Web app URL (default: https://files.gregskril.com)`

type ListResponse = {
  truncated: boolean
  objects: {
    key: string
    size: number
    uploaded: string
    httpMetadata?: { contentType?: string }
    customMetadata?: { title?: string; filename?: string }
  }[]
}

const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    title: { type: 'string', short: 't', default: '' },
    help: { type: 'boolean', short: 'h' },
  },
})

if (values.help || positionals.length === 0) {
  console.log(HELP)
  process.exit(values.help ? 0 : 1)
}

const secret = process.env.FILES_SECRET
if (!secret) fail('FILES_SECRET is not set')

const baseUrl = new URL(process.env.FILES_URL || 'https://files.gregskril.com')
  .origin
const headers = { 'x-admin-secret': secret }

try {
  if (positionals[0] === 'list' && positionals.length === 1) {
    await list()
  } else {
    for (const path of positionals) await upload(path)
  }
} catch (err) {
  fail(`Request to ${baseUrl} failed: ${(err as Error).message}`)
}

async function upload(path: string) {
  const file = Bun.file(path)
  if (!(await file.exists())) fail(`File not found: ${path}`)

  const form = new FormData()
  form.append('file', file, basename(path))
  form.append('title', values.title)

  const res = await fetch(`${baseUrl}/api/create`, {
    method: 'POST',
    headers,
    body: form,
  })
  const data = (await res.json().catch(() => ({}))) as {
    key?: string
    error?: string
  }

  if (!res.ok || !data.key) {
    fail(`Upload failed for ${path}: ${data.error ?? res.statusText}`)
  }

  console.log(`${baseUrl}/share/${data.key}`)
}

async function list() {
  const res = await fetch(`${baseUrl}/api/list`, { headers })
  if (!res.ok) fail(`List failed: ${res.status} ${res.statusText}`)

  const { objects } = (await res.json()) as ListResponse
  objects.sort((a, b) => b.uploaded.localeCompare(a.uploaded))

  for (const obj of objects) {
    const name = obj.customMetadata?.title || obj.customMetadata?.filename
    const date = obj.uploaded.slice(0, 10)
    console.log(
      [
        date,
        formatSize(obj.size).padStart(8),
        `${baseUrl}/share/${obj.key}`,
        name,
      ]
        .filter(Boolean)
        .join('  ')
    )
  }
}

function formatSize(bytes: number) {
  const units = ['B', 'KB', 'MB', 'GB']
  let i = 0
  while (bytes >= 1024 && i < units.length - 1) {
    bytes /= 1024
    i++
  }
  return `${bytes.toFixed(i === 0 ? 0 : 1)} ${units[i]}`
}

function fail(message: string): never {
  console.error(message)
  process.exit(1)
}
