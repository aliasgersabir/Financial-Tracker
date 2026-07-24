"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  ArrowLeftRight,
  Plus,
} from "lucide-react"
import Link from "next/link"
import { formatCurrency, formatDate } from "@/lib/utils"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts"

interface Stats {
  totalBalance: number
  monthlyIncome: number
  monthlyExpenses: number
  categoryData: { name: string; amount: number }[]
  monthlyTrend: { month: string; income: number; expenses: number }[]
  recentTransactions: any[]
  accountCount: number
  transactionCount: number
}

const CHART_COLORS = ["#2563EB", "#6B7280", "#16A34A", "#F59E0B", "#DC2626"]

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  const [authChecked, setAuthChecked] = useState(false)

  useEffect(() => {
    if (status === "loading") return
    if (status === "unauthenticated") {
      window.location.href = "/login"
    } else {
      setAuthChecked(true)
    }
  }, [status])

  useEffect(() => {
    if (status === "authenticated") {
      fetch("/api/health?migrate=true").catch(() => {})
      fetchStats()
    }
  }, [status])

  const fetchStats = async () => {
    try {
      const res = await fetch("/api/stats")
      const data = await res.json()
      setStats(data)
    } catch {
      console.error("Failed to fetch stats")
    } finally {
      setLoading(false)
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

  if (!stats) return null

  const statCards = [
    {
      title: "Total Balance",
      value: formatCurrency(stats.totalBalance),
      icon: Wallet,
      iconBg: "#EFF6FF",
      iconColor: "#2563EB",
    },
    {
      title: "Income This Month",
      value: formatCurrency(stats.monthlyIncome),
      icon: TrendingUp,
      iconBg: "#F0FDF4",
      iconColor: "#16A34A",
    },
    {
      title: "Expenses This Month",
      value: formatCurrency(stats.monthlyExpenses),
      icon: TrendingDown,
      iconBg: "#FEF2F2",
      iconColor: "#DC2626",
    },
    {
      title: "Transactions",
      value: stats.transactionCount.toString(),
      icon: ArrowLeftRight,
      iconBg: "#FFFBEB",
      iconColor: "#F59E0B",
    },
  ]

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h1 style={{ fontSize: "28px", fontWeight: 700, color: "#111111", letterSpacing: "-0.025em" }}>
            Good {new Date().getHours() < 12 ? "morning" : new Date().getHours() < 18 ? "afternoon" : "evening"}, {session?.user?.name?.split(" ")[0]}
          </h1>
          <p style={{ fontSize: "15px", color: "#6B7280", marginTop: "2px" }}>Here&apos;s your financial overview</p>
        </div>
        <Link
          href="/dashboard/transactions"
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
            transition: "all 150ms",
            boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "#1D4ED8"
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "#2563EB"
          }}
          onMouseDown={(e) => {
            e.currentTarget.style.transform = "scale(0.98)"
          }}
          onMouseUp={(e) => {
            e.currentTarget.style.transform = "scale(1)"
          }}
        >
          <Plus style={{ height: "16px", width: "16px" }} />
          Add Transaction
        </Link>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px" }}>
        {statCards.map((card) => (
          <div
            key={card.title}
            style={{
              borderRadius: "20px",
              background: "white",
              padding: "20px",
              boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
              transition: "box-shadow 200ms",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.06)"
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.04)"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
              <span style={{ fontSize: "13px", fontWeight: 500, color: "#6B7280" }}>{card.title}</span>
              <div style={{ display: "flex", height: "36px", width: "36px", alignItems: "center", justifyContent: "center", borderRadius: "10px", background: card.iconBg }}>
                <card.icon style={{ height: "18px", width: "18px", color: card.iconColor }} />
              </div>
            </div>
            <p style={{ fontSize: "24px", fontWeight: 600, color: "#111111", letterSpacing: "-0.025em" }}>{card.value}</p>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "16px" }}>
        <div style={{ borderRadius: "20px", background: "white", padding: "24px", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
          <h3 style={{ fontSize: "17px", fontWeight: 600, color: "#111111", marginBottom: "20px" }}>Monthly Trend</h3>
          <div style={{ height: "280px" }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.monthlyTrend} barGap={4}>
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 12, fill: "#9CA3AF" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: "#9CA3AF" }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(value) => value >= 1000 ? `${(value / 1000).toFixed(0)}k` : value}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: "12px",
                    border: "1px solid #F3F4F6",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                    fontSize: "13px",
                    padding: "8px 12px",
                  }}
                  cursor={{ fill: "#F9FAFB" }}
                />
                <Bar
                  dataKey="income"
                  fill="#2563EB"
                  radius={[6, 6, 0, 0]}
                  name="Income"
                />
                <Bar
                  dataKey="expenses"
                  fill="#DC2626"
                  radius={[6, 6, 0, 0]}
                  name="Expenses"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "16px", marginTop: "16px", paddingTop: "16px", borderTop: "1px solid #F3F4F6" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <div style={{ height: "10px", width: "10px", borderRadius: "9999px", background: "#2563EB" }} />
              <span style={{ fontSize: "13px", color: "#6B7280" }}>Income</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <div style={{ height: "10px", width: "10px", borderRadius: "9999px", background: "#DC2626" }} />
              <span style={{ fontSize: "13px", color: "#6B7280" }}>Expenses</span>
            </div>
          </div>
        </div>

        <div style={{ borderRadius: "20px", background: "white", padding: "24px", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
          <h3 style={{ fontSize: "17px", fontWeight: 600, color: "#111111", marginBottom: "20px" }}>Spending by Category</h3>
          {stats.categoryData.length > 0 ? (
            <>
              <div style={{ height: "200px" }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={stats.categoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={80}
                      paddingAngle={3}
                      dataKey="amount"
                      nameKey="name"
                      strokeWidth={0}
                    >
                      {stats.categoryData.map((_, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={CHART_COLORS[index % CHART_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        borderRadius: "12px",
                        border: "1px solid #F3F4F6",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                        fontSize: "13px",
                        padding: "8px 12px",
                      }}
                      formatter={(value) => formatCurrency(Number(value))}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "16px" }}>
                {stats.categoryData.slice(0, 4).map((cat, i) => (
                  <div key={cat.name} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <div
                        style={{ height: "10px", width: "10px", borderRadius: "9999px", backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }}
                      />
                      <span style={{ fontSize: "13px", color: "#6B7280" }}>{cat.name}</span>
                    </div>
                    <span style={{ fontSize: "13px", fontWeight: 500, color: "#111111" }}>{formatCurrency(cat.amount)}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "280px", color: "#D1D5DB" }}>
              <div style={{ height: "64px", width: "64px", borderRadius: "9999px", background: "#F9FAFB", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "12px" }}>
                <TrendingDown style={{ height: "24px", width: "24px", color: "#D1D5DB" }} />
              </div>
              <p style={{ fontSize: "14px", fontWeight: 500, color: "#9CA3AF" }}>No expenses yet</p>
            </div>
          )}
        </div>
      </div>

      <div style={{ borderRadius: "20px", background: "white", padding: "24px", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
          <h3 style={{ fontSize: "17px", fontWeight: 600, color: "#111111" }}>Recent Transactions</h3>
          <Link
            href="/dashboard/transactions"
            style={{ fontSize: "13px", fontWeight: 500, color: "#2563EB", transition: "color 150ms" }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "#1D4ED8"
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "#2563EB"
            }}
          >
            View all
          </Link>
        </div>
        {stats.recentTransactions.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            {stats.recentTransactions.map((tx: any) => (
              <div
                key={tx.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  borderRadius: "14px",
                  padding: "12px 16px",
                  transition: "background-color 150ms",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "#F9FAFB"
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "transparent"
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div style={{ display: "flex", height: "40px", width: "40px", alignItems: "center", justifyContent: "center", borderRadius: "12px", background: "#F9FAFB", fontSize: "18px" }}>
                    {tx.category?.icon || "💰"}
                  </div>
                  <div>
                    <p style={{ fontSize: "14px", fontWeight: 500, color: "#111111" }}>{tx.description}</p>
                    <p style={{ fontSize: "12px", color: "#9CA3AF" }}>
                      {tx.category?.name || "Uncategorized"} · {tx.account?.name}
                    </p>
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <p
                    style={{
                      fontSize: "14px",
                      fontWeight: 600,
                      color: tx.type === "income" ? "#16A34A" : "#111111",
                    }}
                  >
                    {tx.type === "income" ? "+" : "-"}
                    {formatCurrency(tx.amount)}
                  </p>
                  <p style={{ fontSize: "12px", color: "#9CA3AF" }}>{formatDate(tx.date)}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "64px 0", color: "#D1D5DB" }}>
            <div style={{ height: "64px", width: "64px", borderRadius: "9999px", background: "#F9FAFB", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "12px" }}>
              <ArrowLeftRight style={{ height: "24px", width: "24px", color: "#D1D5DB" }} />
            </div>
            <p style={{ fontSize: "14px", fontWeight: 500, color: "#9CA3AF" }}>No transactions yet</p>
            <p style={{ fontSize: "13px", color: "#D1D5DB", marginTop: "4px" }}>Add your first transaction to get started</p>
          </div>
        )}
      </div>
    </div>
  )
}
