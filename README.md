# Simple File Sharing

Do you ever have a video that you want to share via Loom, only to realize that Loom doesn't support uploading existing files on the free plan? Same.

This repo contains two apps:
- A Next.js app that uses Cloudflare R2 to store files and provide a simple API for uploading and retrieving them. It's meant to be deployed to Cloudflare Pages for the easiest setup and fastest performance.
- A Raycast extension that compresses video files before uploading them to Cloudflare R2 via the Next.js API.

Read each README in the respective folders for more information.