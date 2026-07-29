import { type ReactNode, useEffect, useMemo, useState } from 'react'

import { parseCsv } from '../dataPreview'

const MAX_PREVIEW_BYTES = 2_000_000
const MAX_CSV_ROWS = 250
const MAX_CSV_COLUMNS = 50

type PreviewState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'json'; source: string }
  | { status: 'csv'; rows: string[][] }

function highlightJson(source: string): ReactNode[] {
  const tokenPattern =
    /"(?:\\u[\da-fA-F]{4}|\\[^u]|[^\\"])*"|-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?|\b(?:true|false|null)\b/g
  const nodes: ReactNode[] = []
  let previousIndex = 0
  let tokenIndex = 0

  for (const match of source.matchAll(tokenPattern)) {
    const index = match.index
    const token = match[0]

    if (index > previousIndex) {
      nodes.push(source.slice(previousIndex, index))
    }

    const isString = token.startsWith('"')
    const isKey =
      isString &&
      /^\s*:/.test(source.slice(index + token.length, index + token.length + 8))
    const className = isKey
      ? 'text-sky-300'
      : isString
        ? 'text-emerald-300'
        : token === 'true' || token === 'false'
          ? 'text-violet-300'
          : token === 'null'
            ? 'text-slate-400'
            : 'text-amber-300'

    nodes.push(
      <span className={className} key={`token-${tokenIndex}`}>
        {token}
      </span>
    )
    previousIndex = index + token.length
    tokenIndex += 1
  }

  nodes.push(source.slice(previousIndex))
  return nodes
}

function LoadingPreview() {
  return (
    <div
      className="flex min-h-80 items-center justify-center bg-slate-50"
      aria-live="polite"
    >
      <div className="flex items-center gap-3 text-sm text-slate-500">
        <span className="border-t-primary size-4 animate-spin rounded-full border-2 border-slate-300" />
        Loading preview…
      </div>
    </div>
  )
}

function ErrorPreview({ message, src }: { message: string; src: string }) {
  return (
    <div className="flex min-h-80 flex-col items-center justify-center gap-4 bg-slate-50 px-6 py-14 text-center">
      <div className="flex size-12 items-center justify-center rounded-xl bg-slate-200 font-mono text-lg font-bold text-slate-600">
        !
      </div>
      <div className="max-w-md">
        <p className="font-semibold text-slate-800">Preview unavailable</p>
        <p className="mt-1 text-sm leading-6 text-slate-500">{message}</p>
      </div>
      <a
        href={src}
        target="_blank"
        rel="noopener noreferrer"
        className="bg-primary hover:bg-primary-hover rounded-full px-5 py-2.5 text-sm font-medium text-white transition-colors"
      >
        Open raw file
      </a>
    </div>
  )
}

function JsonPreview({ source }: { source: string }) {
  const highlighted = useMemo(() => highlightJson(source), [source])

  return (
    <div className="max-h-[72svh] min-h-80 overflow-auto bg-slate-950">
      <pre className="min-w-fit p-5 font-mono text-[13px] leading-6 text-slate-200 sm:p-7">
        <code>{highlighted}</code>
      </pre>
    </div>
  )
}

function CsvPreview({ rows }: { rows: string[][] }) {
  if (rows.length === 0) {
    return (
      <div className="flex min-h-80 items-center justify-center bg-slate-50 text-sm text-slate-500">
        This CSV file is empty.
      </div>
    )
  }

  const visibleRows = rows.slice(0, MAX_CSV_ROWS)
  const columnCount = Math.min(
    Math.max(...visibleRows.map((row) => row.length)),
    MAX_CSV_COLUMNS
  )
  const header = Array.from(
    { length: columnCount },
    (_, index) => visibleRows[0]?.[index] || `Column ${index + 1}`
  )
  const body = visibleRows.slice(1)
  const truncated =
    rows.length > MAX_CSV_ROWS ||
    rows.some((row) => row.length > MAX_CSV_COLUMNS)

  return (
    <div className="bg-white">
      <div className="max-h-[68svh] min-h-80 overflow-auto">
        <table className="w-full min-w-max border-collapse text-left text-sm">
          <thead className="sticky top-0 z-10 bg-slate-100 text-xs font-semibold tracking-wide text-slate-600 uppercase shadow-[0_1px_0_0_#e2e8f0]">
            <tr>
              <th className="w-12 px-4 py-3 text-right text-slate-400">#</th>
              {header.map((cell, index) => (
                <th className="max-w-80 px-4 py-3" key={`header-${index}`}>
                  {cell}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {body.map((row, rowIndex) => (
              <tr
                className="hover:bg-primary/5 odd:bg-white even:bg-slate-50/70"
                key={`row-${rowIndex}`}
              >
                <td className="px-4 py-3 text-right font-mono text-xs text-slate-400">
                  {rowIndex + 1}
                </td>
                {header.map((_, columnIndex) => (
                  <td
                    className="max-w-80 truncate px-4 py-3 text-slate-700"
                    title={row[columnIndex] || undefined}
                    key={`cell-${rowIndex}-${columnIndex}`}
                  >
                    {row[columnIndex] || (
                      <span className="text-slate-300">—</span>
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="border-t border-slate-200 bg-slate-50 px-4 py-2.5 text-xs text-slate-500">
        Showing {Math.max(visibleRows.length - 1, 0).toLocaleString()} of{' '}
        {Math.max(rows.length - 1, 0).toLocaleString()} data rows
        {truncated ? ' · Preview limited for performance' : ''}
      </div>
    </div>
  )
}

export function DataPreview({
  src,
  kind,
}: {
  src: string
  kind: 'json' | 'csv'
}) {
  const [state, setState] = useState<PreviewState>({ status: 'loading' })

  useEffect(() => {
    const controller = new AbortController()

    async function loadPreview() {
      try {
        const response = await fetch(src, { signal: controller.signal })
        if (!response.ok) throw new Error('The file could not be loaded.')

        const contentLength = Number(response.headers.get('Content-Length'))
        if (contentLength > MAX_PREVIEW_BYTES) {
          await response.body?.cancel()
          setState({
            status: 'error',
            message: 'This file is too large for an inline preview.',
          })
          return
        }

        const raw = await response.text()
        if (new TextEncoder().encode(raw).byteLength > MAX_PREVIEW_BYTES) {
          setState({
            status: 'error',
            message: 'This file is too large for an inline preview.',
          })
          return
        }

        if (kind === 'json') {
          const parsed = JSON.parse(raw)
          setState({
            status: 'json',
            source: JSON.stringify(parsed, null, 2),
          })
        } else {
          setState({ status: 'csv', rows: parseCsv(raw) })
        }
      } catch (error) {
        if (controller.signal.aborted) return
        setState({
          status: 'error',
          message:
            kind === 'json' && error instanceof SyntaxError
              ? 'This file does not contain valid JSON.'
              : 'The file could not be loaded.',
        })
      }
    }

    void loadPreview()
    return () => controller.abort()
  }, [kind, src])

  if (state.status === 'loading') return <LoadingPreview />
  if (state.status === 'error') {
    return <ErrorPreview message={state.message} src={src} />
  }
  if (state.status === 'json') return <JsonPreview source={state.source} />
  return <CsvPreview rows={state.rows} />
}
