import { HttpTypes } from "@medusajs/types"

import InteractiveLink from "@modules/common/components/interactive-link"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import StoreTemplate from "@modules/store/templates"

export default function CategoryTemplate({
  category,
  currencyCode,
}: {
  category: HttpTypes.StoreProductCategory
  currencyCode: string
}) {
  const parents: HttpTypes.StoreProductCategory[] = []
  let current = category.parent_category
  while (current) {
    parents.unshift(current)
    current = current.parent_category
  }

  return (
    <StoreTemplate
      currencyCode={currencyCode}
      title={category.name}
      categoryName={category.name}
      header={
        <>
          <nav
            aria-label="Хлебные крошки"
            className="mb-3 flex flex-wrap gap-2 text-small-regular text-ui-fg-subtle"
          >
            <LocalizedClientLink href="/" className="hover:text-ui-fg-base">
              Главная
            </LocalizedClientLink>
            <span>/</span>
            <LocalizedClientLink href="/catalog" className="hover:text-ui-fg-base">
              Каталог
            </LocalizedClientLink>
            {parents.map((p) => (
              <span key={p.id} className="flex gap-2">
                <span>/</span>
                <LocalizedClientLink
                  href={`/catalog/${p.handle}`}
                  className="hover:text-ui-fg-base"
                >
                  {p.name}
                </LocalizedClientLink>
              </span>
            ))}
          </nav>
          {category.description && (
            <p className="mb-6 text-base-regular text-ui-fg-subtle">
              {category.description}
            </p>
          )}
          {!!category.category_children?.length && (
            <ul className="mb-6 flex flex-wrap gap-4">
              {category.category_children.map((c) => (
                <li key={c.id}>
                  <InteractiveLink href={`/catalog/${c.handle}`}>
                    {c.name}
                  </InteractiveLink>
                </li>
              ))}
            </ul>
          )}
        </>
      }
    />
  )
}
