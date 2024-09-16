'use client'

import { Link } from 'lucide-react'
import toast, { Toaster } from 'react-hot-toast'

export function Button({
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className="flex h-fit items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-medium text-slate-50 transition-colors hover:bg-primary-hover"
      {...props}
    >
      {children}
    </button>
  )
}

export function ShareButton({ fileId }: { fileId: string }) {
  return (
    <>
      <Button
        onClick={async () => {
          // Get the domain
          const domain = window.location.origin

          try {
            await navigator.clipboard.writeText(`${domain}/share/${fileId}`)
            toast.success('Copied to clipboard')
          } catch (error) {
            toast.error('Failed to copy to clipboard')
          }
        }}
      >
        <Link size={16} strokeWidth="2.5" />
        <span>Share</span>
      </Button>

      <Toaster />
    </>
  )
}
