import { Metadata } from "next"

import { getAllReviewsState } from "@lib/data/reviews"
import { getSiteOrigin, siteUrl, STORE_NAME } from "@lib/util/site"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import StoreReviews from "@modules/reviews/components/store-reviews"

type Props = { params: Promise<{ countryCode: string }> }

export const dynamic = "force-dynamic"

export async function generateMetadata(props: Props): Promise<Metadata> {
  const { countryCode } = await props.params
  const origin = await getSiteOrigin()
  return {
    title: "Отзывы",
    description: `Отзывы покупателей об интернет-магазине ${STORE_NAME} и о товарах.`,
    alternates: { canonical: siteUrl(origin, countryCode, "/reviews") },
  }
}

export default async function ReviewsPage() {
  const initial = await getAllReviewsState()

  return (
    <div className="content-container py-10 small:py-14 max-w-5xl" data-testid="reviews-page">
      <nav
        aria-label="Хлебные крошки"
        className="mb-4 flex gap-2 text-small-regular text-ui-fg-subtle"
      >
        <LocalizedClientLink href="/" className="hover:text-ui-fg-base">
          Главная
        </LocalizedClientLink>
        <span>/</span>
        <span>Отзывы</span>
      </nav>

      <h1 className="mb-5 text-3xl font-bold">Отзывы</h1>

      <div className="mb-5 flex flex-col gap-y-1 text-base-regular text-ui-fg-base">
        <p>
          Уважаемые покупатели! Спасибо, что выбрали «{STORE_NAME}». Нам очень
          важно ваше мнение о нашей работе, и мы читаем каждый отзыв.
        </p>
        <p>
          Мы искренне благодарны вам как за добрые слова и положительную
          оценку, так и за конструктивную критику: именно она помогает нам
          становиться лучше и заботливее относиться к вам. Если что-то пошло
          не так,{" "}
          <LocalizedClientLink
            href="/contact"
            className="text-[#0b6fb8] border-b border-dashed border-[#0b6fb8] hover:border-solid"
          >
            сообщите нам о проблеме
          </LocalizedClientLink>
          , и мы оперативно свяжемся с вами и всё исправим.
        </p>
      </div>

      <p className="mb-5 text-base-semi">
        Чтобы просто поделиться впечатлениями о нашей работе, нажмите кнопку
        ниже. Здесь же собраны отзывы о товарах нашего магазина.
      </p>

      <StoreReviews initial={initial} />
    </div>
  )
}
