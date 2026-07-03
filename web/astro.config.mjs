import cloudflare from '@astrojs/cloudflare'
import react from '@astrojs/react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig, fontProviders } from 'astro/config'

export default defineConfig({
  output: 'server',
  // Fonts are downloaded at build time and self-hosted; no runtime requests
  // to Google Fonts.
  fonts: [
    {
      name: 'Inter',
      cssVariable: '--font-inter',
      provider: fontProviders.google(),
      weights: [400, 500, 600, 700],
      styles: ['normal'],
      subsets: ['latin'],
    },
  ],
  // checkOrigin must stay false: Astro 7 applies CSRF origin checks globally (no
  // per-route opt-out) to POST/PATCH/PUT/DELETE with form-like Content-Types.
  // The Raycast extension POSTs multipart/form-data via axios with only
  // x-admin-secret — no Origin header — so checkOrigin: true returns 403.
  // API auth is enforced in middleware via x-admin-secret instead.
  security: { checkOrigin: false },
  adapter: cloudflare({
    imageService: 'passthrough',
    prerenderEnvironment: 'node',
  }),
  integrations: [react()],
  vite: {
    plugins: [tailwindcss()],
  },
})
