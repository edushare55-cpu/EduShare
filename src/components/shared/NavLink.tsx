"use client"
import Link from "next/link"
import NProgress from "nprogress"
import type { ComponentProps } from "react"

type NavLinkProps = ComponentProps<typeof Link>

export function NavLink({ onClick, ...props }: NavLinkProps) {
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    NProgress.start()
    onClick?.(e)
  }
  return <Link {...props} onClick={handleClick} />
}
