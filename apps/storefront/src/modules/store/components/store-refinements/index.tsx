"use client"

import { useState } from "react"
import { useSortBy } from "react-instantsearch"

import FilterRadioGroup from "@modules/common/components/filter-radio-group"
import { CATEGORY_ATTRIBUTE, getSortOptions } from "./attributes"
import CurrentRefinements from "./current-refinements"
import OnSaleToggle from "./on-sale-toggle"
import OptionRefinements from "./option-refinements"
import PriceRange from "./price-range"
import RefinementGroup from "./refinement-group"

const SortProducts = ({ currencyCode }: { currencyCode: string }) => {
  const items = getSortOptions(currencyCode)
  const { currentRefinement, refine } = useSortBy({ items })

  return (
    <FilterRadioGroup
      title="Сортировка"
      items={items}
      value={currentRefinement}
      handleChange={refine}
      data-testid="sort-by-container"
    />
  )
}

const StoreRefinements = ({
  currencyCode,
  hideCategories = false,
}: {
  currencyCode: string
  hideCategories?: boolean
}) => {
  // На мобильных фильтры свёрнуты под кнопку, чтобы не занимать весь экран
  const [open, setOpen] = useState(false)

  return (
    <div className="mb-8 small:w-[250px] small:shrink-0 small:mr-8">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="small:hidden w-full flex items-center justify-between rounded-rounded border border-ui-border-base px-4 py-3 text-base-semi"
        aria-expanded={open}
        data-testid="filters-toggle"
      >
        Фильтры и сортировка
        <span aria-hidden>{open ? "−" : "+"}</span>
      </button>

      <div
        className={`${
          open ? "flex" : "hidden"
        } small:flex flex-col gap-10 py-4`}
      >
        <CurrentRefinements currencyCode={currencyCode} />
        {!hideCategories && (
          <RefinementGroup attribute={CATEGORY_ATTRIBUTE} title="Категории" />
        )}
        <PriceRange currencyCode={currencyCode} />
        <OnSaleToggle currencyCode={currencyCode} />
        <OptionRefinements />
        <SortProducts currencyCode={currencyCode} />
      </div>
    </div>
  )
}

export default StoreRefinements
