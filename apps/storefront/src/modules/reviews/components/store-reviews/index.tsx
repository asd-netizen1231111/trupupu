"use client"

import {
  getAllReviewsState,
  PublicReview,
  ReviewsState,
} from "@lib/data/reviews"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import Modal from "@modules/common/components/modal"
import {
  formatDate,
  LoginPrompt,
  pluralize,
  ReviewForm,
  StarsRow,
} from "@modules/products/components/product-reviews"
import { Button } from "@modules/common/components/ui"
import { useEffect, useState } from "react"

// Служебный идентификатор: отзыв о работе магазина, а не о товаре
const STORE_REVIEW_ID = "store"

const ReviewItem = ({ review }: { review: PublicReview }) => (
  <li className="flex flex-col gap-y-1 border-b border-gray-200 py-5 last:border-0">
    <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
      <span className="text-base-semi">{review.author_name}</span>
      <span className="text-small-regular text-ui-fg-muted">
        {formatDate(review.created_at)}
      </span>
    </div>
    <StarsRow value={review.rating} size={16} />
    <p className="whitespace-pre-wrap break-words text-base-regular text-ui-fg-base">
      {review.text}
    </p>
    <p className="text-small-regular text-ui-fg-subtle">
      {review.is_store_review || !review.product_handle ? (
        "Отзыв о работе магазина"
      ) : (
        <>
          Отзыв о товаре:{" "}
          <LocalizedClientLink
            href={`/product/${review.product_handle}`}
            className="underline underline-offset-2 hover:text-ui-fg-base"
          >
            {review.product_title ?? "товар"}
          </LocalizedClientLink>
        </>
      )}
    </p>
  </li>
)

export default function StoreReviews({
  initial,
}: {
  initial: ReviewsState
}) {
  const [state, setState] = useState<ReviewsState>(initial)
  const [extra, setExtra] = useState<PublicReview[]>([])
  const [loadingMore, setLoadingMore] = useState(false)
  const [open, setOpen] = useState(false)

  // Актуальный статус авторизации и свежие отзывы после монтирования
  useEffect(() => {
    getAllReviewsState()
      .then(setState)
      .catch(() => {})
  }, [])

  const openModal = async () => {
    setOpen(true)
    try {
      setState(await getAllReviewsState())
      setExtra([])
    } catch {
      // оставляем уже загруженные данные
    }
  }

  const loadMore = async () => {
    setLoadingMore(true)
    try {
      const next = await getAllReviewsState(state.reviews.length + extra.length)
      setExtra((prev) => [...prev, ...next.reviews])
    } finally {
      setLoadingMore(false)
    }
  }

  const all = [...state.reviews, ...extra]
  const count = state.count

  return (
    <>
      <div className="flex justify-center">
        <button
          type="button"
          onClick={openModal}
          className="inline-flex h-11 min-w-[173px] items-center justify-center bg-[#0b6fb8] px-6 text-sm text-white transition-colors hover:bg-[#095a96] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#0b6fb8]"
          data-testid="add-review-button"
        >
          Добавить отзыв
        </button>
      </div>

      <hr className="my-8 border-gray-200" />

      {count > 0 && (
        <div className="mb-2 flex flex-wrap items-center gap-x-3 gap-y-1">
          <span className="text-2xl font-semibold">
            {state.average_rating.toFixed(1)}
          </span>
          <StarsRow value={state.average_rating} size={20} />
          <span className="text-small-regular text-ui-fg-subtle">
            {count} {pluralize(count)}
          </span>
        </div>
      )}

      {all.length === 0 ? (
        <p className="py-6 text-base-regular text-ui-fg-subtle">
          Пока здесь нет отзывов. Станьте первым, кто поделится впечатлениями,
          мы будем очень рады!
        </p>
      ) : (
        <ul data-testid="store-reviews-list">
          {all.map((r) => (
            <ReviewItem key={r.id} review={r} />
          ))}
        </ul>
      )}

      {all.length < count && (
        <div className="mt-4 flex justify-center">
          <Button variant="secondary" disabled={loadingMore} onClick={loadMore}>
            {loadingMore ? "Загружаем…" : "Показать ещё"}
          </Button>
        </div>
      )}

      <Modal isOpen={open} close={() => setOpen(false)} size="large">
        <Modal.Title>Ваш отзыв о нашей работе</Modal.Title>
        <div className="mt-4 flex max-h-[60vh] flex-col gap-y-4 overflow-y-auto pr-1">
          {state.is_authenticated ? (
            <ReviewForm
              productId={STORE_REVIEW_ID}
              title="Расскажите, как мы работаем"
              subtitle="Нам важно каждое слово: ваш отзыв помогает нам становиться лучше. Он появится на сайте после проверки модератором."
              placeholder="Что вам понравилось в нашем магазине? Что мы можем улучшить?"
            />
          ) : (
            <LoginPrompt />
          )}
        </div>
      </Modal>
    </>
  )
}
