import { z } from "zod"

export const PostAdminSiteSettings = z.object({
  phone: z.string().optional(),
  work_hours: z.string().optional(),
  legal_name: z.string().optional(),
  unp: z.string().optional(),
  address: z.string().optional(),
  email: z.string().optional(),
  bank_name: z.string().optional(),
  bank_account: z.string().optional(),
  socials: z.record(z.string(), z.string()).optional(),
})

export type PostAdminSiteSettingsType = z.infer<typeof PostAdminSiteSettings>
