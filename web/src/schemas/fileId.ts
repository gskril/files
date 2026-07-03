import { z } from 'zod'

/** SHA-256 hex (current) or IPFS CIDv0 (legacy keys from before the migration) */
export const fileIdPattern = /^([0-9a-f]{64}|Qm[1-9A-HJ-NP-Za-km-z]{44})$/

export const fileIdSchema = z.object({
  fileId: z.string().regex(fileIdPattern),
})
