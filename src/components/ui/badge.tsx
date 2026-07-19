"use client"

interface BadgeProps {
  children: React.ReactNode
  variant?: "default" | "success" | "destructive" | "warning" | "outline"
  style?: React.CSSProperties
}

export function Badge({ children, variant = "default", style }: BadgeProps) {
  const variants: Record<string, React.CSSProperties> = {
    default: { background: "#EFF6FF", color: "#2563EB" },
    success: { background: "#F0FDF4", color: "#16A34A" },
    destructive: { background: "#FEF2F2", color: "#DC2626" },
    warning: { background: "#FFFBEB", color: "#F59E0B" },
    outline: { background: "#F3F4F6", color: "#6B7280" },
  }

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        borderRadius: "9999px",
        padding: "2px 10px",
        fontSize: "12px",
        fontWeight: 500,
        ...variants[variant],
        ...style,
      }}
    >
      {children}
    </span>
  )
}
