import { Metadata } from "next"

import { getSiteSettings, phoneHref } from "@lib/data/site-settings"
import { infoPageMetadata } from "@modules/policies/templates/info-page"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

type Props = { params: Promise<{ countryCode: string }> }

export const dynamic = "force-static"
export const revalidate = 3600

export async function generateMetadata(props: Props): Promise<Metadata> {
  const { countryCode } = await props.params
  return infoPageMetadata("delivery", countryCode)
}

const iconProps = {
  width: 28,
  height: 28,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
}

const TruckIcon = () => (
  <svg {...iconProps}>
    <path d="M3 6h11v10H3z" />
    <path d="M14 10h4l3 3v3h-7z" />
    <circle cx="7.5" cy="17.5" r="1.8" />
    <circle cx="17.5" cy="17.5" r="1.8" />
  </svg>
)

const PinIcon = () => (
  <svg {...iconProps}>
    <path d="M12 21s7-6.2 7-11.5A7 7 0 0 0 5 9.5C5 14.8 12 21 12 21z" />
    <circle cx="12" cy="9.5" r="2.5" />
  </svg>
)

const HandshakeIcon = () => (
  <svg {...iconProps}>
    <path d="M2 11l4-4 4 1 3-1 5 3" />
    <path d="M22 11l-4-4" />
    <path d="M6 7L2 11l6 6a2 2 0 0 0 3 0" />
    <path d="M18 10l4 1-5 6a2 2 0 0 1-3 0l-2-2" />
    <path d="M10 8l4 4a1.4 1.4 0 0 1-2 2" />
  </svg>
)

const BoxIcon = () => (
  <svg {...iconProps}>
    <path d="M21 8l-9-5-9 5 9 5 9-5z" />
    <path d="M3 8v8l9 5 9-5V8" />
    <path d="M12 13v8" />
  </svg>
)

const cards = [
  {
    icon: <PinIcon />,
    title: "Туда, где вам удобно",
    text: "Привезём заказ домой, на работу или в любое другое место, которое вы назовёте. Вы сами выбираете, где и когда вам удобно его получить — мы подстроимся.",
  },
  {
    icon: <HandshakeIcon />,
    title: "Лично в руки",
    text: "Курьер передаёт товар лично вам. Вы можете сразу осмотреть покупку, убедиться в её качестве и сохранности — и только потом принять заказ.",
  },
  {
    icon: <BoxIcon />,
    title: "Аккуратно и бережно",
    text: "Бытовая техника любит осторожность, поэтому упаковываем каждый заказ так, чтобы он доехал до вас в идеальном состоянии.",
  },
]

export default async function DeliveryPage() {
  const s = await getSiteSettings()
  return (
    <div className="content-container py-10 small:py-14" data-testid="policy-page">
      <nav
        aria-label="Хлебные крошки"
        className="mb-6 flex gap-2 text-small-regular text-ui-fg-subtle"
      >
        <LocalizedClientLink href="/" className="hover:text-ui-fg-base">
          Главная
        </LocalizedClientLink>
        <span>/</span>
        <span>Доставка</span>
      </nav>

      {/* Hero */}
      <section className="rounded-2xl bg-ui-bg-subtle border border-ui-border-base px-6 py-10 small:px-12 small:py-14 text-center">
        <span className="inline-block rounded-full bg-ui-bg-base border border-ui-border-base px-4 py-1 text-small-semi text-ui-fg-subtle mb-5">
          Доставка по всей Беларуси — 0 BYN
        </span>
        <h1 className="text-3xl small:text-5xl font-semibold leading-tight mb-5">
          Быстрая и бесплатная доставка
        </h1>
        <p className="mx-auto max-w-2xl text-base-regular small:text-large-regular text-ui-fg-subtle">
          В «Доброй хате» мы заботимся о том, чтобы покупки радовали вас с
          первой минуты. Поэтому привозим заказы в любой уголок Беларуси —
          совершенно бесплатно.
        </p>
      </section>

      {/* Главный акцент: бесплатная доставка */}
      <section className="mt-8 flex flex-col small:flex-row items-start gap-5 rounded-2xl border border-ui-border-base p-6 small:p-8">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-ui-bg-subtle">
          <TruckIcon />
        </div>
        <div className="flex flex-col gap-2">
          <h2 className="text-xl-semi">Бесплатная доставка по всей Беларуси</h2>
          <p className="text-ui-fg-subtle">
            Минск, областные центры, небольшие города и посёлки — неважно, где
            вы живёте. Доставка всегда бесплатная: без скрытых наценок и
            доплат. Цена, которую вы видите в каталоге, — это цена, которую вы
            платите.
          </p>
        </div>
      </section>

      {/* Карточки */}
      <section className="mt-8 grid grid-cols-1 small:grid-cols-3 gap-5">
        {cards.map((c) => (
          <div
            key={c.title}
            className="flex flex-col gap-3 rounded-2xl border border-ui-border-base p-6 transition-shadow hover:shadow-elevation-card-hover"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-ui-bg-subtle">
              {c.icon}
            </div>
            <h3 className="text-large-semi">{c.title}</h3>
            <p className="text-ui-fg-subtle">{c.text}</p>
          </div>
        ))}
      </section>

      {/* Самовывоз */}
      <section className="mt-8 rounded-2xl bg-ui-bg-subtle border border-ui-border-base p-6 small:p-8">
        <h2 className="text-xl-semi mb-2">Самовывоз</h2>
        <p className="text-ui-fg-subtle">
          Выезжать никуда не нужно — курьер лично привезёт вам товар. Это
          сильно экономит ваше время: не надо ехать через весь город, искать
          пункт выдачи и стоять в очередях. Просто оформите заказ и занимайтесь
          своими делами.
        </p>
      </section>

      {/* CTA */}
      <section className="mt-10 text-center">
        <h2 className="text-2xl small:text-3xl font-semibold mb-3">
          Выбирайте товары и ждите нашего курьера!
        </h2>
        <p className="mx-auto max-w-xl text-ui-fg-subtle mb-6">
          Остальное мы берём на себя. Если остались вопросы — позвоните нам по
          телефону{" "}
          {s.phone ? (
            <a
              href={phoneHref(s.phone)}
              className="font-semibold text-ui-fg-base hover:underline"
            >
              {s.phone}
            </a>
          ) : null}
          {s.work_hours ? ` (${s.work_hours})` : ""}. Мы всегда рады помочь.
        </p>
        <LocalizedClientLink
          href="/catalog"
          className="inline-flex items-center justify-center rounded-full bg-ui-fg-base px-8 py-3 text-base-semi text-ui-bg-base hover:opacity-90 transition-opacity"
        >
          Перейти в каталог
        </LocalizedClientLink>
      </section>
    </div>
  )
}
