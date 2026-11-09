"use client"

import { MagnifyingGlass } from "@medusajs/icons"
import Image from "next/image"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { useEffect, useRef, useState } from "react"

import { sdk } from "@lib/config"
import { localizePath } from "@lib/util/paths"

type Suggestion = {
  id: string
  title: string
  handle: string
  thumbnail: string | null
}

/**
 * Строка поиска в шапке с подсказками.
 * Enter — переход на /search?q=..., клик по подсказке — сразу в товар.
 */
const HeaderSearch = ({ className = "" }: { className?: string }) => {
  const { countryCode } = useParams<{ countryCode: string }>()
  const router = useRouter()
  const [query, setQuery] = useState("")
  const [items, setItems] = useState<Suggestion[]>([])
  const [open, setOpen] = useState(false)
  const boxRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    const q = query.trim()
    if (q.length < 2) {
      setItems([])
      return
    }
    const timer = setTimeout(async () => {
      try {
        const { products } = await sdk.client.fetch<{
          products: Suggestion[]
        }>("/store/products", {
          query: { q, limit: 6, fields: "id,title,handle,thumbnail" },
        })
        setItems(products)
        setOpen(true)
      } catch {
        setItems([])
      }
    }, 250)
    return () => clearTimeout(timer)
  }, [query])

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!boxRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", onClick)
    return () => document.removeEventListener("mousedown", onClick)
  }, [])

  return (
    <form
      ref={boxRef}
      role="search"
      action={localizePath(countryCode, "/search")}
      onSubmit={(e) => {
        e.preventDefault()
        const q = query.trim()
        if (!q) return
        setOpen(false)
        router.push(
          `${localizePath(countryCode, "/search")}?q=${encodeURIComponent(q)}`
        )
      }}
      className={`relative ${className}`}
    >
      <label className="flex items-center gap-2 rounded-full border border-ui-border-base bg-ui-bg-field px-4 h-10 focus-within:border-ui-border-interactive">
        <MagnifyingGlass className="shrink-0 text-ui-fg-muted" />
        <input
          type="search"
          name="q"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => items.length && setOpen(true)}
          placeholder="Поиск товаров"
          aria-label="Поиск товаров"
          autoComplete="off"
          className="w-full bg-transparent text-base-regular text-ui-fg-base outline-none placeholder:text-ui-fg-muted"
          data-testid="header-search-input"
        />
      </label>

      {open && query.trim().length >= 2 && (
        <div className="absolute left-0 right-0 top-full z-[70] mt-2 overflow-hidden rounded-large border border-ui-border-base bg-white shadow-elevation-flyout">
          {items.length ? (
            <ul>
              {items.map((p) => (
                <li key={p.id}>
                  <Link
                    href={localizePath(countryCode, `/product/${p.handle}`)}
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-3 px-4 py-2 hover:bg-ui-bg-subtle"
                  >
                    <span className="relative h-10 w-10 shrink-0 overflow-hidden rounded-rounded bg-ui-bg-subtle">
                      {p.thumbnail && (
                        <Image src={p.thumbnail} alt="" fill sizes="40px" className="object-cover" />
                      )}
                    </span>
                    <span className="text-base-regular text-ui-fg-base line-clamp-1">
                      {p.title}
                    </span>
                  </Link>
                </li>
              ))}
              <li>
                <button
                  type="submit"
                  className="w-full border-t border-ui-border-base px-4 py-2 text-left text-small-regular text-ui-fg-interactive hover:bg-ui-bg-subtle"
                >
                  Все результаты по «{query.trim()}»
                </button>
              </li>
            </ul>
          ) : (
            <p className="px-4 py-3 text-small-regular text-ui-fg-subtle">
              Ничего не найдено
            </p>
          )}
        </div>
      )}
    </form>
  )
}

export default HeaderSearch
