import { writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { generateOpenApiDocument } from '../src/schemas/openapi'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const outputPath = join(root, 'public', 'openapi.json')

writeFileSync(outputPath, `${JSON.stringify(generateOpenApiDocument(), null, 2)}\n`)

console.log(`Wrote ${outputPath}`)
