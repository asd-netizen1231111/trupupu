"use client"

import { Dialog, DialogPanel, Transition, TransitionChild } from "@headlessui/react"
import { XMark } from "@medusajs/icons"
import { usePathname } from "next/navigation"
import { Fragment, useEffect, useState } from "react"

import LocalizedClientLink from "@modules/common/components/localized-client-link"
import HeaderSearch from "../header-search"

type MenuCategory = { id: string; name: string; handle: string }

type MobileMenuProps = {
  categories: MenuCategory[]
  phone?: string | null
  phoneHref?: string
  workHours?: string | null
}

const INFO_LINKS = [
  { href: "/delivery", label: "Доставка" },
  { href: "/payment", label: "Оплата" },
  { href: "/warranty", label: "Гарантия" },
  { href: "/reviews", label: "Отзывы" },
  { href: "/contact", label: "Контакты" },
]

/** Бургер-меню для телефонов: выезжает слева с плавной анимацией. */
const MobileMenu = ({ categories, phone, phoneHref, workHours }: MobileMenuProps) => {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  // Закрываем меню при переходе на другую страницу
  useEffect(() => setOpen(false), [pathname])

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Открыть меню"
        className="small:hidden -ml-2 flex h-10 w-10 items-center justify-center rounded-full hover:bg-ui-bg-subtle"
        data-testid="mobile-menu-button"
      >
        <span className="flex flex-col gap-[5px]" aria-hidden>
          <span className="block h-0.5 w-5 bg-ui-fg-base" />
          <span className="block h-0.5 w-5 bg-ui-fg-base" />
          <span className="block h-0.5 w-5 bg-ui-fg-base" />
        </span>
      </button>

      <Transition show={open} as={Fragment}>
        <Dialog onClose={setOpen} className="relative z-[80] small:hidden">
          <TransitionChild
            as={Fragment}
            enter="transition-opacity duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="transition-opacity duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/40" aria-hidden />
          </TransitionChild>

          <TransitionChild
            as={Fragment}
            enter="transform transition duration-300 ease-out"
            enterFrom="-translate-x-full"
            enterTo="translate-x-0"
            leave="transform transition duration-200 ease-in"
            leaveFrom="translate-x-0"
            leaveTo="-translate-x-full"
          >
            <DialogPanel
              className="fixed inset-y-0 left-0 flex w-[85vw] max-w-sm flex-col bg-white shadow-elevation-modal"
              data-testid="mobile-menu"
            >
              <div className="flex items-center justify-between border-b border-ui-border-base px-4 h-16">
                <span className="text-large-semi">Меню</span>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Закрыть меню"
                  className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-ui-bg-subtle"
                >
                  <XMark />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-6">
                <HeaderSearch />

                <div>
                  <LocalizedClientLink
                    href="/catalog"
                    className="mb-2 block text-large-semi"
                  >
                    Каталог товаров
                  </LocalizedClientLink>
                  <ul className="flex flex-col">
                    {categories.map((c) => (
                      <li key={c.id}>
                        <LocalizedClientLink
                          href={`/catalog/${c.handle}`}
                          className="block rounded-rounded px-2 py-2.5 text-base-regular hover:bg-ui-bg-subtle"
                        >
                          {c.name}
                        </LocalizedClientLink>
                      </li>
                    ))}
                  </ul>
                </div>

                <ul className="flex flex-col border-t border-ui-border-base pt-4">
                  <li>
                    <LocalizedClientLink href="/account" className="block px-2 py-2.5">
                      Личный кабинет
                    </LocalizedClientLink>
                  </li>
                  <li>
                    <LocalizedClientLink href="/cart" className="block px-2 py-2.5">
                      Корзина
                    </LocalizedClientLink>
                  </li>
                  {INFO_LINKS.map((l) => (
                    <li key={l.href}>
                      <LocalizedClientLink href={l.href} className="block px-2 py-2.5 text-ui-fg-subtle">
                        {l.label}
                      </LocalizedClientLink>
                    </li>
                  ))}
                </ul>
              </div>

              {phone && (
                <div className="border-t border-ui-border-base px-4 py-4">
                  <a href={phoneHref} className="block text-large-semi">
                    {phone}
                  </a>
                  {workHours && (
                    <p className="text-small-regular text-ui-fg-subtle">{workHours}</p>
                  )}
                </div>
              )}
            </DialogPanel>
          </TransitionChild>
        </Dialog>
      </Transition>
    </>
  )
}

export default MobileMenu
