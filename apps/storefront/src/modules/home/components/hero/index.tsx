import { Button, Heading } from "@modules/common/components/ui"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { getFace } from "@lib/data/face"

const Hero = async () => {
  const { top } = await getFace()

  return (
    <section className="w-full border-b border-ui-border-base bg-transparent">
      <div className="content-container flex flex-col items-start gap-6 py-20 small:py-28">
        {top.badge && (
          <span className="rounded-full bg-white px-3 py-1 text-small-regular text-ui-fg-subtle border border-ui-border-base">
            {top.badge}
          </span>
        )}
        <Heading level="h1" className="text-3xl small:text-5xl leading-tight text-ui-fg-base font-normal max-w-2xl">
          {top.title}
        </Heading>
        {top.description && (
          <p className="text-ui-fg-subtle max-w-xl">{top.description}</p>
        )}
        {top.button_text && (
          <LocalizedClientLink href={top.button_link || "/catalog"}>
            <Button variant="primary">{top.button_text}</Button>
          </LocalizedClientLink>
        )}
      </div>
    </section>
  )
}

export default Hero
