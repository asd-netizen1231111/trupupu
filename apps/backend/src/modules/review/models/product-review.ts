import { model } from "@medusajs/framework/utils"

export const REVIEW_STATUSES = ["pending", "approved", "rejected"] as const
export type ReviewStatus = (typeof REVIEW_STATUSES)[number]

// Отзыв покупателя о товаре. Новые отзывы попадают на модерацию (pending).
const ProductReview = model.define("product_review", {
  id: model.id({ prefix: "prev" }).primaryKey(),
  product_id: model.text().index(),
  customer_id: model.text().index(),
  rating: model.number(),
  text: model.text(),
  status: model.enum([...REVIEW_STATUSES]).default("pending"),
})

export default ProductReview
