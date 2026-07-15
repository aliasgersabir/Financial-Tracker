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

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
    }
  }, [status, router])

  useEffect(() => {
    if (status === "authenticated") {
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
      <div className="flex items-center justify-center h-64">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#E5E7EB] border-t-[#2563EB]" />
      </div>
    )
  }

  if (!stats) return null

  const statCards = [
    {
      title: "Total Balance",
      value: formatCurrency(stats.totalBalance),
      icon: Wallet,
      iconBg: "bg-[#EFF6FF]",
      iconColor: "text-[#2563EB]",
    },
    {
      title: "Income This Month",
      value: formatCurrency(stats.monthlyIncome),
      icon: TrendingUp,
      iconBg: "bg-[#F0FDF4]",
      iconColor: "text-[#16A34A]",
    },
    {
      title: "Expenses This Month",
      value: formatCurrency(stats.monthlyExpenses),
      icon: TrendingDown,
      iconBg: "bg-[#FEF2F2]",
      iconColor: "text-[#DC2626]",
    },
    {
      title: "Transactions",
      value: stats.transactionCount.toString(),
      icon: ArrowLeftRight,
      iconBg: "bg-[#FFFBEB]",
      iconColor: "text-[#F59E0B]",
    },
  ]

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[28px] font-bold text-[#111111] tracking-tight">
            Good {new Date().getHours() < 12 ? "morning" : new Date().getHours() < 18 ? "afternoon" : "evening"}, {session?.user?.name?.split(" ")[0]}
          </h1>
          <p className="text-[15px] text-[#6B7280] mt-0.5">Here&apos;s your financial overview</p>
        </div>
        <Link
          href="/dashboard/transactions"
          className="inline-flex items-center gap-2 rounded-full bg-[#2563EB] px-5 py-2.5 text-[14px] font-medium text-white hover:bg-[#1D4ED8] transition-all duration-150 shadow-sm active:scale-[0.98]"
        >
          <Plus className="h-4 w-4" />
          Add Transaction
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <div
            key={card.title}
            className="rounded-[20px] bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:shadow-[0_2px_8px_rgba(0,0,0,0.06)] transition-shadow duration-200"
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-[13px] font-medium text-[#6B7280]">{card.title}</span>
              <div className={`flex h-9 w-9 items-center justify-center rounded-[10px] ${card.iconBg}`}>
                <card.icon className={`h-[18px] w-[18px] ${card.iconColor}`} />
              </div>
            </div>
            <p className="text-[24px] font-semibold text-[#111111] tracking-tight">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 rounded-[20px] bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
          <h3 className="text-[17px] font-semibold text-[#111111] mb-5">Monthly Trend</h3>
          <div className="h-[280px]">
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
                  fill="#E5E7EB"
                  radius={[6, 6, 0, 0]}
                  name="Expenses"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="flex items-center gap-4 mt-4 pt-4 border-t border-[#F3F4F6]">
            <div className="flex items-center gap-2">
              <div className="h-2.5 w-2.5 rounded-full bg-[#2563EB]" />
              <span className="text-[13px] text-[#6B7280]">Income</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2.5 w-2.5 rounded-full bg-[#E5E7EB]" />
              <span className="text-[13px] text-[#6B7280]">Expenses</span>
            </div>
          </div>
        </div>

        <div className="rounded-[20px] bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
          <h3 className="text-[17px] font-semibold text-[#111111] mb-5">Spending by Category</h3>
          {stats.categoryData.length > 0 ? (
            <>
              <div className="h-[200px]">
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
              <div className="space-y-2.5 mt-4">
                {stats.categoryData.slice(0, 4).map((cat, i) => (
                  <div key={cat.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }}
                      />
                      <span className="text-[13px] text-[#6B7280]">{cat.name}</span>
                    </div>
                    <span className="text-[13px] font-medium text-[#111111]">{formatCurrency(cat.amount)}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-[280px] text-[#D1D5DB]">
              <div className="h-16 w-16 rounded-full bg-[#F9FAFB] flex items-center justify-center mb-3">
                <TrendingDown className="h-6 w-6 text-[#D1D5DB]" />
              </div>
              <p className="text-[14px] font-medium text-[#9CA3AF]">No expenses yet</p>
            </div>
          )}
        </div>
      </div>

      <div className="rounded-[20px] bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-[17px] font-semibold text-[#111111]">Recent Transactions</h3>
          <Link
            href="/dashboard/transactions"
            className="text-[13px] font-medium text-[#2563EB] hover:text-[#1D4ED8] transition-colors"
          >
            View all
          </Link>
        </div>
        {stats.recentTransactions.length > 0 ? (
          <div className="space-y-1">
            {stats.recentTransactions.map((tx: any) => (
              <div
                key={tx.id}
                className="flex items-center justify-between rounded-[14px] px-4 py-3 hover:bg-[#F9FAFB] transition-colors duration-150"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-[12px] bg-[#F9FAFB] text-lg">
                    {tx.category?.icon || "💰"}
                  </div>
                  <div>
                    <p className="text-[14px] font-medium text-[#111111]">{tx.description}</p>
                    <p className="text-[12px] text-[#9CA3AF]">
                      {tx.category?.name || "Uncategorized"} · {tx.account?.name}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p
                    className={`text-[14px] font-semibold ${
                      tx.type === "income" ? "text-[#16A34A]" : "text-[#111111]"
                    }`}
                  >
                    {tx.type === "income" ? "+" : "-"}
                    {formatCurrency(tx.amount)}
                  </p>
                  <p className="text-[12px] text-[#D1D5DB]">{formatDate(tx.date)}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-[#D1D5DB]">
            <div className="h-16 w-16 rounded-full bg-[#F9FAFB] flex items-center justify-center mb-3">
              <ArrowLeftRight className="h-6 w-6 text-[#D1D5DB]" />
            </div>
            <p className="text-[14px] font-medium text-[#9CA3AF]">No transactions yet</p>
            <p className="text-[13px] text-[#D1D5DB] mt-1">Add your first transaction to get started</p>
          </div>
        )}
      </div>
    </div>
  )
}
