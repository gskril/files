import { getRequestContext } from '@cloudflare/next-on-pages'
import { notFound } from 'next/navigation'
import { z } from 'zod'

import { ShareButton } from '@/components/Button'
import { getRelativeTimeString } from '@/utils'

export const runtime = 'edge'

const Schema = z.object({
  fileId: z.string().length(46),
})

type Params = z.infer<typeof Schema>

const baseCdnUrl =
  process.env.NODE_ENV === 'development' ? 'https://files.gregskril.com' : ''

export default async function Share({ params }: { params: Params }) {
  const safeParse = Schema.safeParse(params)

  if (!safeParse.success) {
    return notFound()
  }

  const { fileId } = safeParse.data

  let file: R2ObjectBody | null
  let contentType: string | undefined

  if (process.env.NODE_ENV === 'development') {
    file = {
      key: 'Qmdd5Npgj93rRZKbffUToffWoJ8f69czYkkES1BxzTHBes',
      // key: 'QmWpVyv3uY7mw8jizyCXf3wAMFvjgjyzmr1sQri3WRjuTJ',
      uploaded: new Date('2024-09-14T00:00:00Z'),
      httpMetadata: {
        contentType: 'video/mp4',
        // contentType: 'image/png',
      },
    } as unknown as R2ObjectBody
  } else {
    file = await getRequestContext().env.R2.get(fileId)
  }

  contentType = file?.httpMetadata?.contentType

  if (!file || !contentType) {
    return notFound()
  }

  const relativeDate = getRelativeTimeString(file.uploaded)

  return (
    <main className="mx-auto flex min-h-svh max-w-7xl flex-col justify-center p-4 sm:p-10">
      <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
        <div className="flex flex-col gap-0.5">
          <h1 className="text-2xl font-bold">
            {file.customMetadata?.title || 'Untitled'}
          </h1>
          <span className="block text-sm text-slate-500">
            Uploaded{' '}
            <time dateTime={file.uploaded.toString()}>{relativeDate}</time>
          </span>
        </div>

        <ShareButton fileId={fileId} />
      </div>

      <div className="mt-3 overflow-hidden rounded-lg bg-slate-200 shadow-md">
        {(() => {
          if (contentType.startsWith('image/')) {
            return <img src={`${baseCdnUrl}/cdn/${file.key}`} />
          }

          if (contentType.startsWith('video/')) {
            return (
              <video
                src={`${baseCdnUrl}/cdn/${file.key}`}
                className="aspect-video w-full"
                controls
              />
            )
          }

          return (
            <span className="block items-center justify-center px-4 py-24 text-center">
              Unsupported file type
            </span>
          )
        })()}
      </div>
    </main>
  )
}
