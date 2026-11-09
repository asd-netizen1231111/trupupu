import { Input, Label, Text, toast } from "@medusajs/ui"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { sdk } from "./sdk"

export type FaceTop = {
  badge: string
  title: string
  description: string
  button_text: string
  button_link: string
}

export type FaceBottomItem = {
  id: string
  badge: string
  title: string
  text: string
  link: string
}

export type Face = {
  top: FaceTop
  bottom: {
    heading: string
    items: FaceBottomItem[]
  }
}

const KEY = ["face"]

export const useFace = () => {
  const qc = useQueryClient()

  const query = useQuery({
    queryKey: KEY,
    queryFn: () => sdk.client.fetch<{ face: Face }>("/admin/face"),
  })

  const save = useMutation({
    mutationFn: (face: Face) =>
      sdk.client.fetch<{ face: Face }>("/admin/face", {
        method: "POST",
        body: face,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY })
      toast.success("Сохранено. Изменения появятся на сайте в течение минуты")
    },
    onError: (e: Error) => toast.error(`Ошибка: ${e.message}`),
  })

  return { face: query.data?.face, isLoading: query.isLoading, save }
}

type Category = { id: string; name: string; handle: string }

/**
 * Поле "путь для кнопки/блока": можно выбрать категорию товаров из списка
 * или вписать путь вручную (например /catalog/pylesosy или /catalog).
 */
export const LinkField = ({
  id,
  label,
  value,
  onChange,
}: {
  id: string
  label: string
  value: string
  onChange: (v: string) => void
}) => {
  const { data } = useQuery({
    queryKey: ["face-categories"],
    queryFn: () =>
      sdk.client.fetch<{ product_categories: Category[] }>(
        "/admin/product-categories",
        { query: { limit: 200, fields: "id,name,handle" } }
      ),
  })

  const categories = data?.product_categories ?? []
  const selected = categories.find((c) => `/catalog/${c.handle}` === value)

  return (
    <div className="flex flex-col gap-y-2">
      <Label htmlFor={id}>{label}</Label>
      <select
        className="bg-ui-bg-field shadow-borders-base text-ui-fg-base txt-compact-small h-8 rounded-md px-2"
        value={selected ? value : value === "/catalog" ? "/catalog" : ""}
        onChange={(e) => {
          if (e.target.value) {
            onChange(e.target.value)
          }
        }}
      >
        <option value="">Свой путь (вписать ниже)</option>
        <option value="/catalog">Весь каталог</option>
        {categories.map((c) => (
          <option key={c.id} value={`/catalog/${c.handle}`}>
            {c.name}
          </option>
        ))}
      </select>
      <Input
        id={id}
        placeholder="/catalog/nazvanie-kategorii"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      <Text size="xsmall" className="text-ui-fg-subtle">
        Куда попадёт покупатель при нажатии
      </Text>
    </div>
  )
}
