# Simple File Sharing

Do you ever have a video that you want to share via Loom, only to realize that Loom doesn't support uploading existing files on the free plan? Same.

This repo contains two apps:
- An Astro web app deployed as a Cloudflare Worker with R2 to store files and provide a simple API for uploading and retrieving them.
- A Raycast extension that compresses video files before uploading them to Cloudflare R2 via the Astro API.

Read each README in the respective folders for more information.