import SalePrice from "@modules/common/components/sale-price"
import { VariantPrice } from "types/global"

export default function PreviewPrice({ price }: { price: VariantPrice }) {
  if (!price) {
    return null
  }

  return (
    <SalePrice
      price={price.calculated_price}
      originalPrice={price.original_price}
      percent={price.percentage_diff}
      onSale={price.original_price_number > price.calculated_price_number}
    />
  )
}
