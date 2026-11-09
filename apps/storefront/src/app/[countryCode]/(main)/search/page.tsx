import { Metadata } from "next"
import { notFound } from "next/navigation"

import { listProducts } from "@lib/data/products"
import { getRegion } from "@lib/data/regions"
import ProductPreview from "@modules/products/components/product-preview"
import SearchForm from "@modules/search/components/search-form"

const RESULT_LIMIT = 24

type Props = {
  params: Promise<{ countryCode: string }>
  searchParams: Promise<{ q?: string | string[] }>
}

const getQuery = (q?: string | string[]) =>
  (Array.isArray(q) ? q[0] : q)?.trim().slice(0, 200) ?? ""

/** 1 товар, 2 товара, 5 товаров */
const plural = (n: number) => {
  const m10 = n % 10
  const m100 = n % 100
  if (m10 === 1 && m100 !== 11) return "товар"
  if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return "товара"
  return "товаров"
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const query = getQuery((await props.searchParams).q)
  return {
    title: query ? `Поиск: «${query}»` : "Поиск",
    // Страницы поиска не индексируем, чтобы не плодить дубли в Google/Яндекс
    robots: { index: false, follow: true },
  }
}

export default async function SearchPage(props: Props) {
  const { countryCode } = await props.params
  const query = getQuery((await props.searchParams).q)

  const region = await getRegion(countryCode)
  if (!region) {
    notFound()
  }

  const { response } = query
    ? await listProducts({
        countryCode,
        queryParams: { q: query, limit: RESULT_LIMIT },
      })
    : { response: { products: [], count: 0 } }

  return (
    <div className="content-container py-6" data-testid="search-container">
      <h1 className="text-2xl-semi mb-6">
        {query ? `Результаты поиска: «${query}»` : "Поиск"}
      </h1>
      <SearchForm countryCode={countryCode} defaultValue={query} className="mb-8 max-w-xl" />
      {query && (
        <p className="text-small-regular text-ui-fg-subtle mb-6">
          Найдено: {response.count} {plural(response.count)}
        </p>
      )}
      {query && response.products.length === 0 ? (
        <p className="text-ui-fg-subtle">
          По вашему запросу ничего не найдено. Попробуйте изменить запрос.
        </p>
      ) : (
        <ul
          className="grid grid-cols-2 w-full small:grid-cols-3 medium:grid-cols-4 gap-x-4 small:gap-x-6 gap-y-8"
          data-testid="search-results"
        >
          {response.products.map((product) => (
            <li key={product.id}>
              <ProductPreview product={product} region={region} />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
