import { cn } from "@/lib/utils"
import type { ButtonHTMLAttributes } from "react"

interface LoadingButtonProps 
  extends ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading:    boolean
  loadingText?: string
  variant?:     "primary" | "secondary" | "outline" | "danger"
}

const variants = {
  primary: `bg-primary text-on-primary 
             hover:opacity-90 focus:ring-2 focus:ring-primary`,
  secondary: `bg-secondary text-on-secondary 
               hover:opacity-90 focus:ring-2 focus:ring-secondary`,
  outline: `border border-primary text-primary bg-transparent
             hover:bg-surface-container-low 
             focus:ring-2 focus:ring-primary`,
  danger: `bg-error text-on-error 
            hover:opacity-90 focus:ring-2 focus:ring-error`,
}

export function LoadingButton({
  isLoading,
  loadingText,
  variant = "secondary",
  className,
  children,
  disabled,
  ...props
}: LoadingButtonProps) {
  return (
    <button
      {...props}
      disabled={disabled || isLoading}
      className={cn(
        "flex items-center justify-center gap-2",
        "px-md py-sm rounded-lg",
        "font-label-md text-label-md",
        "transition-all duration-200",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        "focus:outline-none focus:ring-offset-2",
        variants[variant],
        className
      )}
    >
      {isLoading ? (
        <>
          <span
            className={cn(
              "w-4 h-4 rounded-full border-2 animate-spin shrink-0",
              variant === "outline"
                ? "border-primary/30 border-t-primary"
                : "border-white/30 border-t-white"
            )}
          />
          {loadingText ?? "Loading..."}
        </>
      ) : (
        children
      )}
    </button>
  )
}
