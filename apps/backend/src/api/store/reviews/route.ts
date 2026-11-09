import {
  AuthenticatedMedusaRequest,
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys, MedusaError } from "@medusajs/framework/utils"
import { REVIEW_MODULE } from "../../../modules/review"
import ReviewModuleService from "../../../modules/review/service"
import { STORE_REVIEW_PRODUCT_ID, toPublicReviews } from "../../../lib/reviews"
import { GetStoreReviewsQuery, PostStoreReviewType } from "./validators"

// Публичный список: только одобренные отзывы выбранного товара
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const parsed = GetStoreReviewsQuery.safeParse(req.query)
  if (!parsed.success) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "Неверные параметры: product_id, limit 1-100, offset >= 0"
    )
  }
  const { product_id, limit, offset } = parsed.data

  const service: ReviewModuleService = req.scope.resolve(REVIEW_MODULE)
  // Без product_id отдаём все одобренные отзывы: и о магазине, и о товарах
  const filters = product_id
    ? { product_id, status: "approved" as const }
    : { status: "approved" as const }
  const [reviews, count] = await service.listAndCountProductReviews(filters, {
    take: limit,
    skip: offset,
    order: { created_at: "DESC" },
  })

  const items = await toPublicReviews(req.scope, reviews, {
    withProducts: !product_id,
  })
  const ratings = await service.listProductReviews(filters, {
    select: ["rating"],
  })
  const average =
    ratings.length > 0
      ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length
      : 0

  res.json({
    reviews: items,
    count,
    limit,
    offset,
    average_rating: Math.round(average * 10) / 10,
  })
}

// Создание отзыва: только для авторизованного покупателя, статус всегда pending
export async function POST(
  req: AuthenticatedMedusaRequest<PostStoreReviewType>,
  res: MedusaResponse
) {
  const customerId = req.auth_context?.actor_id
  if (!customerId) {
    throw new MedusaError(
      MedusaError.Types.UNAUTHORIZED,
      "Войдите в аккаунт, чтобы оставить отзыв"
    )
  }

  const { product_id, rating, text } = req.validatedBody

  // product_id "store" — отзыв о работе магазина, проверять товар не нужно
  if (product_id !== STORE_REVIEW_PRODUCT_ID) {
    const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
    const { data: products } = await query.graph({
      entity: "product",
      fields: ["id"],
      filters: { id: product_id },
    })
    if (!products.length) {
      throw new MedusaError(MedusaError.Types.NOT_FOUND, "Товар не найден")
    }
  }

  const service: ReviewModuleService = req.scope.resolve(REVIEW_MODULE)
  const review = await service.createProductReviews({
    product_id,
    customer_id: customerId,
    rating,
    text,
    status: "pending",
  })

  res.status(201).json({
    review: {
      id: review.id,
      product_id: review.product_id,
      rating: review.rating,
      text: review.text,
      status: review.status,
      created_at: review.created_at,
    },
  })
}
