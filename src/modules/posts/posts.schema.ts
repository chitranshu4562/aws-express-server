import { z } from "zod";

export const createPostSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(5000),
});

// PATCH may send either field, but not an empty body
export const updatePostSchema = createPostSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: "Provide title or description",
  });

export const postParamsSchema = z.object({
  id: z.coerce.number().int().positive(),
});
