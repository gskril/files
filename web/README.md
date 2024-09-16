# Next.js App

This is a Next.js app built to run on Cloudflare Pages. It provides an API to upload files to Cloudflare R2, and a simple UI to view uploaded files.

## Deployment

1. Fork this repo:

```bash
git clone https://github.com/gskril/files.git
```

2. Create a new Cloudflare R2 bucket called "files".

3. Create a new Cloudflare Pages project called "files" and connect it to your fork.

4. Once deployed, navigate to the project settings and set the `ADMIN_SECRET` environment variable to a random string of your choosing. You may need to trigger a build to get the new environment variable to take effect. You'll need to use this secret in the Raycast extension to authenticate file uploads.

That's it! The app will be deployed to a custom domain you can set up in the Cloudflare Pages project settings. Files will be viewable via `{yourdomain.com}/share/{file-hash}`.
