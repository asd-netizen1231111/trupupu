import { z } from "zod"

export const REVIEW_STATUS_VALUES = ["pending", "approved", "rejected"] as const

export const GetAdminReviewsQuery = z.object({
  status: z.enum(REVIEW_STATUS_VALUES).optional(),
  limit: z.coerce.number().int().min(1).max(200).default(50),
  offset: z.coerce.number().int().min(0).default(0),
})

export const PostAdminReviewStatus = z.object({
  status: z.enum(REVIEW_STATUS_VALUES),
})

export type PostAdminReviewStatusType = z.infer<typeof PostAdminReviewStatus>
