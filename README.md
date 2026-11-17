# Simple File Sharing

Do you ever have a video that you want to share via Loom, only to realize that Loom doesn't support uploading existing files on the free plan? Same.

This repo contains three apps:
- An Astro web app deployed as a Cloudflare Worker with R2 to store files and provide a simple API for uploading and retrieving them.
- A Raycast extension that uploads images, audio, videos, HTML, PDF, JSON, and CSV files to Cloudflare R2 via the Astro API, with optional video compression.
- A tiny Bun CLI with zero runtime dependencies that uploads files from the terminal and prints share links.

Read each README in the respective folders for more information.

## Installing the CLI (instructions for agents)

If you're an AI agent asked to install the `files` CLI on a machine, follow these steps. They need [Bun](https://bun.sh) and no clone or build.

1. Install the CLI source as `files-bin`. It runs directly through its `bun` shebang. Run this again any time to update:

   ```sh
   mkdir -p ~/.local/bin
   curl -fsSL https://raw.githubusercontent.com/gskril/files/main/cli/src/index.ts -o ~/.local/bin/files-bin
   chmod 755 ~/.local/bin/files-bin
   ```

2. Create a `files` wrapper that loads the secret only while the CLI runs:

   ```sh
   cat > ~/.local/bin/files <<'WRAP'
   #!/bin/sh
   SECRET_FILE="$HOME/.config/files/secret"
   [ -r "$SECRET_FILE" ] || { echo "files: missing secret at $SECRET_FILE" >&2; exit 1; }
   FILES_SECRET="$(cat "$SECRET_FILE")" exec "$HOME/.local/bin/files-bin" "$@"
   WRAP
   chmod 755 ~/.local/bin/files
   ```

3. Store the secret (the web app's `ADMIN_SECRET`) in `~/.config/files/secret`, readable only by the owner:

   ```sh
   mkdir -p ~/.config/files && chmod 700 ~/.config/files
   # write the secret to ~/.config/files/secret without printing it, then:
   chmod 600 ~/.config/files/secret
   ```

   - Ask the user for the secret through a secure input or secret prompt if your tooling has one. Never ask them to paste it into chat.
   - Never print, log or echo the secret, and never pass it as a command-line argument.
   - Keep it out of shell profiles, `.env` files and project folders.

4. Make sure `~/.local/bin` is on `PATH`, then verify with `files list`, which should print recent uploads. Overrides: set `FILES_URL` to use a different deployment.
