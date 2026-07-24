"use client"

import { useSession } from "next-auth/react"
import { useEffect, useState } from "react"
import { Brain, Lightbulb, AlertTriangle, CheckCircle, X } from "lucide-react"

interface Insight {
  id: string
  title: string
  explanation: string
  action: string
  confidence: number
  priority: string
  read: boolean
  dismissed: boolean
  createdAt: string
}

const formatCurrency = (n: number) =>
  `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

export default function InsightsPage() {
  const { status } = useSession()
  const [insights, setInsights] = useState<Insight[]>([])
  const [loading, setLoading] = useState(true)
  const [hoveredCard, setHoveredCard] = useState<string | null>(null)
  const [hoverBtn, setHoverBtn] = useState<string | null>(null)

  useEffect(() => {
    if (status === "loading") return
    if (status === "unauthenticated") window.location.href = "/login"
  }, [status])

  useEffect(() => {
    if (status === "authenticated") fetchInsights()
  }, [status])

  const fetchInsights = async () => {
    try {
      const res = await fetch("/api/insights")
      const data = await res.json()
      setInsights(data.filter((i: Insight) => !i.dismissed))
    } catch {
      console.error("Failed to fetch insights")
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (id: string) => {
    await fetch(`/api/insights/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ read: true }),
    })
    setInsights((prev) =>
      prev.map((i) => (i.id === id ? { ...i, read: true } : i))
    )
  }

  const dismissInsight = async (id: string) => {
    await fetch(`/api/insights/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dismissed: true }),
    })
    setInsights((prev) => prev.filter((i) => i.id !== id))
  }

  const getPriorityConfig = (priority: string) => {
    switch (priority) {
      case "high":
        return { bg: "#FEF2F2", color: "#DC2626", label: "High" }
      case "medium":
        return { bg: "#FFFBEB", color: "#D97706", label: "Medium" }
      default:
        return { bg: "#F3F4F6", color: "#6B7280", label: "Low" }
    }
  }

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case "high":
        return <AlertTriangle style={{ width: "14px", height: "14px" }} />
      case "medium":
        return <Lightbulb style={{ width: "14px", height: "14px" }} />
      default:
        return <CheckCircle style={{ width: "14px", height: "14px" }} />
    }
  }

  if (status === "loading" || loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "256px" }}>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <div style={{ width: "24px", height: "24px", animation: "spin 1s linear infinite", borderRadius: "9999px", border: "2px solid #E5E7EB", borderTopColor: "#2563EB" }} />
      </div>
    )
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <div>
        <h1 style={{ fontSize: "28px", fontWeight: 700, color: "#111111", letterSpacing: "-0.025em" }}>AI Insights</h1>
        <p style={{ fontSize: "15px", color: "#6B7280", marginTop: "2px" }}>Personalized financial analysis</p>
      </div>

      {insights.length > 0 ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "16px" }}>
          {insights.map((insight) => {
            const pConfig = getPriorityConfig(insight.priority)
            const isHovered = hoveredCard === insight.id
            return (
              <div
                key={insight.id}
                onMouseEnter={() => setHoveredCard(insight.id)}
                onMouseLeave={() => setHoveredCard(null)}
                style={{
                  background: "white",
                  borderRadius: "20px",
                  padding: "24px",
                  boxShadow: isHovered ? "0 2px 8px rgba(0,0,0,0.06)" : "0 1px 3px rgba(0,0,0,0.04)",
                  border: insight.read ? "1px solid #F3F4F6" : "1px solid #DBEAFE",
                  transition: "all 200ms ease",
                  display: "flex",
                  flexDirection: "column",
                  gap: "16px",
                }}
              >
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <div style={{
                      display: "flex", width: "40px", height: "40px", alignItems: "center", justifyContent: "center",
                      borderRadius: "10px", background: insight.read ? "#F3F4F6" : "#EFF6FF",
                    }}>
                      <Brain style={{ width: "20px", height: "20px", color: insight.read ? "#9CA3AF" : "#2563EB" }} />
                    </div>
                    <div>
                      <p style={{ fontSize: "15px", fontWeight: 600, color: "#111111", margin: 0 }}>{insight.title}</p>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "4px" }}>
                        <span style={{
                          display: "inline-flex", alignItems: "center", gap: "4px",
                          fontSize: "11px", fontWeight: 500, padding: "2px 8px",
                          borderRadius: "9999px", background: pConfig.bg, color: pConfig.color,
                        }}>
                          {getPriorityIcon(insight.priority)}
                          {pConfig.label}
                        </span>
                        <span style={{
                          display: "inline-block", fontSize: "11px", fontWeight: 500,
                          padding: "2px 8px", borderRadius: "9999px",
                          background: "#F0FDF4", color: "#16A34A",
                        }}>
                          {insight.confidence}% confidence
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <p style={{ fontSize: "14px", color: "#6B7280", lineHeight: "1.6", margin: 0 }}>
                  {insight.explanation}
                </p>

                {insight.action && (
                  <div style={{
                    background: "#EFF6FF", borderRadius: "12px", padding: "12px 16px",
                    border: "1px solid #DBEAFE",
                  }}>
                    <p style={{ fontSize: "12px", fontWeight: 500, color: "#2563EB", margin: "0 0 4px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                      Suggested Action
                    </p>
                    <p style={{ fontSize: "13px", color: "#1E40AF", margin: 0, lineHeight: "1.5" }}>
                      {insight.action}
                    </p>
                  </div>
                )}

                <div style={{ display: "flex", gap: "8px", marginTop: "auto" }}>
                  {!insight.read && (
                    <button
                      onClick={() => markAsRead(insight.id)}
                      onMouseEnter={() => setHoverBtn(`read-${insight.id}`)}
                      onMouseLeave={() => setHoverBtn(null)}
                      style={{
                        flex: 1, padding: "8px 12px", borderRadius: "9999px", fontSize: "13px", fontWeight: 500,
                        background: hoverBtn === `read-${insight.id}` ? "#1D4ED8" : "#2563EB",
                        color: "white", border: "none", cursor: "pointer", transition: "all 150ms ease",
                      }}
                    >
                      Mark as read
                    </button>
                  )}
                  <button
                    onClick={() => dismissInsight(insight.id)}
                    onMouseEnter={() => setHoverBtn(`dismiss-${insight.id}`)}
                    onMouseLeave={() => setHoverBtn(null)}
                    style={{
                      flex: 1, padding: "8px 12px", borderRadius: "9999px", fontSize: "13px", fontWeight: 500,
                      background: hoverBtn === `dismiss-${insight.id}` ? "#F3F4F6" : "white",
                      color: "#6B7280", border: "1px solid #E5E7EB", cursor: "pointer", transition: "all 150ms ease",
                      display: "flex", alignItems: "center", justifyContent: "center", gap: "6px",
                    }}
                  >
                    <X style={{ width: "14px", height: "14px" }} />
                    Dismiss
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div style={{
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          padding: "80px 0", background: "white", borderRadius: "20px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
        }}>
          <div style={{
            width: "64px", height: "64px", borderRadius: "9999px", background: "#F3F4F6",
            display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "16px",
          }}>
            <Brain style={{ width: "24px", height: "24px", color: "#9CA3AF" }} />
          </div>
          <p style={{ fontSize: "16px", fontWeight: 500, color: "#111111", marginBottom: "4px" }}>No insights yet</p>
          <p style={{ fontSize: "14px", color: "#9CA3AF" }}>AI-powered insights will appear here as you add more data</p>
        </div>
      )}
    </div>
  )
}
