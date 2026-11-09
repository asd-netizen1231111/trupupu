"use client"

import type { SearchClient } from "instantsearch.js"
import { ReactNode, useMemo } from "react"
import { Configure, InstantSearch } from "react-instantsearch"

import {
  PRODUCT_INDEX_NAME,
  searchClient,
  withCategoryFilter,
} from "@lib/search-client"
import StoreHits from "@modules/store/components/store-hits"
import StoreRefinements from "@modules/store/components/store-refinements"
import StoreSearchBox from "@modules/store/components/store-search-box"

const PRODUCT_LIMIT = 12

type StoreTemplateProps = {
  currencyCode: string
  title?: string
  /** Если задано — каталог показывает только товары этой категории */
  categoryName?: string
  header?: ReactNode
}

/**
 * Каталог: поиск + фильтры (категория, цена, «со скидкой») + сортировка.
 * Используется и для /catalog, и для /catalog/<категория>.
 */
const StoreTemplate = ({
  currencyCode,
  title = "Каталог товаров",
  categoryName,
  header,
}: StoreTemplateProps) => {
  const client = useMemo(
    () => (categoryName ? withCategoryFilter(categoryName) : searchClient),
    [categoryName]
  )

  return (
    <div className="py-6 content-container" data-testid="category-container">
      {header}
      <div className="mb-8 text-2xl-semi">
        <h1 data-testid="store-page-title">{title}</h1>
      </div>

      <InstantSearch
        indexName={PRODUCT_INDEX_NAME}
        searchClient={client as unknown as SearchClient}
        routing
        future={{ preserveSharedStateOnUnmount: true }}
      >
        <Configure hitsPerPage={PRODUCT_LIMIT} />
        <div className="flex flex-col small:flex-row small:items-start">
          <StoreRefinements
            currencyCode={currencyCode}
            hideCategories={!!categoryName}
          />
          <div className="w-full min-w-0">
            <StoreSearchBox />
            <StoreHits hitsPerPage={PRODUCT_LIMIT} currencyCode={currencyCode} />
          </div>
        </div>
      </InstantSearch>
    </div>
  )
}

export default StoreTemplate
