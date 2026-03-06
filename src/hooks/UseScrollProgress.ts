import { useState, useEffect, RefObject } from 'react'

export function useScrollProgress(containerRef: RefObject<HTMLDivElement | null>) {
  const [scrollProgress, setScrollProgress] = useState(0)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const handleScroll = () => {
      const scrollHeight = container.scrollHeight - container.clientHeight
      const scrollTop = container.scrollTop
      const progress = scrollHeight > 0 ? scrollTop / scrollHeight : 0
      setScrollProgress(Math.min(Math.max(progress, 0), 1))
    }

    container.addEventListener('scroll', handleScroll)
    handleScroll() // Initial call

    return () => container.removeEventListener('scroll', handleScroll)
  }, [containerRef])

  return scrollProgress
}