import { clx } from "@modules/common/components/ui"

type SalePriceProps = {
  /** Итоговая цена (уже со скидкой), отформатированная */
  price: string
  /** Цена до скидки, отформатированная. Показывается только если есть скидка */
  originalPrice?: string | null
  /** Процент скидки, например 20 */
  percent?: number | string | null
  onSale?: boolean
  prefix?: string
  size?: "sm" | "lg"
  className?: string
}

/**
 * Единый вид цены по всему сайту.
 * Цвет скидки — переменная --sale-color в globals.css
 * (поменяем на этапе дизайна в одном месте).
 */
const SalePrice = ({
  price,
  originalPrice,
  percent,
  onSale,
  prefix,
  size = "sm",
  className,
}: SalePriceProps) => {
  const showSale = !!onSale && !!originalPrice && originalPrice !== price
  const pct = Number(percent)

  return (
    <div
      className={clx(
        "flex flex-wrap items-baseline gap-x-2 gap-y-1",
        className
      )}
      data-testid="product-price"
    >
      <span
        className={clx(
          "font-semibold",
          size === "lg" ? "text-2xl" : "text-base",
          showSale ? "text-[color:var(--sale-color)]" : "text-ui-fg-base"
        )}
        data-testid="price"
      >
        {prefix && (
          <span className="font-normal text-ui-fg-subtle">{prefix} </span>
        )}
        {price}
      </span>
      {showSale && (
        <>
          <s
            className={clx(
              "text-ui-fg-muted",
              size === "lg" ? "text-base" : "text-small-regular"
            )}
            data-testid="original-price"
          >
            {originalPrice}
          </s>
          {pct > 0 && (
            <span
              className="rounded-full bg-[color:var(--sale-color)] px-2 py-0.5 text-xsmall-regular font-semibold text-white"
              data-testid="discount-badge"
            >
              −{Math.round(pct)}%
            </span>
          )}
        </>
      )}
    </div>
  )
}

export default SalePrice
