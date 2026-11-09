import { defineRouteConfig } from "@medusajs/admin-sdk"
import { CogSixTooth } from "@medusajs/icons"
import {
  Button,
  Container,
  Heading,
  Input,
  Label,
  Text,
  Textarea,
  toast,
} from "@medusajs/ui"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useEffect, useState } from "react"
import { sdk } from "../../lib/sdk"

type Settings = {
  phone: string
  work_hours: string
  legal_name: string
  unp: string
  address: string
  email: string
  bank_name: string
  bank_account: string
  socials: Record<string, string>
}

const EMPTY: Settings = {
  phone: "",
  work_hours: "",
  legal_name: "",
  unp: "",
  address: "",
  email: "",
  bank_name: "",
  bank_account: "",
  socials: {},
}

const SOCIALS = [
  { key: "instagram", label: "Instagram" },
  { key: "telegram", label: "Telegram" },
  { key: "viber", label: "Viber" },
  { key: "vk", label: "ВКонтакте" },
]

const Field = ({
  id,
  label,
  children,
}: {
  id: string
  label: string
  children: React.ReactNode
}) => (
  <div className="flex flex-col gap-y-2">
    <Label htmlFor={id}>{label}</Label>
    {children}
  </div>
)

const SiteSettingsPage = () => {
  const qc = useQueryClient()
  const [form, setForm] = useState<Settings>(EMPTY)

  const { data, isLoading } = useQuery({
    queryKey: ["site-settings"],
    queryFn: () =>
      sdk.client.fetch<{ site_settings: Partial<Settings> }>(
        "/admin/site-settings"
      ),
  })

  useEffect(() => {
    if (data?.site_settings) {
      const s = data.site_settings
      setForm({
        phone: s.phone ?? "",
        work_hours: s.work_hours ?? "",
        legal_name: s.legal_name ?? "",
        unp: s.unp ?? "",
        address: s.address ?? "",
        email: s.email ?? "",
        bank_name: s.bank_name ?? "",
        bank_account: s.bank_account ?? "",
        socials: (s.socials as Record<string, string>) ?? {},
      })
    }
  }, [data])

  const mutation = useMutation({
    mutationFn: (body: Settings) =>
      sdk.client.fetch("/admin/site-settings", { method: "POST", body }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["site-settings"] })
      toast.success("Настройки сохранены")
    },
    onError: (e: Error) => toast.error(`Ошибка: ${e.message}`),
  })

  const reindex = useMutation({
    mutationFn: () =>
      sdk.client.fetch("/admin/reindex-products", { method: "POST" }),
    onSuccess: () =>
      toast.success("Каталог обновляется. Изменения появятся на сайте через минуту"),
    onError: (e: Error) => toast.error(`Ошибка: ${e.message}`),
  })

  const set = (key: keyof Settings) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => setForm((f) => ({ ...f, [key]: e.target.value }))

  const setSocial = (key: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, socials: { ...f.socials, [key]: e.target.value } }))

  if (isLoading) {
    return (
      <Container>
        <Text>Загрузка…</Text>
      </Container>
    )
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        mutation.mutate(form)
      }}
      className="flex flex-col gap-y-4"
    >
      <Container className="divide-y p-0">
        <div className="px-6 py-4">
          <Heading level="h1">Настройки сайта</Heading>
          <Text className="text-ui-fg-subtle" size="small">
            Данные выводятся в шапке и подвале витрины
          </Text>
        </div>

        <div className="grid grid-cols-1 gap-4 px-6 py-4 md:grid-cols-2">
          <Heading level="h2" className="md:col-span-2">
            Шапка
          </Heading>
          <Field id="phone" label="Контактный телефон">
            <Input id="phone" value={form.phone} onChange={set("phone")} />
          </Field>
          <Field id="work_hours" label="Режим работы">
            <Input
              id="work_hours"
              value={form.work_hours}
              onChange={set("work_hours")}
            />
          </Field>
        </div>

        <div className="grid grid-cols-1 gap-4 px-6 py-4 md:grid-cols-2">
          <Heading level="h2" className="md:col-span-2">
            Подвал (реквизиты)
          </Heading>
          <Field id="legal_name" label="Юридическое название">
            <Input
              id="legal_name"
              value={form.legal_name}
              onChange={set("legal_name")}
            />
          </Field>
          <Field id="unp" label="УНП">
            <Input id="unp" value={form.unp} onChange={set("unp")} />
          </Field>
          <Field id="email" label="Email">
            <Input
              id="email"
              type="email"
              value={form.email}
              onChange={set("email")}
            />
          </Field>
          <div className="md:col-span-2">
            <Field id="address" label="Адрес">
              <Textarea
                id="address"
                value={form.address}
                onChange={set("address")}
              />
            </Field>
          </div>
          <Field id="bank_name" label="Банк">
            <Input
              id="bank_name"
              value={form.bank_name}
              onChange={set("bank_name")}
            />
          </Field>
          <Field id="bank_account" label="Р/с (расчётный счёт)">
            <Input
              id="bank_account"
              value={form.bank_account}
              onChange={set("bank_account")}
            />
          </Field>
        </div>

        <div className="grid grid-cols-1 gap-4 px-6 py-4 md:grid-cols-2">
          <Heading level="h2" className="md:col-span-2">
            Соцсети (ссылки)
          </Heading>
          {SOCIALS.map((s) => (
            <Field key={s.key} id={s.key} label={s.label}>
              <Input
                id={s.key}
                placeholder="https://..."
                value={form.socials[s.key] ?? ""}
                onChange={setSocial(s.key)}
              />
            </Field>
          ))}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-4">
          <div className="flex flex-col">
            <Button
              type="button"
              variant="secondary"
              isLoading={reindex.isPending}
              onClick={() => reindex.mutate()}
            >
              Обновить каталог на сайте
            </Button>
            <Text size="xsmall" className="text-ui-fg-subtle mt-1">
              Нужно, если после изменения скидки цена в каталоге не обновилась
              (автоматически — раз в 10 минут)
            </Text>
          </div>
          <Button type="submit" isLoading={mutation.isPending}>
            Сохранить
          </Button>
        </div>
      </Container>
    </form>
  )
}

export const config = defineRouteConfig({
  label: "Настройки сайта",
  icon: CogSixTooth,
})

export default SiteSettingsPage
