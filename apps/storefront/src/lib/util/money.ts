import { isEmpty } from "./isEmpty"

type ConvertToLocaleParams = {
  amount: number
  currency_code: string
  minimumFractionDigits?: number
  maximumFractionDigits?: number
  locale?: string
}

// Локаль витрины: белорусский рубль в ru-BY выводится как "35,00 Br"
export const STORE_LOCALE = "ru-BY"

export const convertToLocale = ({
  amount,
  currency_code,
  minimumFractionDigits,
  maximumFractionDigits,
  locale = STORE_LOCALE,
}: ConvertToLocaleParams) => {
  if (!currency_code || isEmpty(currency_code)) {
    return amount.toString()
  }
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: currency_code.toUpperCase(),
      minimumFractionDigits,
      maximumFractionDigits,
    }).format(amount)
  } catch {
    return `${amount.toFixed(2)} ${currency_code.toUpperCase()}`
  }
}

/** Короткая запись: formatMoney(35, "byn", 0) -> "35 Br" */
export const formatMoney = (
  amount: number,
  currency_code: string,
  fractionDigits?: number
) =>
  convertToLocale({
    amount,
    currency_code,
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  })
