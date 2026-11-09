const checkEnvVariables = require("./check-env-variables")

checkEnvVariables()

/**
 * Medusa Cloud-related environment variables
 */
const S3_HOSTNAME = process.env.MEDUSA_CLOUD_S3_HOSTNAME
const S3_PATHNAME = process.env.MEDUSA_CLOUD_S3_PATHNAME
const DEFAULT_REGION = (process.env.NEXT_PUBLIC_DEFAULT_REGION || "by").toLowerCase()

const IS_PRODUCTION = process.env.NODE_ENV === "production"

/**
 * Хост бэкенда (откуда отдаются фото /static/...) берём из
 * NEXT_PUBLIC_MEDUSA_BACKEND_URL — домен нигде не прописан в коде.
 * Разрешаем только https (для прода); http://localhost — ниже, только в разработке.
 */
const BACKEND_IMAGE_PATTERNS = (() => {
  const raw = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL
  if (!raw) return []
  try {
    const url = new URL(raw)
    if (url.protocol !== "https:") return []
    return [
      {
        protocol: "https",
        hostname: url.hostname,
        ...(url.port ? { port: url.port } : {}),
        pathname: "/static/**",
      },
    ]
  } catch {
    console.warn(
      `[next.config] NEXT_PUBLIC_MEDUSA_BACKEND_URL некорректный: "${raw}"`
    )
    return []
  }
})()

/**
 * @type {import('next').NextConfig}
 */
const nextConfig = {
  reactStrictMode: true,
  devIndicators: false,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [{ key: "Link", value: '</.well-known/ucp>; rel="ucp"' }],
      },
      {
        source: "/:countryCode/product/:handle",
        headers: [{ key: "Vary", value: "Accept" }],
      },
    ]
  },
  // Старые адреса стартера -> новые красивые (301, чтобы не терять SEO)
  async redirects() {
    return [
      { source: "/:cc/products/:handle", destination: "/:cc/product/:handle", permanent: true },
      { source: "/:cc/categories/:path*", destination: "/:cc/catalog/:path*", permanent: true },
      { source: "/:cc/store", destination: "/:cc/catalog", permanent: true },
      { source: "/:cc/shipping", destination: "/:cc/delivery", permanent: true },
      { source: "/:cc/returns", destination: "/:cc/warranty", permanent: true },
      { source: "/:cc/terms", destination: "/:cc/offer", permanent: true },
      // то же для адресов без кода страны
      { source: "/products/:handle", destination: "/product/:handle", permanent: true },
      { source: "/categories/:path*", destination: "/catalog/:path*", permanent: true },
      { source: "/store", destination: "/catalog", permanent: true },
      { source: "/shipping", destination: "/delivery", permanent: true },
      { source: "/returns", destination: "/warranty", permanent: true },
      { source: "/terms", destination: "/offer", permanent: true },
    ]
  },
  async rewrites() {
    return {
      beforeFiles: [
        // Адреса без кода страны (основной регион)
        {
          source: "/product/:handle([^/.]+).md",
          destination: `/${DEFAULT_REGION}/product/:handle/markdown`,
        },
        {
          source: "/product/:handle([^/.]+)",
          has: [{ type: "header", key: "accept", value: ".*text/markdown.*" }],
          destination: `/${DEFAULT_REGION}/product/:handle/markdown`,
        },
        {
          source: "/:countryCode/product/:handle([^/.]+).md",
          destination: "/:countryCode/product/:handle/markdown",
        },
        {
          source: "/:countryCode/product/:handle([^/.]+)",
          has: [{ type: "header", key: "accept", value: ".*text/markdown.*" }],
          destination: "/:countryCode/product/:handle/markdown",
        },
      ],
    }
  },
  logging: {
    fetches: {
      fullUrl: true,
    },
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    // Оптимизация включена: Next сам ужимает фото и отдаёт WebP/AVIF нужного размера
    formats: ["image/avif", "image/webp"],
    qualities: [50, 75, 90],
    // Фото из админки в разработке лежат на localhost:9000 — разрешаем только локально
    dangerouslyAllowLocalIP: !IS_PRODUCTION,
    remotePatterns: [
      // Фото бэкенда на проде: https://<хост из NEXT_PUBLIC_MEDUSA_BACKEND_URL>/static/**
      ...BACKEND_IMAGE_PATTERNS,
      // localhost — только для разработки
      ...(IS_PRODUCTION ? [] : [{ protocol: "http", hostname: "localhost" }]),
      {
        protocol: "https",
        hostname: "*.s3.*.amazonaws.com",
      },
      {
        protocol: "https",
        hostname: "*.s3.amazonaws.com",
      },
      ...(S3_HOSTNAME && S3_PATHNAME
        ? [
            {
              protocol: "https",
              hostname: S3_HOSTNAME,
              pathname: S3_PATHNAME,
            },
          ]
        : []),
    ],
  },
}

module.exports = nextConfig
