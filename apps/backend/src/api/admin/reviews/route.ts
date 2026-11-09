import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"
import { REVIEW_MODULE } from "../../../modules/review"
import ReviewModuleService from "../../../modules/review/service"
import { toAdminReviews } from "../../../lib/reviews"
import { GetAdminReviewsQuery } from "./validators"

// Все отзывы для модерации, с фильтром по статусу
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const parsed = GetAdminReviewsQuery.safeParse(req.query)
  if (!parsed.success) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "Неверные параметры: status, limit, offset"
    )
  }
  const { status, limit, offset } = parsed.data

  const service: ReviewModuleService = req.scope.resolve(REVIEW_MODULE)
  const filters = status ? { status } : {}

  const [reviews, count] = await service.listAndCountProductReviews(filters, {
    take: limit,
    skip: offset,
    order: { created_at: "DESC" },
  })

  const [pending, approved, rejected] = await Promise.all([
    service.listProductReviews({ status: "pending" }, { select: ["id"] }),
    service.listProductReviews({ status: "approved" }, { select: ["id"] }),
    service.listProductReviews({ status: "rejected" }, { select: ["id"] }),
  ])

  res.json({
    reviews: await toAdminReviews(req.scope, reviews),
    count,
    limit,
    offset,
    counters: {
      pending: pending.length,
      approved: approved.length,
      rejected: rejected.length,
      all: pending.length + approved.length + rejected.length,
    },
  })
}
