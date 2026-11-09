import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { getFace } from "@lib/data/face"

const Promotions = async () => {
  const { bottom } = await getFace()

  if (!bottom.items.length) {
    return null
  }

  return (
    <section className="content-container py-12">
      {bottom.heading && (
        <h2 className="text-2xl text-ui-fg-base mb-6">{bottom.heading}</h2>
      )}
      <ul className="grid grid-cols-1 xsmall:grid-cols-2 small:grid-cols-4 gap-4">
        {bottom.items.map((p) => (
          <li key={p.id}>
            <LocalizedClientLink
              href={p.link || "/catalog"}
              className="flex h-full flex-col gap-2 rounded-lg border border-ui-border-base bg-white p-5 hover:shadow-md transition-shadow"
            >
              {p.badge && (
                <span className="self-start rounded bg-ui-bg-subtle px-2 py-1 text-small-regular font-medium text-ui-fg-base">
                  {p.badge}
                </span>
              )}
              <span className="text-base-regular font-medium text-ui-fg-base">{p.title}</span>
              <span className="text-small-regular text-ui-fg-subtle">{p.text}</span>
            </LocalizedClientLink>
          </li>
        ))}
      </ul>
    </section>
  )
}

export default Promotions
