"use client"
import { isManual } from "@lib/constants"
import {
  ensureDefaultShipping,
  initiatePaymentSession,
  placeOrder,
  updateCart,
} from "@lib/data/cart"
import { Calendar, Cash, CreditCard } from "@medusajs/icons"
import { HttpTypes } from "@medusajs/types"
import ErrorMessage from "@modules/checkout/components/error-message"
import Divider from "@modules/common/components/divider"
import { Button, Heading, clx } from "@modules/common/components/ui"
import { useSearchParams } from "next/navigation"
import React, { useState } from "react"

type PaymentChoice = "cash" | "card" | "installments"

const PAYMENT_CHOICES: {
  id: PaymentChoice
  title: string
  icon: React.JSX.Element
}[] = [
  { id: "cash", title: "Наличными", icon: <Cash /> },
  { id: "card", title: "Картой", icon: <CreditCard /> },
  { id: "installments", title: "Оплата частями", icon: <Calendar /> },
]

const Payment = ({
  cart,
  availablePaymentMethods,
}: {
  cart: HttpTypes.StoreCart
  availablePaymentMethods: { id: string }[]
}) => {
  const searchParams = useSearchParams()
  const isOpen = searchParams.get("step") === "payment"

  const [choice, setChoice] = useState<PaymentChoice | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const providerId =
    availablePaymentMethods.find((m) => isManual(m.id))?.id ??
    availablePaymentMethods[0]?.id

  const notReady =
    !cart.shipping_address || !cart.billing_address || !cart.email

  const handleSubmit = async () => {
    if (!choice || !providerId) {
      return
    }

    setError(null)
    setIsLoading(true)

    try {
      if ((cart.shipping_methods?.length ?? 0) === 0) {
        await ensureDefaultShipping(cart.id)
      }

      const title = PAYMENT_CHOICES.find((c) => c.id === choice)?.title

      await updateCart({
        metadata: { payment_choice: choice, payment_choice_title: title },
      })

      const activeSession = cart.payment_collection?.payment_sessions?.find(
        (s) => s.status === "pending" && s.provider_id === providerId
      )

      if (!activeSession) {
        await initiatePaymentSession(cart, { provider_id: providerId })
      }

      await placeOrder(cart.id)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
      setIsLoading(false)
    }
  }

  return (
    <div className="bg-white">
      <div className="flex flex-row items-center justify-between mb-6">
        <Heading
          level="h2"
          className={clx(
            "flex flex-row text-3xl-regular gap-x-2 items-baseline",
            {
              "opacity-50 pointer-events-none select-none": !isOpen,
            }
          )}
        >
          Оплата
        </Heading>
      </div>

      {isOpen && (
        <div>
          <div
            className="grid grid-cols-1 small:grid-cols-3 gap-3"
            role="radiogroup"
            aria-label="Способ оплаты"
          >
            {PAYMENT_CHOICES.map((item) => {
              const selected = choice === item.id

              return (
                <button
                  key={item.id}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => {
                    setError(null)
                    setChoice(item.id)
                  }}
                  className={clx(
                    "flex flex-col items-center justify-center gap-y-2 py-6 px-4 border rounded-rounded text-base-regular uppercase cursor-pointer transition-all hover:shadow-borders-interactive-with-active",
                    {
                      "border-ui-border-interactive shadow-borders-interactive-with-active":
                        selected,
                    }
                  )}
                  data-testid={`payment-choice-${item.id}`}
                >
                  <span className="text-ui-fg-base">{item.icon}</span>
                  <span>{item.title}</span>
                </button>
              )
            })}
          </div>

          <ErrorMessage
            error={error}
            data-testid="payment-method-error-message"
          />

          <Button
            size="large"
            className="mt-6"
            onClick={handleSubmit}
            isLoading={isLoading}
            disabled={!choice || !providerId || notReady}
            data-testid="submit-order-button"
          >
            Оформить заказ
          </Button>
        </div>
      )}
      <Divider className="mt-8" />
    </div>
  )
}

export default Payment
