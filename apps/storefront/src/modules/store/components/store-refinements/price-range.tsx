"use client"

import * as Slider from "@radix-ui/react-slider"
import { useEffect, useState } from "react"
import { useRange } from "react-instantsearch"

import { indexedCurrency, priceAttribute } from "@lib/search-client"
import { formatMoney } from "@lib/util/money"

/**
 * Фильтр по цене: ползунок + поля «от / до».
 * Границы берутся из статистики индекса по полю min_price_<валюта>.
 */
const PriceRange = ({ currencyCode }: { currencyCode: string }) => {
  const { start, range, canRefine, refine } = useRange({
    attribute: priceAttribute("min_price", currencyCode),
  })
  const currency = indexedCurrency(currencyCode)

  const min = Math.floor(range.min ?? 0)
  const max = Math.ceil(range.max ?? 0)

  const from = Number.isFinite(start[0]) ? (start[0] as number) : min
  const to = Number.isFinite(start[1]) ? (start[1] as number) : max

  const [value, setValue] = useState<number[]>([from, to])

  useEffect(() => {
    setValue([from, to])
  }, [from, to])

  if (!canRefine || min >= max) {
    return null
  }

  const clamp = (n: number) => Math.min(Math.max(n, min), max)

  const commit = (next: number[]) => {
    const a = clamp(Math.min(next[0], next[1]))
    const b = clamp(Math.max(next[0], next[1]))
    setValue([a, b])
    refine([a, b])
  }

  const inputClass =
    "w-full rounded-rounded border border-ui-border-base bg-ui-bg-field px-2 py-1.5 text-small-regular outline-none focus:border-ui-border-interactive"

  return (
    <div className="flex flex-col gap-y-4">
      <span className="txt-compact-small-plus text-ui-fg-subtle">
        Цена, {currency.toUpperCase()}
      </span>

      <div className="flex flex-col gap-y-3 pr-2">
        <div className="flex items-center gap-x-2">
          <input
            type="number"
            inputMode="numeric"
            aria-label="Цена от"
            placeholder={`от ${min}`}
            className={inputClass}
            value={value[0]}
            min={min}
            max={max}
            onChange={(e) => setValue([Number(e.target.value), value[1]])}
            onBlur={() => commit(value)}
            onKeyDown={(e) => e.key === "Enter" && commit(value)}
            data-testid="price-from"
          />
          <span className="text-ui-fg-muted">—</span>
          <input
            type="number"
            inputMode="numeric"
            aria-label="Цена до"
            placeholder={`до ${max}`}
            className={inputClass}
            value={value[1]}
            min={min}
            max={max}
            onChange={(e) => setValue([value[0], Number(e.target.value)])}
            onBlur={() => commit(value)}
            onKeyDown={(e) => e.key === "Enter" && commit(value)}
            data-testid="price-to"
          />
        </div>

        <Slider.Root
          className="relative flex h-5 w-full touch-none select-none items-center"
          value={value}
          min={min}
          max={max}
          step={1}
          minStepsBetweenThumbs={0}
          onValueChange={setValue}
          onValueCommit={commit}
          aria-label="Диапазон цены"
          data-testid="price-range"
        >
          <Slider.Track className="relative h-0.5 w-full grow rounded-full bg-ui-border-base">
            <Slider.Range className="absolute h-full rounded-full bg-ui-fg-interactive" />
          </Slider.Track>
          {value.map((_, index) => (
            <Slider.Thumb
              key={index}
              className="block h-4 w-4 rounded-full border border-ui-border-interactive bg-ui-bg-base shadow-elevation-card-rest outline-none focus-visible:ring-2 focus-visible:ring-ui-fg-interactive"
              aria-label={index === 0 ? "Минимальная цена" : "Максимальная цена"}
            />
          ))}
        </Slider.Root>

        <div className="flex items-center justify-between text-small-regular text-ui-fg-subtle">
          <span>{formatMoney(min, currency, 0)}</span>
          <span>{formatMoney(max, currency, 0)}</span>
        </div>
      </div>
    </div>
  )
}

export default PriceRange
