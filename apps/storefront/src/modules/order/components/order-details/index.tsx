import { HttpTypes } from "@medusajs/types"
import { Text } from "@modules/common/components/ui"

type OrderDetailsProps = {
  order: HttpTypes.StoreOrder
  showStatus?: boolean
}

const OrderDetails = ({ order, showStatus }: OrderDetailsProps) => {
  const STATUS_RU: Record<string, string> = {
    not_fulfilled: "Не отправлен",
    partially_fulfilled: "Отправлен частично",
    fulfilled: "Собран",
    partially_shipped: "Отправлен частично",
    shipped: "Отправлен",
    partially_delivered: "Доставлен частично",
    delivered: "Доставлен",
    canceled: "Отменён",
    not_paid: "Не оплачен",
    awaiting: "Ожидает оплаты",
    authorized: "Авторизован",
    partially_authorized: "Авторизован частично",
    captured: "Оплачен",
    partially_captured: "Оплачен частично",
    partially_refunded: "Возвращён частично",
    refunded: "Возвращён",
    requires_action: "Требует действий",
  }

  const formatStatus = (str: string) => {
    if (STATUS_RU[str]) {
      return STATUS_RU[str]
    }

    const formatted = str.split("_").join(" ")

    return formatted.slice(0, 1).toUpperCase() + formatted.slice(1)
  }

  return (
    <div>
      <Text>
        Мы отправили подтверждение заказа на{" "}
        <span
          className="text-ui-fg-medium-plus font-semibold"
          data-testid="order-email"
        >
          {order.email}
        </span>
        .
      </Text>
      <Text className="mt-2">
        Дата заказа:{" "}
        <span data-testid="order-date">
          {new Date(order.created_at).toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" })}
        </span>
      </Text>
      <Text className="mt-2 text-ui-fg-interactive">
        Номер заказа: <span data-testid="order-id">{order.display_id}</span>
      </Text>

      <div className="flex items-center text-compact-small gap-x-4 mt-4">
        {showStatus && (
          <>
            <Text>
              Статус заказа:{" "}
              <span className="text-ui-fg-subtle " data-testid="order-status">
                {formatStatus(order.fulfillment_status)}
              </span>
            </Text>
            <Text>
              Статус оплаты:{" "}
              <span
                className="text-ui-fg-subtle "
                sata-testid="order-payment-status"
              >
                {formatStatus(order.payment_status)}
              </span>
            </Text>
          </>
        )}
      </div>
    </div>
  )
}

export default OrderDetails
