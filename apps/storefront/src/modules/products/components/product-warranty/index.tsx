import { HttpTypes } from "@medusajs/types"

const MetalShield = ({ size = 28 }: { size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <defs>
      <linearGradient id="metal-shield-g" x1="3" y1="2" x2="21" y2="22">
        <stop offset="0" stopColor="#F3F4F6" />
        <stop offset="0.35" stopColor="#B8BDC4" />
        <stop offset="0.55" stopColor="#E5E7EB" />
        <stop offset="1" stopColor="#8A9099" />
      </linearGradient>
    </defs>
    <path
      d="M12 2.5 4.5 5.5v5.7c0 4.6 3.1 8.8 7.5 10.3 4.4-1.5 7.5-5.7 7.5-10.3V5.5L12 2.5Z"
      fill="url(#metal-shield-g)"
      stroke="#7B8089"
      strokeWidth="1.3"
      strokeLinejoin="round"
    />
    <path
      d="m8.8 12.2 2.3 2.3 4.2-4.6"
      stroke="#5F646C"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

const ProductWarranty = ({ product }: { product: HttpTypes.StoreProduct }) => {
  const warranty = (product.metadata?.warranty as string | undefined)?.trim()

  if (!warranty) return null

  return (
    <div
      className="flex items-center gap-x-3 rounded-lg border border-ui-border-base bg-white px-4 py-3"
      data-testid="product-warranty"
    >
      <MetalShield />
      <span className="text-base-semi text-ui-fg-base">Гарантия {warranty}</span>
    </div>
  )
}

export default ProductWarranty
