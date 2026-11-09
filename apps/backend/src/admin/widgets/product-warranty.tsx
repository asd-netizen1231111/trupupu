import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { Button, Container, Heading, Input, Label, Text, toast } from "@medusajs/ui"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useEffect, useState } from "react"
import { sdk } from "../lib/sdk"

type WidgetProps = { data: { id: string } }

const DEFAULT_CURRENCY = "byn"

const ProductWarrantyWidget = ({ data }: WidgetProps) => {
  const qc = useQueryClient()
  const queryKey = ["product-warranty", data.id]

  const { data: res, isLoading } = useQuery({
    queryKey,
    queryFn: () =>
      sdk.admin.product.retrieve(data.id, {
        fields: "id,metadata,*variants,*variants.prices",
      }),
  })

  const product: any = res?.product
  const [warranty, setWarranty] = useState("")
  const [currency, setCurrency] = useState(DEFAULT_CURRENCY)
  const [price, setPrice] = useState("")

  useEffect(() => {
    if (!product) return
    setWarranty((product.metadata?.warranty as string) ?? "")
    const firstPrice = product.variants?.[0]?.prices?.[0]
    const cur = (firstPrice?.currency_code as string) ?? DEFAULT_CURRENCY
    setCurrency(cur)
    const existing = product.variants?.[0]?.prices?.find(
      (p: any) => p.currency_code === cur
    )
    setPrice(existing ? String(existing.amount) : "")
  }, [product])

  const save = useMutation({
    mutationFn: async () => {
      await sdk.admin.product.update(data.id, {
        metadata: { ...(product?.metadata ?? {}), warranty: warranty.trim() },
      })

      const amount = Number(price.replace(",", "."))
      if (price.trim() !== "" && Number.isFinite(amount) && amount >= 0) {
        const cur = currency.trim().toLowerCase()
        for (const variant of product?.variants ?? []) {
          const prices: any[] = (variant.prices ?? []).map((p: any) => ({
            id: p.id,
            currency_code: p.currency_code,
            amount: p.currency_code === cur ? amount : p.amount,
          }))
          if (!prices.some((p) => p.currency_code === cur)) {
            prices.push({ currency_code: cur, amount })
          }
          await sdk.admin.product.updateVariant(data.id, variant.id, { prices })
        }
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey })
      toast.success("Сохранено")
    },
    onError: (e: Error) => toast.error(`Ошибка: ${e.message}`),
  })

  return (
    <Container className="divide-y p-0">
      <div className="px-6 py-4">
        <Heading level="h2">Гарантия и цена</Heading>
        <Text size="small" className="text-ui-fg-subtle">
          Срок гарантии показывается на странице товара. Цена применяется ко
          всем вариантам товара.
        </Text>
      </div>
      <div className="grid grid-cols-1 gap-4 px-6 py-4">
        {isLoading ? (
          <Text>Загрузка…</Text>
        ) : (
          <>
            <div className="flex flex-col gap-y-2">
              <Label htmlFor="warranty">Срок гарантии</Label>
              <Input
                id="warranty"
                placeholder="например: 1 год, 24 месяца"
                value={warranty}
                onChange={(e) => setWarranty(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2 flex flex-col gap-y-2">
                <Label htmlFor="price">Цена</Label>
                <Input
                  id="price"
                  inputMode="decimal"
                  placeholder="0.00"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-y-2">
                <Label htmlFor="currency">Валюта</Label>
                <Input
                  id="currency"
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                />
              </div>
            </div>
            <div>
              <Button
                size="small"
                isLoading={save.isPending}
                onClick={() => save.mutate()}
              >
                Сохранить
              </Button>
            </div>
          </>
        )}
      </div>
    </Container>
  )
}

export const config = defineWidgetConfig({
  zone: "product.details.after",
})

export default ProductWarrantyWidget
