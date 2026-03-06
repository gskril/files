# File Uploader

An Astro app deployed as a Cloudflare Worker. Provides an API to upload files to Cloudflare R2 and a simple UI to view them.

## Stack

- [Astro](https://astro.build) with the [@astrojs/cloudflare](https://docs.astro.build/en/guides/integrations-guide/cloudflare/) adapter
- [Tailwind CSS](https://tailwindcss.com) for styling
- [Cloudflare R2](https://developers.cloudflare.com/r2/) for file storage
- [React](https://react.dev) for interactive components (hydrated as islands)

## Development

```sh
pnpm install
pnpm dev
```

The dev server runs at `http://localhost:4321`. Note that R2 bindings are not available in `astro dev` — use `pnpm preview` to test with local R2 via Wrangler.

## Deployment

1. Create a Cloudflare R2 bucket called `files`:

   ```sh
   npx wrangler r2 bucket create files
   ```

2. Set the `ADMIN_SECRET` secret (used to authenticate uploads from the Raycast extension):

   ```sh
   echo "<your-secret>" | npx wrangler secret put ADMIN_SECRET
   ```

3. In the Cloudflare dashboard, create a new Worker and connect it to your GitHub repo. Set the build command to `pnpm build` and the output directory to `dist`. Deploys will trigger automatically on push.

## Routes

| Route | Method | Description |
|---|---|---|
| `/` | GET | Landing page (prerendered) |
| `/share/[fileId]` | GET | View an uploaded file |
| `/cdn/[fileId]` | GET | Serve raw file content from R2 |
| `/api/create` | POST | Upload a file (requires `x-admin-secret` header) |

## Scripts

| Command | Description |
|---|---|
| `pnpm dev` | Start local dev server |
| `pnpm build` | Build for production |
| `pnpm preview` | Build and preview locally with Wrangler |
| `pnpm check` | Run Astro type checking |
| `pnpm cf-typegen` | Regenerate Cloudflare binding types |
