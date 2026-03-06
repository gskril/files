/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />
/// <reference types="@cloudflare/workers-types/2023-07-01" />

type Runtime = import('@astrojs/cloudflare').Runtime<Env>

interface Env {
  R2: R2Bucket
  ADMIN_SECRET?: string
}

declare namespace App {
  interface Locals extends Runtime {}
}
