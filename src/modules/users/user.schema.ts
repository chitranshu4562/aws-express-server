import { z } from "zod";

export const signupSchema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email()),
  password: z.string().min(8).max(72),
});

export type SignupInput = z.infer<typeof signupSchema>;
