import { z } from "zod";

export const SwaggerDocSchema = z.object({
  openapi: z.string(),
  info: z.object({
    title: z.string(),
    version: z.string(),
  }),
  paths: z.record(z.string(), z.any()),
  components: z.optional(z.any()),
});

export type SwaggerDoc = z.infer<typeof SwaggerDocSchema>;
