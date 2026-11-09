import { defineRouteConfig } from "@medusajs/admin-sdk"
import { Plus, Trash } from "@medusajs/icons"
import {
  Button,
  Container,
  Heading,
  IconButton,
  Input,
  Label,
  Text,
} from "@medusajs/ui"
import { useEffect, useState } from "react"
import { Face, FaceBottomItem, LinkField, useFace } from "../../../lib/face"

const newId = () => `item-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`

const BottomPage = () => {
  const { face, isLoading, save } = useFace()
  const [form, setForm] = useState<Face["bottom"] | null>(null)

  useEffect(() => {
    if (face) {
      setForm(face.bottom)
    }
  }, [face])

  if (isLoading || !form || !face) {
    return (
      <Container>
        <Text>Загрузка…</Text>
      </Container>
    )
  }

  const updateItem = (id: string, patch: Partial<FaceBottomItem>) =>
    setForm((f) =>
      f
        ? {
            ...f,
            items: f.items.map((i) => (i.id === id ? { ...i, ...patch } : i)),
          }
        : f
    )

  const addItem = () =>
    setForm((f) =>
      f
        ? {
            ...f,
            items: [
              ...f.items,
              {
                id: newId(),
                badge: "",
                title: "Новая акция",
                text: "",
                link: "/catalog",
              },
            ],
          }
        : f
    )

  const removeItem = (id: string) =>
    setForm((f) =>
      f ? { ...f, items: f.items.filter((i) => i.id !== id) } : f
    )

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        save.mutate({ ...face, bottom: form })
      }}
      className="flex flex-col gap-y-4"
    >
      <Container className="divide-y p-0">
        <div className="px-6 py-4">
          <Heading level="h1">FACE / Низ</Heading>
          <Text className="text-ui-fg-subtle" size="small">
            Блоки «Скидки и спецпредложения» на главной странице
          </Text>
        </div>

        <div className="flex flex-col gap-y-2 px-6 py-4">
          <Label htmlFor="heading">Заголовок раздела</Label>
          <Input
            id="heading"
            value={form.heading}
            onChange={(e) =>
              setForm((f) => (f ? { ...f, heading: e.target.value } : f))
            }
          />
        </div>
      </Container>

      {form.items.map((item, index) => (
        <Container key={item.id} className="divide-y p-0">
          <div className="flex items-center justify-between px-6 py-3">
            <Heading level="h2">Блок {index + 1}</Heading>
            <IconButton
              type="button"
              variant="transparent"
              onClick={() => removeItem(item.id)}
              title="Удалить блок"
            >
              <Trash />
            </IconButton>
          </div>
          <div className="grid grid-cols-1 gap-4 px-6 py-4 md:grid-cols-2">
            <div className="flex flex-col gap-y-2">
              <Label htmlFor={`badge-${item.id}`}>Метка (например −20%)</Label>
              <Input
                id={`badge-${item.id}`}
                value={item.badge}
                onChange={(e) => updateItem(item.id, { badge: e.target.value })}
              />
            </div>
            <div className="flex flex-col gap-y-2">
              <Label htmlFor={`title-${item.id}`}>Оглавление</Label>
              <Input
                id={`title-${item.id}`}
                value={item.title}
                onChange={(e) => updateItem(item.id, { title: e.target.value })}
              />
            </div>
            <div className="flex flex-col gap-y-2 md:col-span-2">
              <Label htmlFor={`text-${item.id}`}>Описание</Label>
              <Input
                id={`text-${item.id}`}
                value={item.text}
                onChange={(e) => updateItem(item.id, { text: e.target.value })}
              />
            </div>
            <div className="md:col-span-2">
              <LinkField
                id={`link-${item.id}`}
                label="Путь блока (категория товаров)"
                value={item.link}
                onChange={(v) => updateItem(item.id, { link: v })}
              />
            </div>
          </div>
        </Container>
      ))}

      <Container className="flex items-center justify-between px-6 py-4">
        <Button type="button" variant="secondary" onClick={addItem}>
          <Plus />
          Добавить блок
        </Button>
        <Button type="submit" isLoading={save.isPending}>
          Сохранить
        </Button>
      </Container>
    </form>
  )
}

export const config = defineRouteConfig({
  label: "Низ",
})

export default BottomPage
