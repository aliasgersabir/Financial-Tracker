"use client"

import * as React from "react"

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ style, disabled, ...props }, ref) => {
    return (
      <textarea
        style={{
          minHeight: "80px",
          border: "1px solid #E5E7EB",
          borderRadius: "12px",
          padding: "12px 14px",
          fontSize: "14px",
          outline: "none",
          width: "100%",
          background: "white",
          color: "#111111",
          boxSizing: "border-box",
          transition: "all 0.15s",
          resize: "none",
          opacity: disabled ? 0.5 : 1,
          cursor: disabled ? "not-allowed" : "text",
          ...style,
        }}
        ref={ref}
        disabled={disabled}
        {...props}
      />
    )
  }
)
Textarea.displayName = "Textarea"

export { Textarea }
