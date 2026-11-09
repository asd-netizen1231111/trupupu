"use server"

import { sdk } from "@lib/config"
import { retrieveCustomer } from "./customer"
import { getAuthHeaders } from "./cookies"

export type PublicReview = {
  id: string
  product_id: string
  rating: number
  text: string
  created_at: string
  author_name: string
  // Заполняются только в общем списке (страница «Отзывы»)
  is_store_review?: boolean
  product_title?: string | null
  product_handle?: string | null
}

export type ReviewsState = {
  reviews: PublicReview[]
  count: number
  average_rating: number
  is_authenticated: boolean
}

const PAGE_SIZE = 10

type ReviewsResponse = {
  reviews: PublicReview[]
  count: number
  average_rating: number
}

/** Одобренные отзывы товара + признак, что покупатель вошёл в аккаунт. */
export async function getReviewsState(
  productId: string,
  offset = 0
): Promise<ReviewsState> {
  const [data, customer] = await Promise.all([
    sdk.client
      .fetch<ReviewsResponse>("/store/reviews", {
        query: { product_id: productId, limit: PAGE_SIZE, offset },
        cache: "no-store",
      })
      .catch(() => ({ reviews: [], count: 0, average_rating: 0 })),
    retrieveCustomer(),
  ])

  return {
    reviews: data.reviews,
    count: data.count,
    average_rating: data.average_rating,
    is_authenticated: !!customer,
  }
}

/** Все одобренные отзывы: о магазине и о товарах (раздел «Отзывы» в подвале). */
export async function getAllReviewsState(offset = 0): Promise<ReviewsState> {
  const [data, customer] = await Promise.all([
    sdk.client
      .fetch<ReviewsResponse>("/store/reviews", {
        query: { limit: PAGE_SIZE, offset },
        cache: "no-store",
      })
      .catch(() => ({ reviews: [], count: 0, average_rating: 0 })),
    retrieveCustomer(),
  ])

  return {
    reviews: data.reviews,
    count: data.count,
    average_rating: data.average_rating,
    is_authenticated: !!customer,
  }
}

export type SubmitReviewResult = { ok: true } | { ok: false; error: string }

export async function submitReview(input: {
  productId: string
  rating: number
  text: string
}): Promise<SubmitReviewResult> {
  const text = input.text.trim()

  if (!Number.isInteger(input.rating) || input.rating < 1 || input.rating > 5) {
    return { ok: false, error: "Выберите оценку от 1 до 5 звёзд" }
  }
  if (text.length < 3) {
    return { ok: false, error: "Напишите хотя бы пару слов о товаре" }
  }
  if (text.length > 2000) {
    return { ok: false, error: "Отзыв слишком длинный (максимум 2000 символов)" }
  }

  const headers = await getAuthHeaders()
  if (!("authorization" in headers)) {
    return {
      ok: false,
      error: "Пожалуйста, войдите или зарегистрируйтесь, чтобы оставить отзыв",
    }
  }

  try {
    await sdk.client.fetch("/store/reviews", {
      method: "POST",
      headers,
      body: { product_id: input.productId, rating: input.rating, text },
      cache: "no-store",
    })
    return { ok: true }
  } catch (e) {
    const status = (e as { status?: number }).status
    if (status === 401) {
      return {
        ok: false,
        error: "Сессия истекла. Войдите в аккаунт и попробуйте снова",
      }
    }
    return { ok: false, error: "Не удалось отправить отзыв. Попробуйте позже" }
  }
}
