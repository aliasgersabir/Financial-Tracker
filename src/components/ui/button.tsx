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
    default: "bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-200",
    outline: "border-2 border-gray-200 bg-white hover:bg-gray-50 text-gray-700",
    ghost: "hover:bg-gray-100 text-gray-600",
    destructive: "bg-red-500 text-white hover:bg-red-600 shadow-lg shadow-red-200",
    success: "bg-emerald-500 text-white hover:bg-emerald-600 shadow-lg shadow-emerald-200",
  }
  const sizes = {
    default: "h-10 px-4 py-2 rounded-xl",
    sm: "h-8 px-3 rounded-lg text-sm",
    lg: "h-12 px-6 rounded-xl text-lg",
    icon: "h-10 w-10 rounded-xl",
  }
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:pointer-events-none disabled:opacity-50 cursor-pointer",
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
