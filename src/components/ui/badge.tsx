"use client"

import { cn } from "@/lib/utils"

interface BadgeProps {
  children: React.ReactNode
  variant?: "default" | "success" | "destructive" | "warning" | "outline"
  className?: string
}

export function Badge({ children, variant = "default", className }: BadgeProps) {
  const variants = {
    default: "bg-indigo-100 text-indigo-700",
    success: "bg-emerald-100 text-emerald-700",
    destructive: "bg-red-100 text-red-700",
    warning: "bg-amber-100 text-amber-700",
    outline: "bg-gray-100 text-gray-700",
  }

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  )
}
