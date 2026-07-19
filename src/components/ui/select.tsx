"use client"

import * as React from "react"

export interface SelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  options: { value: string; label: string }[]
  placeholder?: string
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ options, placeholder, style, disabled, ...props }, ref) => {
    const arrowSvg = "data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%239CA3AF%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpath%20d%3D%22m6%209%206%206%206-6%22%2F%3E%3C%2Fsvg%3E"

    return (
      <select
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
          appearance: "none",
          backgroundImage: `url('${arrowSvg}')`,
          backgroundSize: "18px",
          backgroundPosition: "right 12px center",
          backgroundRepeat: "no-repeat",
          paddingRight: "40px",
          cursor: disabled ? "not-allowed" : "pointer",
          opacity: disabled ? 0.5 : 1,
          ...style,
        }}
        ref={ref}
        disabled={disabled}
        {...props}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    )
  }
)
Select.displayName = "Select"

export { Select }
