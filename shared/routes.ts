import { z } from 'zod';
import { insertMessageSchema, messages, media, jobs, nodes } from './schema';

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
};

export const jobInputItemSchema = z.object({
  id: z.string(),
  type: z.string(),
  url: z.string(),
  thumb_url: z.string().optional(),
});

export const api = {
  messages: {
    list: {
      method: 'GET' as const,
      path: '/api/messages' as const,
      responses: {
        200: z.array(z.custom<typeof messages.$inferSelect>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/messages' as const,
      input: insertMessageSchema,
      responses: {
        201: z.custom<typeof messages.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
  },
  media: {
    list: {
      method: 'GET' as const,
      path: '/api/media' as const,
      responses: {
        200: z.array(z.custom<typeof media.$inferSelect>()),
      },
    },
    mock: {
      method: 'GET' as const,
      path: '/api/media/mock' as const,
      responses: {
        200: z.object({
          items: z.array(z.object({
            id: z.string(),
            type: z.enum(['video', 'image']),
            url: z.string(),
            thumb_url: z.string().optional(),
            mtime: z.string(),
            tags: z.array(z.string()),
            favorite: z.boolean(),
          })),
        }),
      },
    }
  },
  jobs: {
    list: {
      method: 'GET' as const,
      path: '/api/jobs' as const,
      responses: {
        200: z.array(z.custom<typeof jobs.$inferSelect>()),
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/jobs/:id' as const,
      responses: {
        200: z.custom<typeof jobs.$inferSelect>(),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/jobs' as const,
      input: z.object({
        type: z.enum(["comfyui.image", "comfyui.video", "media.describe", "system.task"]),
        title: z.string(),
        node: z.enum(["Kratos", "Hades", "Hermes"]),
        inputs: z.array(jobInputItemSchema).default([]),
      }),
      responses: {
        201: z.custom<typeof jobs.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    update: {
      method: 'PATCH' as const,
      path: '/api/jobs/:id' as const,
      input: z.object({
        status: z.enum(["queued", "running", "done", "failed"]).optional(),
        progress: z.number().min(0).max(100).optional(),
        outputs: z.array(jobInputItemSchema).optional(),
        logs: z.array(z.string()).optional(),
      }),
      responses: {
        200: z.custom<typeof jobs.$inferSelect>(),
      },
    },
  },
  nodes: {
    list: {
      method: 'GET' as const,
      path: '/api/nodes' as const,
      responses: {
        200: z.array(z.custom<typeof nodes.$inferSelect>()),
      },
    }
  }
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}

export type MessageResponse = z.infer<typeof api.messages.create.responses[201]>;
export type MediaResponse = z.infer<typeof api.media.list.responses[200]>[number];
export type JobResponse = z.infer<typeof api.jobs.list.responses[200]>[number];
export type NodeResponse = z.infer<typeof api.nodes.list.responses[200]>[number];
export type MockMediaResponse = z.infer<typeof api.media.mock.responses[200]>;
