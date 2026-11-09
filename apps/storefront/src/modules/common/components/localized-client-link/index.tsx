"use client"

import Link from "next/link"
import { useParams } from "next/navigation"
import React from "react"

import { localizePath } from "@lib/util/paths"

/**
 * Ссылка внутри магазина. Для основной страны (by) префикс не добавляется:
 * href="/catalog" -> "/catalog".
 */
const LocalizedClientLink = ({
  children,
  href,
  ...props
}: {
  children?: React.ReactNode
  href: string
  className?: string
  onClick?: () => void
  passHref?: true
  [x: string]: unknown
}) => {
  const { countryCode } = useParams()

  return (
    <Link href={localizePath(countryCode as string, href)} {...props}>
      {children}
    </Link>
  )
}

export default LocalizedClientLink
