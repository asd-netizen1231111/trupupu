import { z } from "zod"

export const PostStoreReview = z.object({
  product_id: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  text: z.string().trim().min(3).max(2000),
})

export type PostStoreReviewType = z.infer<typeof PostStoreReview>

// product_id не указан -> все одобренные отзывы (о магазине и о товарах)
export const GetStoreReviewsQuery = z.object({
  product_id: z.string().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
})
