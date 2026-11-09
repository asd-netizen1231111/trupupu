import { Suspense } from "react"

import { listCategories } from "@lib/data/categories"
import { getSiteSettings, phoneHref } from "@lib/data/site-settings"
import { STORE_NAME } from "@lib/util/site"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import CartButton from "@modules/layout/components/cart-button"
import CatalogMenu from "@modules/layout/components/catalog-menu"
import HeaderSearch from "@modules/layout/components/header-search"
import MobileMenu from "@modules/layout/components/mobile-menu"

export default async function Nav() {
  const [categories, settings] = await Promise.all([
    listCategories({
      fields: "id,name,handle,rank,parent_category_id",
    }).catch(() => []),
    getSiteSettings(),
  ])

  const topCategories = (categories ?? [])
    .filter((c) => !c.parent_category_id)
    .sort((a, b) => (a.rank ?? 0) - (b.rank ?? 0))
    .map((c) => ({ id: c.id, name: c.name, handle: c.handle }))

  const tel = phoneHref(settings.phone)

  return (
    <div className="sticky top-0 inset-x-0 z-50">
      <header className="border-b border-ui-border-base bg-white">
        <nav className="flex items-center gap-3 small:gap-6 h-16 w-full px-6 small:px-8 text-small-regular text-ui-fg-subtle">
          {/* Левая часть: бургер (мобильные) / каталог (десктоп) + название */}
          <MobileMenu
            categories={topCategories}
            phone={settings.phone}
            phoneHref={tel}
            workHours={settings.work_hours}
          />
          <div className="hidden small:flex h-full">
            <CatalogMenu categories={topCategories} />
          </div>
          <LocalizedClientLink
            href="/"
            className="txt-compact-xlarge-plus text-ui-fg-base hover:text-ui-fg-subtle uppercase whitespace-nowrap"
            data-testid="nav-store-link"
          >
            {STORE_NAME}
          </LocalizedClientLink>

          {/* Поиск: в шапке на десктопе, в бургер-меню на мобильных */}
          <HeaderSearch className="hidden small:block flex-1 max-w-xl" />

          {/* Правая часть */}
          <div className="ml-auto flex items-center gap-x-4 small:gap-x-6 h-full">
            <LocalizedClientLink
              className="hidden small:block hover:text-ui-fg-base"
              href="/account"
              data-testid="nav-account-link"
            >
              Аккаунт
            </LocalizedClientLink>
            <Suspense
              fallback={
                <LocalizedClientLink
                  className="hover:text-ui-fg-base flex gap-2"
                  href="/cart"
                  data-testid="nav-cart-link"
                >
                  Корзина (0)
                </LocalizedClientLink>
              }
            >
              <CartButton />
            </Suspense>
            {settings.phone && (
              <div className="hidden xsmall:flex flex-col items-end leading-tight">
                <a
                  href={tel}
                  className="font-semibold text-ui-fg-base hover:text-ui-fg-subtle whitespace-nowrap"
                  data-testid="nav-phone"
                >
                  {settings.phone}
                </a>
                {settings.work_hours && (
                  <span className="text-xsmall-regular text-ui-fg-muted whitespace-nowrap">
                    {settings.work_hours}
                  </span>
                )}
              </div>
            )}
          </div>
        </nav>
      </header>
    </div>
  )
}
