import {
  extendZodWithOpenApi,
  OpenAPIRegistry,
  OpenApiGeneratorV3,
} from '@asteasolutions/zod-to-openapi'
import { z } from 'zod'

import { fileIdPattern } from './fileId'

extendZodWithOpenApi(z)

export const ApiErrorSchema = z
  .object({
    success: z.literal(false).optional(),
    error: z.string(),
  })
  .openapi('ApiError')

export const UploadSuccessSchema = z
  .object({
    success: z.literal(true),
    key: z.string().openapi({
      description:
        'SHA-256 hex hash of the file contents. Fetch the file at /cdn/{key}.',
      example: 'b94d27b9934d3e08a52e52d7da7dabfac484efe37a5380ee9088f7ace2efcde9',
    }),
  })
  .openapi('UploadSuccess')

export const FileObjectSchema = z
  .object({
    key: z.string().openapi({
      description:
        'SHA-256 hex hash of the file contents (or a legacy IPFS CIDv0)',
    }),
    size: z.number().int(),
    uploaded: z.string().datetime(),
    customMetadata: z.record(z.string(), z.string()).optional(),
  })
  .openapi('FileObject')

export const ListFilesSchema = z
  .object({
    truncated: z.boolean(),
    objects: z.array(FileObjectSchema),
  })
  .openapi('ListFiles')

export const FileIdParamSchema = z
  .string()
  .regex(fileIdPattern)
  .openapi({
    param: { name: 'fileId', in: 'path' },
    description:
      'SHA-256 hex hash returned as `key` by the upload endpoint (legacy IPFS CIDv0 keys are also accepted)',
    example: 'b94d27b9934d3e08a52e52d7da7dabfac484efe37a5380ee9088f7ace2efcde9',
  })

export function createOpenApiRegistry() {
  const registry = new OpenAPIRegistry()

  registry.registerComponent('securitySchemes', 'adminSecret', {
    type: 'apiKey',
    in: 'header',
    name: 'x-admin-secret',
    description:
      'Admin secret set via the ADMIN_SECRET environment variable on the deployment',
  })

  registry.registerPath({
    method: 'post',
    path: '/api/create',
    operationId: 'uploadFile',
    summary: 'Upload a file',
    description:
      'Uploads a file to R2. The file is stored under the SHA-256 hex hash of its contents, which is returned as `key`. Uploading the same content twice is idempotent and yields the same key.',
    security: [{ adminSecret: [] }],
    request: {
      body: {
        required: true,
        content: {
          'multipart/form-data': {
            schema: z.object({
              file: z.string().openapi({ type: 'string', format: 'binary' }),
              title: z.string().optional().openapi({ default: '' }),
            }),
          },
        },
      },
    },
    responses: {
      200: {
        description: 'File stored successfully',
        content: { 'application/json': { schema: UploadSuccessSchema } },
      },
      400: {
        description: 'Invalid request',
        content: { 'application/json': { schema: ApiErrorSchema } },
      },
      401: {
        description: 'Missing or invalid x-admin-secret header',
        content: { 'application/json': { schema: ApiErrorSchema } },
      },
      500: {
        description: 'Failed to store the file',
        content: { 'application/json': { schema: ApiErrorSchema } },
      },
    },
  })

  registry.registerPath({
    method: 'get',
    path: '/api/list',
    operationId: 'listFiles',
    summary: 'List uploaded files',
    security: [{ adminSecret: [] }],
    responses: {
      200: {
        description: 'List of uploaded files',
        content: { 'application/json': { schema: ListFilesSchema } },
      },
      401: {
        description: 'Missing or invalid x-admin-secret header',
        content: { 'application/json': { schema: ApiErrorSchema } },
      },
    },
  })

  registry.registerPath({
    method: 'get',
    path: '/cdn/{fileId}',
    operationId: 'getFile',
    summary: 'Fetch a file from the CDN',
    description:
      'Publicly serves a stored file by its content hash with long-lived caching and permissive CORS. No authentication required.',
    request: { params: z.object({ fileId: FileIdParamSchema }) },
    responses: {
      200: {
        description: 'The file contents',
        content: {
          '*/*': { schema: z.string().openapi({ type: 'string', format: 'binary' }) },
        },
      },
      404: {
        description: 'File not found',
        content: { 'application/json': { schema: ApiErrorSchema } },
      },
    },
  })

  return registry
}

export function generateOpenApiDocument() {
  const registry = createOpenApiRegistry()
  const generator = new OpenApiGeneratorV3(registry.definitions)

  return generator.generateDocument({
    openapi: '3.0.3',
    info: {
      title: 'Simple File Sharing API',
      version: '1.0.0',
      description:
        'Upload files to Cloudflare R2 and serve them via a public CDN route. Files are addressed by the SHA-256 hash of their contents, hex-encoded.',
    },
    servers: [{ url: '/', description: 'The deployment this spec is served from' }],
  })
}
