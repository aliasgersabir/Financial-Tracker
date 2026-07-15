"use client"

import { cn } from "@/lib/utils"

interface BadgeProps {
  children: React.ReactNode
  variant?: "default" | "success" | "destructive" | "warning" | "outline"
  className?: string
}

export function Badge({ children, variant = "default", className }: BadgeProps) {
  const variants = {
    default: "bg-[#EFF6FF] text-[#2563EB]",
    success: "bg-[#F0FDF4] text-[#16A34A]",
    destructive: "bg-[#FEF2F2] text-[#DC2626]",
    warning: "bg-[#FFFBEB] text-[#F59E0B]",
    outline: "bg-[#F3F4F6] text-[#6B7280]",
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
