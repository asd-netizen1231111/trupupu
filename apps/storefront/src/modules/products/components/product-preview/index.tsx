import { getProductPrice } from "@lib/util/get-product-price"
import { HttpTypes } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { Text } from "@modules/common/components/ui"
import Thumbnail from "../thumbnail"
import PreviewPrice from "./price"

export default function ProductPreview({
  product,
  isFeatured,
}: {
  product: HttpTypes.StoreProduct
  isFeatured?: boolean
  region?: HttpTypes.StoreRegion
}) {
  const { cheapestPrice } = getProductPrice({ product })

  return (
    <LocalizedClientLink href={`/product/${product.handle}`} className="group">
      <div data-testid="product-wrapper">
        <Thumbnail
          thumbnail={product.thumbnail}
          images={product.images}
          alt={product.title}
          size="square"
          isFeatured={isFeatured}
        />
        <div className="flex flex-col gap-1 mt-3">
          <Text
            className="text-ui-fg-base line-clamp-2"
            data-testid="product-title"
          >
            {product.title}
          </Text>
          {cheapestPrice && <PreviewPrice price={cheapestPrice} />}
        </div>
      </div>
    </LocalizedClientLink>
  )
}
