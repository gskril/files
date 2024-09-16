declare module 'ipfs-only-hash' {
  export function of(data: string | Uint8Array): Promise<string>
}
