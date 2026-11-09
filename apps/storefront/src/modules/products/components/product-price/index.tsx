import { getProductPrice } from "@lib/util/get-product-price"
import { HttpTypes } from "@medusajs/types"
import SalePrice from "@modules/common/components/sale-price"

export default function ProductPrice({
  product,
  variant,
}: {
  product: HttpTypes.StoreProduct
  variant?: HttpTypes.StoreProductVariant
}) {
  const { cheapestPrice, variantPrice } = getProductPrice({
    product,
    variantId: variant?.id,
  })

  const selectedPrice = variant ? variantPrice : cheapestPrice

  if (!selectedPrice) {
    return <div className="block w-32 h-9 bg-gray-100 animate-pulse" />
  }

  const hasManyPrices = !variant && (product.variants?.length ?? 0) > 1

  return (
    <SalePrice
      size="lg"
      prefix={hasManyPrices ? "от" : undefined}
      price={selectedPrice.calculated_price}
      originalPrice={selectedPrice.original_price}
      percent={selectedPrice.percentage_diff}
      onSale={
        selectedPrice.original_price_number >
        selectedPrice.calculated_price_number
      }
    />
  )
}
