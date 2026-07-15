"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

const Button = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: "default" | "outline" | "ghost" | "destructive" | "success"
    size?: "default" | "sm" | "lg" | "icon"
  }
>(({ className, variant = "default", size = "default", ...props }, ref) => {
  const variants = {
    default: "bg-[#2563EB] text-white hover:bg-[#1D4ED8] shadow-sm",
    outline: "bg-white border border-[#E5E7EB] text-[#111111] hover:bg-[#F9FAFB] shadow-sm",
    ghost: "text-[#6B7280] hover:bg-[#F3F4F6] hover:text-[#111111]",
    destructive: "bg-[#DC2626] text-white hover:bg-[#B91C1C] shadow-sm",
    success: "bg-[#16A34A] text-white hover:bg-[#15803D] shadow-sm",
  }
  const sizes = {
    default: "h-10 px-5 py-2 rounded-full text-sm font-medium",
    sm: "h-8 px-3.5 rounded-full text-sm font-medium",
    lg: "h-12 px-8 rounded-full text-base font-medium",
    icon: "h-10 w-10 rounded-full",
  }
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center transition-all duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 cursor-pointer active:scale-[0.98]",
        variants[variant],
        sizes[size],
        className
      )}
      ref={ref}
      {...props}
    />
  )
})
Button.displayName = "Button"

export { Button }
