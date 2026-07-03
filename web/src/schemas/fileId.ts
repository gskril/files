import { z } from 'zod'

/** IPFS CIDv0 base58 hash length */
export const FILE_ID_LENGTH = 46

export const fileIdSchema = z.object({
  fileId: z.string().length(FILE_ID_LENGTH),
})
