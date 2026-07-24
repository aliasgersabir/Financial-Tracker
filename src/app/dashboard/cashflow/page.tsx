"use client"

import { useSession } from "next-auth/react"
import { useEffect, useState } from "react"
import { Clock, ArrowDown, ArrowUp, Plus, Calendar, X } from "lucide-react"
import { formatCurrency, formatDate } from "@/lib/utils"

interface Projection {
  date: string
  type: string
  description: string
  amount: number
  category: string | null
  isRecurring: boolean
  source: string
  runningBalance: number
  id?: string
}

interface CashFlowSummary {
  totalIncome: number
  totalExpenses: number
  netCashFlow: number
  currentBalance: number
  projectedBalance: number
}

const SOURCE_ICONS: Record<string, string> = {
  recurring: "↻",
  subscription: "✦",
  calendar: "◈",
  manual: "●",
}

export default function CashFlowPage() {
  const { status } = useSession()
  const [projections, setProjections] = useState<Projection[]>([])
  const [summary, setSummary] = useState<CashFlowSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState({
    date: new Date().toISOString().split("T")[0],
    type: "expense",
    description: "",
    amount: "",
    category: "",
    isRecurring: false,
  })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (status === "loading") return
    if (status === "unauthenticated") {
      window.location.href = "/login"
    } else {
      fetchData()
    }
  }, [status])

  const fetchData = async () => {
    try {
      const res = await fetch("/api/cash-flow")
      const data = await res.json()
      setProjections(data.projections || [])
      setSummary(data.summary || null)
    } catch {
      console.error("Failed to fetch cash flow data")
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.amount || !form.description) return
    setSubmitting(true)

    try {
      await fetch("/api/cash-flow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          amount: parseFloat(form.amount),
        }),
      })
      setModalOpen(false)
      setForm({
        date: new Date().toISOString().split("T")[0],
        type: "expense",
        description: "",
        amount: "",
        category: "",
        isRecurring: false,
      })
      fetchData()
    } catch {
      console.error("Failed to add projection")
    } finally {
      setSubmitting(false)
    }
  }

  if (status === "loading" || loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "256px" }}>
        <div
          style={{
            height: "24px",
            width: "24px",
            animation: "spin 1s linear infinite",
            borderRadius: "9999px",
            border: "2px solid #E5E7EB",
            borderTopColor: "#2563EB",
          }}
        />
      </div>
    )
  }

  const summaryCards = summary
    ? [
        {
          label: "Total Income",
          value: summary.totalIncome,
          icon: ArrowDown,
          color: "#16A34A",
          bg: "#F0FDF4",
        },
        {
          label: "Total Expenses",
          value: summary.totalExpenses,
          icon: ArrowUp,
          color: "#DC2626",
          bg: "#FEF2F2",
        },
        {
          label: "Net Cash Flow",
          value: summary.netCashFlow,
          icon: Clock,
          color: summary.netCashFlow >= 0 ? "#16A34A" : "#DC2626",
          bg: summary.netCashFlow >= 0 ? "#F0FDF4" : "#FEF2F2",
        },
      ]
    : []

  return (
    <>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        input::placeholder { color: #9CA3AF; }
        input:focus { border-color: #2563EB !important; box-shadow: 0 0 0 2px rgba(37,99,235,0.1); outline: none; }
        select:focus { border-color: #2563EB !important; box-shadow: 0 0 0 2px rgba(37,99,235,0.1); outline: none; }
      `}</style>
      <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <h1 style={{ fontSize: "28px", fontWeight: 700, color: "#111111", letterSpacing: "-0.025em", margin: 0 }}>
              Cash Flow Timeline
            </h1>
            <p style={{ fontSize: "15px", color: "#6B7280", marginTop: "2px" }}>
              Your upcoming financial obligations
            </p>
          </div>
          <button
            onClick={() => setModalOpen(true)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              borderRadius: "9999px",
              background: "#2563EB",
              padding: "10px 20px",
              fontSize: "14px",
              fontWeight: 500,
              color: "white",
              transition: "all 0.15s",
              boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
              cursor: "pointer",
              border: "none",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#1D4ED8"
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "#2563EB"
            }}
          >
            <Plus style={{ height: "16px", width: "16px" }} />
            Add Projection
          </button>
        </div>

        {summaryCards.length > 0 && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px" }}>
            {summaryCards.map((card) => (
              <div
                key={card.label}
                style={{
                  borderRadius: "20px",
                  background: "white",
                  padding: "20px",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <div>
                  <p style={{ fontSize: "13px", fontWeight: 500, color: "#6B7280", margin: 0 }}>{card.label}</p>
                  <p style={{ fontSize: "24px", fontWeight: 600, color: card.color, margin: "4px 0 0 0", letterSpacing: "-0.025em" }}>
                    {formatCurrency(card.value)}
                  </p>
                </div>
                <div
                  style={{
                    height: "44px",
                    width: "44px",
                    borderRadius: "12px",
                    background: card.bg,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <card.icon style={{ height: "20px", width: "20px", color: card.color }} />
                </div>
              </div>
            ))}
          </div>
        )}

        {summary && (
          <div
            style={{
              borderRadius: "16px",
              padding: "16px 20px",
              background: summary.projectedBalance >= summary.currentBalance ? "#F0FDF4" : "#FEF2F2",
              border: `1px solid ${summary.projectedBalance >= summary.currentBalance ? "#BBF7D0" : "#FECACA"}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <Calendar style={{ height: "16px", width: "16px", color: summary.projectedBalance >= summary.currentBalance ? "#16A34A" : "#DC2626" }} />
              <span style={{ fontSize: "14px", color: "#374151" }}>
                Projected balance in 30 days: <strong>{formatCurrency(summary.projectedBalance)}</strong>
              </span>
            </div>
            <span style={{ fontSize: "13px", color: "#6B7280" }}>
              Current: {formatCurrency(summary.currentBalance)}
            </span>
          </div>
        )}

        {projections.length > 0 ? (
          <div style={{ position: "relative", paddingLeft: "24px" }}>
            <div
              style={{
                position: "absolute",
                left: "11px",
                top: "0",
                bottom: "0",
                width: "2px",
                background: "#F3F4F6",
              }}
            />
            <div style={{ display: "flex", flexDirection: "column", gap: "0" }}>
              {projections.map((p, i) => {
                const isIncome = p.type === "income"
                return (
                  <div
                    key={`${p.source}-${p.date}-${i}`}
                    style={{
                      position: "relative",
                      padding: "20px 0 20px 24px",
                      animation: "fadeIn 0.3s ease",
                    }}
                  >
                    <div
                      style={{
                        position: "absolute",
                        left: "-13px",
                        top: "24px",
                        height: "12px",
                        width: "12px",
                        borderRadius: "9999px",
                        background: isIncome ? "#16A34A" : "#DC2626",
                        border: "2px solid white",
                        boxShadow: "0 0 0 2px " + (isIncome ? "#16A34A" : "#DC2626"),
                      }}
                    />
                    <div
                      style={{
                        borderRadius: "16px",
                        background: "white",
                        boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                        padding: "16px 20px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        transition: "box-shadow 0.2s",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.06)"
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.04)"
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "16px", minWidth: 0, flex: 1 }}>
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", minWidth: "60px" }}>
                          <span style={{ fontSize: "11px", fontWeight: 600, color: "#9CA3AF", textTransform: "uppercase" as const, letterSpacing: "0.05em" }}>
                            {new Date(p.date).toLocaleDateString("en-US", { month: "short" })}
                          </span>
                          <span style={{ fontSize: "20px", fontWeight: 700, color: "#111111", lineHeight: 1.2 }}>
                            {new Date(p.date).getDate()}
                          </span>
                        </div>
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <p style={{ fontSize: "14px", fontWeight: 500, color: "#111111", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>
                              {p.description}
                            </p>
                            <span
                              style={{
                                fontSize: "11px",
                                fontWeight: 500,
                                color: "#6B7280",
                                background: "#F3F4F6",
                                padding: "2px 8px",
                                borderRadius: "9999px",
                                whiteSpace: "nowrap" as const,
                                flexShrink: 0,
                              }}
                            >
                              {SOURCE_ICONS[p.source] || "●"} {p.source}
                            </span>
                          </div>
                          {p.category && (
                            <p style={{ fontSize: "12px", color: "#9CA3AF", margin: "2px 0 0 0" }}>
                              {p.category}
                            </p>
                          )}
                        </div>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "2px", flexShrink: 0, marginLeft: "16px" }}>
                        <span
                          style={{
                            fontSize: "16px",
                            fontWeight: 600,
                            color: isIncome ? "#16A34A" : "#DC2626",
                          }}
                        >
                          {isIncome ? "+" : "-"}{formatCurrency(p.amount)}
                        </span>
                        <span style={{ fontSize: "12px", color: "#9CA3AF" }}>
                          Balance: {formatCurrency(p.runningBalance)}
                        </span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ) : (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: "80px 0",
            }}
          >
            <div
              style={{
                height: "64px",
                width: "64px",
                borderRadius: "9999px",
                background: "#F3F4F6",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: "16px",
              }}
            >
              <Clock style={{ height: "24px", width: "24px", color: "#D1D5DB" }} />
            </div>
            <p style={{ fontSize: "16px", fontWeight: 500, color: "#111111", margin: 0 }}>
              No upcoming cash flow
            </p>
            <p style={{ fontSize: "14px", color: "#9CA3AF", marginTop: "4px" }}>
              Add a projection or set up recurring transactions to see your timeline
            </p>
          </div>
        )}

        {modalOpen && (
          <>
            <div
              onClick={() => setModalOpen(false)}
              style={{
                position: "fixed",
                inset: 0,
                background: "rgba(0,0,0,0.4)",
                backdropFilter: "blur(4px)",
                zIndex: 50,
              }}
            />
            <div
              style={{
                position: "fixed",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                background: "white",
                borderRadius: "24px",
                boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)",
                width: "480px",
                maxWidth: "90vw",
                maxHeight: "90vh",
                overflowY: "auto",
                zIndex: 51,
                animation: "fadeIn 0.2s ease",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "24px 24px 0 24px" }}>
                <h2 style={{ fontSize: "18px", fontWeight: 600, color: "#111111", margin: 0 }}>Add Projection</h2>
                <button
                  onClick={() => setModalOpen(false)}
                  style={{
                    height: "32px",
                    width: "32px",
                    borderRadius: "9999px",
                    border: "none",
                    background: "#F3F4F6",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    transition: "background 0.15s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "#E5E7EB"
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "#F3F4F6"
                  }}
                >
                  <X style={{ height: "16px", width: "16px", color: "#6B7280" }} />
                </button>
              </div>
              <form onSubmit={handleSubmit} style={{ padding: "20px 24px 24px 24px", display: "flex", flexDirection: "column", gap: "16px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "#111111", marginBottom: "6px" }}>Type</label>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                    {["income", "expense"].map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setForm({ ...form, type: t })}
                        style={{
                          borderRadius: "12px",
                          border: `1px solid ${form.type === t ? (t === "income" ? "#16A34A" : "#DC2626") : "#E5E7EB"}`,
                          background: form.type === t ? (t === "income" ? "#F0FDF4" : "#FEF2F2") : "white",
                          padding: "10px",
                          fontSize: "13px",
                          fontWeight: 500,
                          color: form.type === t ? (t === "income" ? "#16A34A" : "#DC2626") : "#6B7280",
                          transition: "all 0.15s",
                          cursor: "pointer",
                        }}
                      >
                        {t === "income" ? "↓ " : "↑ "}{t.charAt(0).toUpperCase() + t.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "#111111", marginBottom: "6px" }}>Amount</label>
                  <input
                    type="number"
                    step="0.01"
                    value={form.amount}
                    onChange={(e) => setForm({ ...form, amount: e.target.value })}
                    placeholder="0.00"
                    required
                    style={{
                      height: "44px",
                      width: "100%",
                      borderRadius: "12px",
                      border: "1px solid #E5E7EB",
                      background: "white",
                      padding: "0 14px",
                      fontSize: "14px",
                      color: "#111111",
                      transition: "all 0.15s",
                      boxSizing: "border-box" as const,
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "#111111", marginBottom: "6px" }}>Description</label>
                  <input
                    type="text"
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="e.g. Rent payment"
                    required
                    style={{
                      height: "44px",
                      width: "100%",
                      borderRadius: "12px",
                      border: "1px solid #E5E7EB",
                      background: "white",
                      padding: "0 14px",
                      fontSize: "14px",
                      color: "#111111",
                      transition: "all 0.15s",
                      boxSizing: "border-box" as const,
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "#111111", marginBottom: "6px" }}>Date</label>
                  <input
                    type="date"
                    value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                    required
                    style={{
                      height: "44px",
                      width: "100%",
                      borderRadius: "12px",
                      border: "1px solid #E5E7EB",
                      background: "white",
                      padding: "0 14px",
                      fontSize: "14px",
                      color: "#111111",
                      transition: "all 0.15s",
                      boxSizing: "border-box" as const,
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "#111111", marginBottom: "6px" }}>Category (optional)</label>
                  <input
                    type="text"
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    placeholder="e.g. Housing"
                    style={{
                      height: "44px",
                      width: "100%",
                      borderRadius: "12px",
                      border: "1px solid #E5E7EB",
                      background: "white",
                      padding: "0 14px",
                      fontSize: "14px",
                      color: "#111111",
                      transition: "all 0.15s",
                      boxSizing: "border-box" as const,
                    }}
                  />
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <input
                    type="checkbox"
                    id="isRecurring"
                    checked={form.isRecurring}
                    onChange={(e) => setForm({ ...form, isRecurring: e.target.checked })}
                    style={{ width: "16px", height: "16px", accentColor: "#2563EB", cursor: "pointer" }}
                  />
                  <label htmlFor="isRecurring" style={{ fontSize: "13px", color: "#6B7280", cursor: "pointer" }}>
                    This is a recurring projection
                  </label>
                </div>

                <div style={{ display: "flex", gap: "12px", paddingTop: "8px" }}>
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    style={{
                      flex: 1,
                      height: "44px",
                      borderRadius: "9999px",
                      border: "1px solid #E5E7EB",
                      background: "white",
                      fontSize: "14px",
                      fontWeight: 500,
                      color: "#111111",
                      cursor: "pointer",
                      transition: "background 0.15s",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "#F9FAFB"
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "white"
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    style={{
                      flex: 1,
                      height: "44px",
                      borderRadius: "9999px",
                      border: "none",
                      background: submitting ? "#93C5FD" : "#2563EB",
                      color: "white",
                      fontSize: "14px",
                      fontWeight: 500,
                      cursor: submitting ? "not-allowed" : "pointer",
                      transition: "all 0.15s",
                      boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
                    }}
                    onMouseEnter={(e) => {
                      if (!submitting) e.currentTarget.style.background = "#1D4ED8"
                    }}
                    onMouseLeave={(e) => {
                      if (!submitting) e.currentTarget.style.background = "#2563EB"
                    }}
                  >
                    {submitting ? "Adding..." : "Add Projection"}
                  </button>
                </div>
              </form>
            </div>
          </>
        )}
      </div>
    </>
  )
}
