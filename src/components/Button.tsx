'use client'

import { Link } from 'lucide-react'
import toast, { Toaster } from 'react-hot-toast'

export function CopyButton({ text }: { text: string }) {
  return (
    <>
      <button
        className="bg-primary hover:bg-primary-hover flex h-fit items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium text-slate-50 transition-colors"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(text)
            toast.success('Copied to clipboard')
          } catch (error) {
            toast.error('Failed to copy to clipboard')
          }
        }}
      >
        <Link size={16} strokeWidth="2.5" />
        <span>Share</span>
      </button>

      <Toaster />
    </>
  )
}
