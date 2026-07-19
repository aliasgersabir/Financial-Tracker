"use client"

import * as React from "react"

const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ type, style, disabled, ...props }, ref) => {
  return (
    <input
      type={type}
      style={{
        height: "44px",
        border: "1px solid #E5E7EB",
        borderRadius: "12px",
        padding: "0 14px",
        fontSize: "14px",
        outline: "none",
        width: "100%",
        background: "white",
        color: "#111111",
        boxSizing: "border-box",
        transition: "all 0.15s",
        opacity: disabled ? 0.5 : 1,
        cursor: disabled ? "not-allowed" : "text",
        ...style,
      }}
      ref={ref}
      disabled={disabled}
      {...props}
    />
  )
})
Input.displayName = "Input"

export { Input }
