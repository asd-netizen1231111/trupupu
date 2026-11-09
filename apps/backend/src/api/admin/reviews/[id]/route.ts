import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"
import { REVIEW_MODULE } from "../../../../modules/review"
import ReviewModuleService from "../../../../modules/review/service"
import { toAdminReviews } from "../../../../lib/reviews"
import { PostAdminReviewStatusType } from "../validators"

// Смена статуса: approved / rejected / pending
export async function POST(
  req: MedusaRequest<PostAdminReviewStatusType>,
  res: MedusaResponse
) {
  const service: ReviewModuleService = req.scope.resolve(REVIEW_MODULE)
  const { id } = req.params

  const [existing] = await service.listProductReviews({ id }, { take: 1 })
  if (!existing) {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, "Отзыв не найден")
  }

  const updated = await service.updateProductReviews({
    id,
    status: req.validatedBody.status,
  })
  const [review] = await toAdminReviews(req.scope, [updated])

  res.json({ review })
}

// Полное удаление записи
export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  const service: ReviewModuleService = req.scope.resolve(REVIEW_MODULE)
  const { id } = req.params

  const [existing] = await service.listProductReviews({ id }, { take: 1 })
  if (!existing) {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, "Отзыв не найден")
  }

  await service.deleteProductReviews(id)

  res.json({ id, object: "product_review", deleted: true })
}
