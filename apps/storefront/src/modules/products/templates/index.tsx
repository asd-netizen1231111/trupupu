import React, { Suspense } from "react"

import { HttpTypes } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import VariantImageGallery from "@modules/products/components/image-gallery/variant-image-gallery"
import ProductActions from "@modules/products/components/product-actions"
import ProductTabs from "@modules/products/components/product-tabs"
import ProductWarranty from "@modules/products/components/product-warranty"
import RelatedProducts from "@modules/products/components/related-products"
import ProductInfo from "@modules/products/templates/product-info"
import SkeletonRelatedProducts from "@modules/skeletons/templates/skeleton-related-products"
import { notFound } from "next/navigation"

type ProductTemplateProps = {
  product: HttpTypes.StoreProduct
  region: HttpTypes.StoreRegion
  countryCode: string
}

const ProductTemplate: React.FC<ProductTemplateProps> = ({
  product,
  region,
  countryCode,
}) => {
  if (!product || !product.id) {
    return notFound()
  }

  const category = product.categories?.[0]

  return (
    <>
      <div className="content-container py-6" data-testid="product-container">
        <nav
          aria-label="Хлебные крошки"
          className="mb-6 flex flex-wrap gap-2 text-small-regular text-ui-fg-subtle"
        >
          <LocalizedClientLink href="/" className="hover:text-ui-fg-base">
            Главная
          </LocalizedClientLink>
          <span>/</span>
          <LocalizedClientLink href="/catalog" className="hover:text-ui-fg-base">
            Каталог
          </LocalizedClientLink>
          {category && (
            <>
              <span>/</span>
              <LocalizedClientLink
                href={`/catalog/${category.handle}`}
                className="hover:text-ui-fg-base"
              >
                {category.name}
              </LocalizedClientLink>
            </>
          )}
        </nav>

        <div className="grid grid-cols-1 small:grid-cols-2 gap-8 small:gap-12 items-start">
          <div className="w-full small:sticky small:top-24 flex flex-col gap-y-4">
            <VariantImageGallery product={product} />
            <div className="small:mx-8">
              <ProductWarranty product={product} />
            </div>
          </div>
          <div className="flex flex-col gap-y-8 w-full">
            <ProductInfo product={product} />
            <ProductActions product={product} region={region} />
            <ProductTabs product={product} />
          </div>
        </div>
      </div>
      <div
        className="content-container my-16 small:my-24"
        data-testid="related-products-container"
      >
        <Suspense fallback={<SkeletonRelatedProducts />}>
          <RelatedProducts product={product} countryCode={countryCode} />
        </Suspense>
      </div>
    </>
  )
}

export default ProductTemplate
