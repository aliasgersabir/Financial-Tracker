"use client"

import * as React from "react"

const Button = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: "default" | "outline" | "ghost" | "destructive" | "success"
    size?: "default" | "sm" | "lg" | "icon"
  }
>(({ variant = "default", size = "default", style, disabled, ...props }, ref) => {
  const variants: Record<string, React.CSSProperties> = {
    default: { background: "#2563EB", color: "white", border: "none" },
    outline: { background: "white", border: "1px solid #E5E7EB", color: "#111111" },
    ghost: { background: "transparent", color: "#6B7280", border: "none" },
    destructive: { background: "#DC2626", color: "white", border: "none" },
    success: { background: "#16A34A", color: "white", border: "none" },
  }

  const sizes: Record<string, React.CSSProperties> = {
    default: { height: "40px", padding: "0 20px", fontSize: "14px" },
    sm: { height: "32px", padding: "0 12px", fontSize: "13px" },
    lg: { height: "48px", padding: "0 24px", fontSize: "15px" },
    icon: { height: "40px", width: "40px", padding: "0", fontSize: "14px" },
  }

  const baseStyle: React.CSSProperties = {
    borderRadius: "9999px",
    fontWeight: 500,
    cursor: disabled ? "not-allowed" : "pointer",
    transition: "all 0.15s",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    opacity: disabled ? 0.5 : 1,
    pointerEvents: disabled ? "none" : "auto",
    boxSizing: "border-box",
    ...variants[variant],
    ...sizes[size],
    ...style,
  }

  return (
    <button
      style={baseStyle}
      ref={ref}
      disabled={disabled}
      {...props}
    />
  )
})
Button.displayName = "Button"

export { Button }
