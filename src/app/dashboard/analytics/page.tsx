"use client"

import { useSession } from "next-auth/react"
import { useEffect, useState } from "react"
import { BarChart3, PieChart, TrendingUp, Calendar } from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart as RechartsPie,
  Pie,
  Cell,
  CartesianGrid,
} from "recharts"

interface AnalyticsData {
  dailySpending: { date: string; amount: number }[]
  categoryComparison: { name: string; amount: number; color: string }[]
  incomeVsExpenses: { month: string; income: number; expenses: number }[]
  topMerchants: { name: string; total: number; count: number }[]
  monthlyComparison: { month: string; income: number; expenses: number; savings: number; savingsRate: number }[]
}

const PIE_COLORS = ["#2563EB", "#16A34A", "#F59E0B", "#DC2626", "#8B5CF6", "#EC4899", "#06B6D4", "#F97316"]

export default function AnalyticsPage() {
  const { status } = useSession()
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState("this-month")
  const [hoverRange, setHoverRange] = useState<string | null>(null)
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
    if (status === "authenticated") fetchAnalytics()
  }, [status, dateRange])

  const fetchAnalytics = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/stats")
      const stats = await res.json()

      const categoryData = (stats.categoryData || []).map((c: any, i: number) => ({
        name: c.name,
        amount: c.amount,
        color: PIE_COLORS[i % PIE_COLORS.length],
      }))

      const dailySpending = (stats.dailyTrend || []).map((d: any) => ({
        date: d.date || d.day,
        amount: d.expenses || d.amount || 0,
      }))

      const incomeVsExpenses = (stats.monthlyTrend || []).map((m: any) => ({
        month: m.month,
        income: m.income || 0,
        expenses: m.expenses || 0,
      }))

      const monthlyComparison = (stats.monthlyTrend || []).map((m: any) => {
        const savings = (m.income || 0) - (m.expenses || 0)
        return {
          month: m.month,
          income: m.income || 0,
          expenses: m.expenses || 0,
          savings,
          savingsRate: m.income > 0 ? Math.round((savings / m.income) * 100) : 0,
        }
      })

      setData({
        dailySpending,
        categoryComparison: categoryData,
        incomeVsExpenses,
        topMerchants: stats.topMerchants || [],
        monthlyComparison,
      })
    } catch {
      console.error("Failed to fetch analytics")
    } finally {
      setLoading(false)
    }
  }

  const ranges = [
    { label: "This Month", value: "this-month" },
    { label: "Last 3 Months", value: "last-3-months" },
    { label: "Last 6 Months", value: "last-6-months" },
    { label: "This Year", value: "this-year" },
  ]

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
          <h1 style={{ fontSize: isMobile ? "22px" : "28px", fontWeight: 700, color: "#111111", letterSpacing: "-0.025em" }}>Advanced Analytics</h1>
          <p style={{ fontSize: "15px", color: "#6B7280", marginTop: "2px" }}>Comprehensive financial insights</p>
        </div>
        <div style={{ display: "flex", gap: "6px", background: "#F3F4F6", borderRadius: "9999px", padding: "4px" }}>
          {ranges.map((r) => {
            const isActive = dateRange === r.value
            const isHovered = hoverRange === r.value
            return (
              <button
                key={r.value}
                onClick={() => setDateRange(r.value)}
                onMouseEnter={() => setHoverRange(r.value)}
                onMouseLeave={() => setHoverRange(null)}
                style={{
                  borderRadius: "9999px", padding: "6px 16px",
                  fontSize: "13px", fontWeight: 500, transition: "all 150ms ease",
                  cursor: "pointer", border: "none",
                  background: isActive ? "#111111" : "transparent",
                  color: isActive ? "white" : isHovered ? "#111111" : "#6B7280",
                }}
              >
                {r.label}
              </button>
            )
          })}
        </div>
      </div>

      {data && (
        <>
          <div style={{ borderRadius: "20px", background: "white", padding: isMobile ? "16px" : "24px", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "20px" }}>
              <BarChart3 style={{ width: "18px", height: "18px", color: "#2563EB" }} />
              <h3 style={{ fontSize: "17px", fontWeight: 600, color: "#111111", margin: 0 }}>Daily Spending Trend</h3>
            </div>
            <div style={{ height: "260px" }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.dailySpending.slice(-30)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false} tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v} />
                  <Tooltip
                    contentStyle={{
                      borderRadius: "12px", border: "1px solid #F3F4F6",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.08)", fontSize: "13px", padding: "8px 12px",
                    }}
                    formatter={(value) => formatCurrency(Number(value))}
                  />
                  <Bar dataKey="amount" fill="#2563EB" radius={[4, 4, 0, 0]} name="Spending" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: isMobile ? "12px" : "16px" }}>
            <div style={{ borderRadius: "20px", background: "white", padding: isMobile ? "16px" : "24px", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "20px" }}>
                <PieChart style={{ width: "18px", height: "18px", color: "#16A34A" }} />
                <h3 style={{ fontSize: "17px", fontWeight: 600, color: "#111111", margin: 0 }}>Category Comparison</h3>
              </div>
              {data.categoryComparison.length > 0 ? (
                <>
                  <div style={{ height: "220px" }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsPie>
                        <Pie
                          data={data.categoryComparison}
                          cx="50%"
                          cy="50%"
                          innerRadius={55}
                          outerRadius={85}
                          paddingAngle={3}
                          dataKey="amount"
                          nameKey="name"
                          strokeWidth={0}
                        >
                          {data.categoryComparison.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            borderRadius: "12px", border: "1px solid #F3F4F6",
                            boxShadow: "0 4px 12px rgba(0,0,0,0.08)", fontSize: "13px", padding: "8px 12px",
                          }}
                          formatter={(value) => formatCurrency(Number(value))}
                        />
                      </RechartsPie>
                    </ResponsiveContainer>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "16px" }}>
                    {data.categoryComparison.slice(0, 5).map((cat, i) => (
                      <div key={cat.name} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <div style={{ height: "8px", width: "8px", borderRadius: "9999px", backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                          <span style={{ fontSize: "13px", color: "#6B7280" }}>{cat.name}</span>
                        </div>
                        <span style={{ fontSize: "13px", fontWeight: 500, color: "#111111" }}>{formatCurrency(cat.amount)}</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "280px", color: "#9CA3AF" }}>
                  <p style={{ fontSize: "14px" }}>No category data yet</p>
                </div>
              )}
            </div>

            <div style={{ borderRadius: "20px", background: "white", padding: isMobile ? "16px" : "24px", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "20px" }}>
                <TrendingUp style={{ width: "18px", height: "18px", color: "#F59E0B" }} />
                <h3 style={{ fontSize: "17px", fontWeight: 600, color: "#111111", margin: 0 }}>Income vs Expenses</h3>
              </div>
              <div style={{ height: "260px" }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.incomeVsExpenses} barGap={4}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false} tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v} />
                    <Tooltip
                      contentStyle={{
                        borderRadius: "12px", border: "1px solid #F3F4F6",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.08)", fontSize: "13px", padding: "8px 12px",
                      }}
                      formatter={(value) => formatCurrency(Number(value))}
                    />
                    <Bar dataKey="income" fill="#16A34A" radius={[4, 4, 0, 0]} name="Income" />
                    <Bar dataKey="expenses" fill="#DC2626" radius={[4, 4, 0, 0]} name="Expenses" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "16px", marginTop: "12px", paddingTop: "12px", borderTop: "1px solid #F3F4F6" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <div style={{ height: "8px", width: "8px", borderRadius: "9999px", background: "#16A34A" }} />
                  <span style={{ fontSize: "12px", color: "#6B7280" }}>Income</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <div style={{ height: "8px", width: "8px", borderRadius: "9999px", background: "#DC2626" }} />
                  <span style={{ fontSize: "12px", color: "#6B7280" }}>Expenses</span>
                </div>
              </div>
            </div>
          </div>

          {data.topMerchants.length > 0 && (
            <div style={{ borderRadius: "20px", background: "white", padding: isMobile ? "16px" : "24px", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
              <h3 style={{ fontSize: "17px", fontWeight: 600, color: "#111111", marginBottom: "20px" }}>Top Merchants</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {data.topMerchants.map((merchant, i) => (
                  <div
                    key={merchant.name}
                    style={{
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      padding: "12px 16px", borderRadius: "12px", background: "#F9FAFB",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <div style={{
                        width: "28px", height: "28px", borderRadius: "9999px",
                        background: PIE_COLORS[i % PIE_COLORS.length] + "20",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: "12px", fontWeight: 600, color: PIE_COLORS[i % PIE_COLORS.length],
                      }}>
                        {i + 1}
                      </div>
                      <span style={{ fontSize: "14px", fontWeight: 500, color: "#111111" }}>{merchant.name}</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <span style={{ fontSize: "12px", color: "#9CA3AF" }}>{merchant.count} txns</span>
                      <span style={{ fontSize: "14px", fontWeight: 600, color: "#111111" }}>{formatCurrency(merchant.total)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {data.monthlyComparison.length > 0 && (
            <div style={{ borderRadius: "20px", background: "white", padding: isMobile ? "16px" : "24px", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "20px" }}>
                <Calendar style={{ width: "18px", height: "18px", color: "#8B5CF6" }} />
                <h3 style={{ fontSize: "17px", fontWeight: 600, color: "#111111", margin: 0 }}>Monthly Comparison</h3>
              </div>
              <div style={{ overflowX: "auto" as const }}>
                <table style={{ width: "100%", borderCollapse: "collapse" as const }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid #F3F4F6" }}>
                      {["Month", "Income", "Expenses", "Savings", "Rate"].map((h) => (
                        <th key={h} style={{
                          textAlign: h === "Month" ? "left" : "right",
                          padding: "12px 16px", fontSize: "12px", fontWeight: 500,
                          color: "#9CA3AF", textTransform: "uppercase" as const, letterSpacing: "0.05em",
                        }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.monthlyComparison.map((row) => (
                      <tr key={row.month} style={{ borderBottom: "1px solid #F3F4F6" }}>
                        <td style={{ padding: "12px 16px", fontSize: "14px", fontWeight: 500, color: "#111111" }}>{row.month}</td>
                        <td style={{ padding: "12px 16px", fontSize: "14px", color: "#16A34A", textAlign: "right" }}>{formatCurrency(row.income)}</td>
                        <td style={{ padding: "12px 16px", fontSize: "14px", color: "#DC2626", textAlign: "right" }}>{formatCurrency(row.expenses)}</td>
                        <td style={{ padding: "12px 16px", fontSize: "14px", color: row.savings >= 0 ? "#2563EB" : "#DC2626", textAlign: "right", fontWeight: 500 }}>{formatCurrency(row.savings)}</td>
                        <td style={{ padding: "12px 16px", fontSize: "14px", color: "#6B7280", textAlign: "right" }}>{row.savingsRate}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {!data && !loading && (
        <div style={{
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          padding: "80px 0", background: "white", borderRadius: "20px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
        }}>
          <div style={{
            width: "64px", height: "64px", borderRadius: "9999px", background: "#F3F4F6",
            display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "16px",
          }}>
            <BarChart3 style={{ width: "24px", height: "24px", color: "#9CA3AF" }} />
          </div>
          <p style={{ fontSize: "16px", fontWeight: 500, color: "#111111", marginBottom: "4px" }}>No analytics data</p>
          <p style={{ fontSize: "14px", color: "#9CA3AF" }}>Add transactions to see analytics</p>
        </div>
      )}
    </div>
  )
}
