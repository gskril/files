import cloudflare from '@astrojs/cloudflare'
import react from '@astrojs/react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'astro/config'

export default defineConfig({
  output: 'server',
  // The API is authenticated via the x-admin-secret header (not cookies), and
  // clients like the Raycast extension POST forms without an Origin header,
  // which Astro's CSRF check would otherwise reject.
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
