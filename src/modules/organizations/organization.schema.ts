import { z } from "zod";

const name = z.string().trim().min(1).max(100);
const slug = z
  .string()
  .trim()
  .toLowerCase()
  .min(3)
  .max(50)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers and single hyphens");

export const createOrganizationSchema = z.object({ name, slug });

export const updateOrganizationSchema = z
  .object({ name: name.optional(), slug: slug.optional() })
  .refine((data) => data.name !== undefined || data.slug !== undefined, {
    message: "Provide at least one field to update",
  });

export type CreateOrganizationInput = z.infer<typeof createOrganizationSchema>;
export type UpdateOrganizationInput = z.infer<typeof updateOrganizationSchema>;
