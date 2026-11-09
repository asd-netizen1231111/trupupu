import { getI18n } from "react-i18next"

/**
 * Русский язык админки по умолчанию.
 *
 * Встроенный перевод (ru) уже есть в @medusajs/dashboard. Детектор языка берёт
 * значение из cookie/localStorage "lng", и старая cookie может перебить наше
 * значение. Поэтому ждём инициализации i18n и один раз переключаем язык
 * напрямую. Если потом выбрать другой язык (Профиль → Редактировать),
 * он сохранится и перезаписан не будет.
 */
const FLAG = "lng_ru_forced_v2"
const TARGET = "ru"

function applyRussian(attempt = 0) {
  try {
    const i18n = getI18n()

    if (i18n && i18n.isInitialized) {
      if (i18n.language !== TARGET) {
        void i18n.changeLanguage(TARGET)
      }
      window.localStorage.setItem(FLAG, "1")
      return
    }
  } catch {
    // игнорируем, попробуем ещё раз
  }

  if (attempt < 100) {
    window.setTimeout(() => applyRussian(attempt + 1), 100)
  }
}

try {
  if (typeof window !== "undefined" && !window.localStorage.getItem(FLAG)) {
    applyRussian()
  }
} catch {
  // хранилище недоступно
}

export default {}
