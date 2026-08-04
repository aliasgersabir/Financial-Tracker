"use client"

import { useSession } from "next-auth/react"
import { useEffect, useState } from "react"
import { Plus, Download, ChevronDown, ChevronUp } from "lucide-react"
import { formatCurrency } from "@/lib/utils"

interface ReportData {
  totalIncome: number
  totalExpenses: number
  savings: number
  savingsRate: number
  topCategory: { name: string; color: string; amount: number; icon: string; percentage: number } | null
  largestExpense: { description: string; amount: number; date: string; category: string } | null
  categoryBreakdown: { name: string; color: string; amount: number; icon: string; percentage: number }[]
  dailyTrend: { date: string; income: number; expenses: number }[]
  transactionCount: number
}

interface Report {
  id: string
  title: string
  period: string
  startDate: string
  endDate: string
  data: string
  createdAt: string
  parsedData?: ReportData
}

export default function ReportsPage() {
  const { status } = useSession()
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [period, setPeriod] = useState("monthly")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [showForm, setShowForm] = useState(false)
  const [hoveredCard, setHoveredCard] = useState<string | null>(null)
  const [genBtnHovered, setGenBtnHovered] = useState(false)
  const [hoveredPeriod, setHoveredPeriod] = useState<string | null>(null)
  const [createBtnHovered, setCreateBtnHovered] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640)
    check()
    window.addEventListener("resize", check)
    return () => window.removeEventListener("resize", check)
  }, [])

  useEffect(() => {
    if (status === "loading") return
    if (status === "unauthenticated") window.location.href = "/login"
  }, [status])

  useEffect(() => {
    if (status === "authenticated") fetchReports()
  }, [status])

  const fetchReports = async () => {
    try {
      const res = await fetch("/api/reports")
      const data = await res.json()
      setReports(data.map((r: Report) => {
        try { return { ...r, parsedData: JSON.parse(r.data) } }
        catch { return { ...r, parsedData: null } }
      }))
    } catch {
      // API error — leave reports as []
    } finally {
      setLoading(false)
    }
  }

  const handleGenerate = async () => {
    let effectiveStart = startDate
    let effectiveEnd = endDate
    if (period !== "custom") {
      const today = new Date()
      const y = today.getFullYear()
      const m = today.getMonth()
      if (period === "monthly") {
        effectiveStart = new Date(y, m, 1).toISOString().slice(0, 10)
      } else if (period === "quarterly") {
        const qStart = Math.floor(m / 3) * 3
        effectiveStart = new Date(y, qStart, 1).toISOString().slice(0, 10)
      } else if (period === "yearly") {
        effectiveStart = new Date(y, 0, 1).toISOString().slice(0, 10)
      }
      effectiveEnd = today.toISOString().slice(0, 10)
    }
    if (!effectiveStart || !effectiveEnd) return
    setGenerating(true)
    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ period, startDate: effectiveStart, endDate: effectiveEnd }),
      })
      const report = await res.json()
      const parsed = report.parsedData || (() => { try { return JSON.parse(report.data) } catch { return null } })()
      setReports((prev) => [{ ...report, parsedData: parsed }, ...prev])
      setShowForm(false)
    } catch {
      // API or parse error — silently ignore
    } finally {
      setGenerating(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this report?")) return
    await fetch(`/api/reports/${id}`, { method: "DELETE" })
    setReports((prev) => prev.filter((r) => r.id !== id))
    if (expandedId === id) setExpandedId(null)
  }

  const exportCSV = (report: Report) => {
    let data
    try {
      data = report.parsedData || JSON.parse(report.data)
    } catch { return }
    if (!data) return
    let csv = "Category,Amount,Percentage\n"
    for (const c of data.categoryBreakdown) {
      csv += `"${c.name}",${c.amount},${c.percentage}%\n`
    }
    csv += "\nDate,Income,Expenses\n"
    for (const d of data.dailyTrend) {
      csv += `${d.date},${d.income},${d.expenses}\n`
    }

    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${report.title.replace(/[^a-zA-Z0-9]/g, "_")}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const periods = ["monthly", "quarterly", "yearly", "custom"]

  if (status === "loading" || loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "256px" }}>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <div style={{ width: "24px", height: "24px", animation: "spin 1s linear infinite", borderRadius: "9999px", border: "2px solid #E5E7EB", borderTopColor: "#2563EB" }} />
      </div>
    )
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: isMobile ? "12px" : "24px" }}>
      <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", alignItems: isMobile ? "stretch" : "center", justifyContent: "space-between", gap: isMobile ? "12px" : "0" }}>
        <div>
          <h1 style={{ fontSize: isMobile ? "22px" : "28px", fontWeight: 700, color: "#111111", letterSpacing: "-0.025em" }}>Reports</h1>
          <p style={{ fontSize: "15px", color: "#6B7280", marginTop: "2px" }}>Analyze your finances</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          onMouseEnter={() => setCreateBtnHovered(true)}
          onMouseLeave={() => setCreateBtnHovered(false)}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            borderRadius: "9999px",
            background: createBtnHovered ? "#1D4ED8" : "#2563EB",
            padding: "10px 20px",
            fontSize: "14px",
            fontWeight: 500,
            color: "white",
            transition: "all 150ms ease",
            cursor: "pointer",
          }}
        >
          <Plus style={{ width: "16px", height: "16px" }} />
          Generate Report
        </button>
      </div>

      {showForm && (
        <div style={{ background: "white", borderRadius: "20px", border: "1px solid #E5E7EB", padding: isMobile ? "16px" : "24px", display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={{ display: "flex", gap: "6px", background: "#F3F4F6", borderRadius: "9999px", padding: "4px", width: "fit-content" }}>
            {periods.map((p) => {
              const isActive = period === p
              const isHovered = hoveredPeriod === p
              return (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  onMouseEnter={() => setHoveredPeriod(p)}
                  onMouseLeave={() => setHoveredPeriod(null)}
                  style={{
                    borderRadius: "9999px",
                    padding: "6px 16px",
                    fontSize: "13px",
                    fontWeight: 500,
                    transition: "all 150ms ease",
                    cursor: "pointer",
                    background: isActive ? "#111111" : "transparent",
                    color: isActive ? "white" : isHovered ? "#111111" : "#6B7280",
                  }}
                >
                  {p.charAt(0).toUpperCase() + p.slice(1)}
                </button>
              )
            })}
          </div>

          {period === "custom" && (
            <div style={{ display: "flex", gap: "12px" }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "#111111", marginBottom: "6px" }}>Start Date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  style={{
                    height: "44px",
                    width: "100%",
                    borderRadius: "12px",
                    border: "1px solid #E5E7EB",
                    background: "white",
                    padding: "0 14px",
                    fontSize: "14px",
                    color: "#111111",
                    outline: "none",
                  }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "#111111", marginBottom: "6px" }}>End Date</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  style={{
                    height: "44px",
                    width: "100%",
                    borderRadius: "12px",
                    border: "1px solid #E5E7EB",
                    background: "white",
                    padding: "0 14px",
                    fontSize: "14px",
                    color: "#111111",
                    outline: "none",
                  }}
                />
              </div>
            </div>
          )}

          <button
            onClick={handleGenerate}
            disabled={generating || (period === "custom" && (!startDate || !endDate))}
            onMouseEnter={() => setGenBtnHovered(true)}
            onMouseLeave={() => setGenBtnHovered(false)}
            style={{
              alignSelf: "flex-end",
              borderRadius: "9999px",
              background: genBtnHovered ? "#1D4ED8" : "#2563EB",
              padding: "10px 24px",
              fontSize: "14px",
              fontWeight: 500,
              color: "white",
              transition: "all 150ms ease",
              cursor: "pointer",
              opacity: generating ? 0.6 : 1,
            }}
          >
            {generating ? "Generating..." : "Generate"}
          </button>
        </div>
      )}

      {reports.length > 0 ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {reports.map((report) => {
            const data = (() => { try { return report.parsedData || JSON.parse(report.data) } catch { return null } })()
            if (!data) return null
            const isExpanded = expandedId === report.id
            const isHovered = hoveredCard === report.id
            const maxDaily = Math.max(...(data.dailyTrend || []).map((d: { expenses: number }) => d.expenses), 1)

            return (
              <div
                key={report.id}
                style={{
                  background: "white",
                  borderRadius: "20px",
                  border: "1px solid #E5E7EB",
                  overflow: "hidden",
                  boxShadow: isHovered ? "0 2px 8px rgba(0,0,0,0.06)" : "0 1px 3px rgba(0,0,0,0.04)",
                  transition: "all 200ms ease",
                }}
              >
                <div
                  onClick={() => setExpandedId(isExpanded ? null : report.id)}
                  onMouseEnter={() => setHoveredCard(report.id)}
                  onMouseLeave={() => setHoveredCard(null)}
                  style={{ display: "flex", alignItems: "center", justifyContent: "space-between",           padding: isMobile ? "16px" : "20px 24px", cursor: "pointer" }}
                >
                  <div>
                    <p style={{ fontSize: "15px", fontWeight: 600, color: "#111111", margin: 0 }}>{report.title}</p>
                    <p style={{ fontSize: "13px", color: "#6B7280", margin: "2px 0 0", textTransform: "capitalize" }}>
                      {report.period} · Generated {new Date(report.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <button
                      onClick={(e) => { e.stopPropagation(); exportCSV(report) }}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                        borderRadius: "9999px",
                        padding: "6px 12px",
                        fontSize: "12px",
                        fontWeight: 500,
                        background: "#F3F4F6",
                        color: "#6B7280",
                        border: "none",
                        cursor: "pointer",
                        transition: "all 150ms ease",
                      }}
                    >
                      <Download style={{ width: "12px", height: "12px" }} />
                      CSV
                    </button>
                    {isExpanded ? <ChevronUp style={{ width: "16px", height: "16px", color: "#6B7280" }} /> : <ChevronDown style={{ width: "16px", height: "16px", color: "#6B7280" }} />}
                  </div>
                </div>

                {isExpanded && (
                  <div style={{ padding: "0 24px 24px", display: "flex", flexDirection: "column", gap: "24px" }}>
                    <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, 1fr)", gap: "12px" }}>
                      {[
                        { label: "Income", value: formatCurrency(data.totalIncome), color: "#16A34A" },
                        { label: "Expenses", value: formatCurrency(data.totalExpenses), color: "#DC2626" },
                        { label: "Savings", value: formatCurrency(data.savings), color: data.savings >= 0 ? "#2563EB" : "#DC2626" },
                        { label: "Savings Rate", value: `${data.savingsRate}%`, color: "#8B5CF6" },
                      ].map((s) => (
                        <div key={s.label} style={{ background: "#F8F8F6", borderRadius: "16px", padding: "16px" }}>
                          <p style={{ fontSize: "12px", color: "#6B7280", margin: 0, fontWeight: 500 }}>{s.label}</p>
                          <p style={{ fontSize: "20px", fontWeight: 700, color: s.color, margin: "4px 0 0" }}>{s.value}</p>
                        </div>
                      ))}
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: "12px" }}>
                      {data.topCategory && (
                        <div style={{ background: "#F8F8F6", borderRadius: "16px", padding: "16px" }}>
                          <p style={{ fontSize: "12px", color: "#6B7280", margin: 0, fontWeight: 500 }}>Top Category</p>
                          <p style={{ fontSize: "15px", fontWeight: 600, color: "#111111", margin: "4px 0 0" }}>
                            {data.topCategory.icon} {data.topCategory.name}
                          </p>
                          <p style={{ fontSize: "13px", color: "#6B7280", margin: "2px 0 0" }}>{formatCurrency(data.topCategory.amount)} ({data.topCategory.percentage}%)</p>
                        </div>
                      )}
                      {data.largestExpense && (
                        <div style={{ background: "#F8F8F6", borderRadius: "16px", padding: "16px" }}>
                          <p style={{ fontSize: "12px", color: "#6B7280", margin: 0, fontWeight: 500 }}>Largest Expense</p>
                          <p style={{ fontSize: "15px", fontWeight: 600, color: "#111111", margin: "4px 0 0" }}>{data.largestExpense.description}</p>
                          <p style={{ fontSize: "13px", color: "#6B7280", margin: "2px 0 0" }}>
                            {formatCurrency(data.largestExpense.amount)} · {data.largestExpense.category}
                          </p>
                        </div>
                      )}
                    </div>

                    {data.categoryBreakdown.length > 0 && (
                      <div>
                        <p style={{ fontSize: "13px", fontWeight: 500, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "12px" }}>Category Breakdown</p>
                        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                          {data.categoryBreakdown.map((cat: { name: string; color: string; amount: number; percentage: number; icon: string }) => (
                            <div key={cat.name} style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                              <span style={{ fontSize: "14px", width: "20px", textAlign: "center" }}>{cat.icon}</span>
                              <div style={{ flex: 1 }}>
                                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                                  <span style={{ fontSize: "13px", fontWeight: 500, color: "#111111" }}>{cat.name}</span>
                                  <span style={{ fontSize: "13px", color: "#6B7280" }}>{formatCurrency(cat.amount)} ({cat.percentage}%)</span>
                                </div>
                                <div style={{ height: "6px", borderRadius: "9999px", background: "#F3F4F6", overflow: "hidden" }}>
                                  <div style={{ height: "100%", width: `${cat.percentage}%`, background: cat.color, borderRadius: "9999px", transition: "width 300ms ease" }} />
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {data.dailyTrend.length > 0 && (
                      <div>
                        <p style={{ fontSize: "13px", fontWeight: 500, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "12px" }}>Daily Trend</p>
                        <div style={{ display: "flex", alignItems: "flex-end", gap: "2px", height: "64px" }}>
                          {data.dailyTrend.map((d: { date: string; expenses: number }) => (
                            <div
                              key={d.date}
                              title={`${d.date}: ${formatCurrency(d.expenses)}`}
                              style={{
                                flex: 1,
                                background: "#2563EB",
                                borderRadius: "3px 3px 0 0",
                                height: `${(d.expenses / maxDaily) * 100}%`,
                                minHeight: d.expenses > 0 ? "4px" : "0px",
                                transition: "height 300ms ease",
                              }}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "80px 0" }}>
          <div style={{ width: "64px", height: "64px", borderRadius: "9999px", background: "#F3F4F6", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "16px" }}>
            <span style={{ fontSize: "24px" }}>📊</span>
          </div>
          <p style={{ fontSize: "16px", fontWeight: 500, color: "#111111", marginBottom: "4px" }}>No reports yet</p>
          <p style={{ fontSize: "14px", color: "#9CA3AF", marginBottom: "24px" }}>Generate your first financial report</p>
          <button
            onClick={() => setShowForm(true)}
            onMouseEnter={() => setGenBtnHovered(true)}
            onMouseLeave={() => setGenBtnHovered(false)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              borderRadius: "9999px",
              background: genBtnHovered ? "#1D4ED8" : "#2563EB",
              padding: "10px 20px",
              fontSize: "14px",
              fontWeight: 500,
              color: "white",
              transition: "all 150ms ease",
              cursor: "pointer",
            }}
          >
            <Plus style={{ width: "16px", height: "16px" }} />
            Generate Report
          </button>
        </div>
      )}
    </div>
  )
}
