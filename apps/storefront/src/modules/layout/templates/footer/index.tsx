import { listCategories } from "@lib/data/categories"
import { getSiteSettings, phoneHref } from "@lib/data/site-settings"
import { STORE_NAME } from "@lib/util/site"
import FlowingLines from "@modules/common/components/flowing-lines"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

const SOCIAL_LABELS: Record<string, string> = {
  instagram: "Instagram",
  telegram: "Telegram",
  viber: "Viber",
  vk: "ВКонтакте",
}

const INFO_LINKS = [
  { href: "/delivery", label: "Доставка" },
  { href: "/payment", label: "Оплата" },
  { href: "/warranty", label: "Гарантия" },
  { href: "/reviews", label: "Отзывы" },
  { href: "/contact", label: "Контакты" },
]

const LEGAL_LINKS = [
  { href: "/offer", label: "Публичная оферта" },
  { href: "/privacy", label: "Политика конфиденциальности" },
]

const Column = ({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) => (
  <div className="flex flex-col gap-y-3">
    <span className="txt-small-plus text-ui-fg-base">{title}</span>
    {children}
  </div>
)

export default async function Footer() {
  const [categories, s] = await Promise.all([
    listCategories({ fields: "id,name,handle,rank,parent_category_id" }).catch(
      () => []
    ),
    getSiteSettings(),
  ])

  const top = (categories ?? [])
    .filter((c) => !c.parent_category_id)
    .sort((a, b) => (a.rank ?? 0) - (b.rank ?? 0))

  const socials = Object.entries(s.socials ?? {}).filter(([, url]) => !!url)
  const linkClass = "hover:text-ui-fg-base"

  return (
    <footer className="relative overflow-hidden border-t border-ui-border-base w-full bg-ui-bg-subtle">
      <FlowingLines lines={5} seed={21} opacity={0.3} />
      <div className="relative z-10 content-container py-12 small:py-16">
        <div className="grid grid-cols-1 xsmall:grid-cols-2 small:grid-cols-4 gap-10">
          <Column title="Каталог">
            <ul className="grid grid-cols-1 gap-2 text-ui-fg-subtle txt-small">
              {top.slice(0, 10).map((c) => (
                <li key={c.id}>
                  <LocalizedClientLink className={linkClass} href={`/catalog/${c.handle}`}>
                    {c.name}
                  </LocalizedClientLink>
                </li>
              ))}
            </ul>
          </Column>

          <Column title="Покупателям">
            <ul className="grid grid-cols-1 gap-2 text-ui-fg-subtle txt-small">
              {INFO_LINKS.map((l) => (
                <li key={l.href}>
                  <LocalizedClientLink className={linkClass} href={l.href}>
                    {l.label}
                  </LocalizedClientLink>
                </li>
              ))}
              {LEGAL_LINKS.map((l) => (
                <li key={l.href}>
                  <LocalizedClientLink className={linkClass} href={l.href}>
                    {l.label}
                  </LocalizedClientLink>
                </li>
              ))}
            </ul>
          </Column>

          <Column title="Контакты">
            <ul className="grid grid-cols-1 gap-2 text-ui-fg-subtle txt-small">
              {s.phone && (
                <li>
                  <a href={phoneHref(s.phone)} className="text-ui-fg-base font-semibold hover:underline">
                    {s.phone}
                  </a>
                </li>
              )}
              {s.work_hours && <li>{s.work_hours}</li>}
              {s.email && (
                <li>
                  <a href={`mailto:${s.email}`} className={linkClass}>
                    {s.email}
                  </a>
                </li>
              )}
              {s.address && <li className="whitespace-pre-line">{s.address}</li>}
            </ul>
            {!!socials.length && (
              <ul className="flex flex-wrap gap-3 txt-small">
                {socials.map(([key, url]) => (
                  <li key={key}>
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-full border border-ui-border-base px-3 py-1 hover:bg-white"
                    >
                      {SOCIAL_LABELS[key] ?? key}
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </Column>

          <Column title={STORE_NAME}>
            <div className="grid grid-cols-1 gap-2 text-ui-fg-subtle txt-small">
              {s.legal_name && <p>{s.legal_name}</p>}
              {s.unp && <p>УНП {s.unp}</p>}
              {s.address && <p className="whitespace-pre-line">Юр. адрес: {s.address}</p>}
              {s.bank_name && <p>{s.bank_name}</p>}
              {s.bank_account && <p>Р/с {s.bank_account}</p>}
            </div>
          </Column>
        </div>

        <div className="mt-12 flex flex-col xsmall:flex-row gap-2 justify-between border-t border-ui-border-base pt-6 text-ui-fg-muted txt-compact-small">
          <span>
            © {new Date().getFullYear()} {s.legal_name || STORE_NAME}. Все права защищены.
          </span>
          <LocalizedClientLink href="/privacy" className="hover:text-ui-fg-base">
            Политика конфиденциальности
          </LocalizedClientLink>
        </div>
      </div>
    </footer>
  )
}
