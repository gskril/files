/// <reference path="../.astro/types.d.ts" />
/// <reference path="../worker-configuration.d.ts" />
/// <reference types="astro/client" />

declare namespace Cloudflare {
  interface Env {
    ADMIN_SECRET: string
  }
}
