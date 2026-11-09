import { defineRouteConfig } from "@medusajs/admin-sdk"
import { ChatBubbleLeftRight } from "@medusajs/icons"
import {
  Button,
  Container,
  Heading,
  StatusBadge,
  Table,
  Tabs,
  Text,
  toast,
  usePrompt,
} from "@medusajs/ui"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { sdk } from "../../lib/sdk"

type Status = "pending" | "approved" | "rejected"
type Tab = "all" | Status

type AdminReview = {
  id: string
  product_id: string
  rating: number
  text: string
  status: Status
  created_at: string
  customer_name: string
  customer_email: string | null
  product_title: string
}

type ReviewsResponse = {
  reviews: AdminReview[]
  count: number
  limit: number
  offset: number
  counters: { all: number; pending: number; approved: number; rejected: number }
}

const PAGE_SIZE = 20

const STATUS_LABEL: Record<Status, string> = {
  pending: "На модерации",
  approved: "Одобрен",
  rejected: "Отклонён",
}

const STATUS_COLOR: Record<Status, "orange" | "green" | "red"> = {
  pending: "orange",
  approved: "green",
  rejected: "red",
}

const Stars = ({ value }: { value: number }) => (
  <span aria-label={`Оценка ${value} из 5`} className="whitespace-nowrap">
    <span className="text-ui-tag-orange-icon">{"★".repeat(value)}</span>
    <span className="text-ui-fg-muted">{"★".repeat(5 - value)}</span>
  </span>
)

const formatDate = (iso: string) =>
  new Date(iso).toLocaleString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })

const ReviewsPage = () => {
  const qc = useQueryClient()
  const prompt = usePrompt()
  const [tab, setTab] = useState<Tab>("pending")
  const [page, setPage] = useState(0)

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["admin-reviews", tab, page],
    queryFn: () => {
      const params = new URLSearchParams({
        limit: String(PAGE_SIZE),
        offset: String(page * PAGE_SIZE),
      })
      if (tab !== "all") {
        params.set("status", tab)
      }
      return sdk.client.fetch<ReviewsResponse>(
        `/admin/reviews?${params.toString()}`
      )
    },
  })

  const refresh = () => qc.invalidateQueries({ queryKey: ["admin-reviews"] })

  const setStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: Status }) =>
      sdk.client.fetch(`/admin/reviews/${id}`, {
        method: "POST",
        body: { status },
      }),
    onSuccess: (_d, vars) => {
      refresh()
      toast.success(
        vars.status === "approved" ? "Отзыв одобрен" : "Отзыв отклонён"
      )
    },
    onError: (e: Error) => toast.error(`Ошибка: ${e.message}`),
  })

  const remove = useMutation({
    mutationFn: (id: string) =>
      sdk.client.fetch(`/admin/reviews/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      refresh()
      toast.success("Отзыв удалён")
    },
    onError: (e: Error) => toast.error(`Ошибка: ${e.message}`),
  })

  const onDelete = async (id: string) => {
    const ok = await prompt({
      title: "Удалить отзыв?",
      description: "Запись будет удалена без возможности восстановления.",
      confirmText: "Удалить",
      cancelText: "Отмена",
    })
    if (ok) {
      remove.mutate(id)
    }
  }

  const changeTab = (value: string) => {
    setTab(value as Tab)
    setPage(0)
  }

  const counters = data?.counters
  const reviews = data?.reviews ?? []
  const total = data?.count ?? 0
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const busy = setStatus.isPending || remove.isPending

  return (
    <Container className="divide-y p-0">
      <div className="px-6 py-4">
        <Heading level="h1">Отзывы</Heading>
        <Text className="text-ui-fg-subtle" size="small">
          Модерация отзывов о товарах. На витрине показываются только
          одобренные.
        </Text>
      </div>

      <div className="px-6 py-3">
        <Tabs value={tab} onValueChange={changeTab}>
          <Tabs.List>
            <Tabs.Trigger value="all">
              Все{counters ? ` (${counters.all})` : ""}
            </Tabs.Trigger>
            <Tabs.Trigger value="pending">
              На модерации{counters ? ` (${counters.pending})` : ""}
            </Tabs.Trigger>
            <Tabs.Trigger value="approved">
              Одобренные{counters ? ` (${counters.approved})` : ""}
            </Tabs.Trigger>
            <Tabs.Trigger value="rejected">
              Отклонённые{counters ? ` (${counters.rejected})` : ""}
            </Tabs.Trigger>
          </Tabs.List>
        </Tabs>
      </div>

      {isLoading ? (
        <div className="px-6 py-8">
          <Text>Загрузка…</Text>
        </div>
      ) : isError ? (
        <div className="px-6 py-8">
          <Text className="text-ui-fg-error">
            Не удалось загрузить отзывы: {(error as Error).message}
          </Text>
        </div>
      ) : reviews.length === 0 ? (
        <div className="px-6 py-8">
          <Text className="text-ui-fg-subtle">В этом разделе отзывов нет.</Text>
        </div>
      ) : (
        <Table>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell>Пользователь</Table.HeaderCell>
              <Table.HeaderCell>Товар</Table.HeaderCell>
              <Table.HeaderCell>Оценка</Table.HeaderCell>
              <Table.HeaderCell>Отзыв</Table.HeaderCell>
              <Table.HeaderCell>Статус</Table.HeaderCell>
              <Table.HeaderCell className="text-right">Действия</Table.HeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {reviews.map((r) => (
              <Table.Row key={r.id} className="align-top">
                <Table.Cell>
                  <div className="flex flex-col py-2">
                    <Text size="small" weight="plus">
                      {r.customer_name}
                    </Text>
                    {r.customer_email && r.customer_email !== r.customer_name && (
                      <Text size="xsmall" className="text-ui-fg-subtle">
                        {r.customer_email}
                      </Text>
                    )}
                    <Text size="xsmall" className="text-ui-fg-muted">
                      {formatDate(r.created_at)}
                    </Text>
                  </div>
                </Table.Cell>
                <Table.Cell>
                  <Text size="small" className="py-2">
                    {r.product_title}
                  </Text>
                </Table.Cell>
                <Table.Cell>
                  <div className="py-2">
                    <Stars value={r.rating} />
                  </div>
                </Table.Cell>
                <Table.Cell className="max-w-[360px]">
                  <Text
                    size="small"
                    className="whitespace-pre-wrap break-words py-2"
                  >
                    {r.text}
                  </Text>
                </Table.Cell>
                <Table.Cell>
                  <div className="py-2">
                    <StatusBadge color={STATUS_COLOR[r.status]}>
                      {STATUS_LABEL[r.status]}
                    </StatusBadge>
                  </div>
                </Table.Cell>
                <Table.Cell>
                  <div className="flex justify-end gap-x-2 py-2">
                    {r.status !== "approved" && (
                      <Button
                        size="small"
                        variant="secondary"
                        disabled={busy}
                        onClick={() =>
                          setStatus.mutate({ id: r.id, status: "approved" })
                        }
                      >
                        Одобрить
                      </Button>
                    )}
                    {r.status !== "rejected" && (
                      <Button
                        size="small"
                        variant="secondary"
                        disabled={busy}
                        onClick={() =>
                          setStatus.mutate({ id: r.id, status: "rejected" })
                        }
                      >
                        Отклонить
                      </Button>
                    )}
                    <Button
                      size="small"
                      variant="danger"
                      disabled={busy}
                      onClick={() => onDelete(r.id)}
                    >
                      Удалить
                    </Button>
                  </div>
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table>
      )}

      {total > PAGE_SIZE && (
        <div className="flex items-center justify-between px-6 py-3">
          <Text size="small" className="text-ui-fg-subtle">
            Страница {page + 1} из {pageCount} · всего {total}
          </Text>
          <div className="flex gap-x-2">
            <Button
              size="small"
              variant="secondary"
              disabled={page === 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
            >
              Назад
            </Button>
            <Button
              size="small"
              variant="secondary"
              disabled={page + 1 >= pageCount}
              onClick={() => setPage((p) => p + 1)}
            >
              Далее
            </Button>
          </div>
        </div>
      )}
    </Container>
  )
}

export const config = defineRouteConfig({
  label: "Отзывы",
  icon: ChatBubbleLeftRight,
})

export default ReviewsPage
