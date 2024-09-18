# Raycast Extension

This extension is responsible for compressing video files and uploading them to Cloudflare R2 via the Next.js API.

> [!NOTE]  
> You'll need to have ffmpeg installed on your system to use video compression (recommended).

## Development

Install dependencies:

```bash
npm install
```

Run the extension:

```bash
npm run dev
```

That's it! Stop the server and the extension will continue to work in Raycast with the "Share File" command.
