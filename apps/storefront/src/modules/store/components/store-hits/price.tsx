"use client"

import { indexedCurrency, priceAttribute } from "@lib/search-client"
import { formatMoney } from "@lib/util/money"
import SalePrice from "@modules/common/components/sale-price"

/** Поля цены, которые приходят из поискового индекса, например `min_price_byn`. */
export type HitPricing = Record<string, unknown>

type HitPriceProps = {
  hit: HitPricing
  currencyCode: string
}

const amount = (value: unknown) => (typeof value === "number" ? value : null)

const HitPrice = ({ hit, currencyCode }: HitPriceProps) => {
  const currency = indexedCurrency(currencyCode)
  const min_price = amount(hit[priceAttribute("min_price", currencyCode)])
  const max_price = amount(hit[priceAttribute("max_price", currencyCode)])
  const original_price = amount(
    hit[priceAttribute("original_price", currencyCode)]
  )
  const on_sale = hit[priceAttribute("on_sale", currencyCode)] === true

  if (min_price === null) {
    return null
  }

  const isRange = (max_price ?? min_price) > min_price
  const percent =
    on_sale && original_price
      ? ((original_price - min_price) / original_price) * 100
      : null

  return (
    <SalePrice
      prefix={isRange ? "от" : undefined}
      price={formatMoney(min_price, currency)}
      originalPrice={
        original_price !== null ? formatMoney(original_price, currency) : null
      }
      percent={percent}
      onSale={on_sale}
    />
  )
}

export default HitPrice
