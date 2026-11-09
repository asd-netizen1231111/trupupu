import { defineRouteConfig } from "@medusajs/admin-sdk"
import { PencilSquare } from "@medusajs/icons"
import { Container, Heading, Text } from "@medusajs/ui"
import { Link } from "react-router-dom"

const FacePage = () => {
  return (
    <Container className="divide-y p-0">
      <div className="px-6 py-4">
        <Heading level="h1">FACE</Heading>
        <Text className="text-ui-fg-subtle" size="small">
          Управление главной страницей сайта: акции и спецпредложения
        </Text>
      </div>
      <div className="flex flex-col gap-y-2 px-6 py-4">
        <Link to="/face/top" className="text-ui-fg-interactive">
          Верх — блок «Акции недели»
        </Link>
        <Link to="/face/bottom" className="text-ui-fg-interactive">
          Низ — «Скидки и спецпредложения»
        </Link>
      </div>
    </Container>
  )
}

export const config = defineRouteConfig({
  label: "FACE",
  icon: PencilSquare,
})

export default FacePage
