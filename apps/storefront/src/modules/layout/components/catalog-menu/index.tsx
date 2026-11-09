"use client"

import { Popover, PopoverButton, PopoverPanel } from "@headlessui/react"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

type CatalogCategory = {
  id: string
  name: string
  handle: string
}

const CatalogMenu = ({ categories }: { categories: CatalogCategory[] }) => {
  return (
    <Popover className="relative h-full flex">
      {({ close }) => (
        <>
          <PopoverButton
            data-testid="nav-catalog-button"
            className="h-full flex items-center gap-2 font-medium text-ui-fg-base focus:outline-none hover:text-ui-fg-subtle"
          >
            <span aria-hidden>☰</span>
            Каталог товаров
          </PopoverButton>

          <PopoverPanel className="absolute left-0 top-full z-[60] mt-1 w-72 rounded-md border border-ui-border-base bg-white py-2 shadow-lg">
            {categories.length ? (
              <ul data-testid="nav-catalog-list">
                {categories.map((c) => (
                  <li key={c.id}>
                    <LocalizedClientLink
                      href={`/catalog/${c.handle}`}
                      onClick={() => close()}
                      className="block px-4 py-2 text-ui-fg-base hover:bg-ui-bg-subtle"
                    >
                      {c.name}
                    </LocalizedClientLink>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="px-4 py-2 text-ui-fg-muted">Категорий пока нет</p>
            )}
          </PopoverPanel>
        </>
      )}
    </Popover>
  )
}

export default CatalogMenu
