"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, type, ...props }, ref) => {
  return (
    <input
      type={type}
      className={cn(
        "flex h-11 w-full rounded-xl border border-[#E5E7EB] bg-white px-3.5 py-2 text-sm text-[#111111] transition-all duration-150 placeholder:text-[#9CA3AF] focus:outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/10 disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      ref={ref}
      {...props}
    />
  )
})
Input.displayName = "Input"

export { Input }
