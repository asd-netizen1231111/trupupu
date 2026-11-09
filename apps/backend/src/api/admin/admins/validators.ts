import { z } from "zod"

export const PostAdminCreateAdmin = z.object({
  email: z.string().trim().toLowerCase().email().max(255),
  password: z.string().min(8).max(128),
  first_name: z.string().trim().max(100).optional(),
  last_name: z.string().trim().max(100).optional(),
})

export const PostAdminUpdateAdmin = z
  .object({
    password: z.string().min(8).max(128).optional(),
    first_name: z.string().trim().max(100).optional(),
    last_name: z.string().trim().max(100).optional(),
  })
  .refine((v) => Object.keys(v).length > 0, {
    message: "Нечего обновлять",
  })

export type PostAdminCreateAdminType = z.infer<typeof PostAdminCreateAdmin>
export type PostAdminUpdateAdminType = z.infer<typeof PostAdminUpdateAdmin>
