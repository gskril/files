# CLI

A tiny command-line uploader for the file sharing service. Built with [Bun](https://bun.sh) and zero runtime dependencies.

## Setup

```sh
bun install
bun run build                  # compiles a standalone binary to dist/files
cp dist/files /usr/local/bin/  # or anywhere on your PATH
```

Set your API secret (the same `ADMIN_SECRET` the web app uses) in your shell profile:

```sh
export FILES_SECRET="<your-secret>"
export FILES_URL="https://files.gregskril.com" # optional, this is the default
```

## Usage

```sh
files video.mp4                 # upload, prints the share link
files a.png b.pdf -t "Receipts" # upload several files with a title
files video.mp4 | pbcopy        # copy the link to your clipboard
files list                      # list uploaded files, newest first
```

During development you can skip the build and run `bun src/index.ts <args>`.
