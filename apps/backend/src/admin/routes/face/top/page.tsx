import { defineRouteConfig } from "@medusajs/admin-sdk"
import {
  Button,
  Container,
  Heading,
  Input,
  Label,
  Text,
  Textarea,
} from "@medusajs/ui"
import { useEffect, useState } from "react"
import { FaceTop, LinkField, useFace } from "../../../lib/face"

const TopPage = () => {
  const { face, isLoading, save } = useFace()
  const [form, setForm] = useState<FaceTop | null>(null)

  useEffect(() => {
    if (face) {
      setForm(face.top)
    }
  }, [face])

  if (isLoading || !form || !face) {
    return (
      <Container>
        <Text>Загрузка…</Text>
      </Container>
    )
  }

  const set = (key: keyof FaceTop) => (v: string) =>
    setForm((f) => (f ? { ...f, [key]: v } : f))

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        save.mutate({ ...face, top: form })
      }}
    >
      <Container className="divide-y p-0">
        <div className="px-6 py-4">
          <Heading level="h1">FACE / Верх</Heading>
          <Text className="text-ui-fg-subtle" size="small">
            Верхний блок главной страницы (акции недели)
          </Text>
        </div>

        <div className="flex flex-col gap-4 px-6 py-4">
          <div className="flex flex-col gap-y-2">
            <Label htmlFor="badge">Метка (например «Акции недели»)</Label>
            <Input
              id="badge"
              value={form.badge}
              onChange={(e) => set("badge")(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-y-2">
            <Label htmlFor="title">Описание акции (оглавление)</Label>
            <Textarea
              id="title"
              rows={2}
              value={form.title}
              onChange={(e) => set("title")(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-y-2">
            <Label htmlFor="description">Описание (середина)</Label>
            <Textarea
              id="description"
              rows={3}
              value={form.description}
              onChange={(e) => set("description")(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-y-2">
            <Label htmlFor="button_text">Текст кнопки</Label>
            <Input
              id="button_text"
              value={form.button_text}
              onChange={(e) => set("button_text")(e.target.value)}
            />
          </div>
          <LinkField
            id="button_link"
            label="Путь кнопки (категория товаров)"
            value={form.button_link}
            onChange={set("button_link")}
          />
        </div>

        <div className="flex justify-end px-6 py-4">
          <Button type="submit" isLoading={save.isPending}>
            Сохранить
          </Button>
        </div>
      </Container>
    </form>
  )
}

export const config = defineRouteConfig({
  label: "Верх",
})

export default TopPage
