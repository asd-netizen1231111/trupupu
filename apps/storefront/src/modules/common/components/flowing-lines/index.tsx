"use client"

import { useEffect, useMemo, useRef, useState } from "react"

type Props = {
  /** Количество линий */
  lines?: number
  /** Палитра линий (циклически) */
  colors?: string[]
  /** Общая прозрачность линий */
  opacity?: number
  strokeWidth?: number
  /** Реакция на мышь и прокрутку */
  interactive?: boolean
  /** Меняет рисунок линий */
  seed?: number
  className?: string
}

const W = 1440
const H = 900
const XS = [-80, 300, 660, 1020, 1380, 1520]
const SPLINES = "0.45 0 0.55 1;0.45 0 0.55 1;0.45 0 0.55 1"
// Три слоя глубины: чем больше коэффициент, тем сильнее слой смещается
const DEPTHS = [0.5, 1, 1.8]

// Детерминированный генератор (одинаковый на сервере и клиенте)
function mulberry32(a: number) {
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// Плавная кривая через точки (касательные горизонтальны)
function buildPath(ys: number[]) {
  let d = `M ${XS[0]} ${ys[0].toFixed(1)}`
  for (let i = 1; i < XS.length; i++) {
    const mid = (XS[i] - XS[i - 1]) / 2
    d += ` C ${XS[i - 1] + mid} ${ys[i - 1].toFixed(1)}, ${XS[i] - mid} ${ys[
      i
    ].toFixed(1)}, ${XS[i]} ${ys[i].toFixed(1)}`
  }
  return d
}

export default function FlowingLines({
  lines = 7,
  colors = ["#8a6a5a", "#2b2b2b", "#b79b86"],
  opacity = 0.35,
  strokeWidth = 1.2,
  interactive = false,
  seed = 7,
  className = "absolute inset-0 pointer-events-none",
}: Props) {
  const [reduced, setReduced] = useState(false)
  const layerRefs = useRef<(SVGGElement | null)[]>([])

  const paths = useMemo(() => {
    const rand = mulberry32(seed)
    return Array.from({ length: lines }, (_, i) => {
      const baseY = (H * (i + 0.5)) / lines
      const amp = 90 + rand() * 140
      const variants = [0, 1, 2].map(() =>
        XS.map(() => baseY + (rand() - 0.5) * 2 * amp)
      )
      const [a, b, c] = variants.map(buildPath)
      return {
        id: i,
        layer: i % DEPTHS.length,
        d: a,
        values: [a, b, c, a].join(";"),
        dur: 20 + rand() * 18,
        begin: -rand() * 20,
        color: colors[i % colors.length],
        width: strokeWidth * (0.7 + rand() * 0.9),
      }
    })
  }, [lines, colors, strokeWidth, seed])

  // prefers-reduced-motion: отключаем анимацию и реакцию
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
    const update = () => setReduced(mq.matches)
    update()
    mq.addEventListener("change", update)
    return () => mq.removeEventListener("change", update)
  }, [])

  // Реакция на мышь и прокрутку
  useEffect(() => {
    if (!interactive || reduced) return

    const target = { mx: 0, my: 0, sy: 0 }
    const cur = { mx: 0, my: 0, sy: 0 }
    let raf = 0

    const apply = () => {
      layerRefs.current.forEach((el, i) => {
        if (!el) return
        const f = DEPTHS[i]
        const x = cur.mx * 18 * f
        const y = cur.my * 12 * f + Math.sin(cur.sy / 500) * 30 * f
        el.style.transform = `translate(${x.toFixed(2)}px, ${y.toFixed(2)}px)`
      })
    }

    const tick = () => {
      cur.mx += (target.mx - cur.mx) * 0.06
      cur.my += (target.my - cur.my) * 0.06
      cur.sy += (target.sy - cur.sy) * 0.08
      apply()
      const moving =
        Math.abs(target.mx - cur.mx) > 0.001 ||
        Math.abs(target.my - cur.my) > 0.001 ||
        Math.abs(target.sy - cur.sy) > 0.5
      raf = moving ? requestAnimationFrame(tick) : 0
    }
    const kick = () => {
      if (!raf) raf = requestAnimationFrame(tick)
    }

    const onMove = (e: PointerEvent) => {
      target.mx = (e.clientX / window.innerWidth) * 2 - 1
      target.my = (e.clientY / window.innerHeight) * 2 - 1
      kick()
    }
    const onScroll = () => {
      target.sy = window.scrollY
      kick()
    }

    target.sy = cur.sy = window.scrollY
    window.addEventListener("pointermove", onMove, { passive: true })
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => {
      window.removeEventListener("pointermove", onMove)
      window.removeEventListener("scroll", onScroll)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [interactive, reduced])

  return (
    <svg
      aria-hidden="true"
      className={className}
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="xMidYMid slice"
      fill="none"
    >
      {DEPTHS.map((_, layer) => (
        <g
          key={layer}
          ref={(el) => {
            layerRefs.current[layer] = el
          }}
          style={{ willChange: interactive ? "transform" : undefined }}
        >
          {paths
            .filter((p) => p.layer === layer)
            .map((p) => (
              <path
                key={p.id}
                d={p.d}
                stroke={p.color}
                strokeWidth={p.width}
                strokeLinecap="round"
                opacity={opacity}
                vectorEffect="non-scaling-stroke"
              >
                {!reduced && (
                  <animate
                    attributeName="d"
                    values={p.values}
                    keyTimes="0;0.33;0.66;1"
                    calcMode="spline"
                    keySplines={SPLINES}
                    dur={`${p.dur.toFixed(1)}s`}
                    begin={`${p.begin.toFixed(1)}s`}
                    repeatCount="indefinite"
                  />
                )}
              </path>
            ))}
        </g>
      ))}
    </svg>
  )
}
