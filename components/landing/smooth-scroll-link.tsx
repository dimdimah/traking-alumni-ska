'use client'

import { useCallback } from 'react'
import { cubicBezier } from 'motion'

const ease = cubicBezier(0.22, 0.1, 0.25, 1)

function scrollToSection(href: string) {
  const id = href.replace('#', '')
  const el = document.getElementById(id)
  if (!el) return

  const targetY = el.getBoundingClientRect().top + window.scrollY - 80
  const startY = window.scrollY
  const delta = targetY - startY
  const duration = 900
  const startTime = performance.now()

  return new Promise<void>((resolve) => {
    const tick = (now: number) => {
      const t = Math.min((now - startTime) / duration, 1)
      window.scrollTo(0, startY + delta * ease(t))
      if (t < 1) requestAnimationFrame(tick)
      else resolve()
    }
    requestAnimationFrame(tick)
  })
}

interface SmoothScrollLinkProps {
  href: string
  children: React.ReactNode
  className?: string
  onClick?: () => void
}

export function SmoothScrollLink({ href, children, className, onClick }: SmoothScrollLinkProps) {
  const handleClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    scrollToSection(href)
    onClick?.()
  }, [href, onClick])

  return (
    <a href={href} onClick={handleClick} className={className}>
      {children}
    </a>
  )
}
