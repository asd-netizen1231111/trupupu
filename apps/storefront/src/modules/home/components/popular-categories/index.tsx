import { listCategories } from "@lib/data/categories"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

export default async function PopularCategories() {
  const categories = await listCategories({
    fields: "id,name,handle,rank,parent_category_id",
  }).catch(() => [])

  const top = (categories ?? [])
    .filter((c) => !c.parent_category_id)
    .sort((a, b) => (a.rank ?? 0) - (b.rank ?? 0))

  if (!top.length) {
    return null
  }

  return (
    <section className="content-container py-12">
      <h2 className="text-2xl text-ui-fg-base mb-6">Популярные категории</h2>
      <ul className="grid grid-cols-2 small:grid-cols-5 gap-4">
        {top.map((c) => (
          <li key={c.id}>
            <LocalizedClientLink
              href={`/catalog/${c.handle}`}
              className="flex h-28 items-center justify-center rounded-lg border border-ui-border-base bg-ui-bg-subtle p-4 text-center text-ui-fg-base hover:bg-white hover:shadow-md transition"
            >
              {c.name}
            </LocalizedClientLink>
          </li>
        ))}
      </ul>
    </section>
  )
}
