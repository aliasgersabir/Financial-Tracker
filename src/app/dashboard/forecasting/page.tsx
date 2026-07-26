"use client"

import { useSession } from "next-auth/react"
import { useEffect, useState } from "react"
import { TrendingUp, Calendar, ArrowUpRight } from "lucide-react"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts"

interface ForecastData {
  month: string
  income: number
  expenses: number
  savings: number
  balance: number
}

interface ForecastResult {
  projections: ForecastData[]
  projectedSavings: number
  projectedBalance: number
  growthRate: number
}

const formatCurrency = (n: number) =>
  `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

export default function ForecastingPage() {
  const { status } = useSession()
  const [data, setData] = useState<ForecastResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState("3m")
  const [hoverPeriod, setHoverPeriod] = useState<string | null>(null)
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
    if (status === "authenticated") fetchForecast()
  }, [status, period])

  const fetchForecast = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/forecasting?period=${period}`)
      const result = await res.json()
      setData(result)
    } catch {
      console.error("Failed to fetch forecast")
    } finally {
      setLoading(false)
    }
  }

  const periods = [
    { label: "1M", value: "1m" },
    { label: "3M", value: "3m" },
    { label: "6M", value: "6m" },
    { label: "12M", value: "12m" },
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
    <div style={{ display: "flex", flexDirection: "column", gap: isMobile ? "16px" : "24px" }}>
      <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", alignItems: isMobile ? "stretch" : "center", justifyContent: isMobile ? "stretch" : "space-between", gap: isMobile ? "12px" : "0" }}>
        <div>
          <h1 style={{ fontSize: isMobile ? "22px" : "28px", fontWeight: 700, color: "#111111", letterSpacing: "-0.025em" }}>Financial Forecasting</h1>
          <p style={{ fontSize: isMobile ? "13px" : "15px", color: "#6B7280", marginTop: "2px" }}>Project your financial future</p>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", background: "#F3F4F6", borderRadius: "9999px", padding: "4px" }}>
          {periods.map((p) => {
            const isActive = period === p.value
            const isHovered = hoverPeriod === p.value
            return (
              <button
                key={p.value}
                onClick={() => setPeriod(p.value)}
                onMouseEnter={() => setHoverPeriod(p.value)}
                onMouseLeave={() => setHoverPeriod(null)}
                style={{
                  borderRadius: "9999px", padding: isMobile ? "6px 12px" : "6px 16px",
                  fontSize: isMobile ? "12px" : "13px", fontWeight: 500, transition: "all 150ms ease",
                  cursor: "pointer", border: "none",
                  background: isActive ? "#111111" : "transparent",
                  color: isActive ? "white" : isHovered ? "#111111" : "#6B7280",
                }}
              >
                {p.label}
              </button>
            )
          })}
        </div>
      </div>

      {data && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)", gap: "16px" }}>
            {[
              { label: "Projected Savings", value: formatCurrency(data.projectedSavings), icon: TrendingUp, iconBg: "#F0FDF4", iconColor: "#16A34A" },
              { label: "Projected Balance", value: formatCurrency(data.projectedBalance), icon: ArrowUpRight, iconBg: "#EFF6FF", iconColor: "#2563EB" },
              { label: "Growth Rate", value: `${data.growthRate.toFixed(1)}%`, icon: Calendar, iconBg: "#FEF3C7", iconColor: "#D97706" },
            ].map((card) => (
              <div
                key={card.label}
                style={{
                  borderRadius: "20px", background: "white", padding: isMobile ? "16px" : "20px",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.04)", transition: "box-shadow 200ms",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
                  <span style={{ fontSize: isMobile ? "12px" : "13px", fontWeight: 500, color: "#6B7280" }}>{card.label}</span>
                  <div style={{ display: "flex", height: "36px", width: "36px", alignItems: "center", justifyContent: "center", borderRadius: "10px", background: card.iconBg }}>
                    <card.icon style={{ height: "18px", width: "18px", color: card.iconColor }} />
                  </div>
                </div>
                <p style={{ fontSize: isMobile ? "20px" : "24px", fontWeight: 600, color: "#111111", letterSpacing: "-0.025em" }}>{card.value}</p>
              </div>
            ))}
          </div>

          <div style={{ borderRadius: "20px", background: "white", padding: isMobile ? "16px" : "24px", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
            <h3 style={{ fontSize: isMobile ? "15px" : "17px", fontWeight: 600, color: "#111111", marginBottom: "20px" }}>Projection Overview</h3>
            <div style={{ height: isMobile ? "220px" : "320px" }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.projections}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                  <XAxis dataKey="month" tick={{ fontSize: isMobile ? 10 : 12, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: isMobile ? 10 : 12, fill: "#9CA3AF" }} axisLine={false} tickLine={false} tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v} />
                  <Tooltip
                    contentStyle={{
                      borderRadius: "12px", border: "1px solid #F3F4F6",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.08)", fontSize: isMobile ? "12px" : "13px", padding: "8px 12px",
                    }}
                    formatter={(value) => formatCurrency(Number(value))}
                  />
                  <Line type="monotone" dataKey="income" stroke="#16A34A" strokeWidth={2} dot={false} name="Income" />
                  <Line type="monotone" dataKey="expenses" stroke="#DC2626" strokeWidth={2} dot={false} name="Expenses" />
                  <Line type="monotone" dataKey="savings" stroke="#2563EB" strokeWidth={2} dot={false} name="Savings" />
                  <Line type="monotone" dataKey="balance" stroke="#8B5CF6" strokeWidth={2} dot={false} name="Balance" strokeDasharray="5 5" />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: isMobile ? "12px" : "20px", marginTop: "16px", paddingTop: "16px", borderTop: "1px solid #F3F4F6" }}>
              {[
                { label: "Income", color: "#16A34A" },
                { label: "Expenses", color: "#DC2626" },
                { label: "Savings", color: "#2563EB" },
                { label: "Balance", color: "#8B5CF6" },
              ].map((item) => (
                <div key={item.label} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <div style={{ height: "10px", width: "10px", borderRadius: "9999px", background: item.color }} />
                  <span style={{ fontSize: isMobile ? "12px" : "13px", color: "#6B7280" }}>{item.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={{ borderRadius: "20px", background: "white", padding: isMobile ? "16px" : "24px", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
            <h3 style={{ fontSize: isMobile ? "15px" : "17px", fontWeight: 600, color: "#111111", marginBottom: "20px" }}>Monthly Projections</h3>
            <div style={{ overflowX: "auto" as const }}>
              <table style={{ width: "100%", borderCollapse: "collapse" as const }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid #F3F4F6" }}>
                    {["Month", "Income", "Expenses", "Savings", "Balance"].map((h) => (
                      <th key={h} style={{
                        textAlign: h === "Month" ? "left" : "right",
                        padding: isMobile ? "10px 8px" : "12px 16px", fontSize: isMobile ? "10px" : "12px", fontWeight: 500,
                        color: "#9CA3AF", textTransform: "uppercase" as const, letterSpacing: "0.05em",
                      }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.projections.map((row, i) => (
                    <tr key={i} style={{ borderBottom: "1px solid #F3F4F6" }}>
                      <td style={{ padding: isMobile ? "10px 8px" : "12px 16px", fontSize: isMobile ? "12px" : "14px", fontWeight: 500, color: "#111111" }}>{row.month}</td>
                      <td style={{ padding: isMobile ? "10px 8px" : "12px 16px", fontSize: isMobile ? "12px" : "14px", color: "#16A34A", textAlign: "right" }}>{formatCurrency(row.income)}</td>
                      <td style={{ padding: isMobile ? "10px 8px" : "12px 16px", fontSize: isMobile ? "12px" : "14px", color: "#DC2626", textAlign: "right" }}>{formatCurrency(row.expenses)}</td>
                      <td style={{ padding: isMobile ? "10px 8px" : "12px 16px", fontSize: isMobile ? "12px" : "14px", color: "#2563EB", textAlign: "right", fontWeight: 500 }}>{formatCurrency(row.savings)}</td>
                      <td style={{ padding: isMobile ? "10px 8px" : "12px 16px", fontSize: isMobile ? "12px" : "14px", color: "#111111", textAlign: "right", fontWeight: 600 }}>{formatCurrency(row.balance)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {!data && !loading && (
        <div style={{
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          padding: isMobile ? "40px 0" : "80px 0", background: "white", borderRadius: "20px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
        }}>
          <div style={{
            width: isMobile ? "48px" : "64px", height: isMobile ? "48px" : "64px", borderRadius: "9999px", background: "#F3F4F6",
            display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "16px",
          }}>
            <TrendingUp style={{ width: isMobile ? "20px" : "24px", height: isMobile ? "20px" : "24px", color: "#9CA3AF" }} />
          </div>
          <p style={{ fontSize: isMobile ? "14px" : "16px", fontWeight: 500, color: "#111111", marginBottom: "4px" }}>No forecast data</p>
          <p style={{ fontSize: isMobile ? "12px" : "14px", color: "#9CA3AF" }}>Add transactions to see financial projections</p>
        </div>
      )}
    </div>
  )
}
