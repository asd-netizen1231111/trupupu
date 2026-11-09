import { HttpTypes } from "@medusajs/types"
import { Heading, Text } from "@modules/common/components/ui"
import ProductReviews from "@modules/products/components/product-reviews"

type ProductInfoProps = {
  product: HttpTypes.StoreProduct
}

const ProductInfo = ({ product }: ProductInfoProps) => {
  return (
    <div id="product-info" className="flex flex-col gap-y-3">
      <Heading
        level="h1"
        className="text-2xl small:text-3xl leading-tight text-ui-fg-base"
        data-testid="product-title"
      >
        {product.title}
      </Heading>
      {product.subtitle && (
        <Text className="text-ui-fg-subtle">{product.subtitle}</Text>
      )}
      <ProductReviews productId={product.id} />
    </div>
  )
}

export default ProductInfo
