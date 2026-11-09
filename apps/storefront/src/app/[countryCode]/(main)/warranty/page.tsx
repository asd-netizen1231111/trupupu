import { Metadata } from "next"

import { getSiteSettings, phoneHref } from "@lib/data/site-settings"
import { infoPageMetadata } from "@modules/policies/templates/info-page"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

type Props = { params: Promise<{ countryCode: string }> }

export const dynamic = "force-static"
export const revalidate = 3600

export async function generateMetadata(props: Props): Promise<Metadata> {
  const { countryCode } = await props.params
  return infoPageMetadata("warranty", countryCode)
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

const ShieldCheckIcon = () => (
  <svg {...iconProps}>
    <path d="M12 3l8 3v6c0 4.5-3.2 8-8 9-4.8-1-8-4.5-8-9V6l8-3z" />
    <path d="M8.5 12l2.5 2.5 4.5-5" />
  </svg>
)

const MedalIcon = () => (
  <svg {...iconProps}>
    <circle cx="12" cy="9" r="5" />
    <path d="M9 13.5L7 21l5-2.5 5 2.5-2-7.5" />
    <path d="M10 9l1.5 1.5L14.5 7.5" />
  </svg>
)

const ReceiptIcon = () => (
  <svg {...iconProps}>
    <path d="M6 3h12v18l-3-2-3 2-3-2-3 2V3z" />
    <path d="M9 8h6M9 12h6" />
  </svg>
)

const HeartIcon = () => (
  <svg {...iconProps}>
    <path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z" />
  </svg>
)

const ChatIcon = () => (
  <svg {...iconProps}>
    <path d="M4 5h16v11H9l-5 4V5z" />
  </svg>
)

const WrenchIcon = () => (
  <svg {...iconProps}>
    <path d="M14.5 6.5a4 4 0 0 0-5 5L3.5 17.5l3 3 6-6a4 4 0 0 0 5-5l-2.5 2.5-2.5-.5-.5-2.5 2.5-2.5z" />
  </svg>
)

const GiftIcon = () => (
  <svg {...iconProps}>
    <rect x="3" y="8" width="18" height="4" rx="1" />
    <path d="M5 12v8h14v-8M12 8v12" />
    <path d="M12 8S10.5 3.5 8 4.5 8 8 12 8zm0 0s1.5-4.5 4-3.5S16 8 12 8z" />
  </svg>
)

const cards = [
  {
    icon: <ShieldCheckIcon />,
    title: "Официальная гарантия производителя",
    text: "Мы не придумываем «свою» сомнительную гарантию. На всю технику действует полноценная, официальная гарантия от заводов-изготовителей — с понятными сроками и сервисной поддержкой.",
  },
  {
    icon: <MedalIcon />,
    title: "Уверенность в качестве",
    text: "Каждый товар мы тщательно проверяем перед отправкой. Но если вдруг что-то пойдёт не так — не переживайте: мы всегда на вашей стороне и поможем разобраться.",
  },
]

const steps = [
  {
    icon: <ChatIcon />,
    title: "Свяжитесь с нами",
    text: "Обнаружили заводской брак? Просто позвоните или напишите нам — расскажите, что случилось.",
  },
  {
    icon: <WrenchIcon />,
    title: "Оформим гарантийный случай",
    text: "Мы поможем с документами и подскажем, что делать дальше. Вам не придётся ходить по инстанциям.",
  },
  {
    icon: <GiftIcon />,
    title: "Починим или заменим",
    text: "Если брак подтвердится, мы оформим ремонт по гарантии или бесплатно заменим товар.",
  },
]

const conditions = [
  "Сохраните кассовый или электронный чек — это главное подтверждение покупки.",
  "Не выбрасывайте упаковку — с ней проще и быстрее оформить любой гарантийный случай.",
  "Пользуйтесь техникой согласно инструкции по эксплуатации.",
]

const exclusions = [
  "Механические повреждения: сколы, вмятины, трещины, следы ударов и падений.",
  "Следы неправильной эксплуатации — использование не по назначению или с нарушением инструкции.",
  "Следы самостоятельного ремонта или вмешательства неуполномоченных лиц.",
]

export default async function WarrantyPage() {
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
        <span>Гарантия</span>
      </nav>

      {/* Hero */}
      <section className="rounded-2xl bg-ui-bg-subtle border border-ui-border-base px-6 py-10 small:px-12 small:py-14 text-center">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-ui-bg-base border border-ui-border-base">
          <ShieldCheckIcon />
        </div>
        <span className="inline-block rounded-full bg-ui-bg-base border border-ui-border-base px-4 py-1 text-small-semi text-ui-fg-subtle mb-5">
          Мы всегда на вашей стороне
        </span>
        <h1 className="text-3xl small:text-5xl font-semibold leading-tight mb-5">
          Официальная гарантия качества
        </h1>
        <p className="mx-auto max-w-2xl text-base-regular small:text-large-regular text-ui-fg-subtle">
          Покупка техники — это всегда немного волнения: а вдруг что-то
          пойдёт не так? В «Доброй хате» мы сделали всё, чтобы вы об этом не
          переживали. Мы выбираем надёжные товары, проверяем их и честно
          стоим за каждый из них.
        </p>
      </section>

      {/* Главные акценты */}
      <section className="mt-8 grid grid-cols-1 small:grid-cols-2 gap-5">
        {cards.map((c) => (
          <div
            key={c.title}
            className="flex flex-col gap-3 rounded-2xl border border-ui-border-base p-6 transition-shadow hover:shadow-elevation-card-hover"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-ui-bg-subtle">
              {c.icon}
            </div>
            <h2 className="text-large-semi">{c.title}</h2>
            <p className="text-ui-fg-subtle">{c.text}</p>
          </div>
        ))}
      </section>

      {/* Как это работает */}
      <section className="mt-12">
        <h2 className="text-2xl small:text-3xl font-semibold text-center mb-2">
          Как это работает
        </h2>
        <p className="mx-auto max-w-xl text-center text-ui-fg-subtle mb-6">
          Всё просто — три шага, и вы можете больше не волноваться.
        </p>
        <div className="grid grid-cols-1 small:grid-cols-3 gap-5">
          {steps.map((st, i) => (
            <div
              key={st.title}
              className="relative flex flex-col gap-3 rounded-2xl border border-ui-border-base p-6"
            >
              <span className="absolute right-5 top-4 text-3xl font-semibold text-ui-fg-muted">
                {i + 1}
              </span>
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-ui-bg-subtle">
                {st.icon}
              </div>
              <h3 className="text-large-semi">{st.title}</h3>
              <p className="text-ui-fg-subtle">{st.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Условия */}
      <section className="mt-12 flex flex-col small:flex-row items-start gap-5 rounded-2xl border border-ui-border-base bg-ui-bg-subtle p-6 small:p-8">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-ui-bg-base border border-ui-border-base">
          <ReceiptIcon />
        </div>
        <div className="flex flex-col gap-3">
          <h2 className="text-xl-semi">Условия гарантии</h2>
          <p className="text-ui-fg-subtle">
            Чтобы гарантия работала без лишних вопросов, нужно совсем немного:
          </p>
          <ul className="flex flex-col gap-2 text-ui-fg-base">
            {conditions.map((c) => (
              <li key={c} className="flex items-start gap-2">
                <span aria-hidden className="mt-1">
                  ✓
                </span>
                <span>{c}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Что не является гарантийным случаем (аккордеон) */}
      <section className="mt-5">
        <details className="group rounded-2xl border border-ui-border-base p-6 small:px-8">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-large-semi">
            <span>Что не является гарантийным случаем</span>
            <span
              aria-hidden
              className="text-2xl leading-none transition-transform group-open:rotate-45"
            >
              +
            </span>
          </summary>
          <div className="mt-4 flex flex-col gap-3">
            <p className="text-ui-fg-subtle">
              Гарантия покрывает заводской брак. Поэтому, к сожалению, она не
              распространяется на:
            </p>
            <ul className="flex flex-col gap-2 pl-5 list-disc marker:text-ui-fg-muted text-ui-fg-subtle">
              {exclusions.map((e) => (
                <li key={e} className="pl-1">
                  {e}
                </li>
              ))}
            </ul>
          </div>
        </details>
      </section>

      {/* Успокаивающий текст + CTA */}
      <section className="mt-12 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-ui-bg-subtle">
          <HeartIcon />
        </div>
        <h2 className="text-2xl small:text-3xl font-semibold mb-3">
          Ваш комфорт и спокойствие — наша главная задача
        </h2>
        <p className="mx-auto max-w-xl text-ui-fg-subtle mb-2">
          Покупайте в «Доброй хате» с уверенностью!
        </p>
        <p className="mx-auto max-w-xl text-ui-fg-subtle mb-6">
          Остались вопросы по гарантии? Позвоните нам
          {s.phone ? (
            <>
              {" "}
              по телефону{" "}
              <a
                href={phoneHref(s.phone)}
                className="font-semibold text-ui-fg-base hover:underline"
              >
                {s.phone}
              </a>
            </>
          ) : null}
          {s.work_hours ? ` (${s.work_hours})` : ""} — мы с удовольствием всё
          расскажем и подскажем.
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
