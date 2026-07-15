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
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
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

const COLORS = ["#6366f1", "#8b5cf6", "#a78bfa", "#c4b5fd", "#ddd6fe", "#ede9fe"]

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
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
      </div>
    )
  }

  if (!stats) return null

  const statCards = [
    {
      title: "Total Balance",
      value: formatCurrency(stats.totalBalance),
      icon: Wallet,
      color: "from-indigo-500 to-purple-600",
      bgColor: "bg-indigo-50",
    },
    {
      title: "Income This Month",
      value: formatCurrency(stats.monthlyIncome),
      icon: TrendingUp,
      color: "from-emerald-500 to-teal-600",
      bgColor: "bg-emerald-50",
    },
    {
      title: "Expenses This Month",
      value: formatCurrency(stats.monthlyExpenses),
      icon: TrendingDown,
      color: "from-red-500 to-rose-600",
      bgColor: "bg-red-50",
    },
    {
      title: "Transactions",
      value: stats.transactionCount.toString(),
      icon: ArrowLeftRight,
      color: "from-amber-500 to-orange-600",
      bgColor: "bg-amber-50",
    },
  ]

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            Welcome back, {session?.user?.name?.split(" ")[0]} 👋
          </h1>
          <p className="text-gray-500 mt-1">Here&apos;s your financial overview</p>
        </div>
        <Link
          href="/dashboard/transactions"
          className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200"
        >
          <Plus className="h-4 w-4" />
          Add Transaction
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <div
            key={card.title}
            className="rounded-2xl border-2 border-gray-100 bg-white p-5 hover:shadow-md transition-all"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-gray-500">{card.title}</span>
              <div className={`rounded-xl ${card.bgColor} p-2`}>
                <card.icon className="h-5 w-5 text-gray-600" />
              </div>
            </div>
            <p className="text-2xl font-bold">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rounded-2xl border-2 border-gray-100 bg-white p-6">
          <h3 className="text-lg font-semibold mb-4">Monthly Trend</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.monthlyTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    borderRadius: "12px",
                    border: "2px solid #f0f0f0",
                    boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)",
                  }}
                />
                <Legend />
                <Bar
                  dataKey="income"
                  fill="#10b981"
                  radius={[6, 6, 0, 0]}
                  name="Income"
                />
                <Bar
                  dataKey="expenses"
                  fill="#f87171"
                  radius={[6, 6, 0, 0]}
                  name="Expenses"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl border-2 border-gray-100 bg-white p-6">
          <h3 className="text-lg font-semibold mb-4">Spending by Category</h3>
          {stats.categoryData.length > 0 ? (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={4}
                    dataKey="amount"
                    nameKey="name"
                  >
                    {stats.categoryData.map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      borderRadius: "12px",
                      border: "2px solid #f0f0f0",
                    }}
                    formatter={(value) => formatCurrency(Number(value))}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-72 text-gray-400">
              <p className="text-4xl mb-2">📊</p>
              <p className="text-sm">No expenses yet</p>
            </div>
          )}
          <div className="space-y-2 mt-4">
            {stats.categoryData.slice(0, 4).map((cat, i) => (
              <div key={cat.name} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: COLORS[i % COLORS.length] }}
                  />
                  <span className="text-gray-600">{cat.name}</span>
                </div>
                <span className="font-medium">{formatCurrency(cat.amount)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border-2 border-gray-100 bg-white p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Recent Transactions</h3>
          <Link
            href="/dashboard/transactions"
            className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
          >
            View all
          </Link>
        </div>
        {stats.recentTransactions.length > 0 ? (
          <div className="space-y-3">
            {stats.recentTransactions.map((tx: any) => (
              <div
                key={tx.id}
                className="flex items-center justify-between rounded-xl p-3 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100 text-lg">
                    {tx.category?.icon || "💰"}
                  </div>
                  <div>
                    <p className="font-medium text-sm">{tx.description}</p>
                    <p className="text-xs text-gray-500">
                      {tx.category?.name || "Uncategorized"} · {tx.account?.name}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p
                    className={`font-semibold ${
                      tx.type === "income" ? "text-emerald-600" : "text-red-500"
                    }`}
                  >
                    {tx.type === "income" ? "+" : "-"}
                    {formatCurrency(tx.amount)}
                  </p>
                  <p className="text-xs text-gray-400">{formatDate(tx.date)}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-gray-400">
            <p className="text-4xl mb-2">💸</p>
            <p className="font-medium">No transactions yet</p>
            <p className="text-sm mt-1">Add your first transaction to get started</p>
          </div>
        )}
      </div>
    </div>
  )
}
