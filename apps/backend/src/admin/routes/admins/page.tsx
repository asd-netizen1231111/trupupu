import { defineRouteConfig } from "@medusajs/admin-sdk"
import { Users } from "@medusajs/icons"
import {
  Button,
  Container,
  Heading,
  Input,
  Label,
  Table,
  Text,
  toast,
  usePrompt,
} from "@medusajs/ui"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { sdk } from "../../lib/sdk"

type Admin = {
  id: string
  email: string
  first_name: string | null
  last_name: string | null
  created_at: string
}

type AdminsResponse = {
  admins: Admin[]
  count: number
  current_id: string | null
}

const formatDate = (iso: string) =>
  new Date(iso).toLocaleString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })

const fullName = (a: Admin) =>
  [a.first_name, a.last_name].filter(Boolean).join(" ") || "—"

const AdminsPage = () => {
  const qc = useQueryClient()
  const prompt = usePrompt()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")

  // смена пароля: id админа и новый пароль
  const [editId, setEditId] = useState<string | null>(null)
  const [newPassword, setNewPassword] = useState("")

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["admin-admins"],
    queryFn: () => sdk.client.fetch<AdminsResponse>("/admin/admins"),
  })

  const refresh = () => qc.invalidateQueries({ queryKey: ["admin-admins"] })

  const create = useMutation({
    mutationFn: () =>
      sdk.client.fetch("/admin/admins", {
        method: "POST",
        body: {
          email,
          password,
          first_name: firstName || undefined,
          last_name: lastName || undefined,
        },
      }),
    onSuccess: () => {
      refresh()
      toast.success("Админ добавлен")
      setEmail("")
      setPassword("")
      setFirstName("")
      setLastName("")
    },
    onError: (e: Error) => toast.error(`Ошибка: ${e.message}`),
  })

  const changePassword = useMutation({
    mutationFn: ({ id, password }: { id: string; password: string }) =>
      sdk.client.fetch(`/admin/admins/${id}`, {
        method: "POST",
        body: { password },
      }),
    onSuccess: () => {
      toast.success("Пароль изменён")
      setEditId(null)
      setNewPassword("")
    },
    onError: (e: Error) => toast.error(`Ошибка: ${e.message}`),
  })

  const remove = useMutation({
    mutationFn: (id: string) =>
      sdk.client.fetch(`/admin/admins/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      refresh()
      toast.success("Админ удалён")
    },
    onError: (e: Error) => toast.error(`Ошибка: ${e.message}`),
  })

  const onDelete = async (a: Admin) => {
    const ok = await prompt({
      title: "Удалить админа?",
      description: `Доступ для ${a.email} будет закрыт без возможности восстановления.`,
      confirmText: "Удалить",
      cancelText: "Отмена",
    })
    if (ok) {
      remove.mutate(a.id)
    }
  }

  const canCreate = email.trim().length > 0 && password.length >= 8
  const admins = data?.admins ?? []
  const busy = create.isPending || changePassword.isPending || remove.isPending

  return (
    <div className="flex flex-col gap-y-3">
      <Container className="divide-y p-0">
        <div className="px-6 py-4">
          <Heading level="h1">Админы</Heading>
          <Text className="text-ui-fg-subtle" size="small">
            Добавляйте новых администраторов: логин (email) и пароль для входа
            в админку.
          </Text>
        </div>

        <form
          className="grid grid-cols-1 gap-4 px-6 py-4 md:grid-cols-2"
          onSubmit={(e) => {
            e.preventDefault()
            if (canCreate && !busy) {
              create.mutate()
            }
          }}
        >
          <div className="flex flex-col gap-y-1">
            <Label htmlFor="adm-email">Логин (email)</Label>
            <Input
              id="adm-email"
              type="email"
              autoComplete="off"
              placeholder="admin@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-y-1">
            <Label htmlFor="adm-pass">Пароль (минимум 8 символов)</Label>
            <Input
              id="adm-pass"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-y-1">
            <Label htmlFor="adm-first">Имя (необязательно)</Label>
            <Input
              id="adm-first"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-y-1">
            <Label htmlFor="adm-last">Фамилия (необязательно)</Label>
            <Input
              id="adm-last"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
            />
          </div>
          <div className="md:col-span-2">
            <Button
              type="submit"
              disabled={!canCreate || busy}
              isLoading={create.isPending}
            >
              Добавить админа
            </Button>
          </div>
        </form>
      </Container>

      <Container className="divide-y p-0">
        <div className="px-6 py-4">
          <Heading level="h2">Список админов</Heading>
        </div>

        {isLoading ? (
          <div className="px-6 py-8">
            <Text>Загрузка…</Text>
          </div>
        ) : isError ? (
          <div className="px-6 py-8">
            <Text className="text-ui-fg-error">
              Не удалось загрузить список: {(error as Error).message}
            </Text>
          </div>
        ) : (
          <Table>
            <Table.Header>
              <Table.Row>
                <Table.HeaderCell>Логин</Table.HeaderCell>
                <Table.HeaderCell>Имя</Table.HeaderCell>
                <Table.HeaderCell>Создан</Table.HeaderCell>
                <Table.HeaderCell className="text-right">
                  Действия
                </Table.HeaderCell>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {admins.map((a) => {
                const isMe = a.id === data?.current_id
                const editing = editId === a.id
                return (
                  <Table.Row key={a.id} className="align-top">
                    <Table.Cell>
                      <Text size="small" weight="plus" className="py-2">
                        {a.email}
                        {isMe ? " (вы)" : ""}
                      </Text>
                    </Table.Cell>
                    <Table.Cell>
                      <Text size="small" className="py-2">
                        {fullName(a)}
                      </Text>
                    </Table.Cell>
                    <Table.Cell>
                      <Text size="small" className="py-2">
                        {formatDate(a.created_at)}
                      </Text>
                    </Table.Cell>
                    <Table.Cell>
                      <div className="flex justify-end gap-x-2 py-2">
                        {editing ? (
                          <>
                            <Input
                              size="small"
                              type="password"
                              autoComplete="new-password"
                              placeholder="Новый пароль"
                              value={newPassword}
                              onChange={(e) => setNewPassword(e.target.value)}
                            />
                            <Button
                              size="small"
                              disabled={newPassword.length < 8 || busy}
                              onClick={() =>
                                changePassword.mutate({
                                  id: a.id,
                                  password: newPassword,
                                })
                              }
                            >
                              Сохранить
                            </Button>
                            <Button
                              size="small"
                              variant="secondary"
                              onClick={() => {
                                setEditId(null)
                                setNewPassword("")
                              }}
                            >
                              Отмена
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button
                              size="small"
                              variant="secondary"
                              disabled={busy}
                              onClick={() => {
                                setEditId(a.id)
                                setNewPassword("")
                              }}
                            >
                              Сменить пароль
                            </Button>
                            <Button
                              size="small"
                              variant="danger"
                              disabled={busy || isMe}
                              onClick={() => onDelete(a)}
                            >
                              Удалить
                            </Button>
                          </>
                        )}
                      </div>
                    </Table.Cell>
                  </Table.Row>
                )
              })}
            </Table.Body>
          </Table>
        )}
      </Container>
    </div>
  )
}

export const config = defineRouteConfig({
  label: "Админы",
  icon: Users,
})

export default AdminsPage
