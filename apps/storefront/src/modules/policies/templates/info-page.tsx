import { Metadata } from "next"
import type { ReactNode } from "react"

import { InfoBlock, InfoPage, INFO_PAGES } from "@lib/content/info-pages"
import { getSiteOrigin, siteUrl } from "@lib/util/site"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

/** SEO-метаданные для информационной страницы */
export const infoPageMetadata = async (
  slug: keyof typeof INFO_PAGES,
  countryCode: string
): Promise<Metadata> => {
  const page = INFO_PAGES[slug]
  const origin = await getSiteOrigin()
  return {
    title: page.title,
    description: page.description,
    alternates: { canonical: siteUrl(origin, countryCode, `/${page.slug}`) },
  }
}

/** Лёгкая разметка: **жирный** и [текст](https://ссылка) — без dangerouslySetInnerHTML */
const renderInline = (text: string): ReactNode[] => {
  const re = /\*\*(.+?)\*\*|\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g
  const out: ReactNode[] = []
  let last = 0
  let m: RegExpExecArray | null
  let key = 0
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) out.push(text.slice(last, m.index))
    if (m[1] !== undefined) {
      out.push(
        <strong key={key++} className="font-semibold text-ui-fg-base">
          {m[1]}
        </strong>
      )
    } else {
      out.push(
        <a
          key={key++}
          href={m[3]}
          target="_blank"
          rel="noopener noreferrer"
          className="text-ui-fg-interactive underline hover:text-ui-fg-interactive-hover"
        >
          {m[2]}
        </a>
      )
    }
    last = m.index + m[0].length
  }
  if (last < text.length) out.push(text.slice(last))
  return out
}

const sectionId = (i: number) => `section-${i + 1}`

const Block = ({ block }: { block: InfoBlock }) => {
  switch (block.type) {
    case "h3":
      return (
        <h3 className="text-base-semi text-ui-fg-base mt-2">{block.text}</h3>
      )
    case "ul":
      return (
        <ul className="flex flex-col gap-2 pl-5 list-disc marker:text-ui-fg-muted text-ui-fg-subtle">
          {block.items.map((it, i) => (
            <li key={i} className="pl-1">
              {renderInline(it)}
            </li>
          ))}
        </ul>
      )
    case "ol": {
      const prefix = block.prefix ?? ""
      const start = block.start ?? 1
      return (
        <ol className="flex flex-col gap-3 text-ui-fg-subtle">
          {block.items.map((it, i) => (
            <li key={i} className="flex gap-3">
              <span className="shrink-0 min-w-[2.5rem] font-semibold text-ui-fg-base tabular-nums">
                {`${prefix}${start + i}.`}
              </span>
              <span className="leading-relaxed">{renderInline(it)}</span>
            </li>
          ))}
        </ol>
      )
    }
    case "note":
      return (
        <p className="rounded-rounded border-l-4 border-ui-border-strong bg-ui-bg-subtle px-4 py-3 text-ui-fg-subtle">
          {renderInline(block.text)}
        </p>
      )
    default:
      return <p className="text-ui-fg-subtle">{renderInline(block.text)}</p>
  }
}

export const InfoPageView = ({
  page,
  children,
}: {
  page: InfoPage
  children?: ReactNode
}) => {
  const headed = page.sections.filter((s) => s.heading)
  return (
    <div
      className="content-container py-10 small:py-14 max-w-3xl"
      data-testid="policy-page"
    >
      <nav
        aria-label="Хлебные крошки"
        className="mb-4 flex gap-2 text-small-regular text-ui-fg-subtle"
      >
        <LocalizedClientLink href="/" className="hover:text-ui-fg-base">
          Главная
        </LocalizedClientLink>
        <span>/</span>
        <span>{page.title}</span>
      </nav>

      {page.updatedAt && (
        <p
          className="mb-3 text-small-regular text-ui-fg-subtle"
          data-testid="policy-updated-at"
        >
          Дата последнего обновления:{" "}
          <time className="font-semibold text-ui-fg-base">{page.updatedAt}</time>
        </p>
      )}

      <h1 className={`text-2xl-semi ${page.subtitle ? "mb-2" : "mb-6"}`}>
        {page.title}
      </h1>
      {page.subtitle && (
        <p className="mb-6 text-large-semi text-ui-fg-subtle">
          {page.subtitle}
        </p>
      )}

      {page.intro && (
        <p className="mb-8 text-large-regular text-ui-fg-subtle leading-relaxed">
          {renderInline(page.intro)}
        </p>
      )}

      {page.toc && headed.length > 1 && (
        <nav
          aria-label="Содержание"
          className="mb-10 rounded-rounded border border-ui-border-base bg-ui-bg-subtle p-5"
        >
          <p className="mb-3 text-base-semi">Содержание</p>
          <ul className="flex flex-col gap-2 text-ui-fg-subtle">
            {page.sections.map(
              (s, i) =>
                s.heading && (
                  <li key={i}>
                    <a
                      href={`#${sectionId(i)}`}
                      className="hover:text-ui-fg-base hover:underline"
                    >
                      {s.heading}
                    </a>
                  </li>
                )
            )}
          </ul>
        </nav>
      )}

      <div className="flex flex-col gap-10 text-base-regular text-ui-fg-base">
        {children}
        {page.sections.map((s, i) => (
          <section
            key={i}
            id={sectionId(i)}
            className="flex flex-col gap-4 scroll-mt-24"
          >
            {s.heading && <h2 className="text-xl-semi">{s.heading}</h2>}
            {s.paragraphs.map((p, j) => (
              <p key={j} className="text-ui-fg-subtle">
                {renderInline(p)}
              </p>
            ))}
            {s.blocks?.map((b, j) => (
              <Block key={j} block={b} />
            ))}
          </section>
        ))}
      </div>

      {page.outro && (
        <p className="mt-12 border-t border-ui-border-base pt-6 text-large-semi">
          {page.outro}
        </p>
      )}
    </div>
  )
}
