"use client"

import {
  getReviewsState,
  PublicReview,
  ReviewsState,
  submitReview,
} from "@lib/data/reviews"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import Modal from "@modules/common/components/modal"
import { Button, clx } from "@modules/common/components/ui"
import { useCallback, useEffect, useState } from "react"

const STAR_PATH =
  "M12 2.5l2.9 6.1 6.6.9-4.8 4.6 1.2 6.6L12 17.5 6.1 20.7l1.2-6.6L2.5 9.5l6.6-.9L12 2.5z"

export const Star = ({ filled, size = 18 }: { filled: boolean; size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    aria-hidden="true"
    className={filled ? "text-amber-400" : "text-gray-300"}
    fill="currentColor"
  >
    <path d={STAR_PATH} />
  </svg>
)

export const StarsRow = ({ value, size }: { value: number; size?: number }) => (
  <span
    className="inline-flex items-center gap-0.5"
    role="img"
    aria-label={`Оценка ${value} из 5`}
  >
    {[1, 2, 3, 4, 5].map((n) => (
      <Star key={n} filled={n <= Math.round(value)} size={size} />
    ))}
  </span>
)

export const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })

export const pluralize = (n: number) => {
  const m10 = n % 10
  const m100 = n % 100
  if (m10 === 1 && m100 !== 11) return "отзыв"
  if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return "отзыва"
  return "отзывов"
}

const RATING_HINT: Record<number, string> = {
  1: "Ужасно",
  2: "Плохо",
  3: "Нормально",
  4: "Хорошо",
  5: "Отлично",
}

export const ReviewForm = ({
  productId,
  title = "Поделитесь впечатлениями о товаре",
  subtitle = "Ваше мнение поможет другим покупателям сделать выбор",
  placeholder = "Что вам понравилось? Что можно улучшить?",
}: {
  productId: string
  title?: string
  subtitle?: string
  placeholder?: string
}) => {
  const [rating, setRating] = useState(0)
  const [hover, setHover] = useState(0)
  const [text, setText] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [sending, setSending] = useState(false)
  const [done, setDone] = useState(false)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (rating < 1) {
      setError("Поставьте оценку, нажав на звёзды")
      return
    }
    setSending(true)
    const res = await submitReview({ productId, rating, text })
    setSending(false)
    if (res.ok) {
      setDone(true)
    } else {
      setError(res.error)
    }
  }

  if (done) {
    return (
      <div
        className="rounded-lg border border-green-200 bg-green-50 p-4 text-small-regular text-green-800"
        role="status"
        data-testid="review-success"
      >
        Спасибо! Ваш отзыв отправлен на модерацию и появится после проверки
        администратором
      </div>
    )
  }

  const shown = hover || rating

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-y-3" noValidate>
      <div>
        <p className="text-base-semi">{title}</p>
        <p className="text-small-regular text-ui-fg-subtle">{subtitle}</p>
      </div>

      <div className="flex items-center gap-x-3">
        <div
          className="flex items-center gap-x-0.5"
          role="radiogroup"
          aria-label="Ваша оценка"
          onMouseLeave={() => setHover(0)}
        >
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              role="radio"
              aria-checked={rating === n}
              aria-label={`${n} из 5`}
              onClick={() => setRating(n)}
              onMouseEnter={() => setHover(n)}
              className="rounded p-0.5 transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-900"
            >
              <Star filled={n <= shown} size={28} />
            </button>
          ))}
        </div>
        <span className="text-small-regular text-ui-fg-subtle">
          {shown ? RATING_HINT[shown] : "Выберите оценку"}
        </span>
      </div>

      <div className="flex flex-col gap-y-1">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          maxLength={2000}
          rows={4}
          placeholder={placeholder}
          aria-label="Текст отзыва"
          className="w-full resize-y rounded-md border border-gray-200 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900"
          data-testid="review-text"
        />
        <span className="self-end text-xs text-ui-fg-muted">
          {text.length}/2000
        </span>
      </div>

      {error && (
        <p className="text-small-regular text-rose-600" role="alert">
          {error}
        </p>
      )}

      <div>
        <Button type="submit" disabled={sending} data-testid="review-submit">
          {sending ? "Отправляем…" : "Отправить отзыв"}
        </Button>
      </div>
    </form>
  )
}

export const LoginPrompt = () => (
  <div
    className="flex flex-col items-start gap-y-3 rounded-lg border border-gray-200 bg-gray-50 p-4"
    data-testid="review-login-prompt"
  >
    <p className="text-small-regular">
      Пожалуйста, войдите или зарегистрируйтесь, чтобы оставить отзыв
    </p>
    <LocalizedClientLink
      href="/account"
      className="inline-flex h-10 items-center justify-center rounded-md bg-black px-4 text-white transition-colors hover:bg-gray-800"
    >
      Войти / Зарегистрироваться
    </LocalizedClientLink>
  </div>
)

const ReviewItem = ({ review }: { review: PublicReview }) => (
  <li className="flex flex-col gap-y-1 border-b border-gray-100 py-4 last:border-0">
    <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
      <span className="text-base-semi">{review.author_name}</span>
      <span className="text-small-regular text-ui-fg-muted">
        {formatDate(review.created_at)}
      </span>
    </div>
    <StarsRow value={review.rating} size={16} />
    <p className="whitespace-pre-wrap break-words text-small-regular text-ui-fg-base">
      {review.text}
    </p>
  </li>
)

export default function ProductReviews({ productId }: { productId: string }) {
  const [open, setOpen] = useState(false)
  const [state, setState] = useState<ReviewsState | null>(null)
  const [loading, setLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [extra, setExtra] = useState<PublicReview[]>([])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      setState(await getReviewsState(productId))
      setExtra([])
    } finally {
      setLoading(false)
    }
  }, [productId])

  // Сводка (количество и средняя оценка) для кнопки
  useEffect(() => {
    getReviewsState(productId)
      .then(setState)
      .catch(() => {})
  }, [productId])

  const openModal = () => {
    setOpen(true)
    // свежие отзывы и актуальный статус авторизации
    load()
  }

  const loadMore = async () => {
    if (!state) return
    setLoadingMore(true)
    try {
      const next = await getReviewsState(
        productId,
        state.reviews.length + extra.length
      )
      setExtra((prev) => [...prev, ...next.reviews])
    } finally {
      setLoadingMore(false)
    }
  }

  const all = state ? [...state.reviews, ...extra] : []
  const count = state?.count ?? 0

  return (
    <>
      <button
        type="button"
        onClick={openModal}
        className="inline-flex w-fit items-center gap-x-2 rounded-md text-small-regular text-ui-fg-subtle underline-offset-4 transition-colors hover:text-ui-fg-base hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-900"
        data-testid="product-reviews-button"
      >
        {count > 0 && state ? (
          <>
            <StarsRow value={state.average_rating} size={16} />
            <span>
              {state.average_rating.toFixed(1)} · {count} {pluralize(count)}
            </span>
          </>
        ) : (
          <span>Отзывы</span>
        )}
      </button>

      <Modal isOpen={open} close={() => setOpen(false)} size="large">
        <Modal.Title>Мнения наших покупателей</Modal.Title>

        <div className="mt-4 flex max-h-[60vh] flex-col gap-y-6 overflow-y-auto pr-1">
          {loading && !state ? (
            <p className="text-small-regular text-ui-fg-subtle">Загрузка…</p>
          ) : (
            <>
              {count > 0 && state && (
                <div className="flex items-center gap-x-3">
                  <span className="text-2xl font-semibold">
                    {state.average_rating.toFixed(1)}
                  </span>
                  <StarsRow value={state.average_rating} size={20} />
                  <span className="text-small-regular text-ui-fg-subtle">
                    на основе {count} {pluralize(count)}
                  </span>
                </div>
              )}

              {all.length === 0 ? (
                <p className="text-small-regular text-ui-fg-subtle">
                  Пока нет отзывов об этом товаре. Станьте первым, кто
                  поделится впечатлениями!
                </p>
              ) : (
                <ul data-testid="reviews-list">
                  {all.map((r) => (
                    <ReviewItem key={r.id} review={r} />
                  ))}
                </ul>
              )}

              {all.length < count && (
                <div>
                  <Button
                    variant="secondary"
                    disabled={loadingMore}
                    onClick={loadMore}
                  >
                    {loadingMore ? "Загружаем…" : "Показать ещё"}
                  </Button>
                </div>
              )}

              <div className={clx("border-t border-gray-100 pt-5")}>
                {state?.is_authenticated ? (
                  <ReviewForm productId={productId} />
                ) : (
                  <LoginPrompt />
                )}
              </div>
            </>
          )}
        </div>
      </Modal>
    </>
  )
}
