"use client"
import { useEffect, Suspense } from "react"
import { usePathname, useSearchParams } from "next/navigation"
import NProgress from "nprogress"

// Configure NProgress behavior
NProgress.configure({
  minimum:   0.15,
  easing:    "ease",
  speed:     300,
  showSpinner: false,  // We use our own spinner
  trickleSpeed: 80,
})

function NavigationProgressInner() {
  const pathname     = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    NProgress.done()
  }, [pathname, searchParams])

  return null
}

export function NavigationProgress() {
  return (
    <Suspense fallback={null}>
      <NavigationProgressInner />
    </Suspense>
  )
}
