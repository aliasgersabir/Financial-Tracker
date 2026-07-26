"use client"

import { useSession } from "next-auth/react"
import { useEffect, useState } from "react"
import Link from "next/link"
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  ArrowLeftRight,
  Plus,
  Sparkles,
  Target,
  CreditCard,
  MessageCircle,
  BarChart3,
  ArrowRight,
  Lightbulb,
  Calendar,
  CircleDollarSign,
  Activity,
  Zap,
  Camera,
  BookOpen,
} from "lucide-react"
import { formatCurrency, formatDate } from "@/lib/utils"
import {
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
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

interface HealthScore {
  score: number
  breakdown: {
    savings: { score: number; max: number; rate: number }
    budget: { score: number; max: number; discipline: number }
    goals: { score: number; max: number; progress: number }
    emergency: { score: number; max: number; months: number }
    consistency: { score: number; max: number; ratio: number }
    debt: { score: number; max: number; ratio: number }
  }
}

interface Insight {
  id: string
  type: string
  title: string
  explanation: string
  action: string
  confidence: number
  priority: string
}

interface Goal {
  id: string
  name: string
  target: number
  current: number
  percentage: number
}

interface BudgetItem {
  id: string
  category: { name: string; icon: string } | null
  budgeted: number
  spent: number
  percentage: number
  status: string
}

interface Subscription {
  id: string
  name: string
  amount: number
  frequency: string
  monthlyCost: number
  color: string
}

const CHART_COLORS = ["#2563EB", "#6B7280", "#16A34A", "#F59E0B", "#DC2626"]

function getHealthColor(score: number): string {
  if (score >= 80) return "#16A34A"
  if (score >= 50) return "#F59E0B"
  return "#DC2626"
}

function getHealthLabel(score: number): string {
  if (score >= 80) return "Excellent"
  if (score >= 50) return "Fair"
  return "Needs Attention"
}

const CircularProgress = ({ score, size = 120 }: { score: number; size?: number }) => {
  const radius = (size - 12) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (score / 100) * circumference
  const color = getHealthColor(score)

  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#F3F4F6" strokeWidth="8" />
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={color} strokeWidth="8" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={offset} style={{ transition: "stroke-dashoffset 1s ease" }} />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontSize: "28px", fontWeight: 700, color: "#111111", lineHeight: 1 }}>{score}</span>
        <span style={{ fontSize: "11px", color: "#9CA3AF", marginTop: "2px" }}>/ 100</span>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const [stats, setStats] = useState<Stats | null>(null)
  const [healthScore, setHealthScore] = useState<HealthScore | null>(null)
  const [insights, setInsights] = useState<Insight[]>([])
  const [goals, setGoals] = useState<Goal[]>([])
  const [budgets, setBudgets] = useState<BudgetItem[]>([])
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [cashFlow, setCashFlow] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640)
    check()
    window.addEventListener("resize", check)
    return () => window.removeEventListener("resize", check)
  }, [])

  useEffect(() => {
    if (status === "loading") return
    if (status === "unauthenticated") {
      window.location.href = "/login"
    }
  }, [status])

  useEffect(() => {
    if (status === "authenticated") {
      fetch("/api/health?migrate=true").catch(() => {})
      fetch("/api/stats").then((r) => r.json()).then((data) => {
        setStats(data)
      }).catch(() => setStats({
        totalBalance: 0, monthlyIncome: 0, monthlyExpenses: 0,
        categoryData: [], monthlyTrend: [], recentTransactions: [],
        accountCount: 0, transactionCount: 0,
      })).finally(() => setLoading(false))

      Promise.allSettled([
        fetch("/api/health-score").then((r) => r.json()),
        fetch("/api/insights").then((r) => r.json()),
        fetch("/api/cash-flow").then((r) => r.json()),
        fetch("/api/goals/overview").then((r) => r.json()),
        fetch("/api/budgets/overview").then((r) => r.json()),
        fetch("/api/subscriptions").then((r) => r.json()),
      ]).then(([healthRes, insightsRes, cashRes, goalsRes, budgetsRes, subsRes]) => {
        if (healthRes.status === "fulfilled") setHealthScore(healthRes.value)
        if (insightsRes.status === "fulfilled") setInsights(Array.isArray(insightsRes.value) ? insightsRes.value : [])
        if (cashRes.status === "fulfilled") setCashFlow(cashRes.value)
        if (goalsRes.status === "fulfilled") setGoals(goalsRes.value.goals || [])
        if (budgetsRes.status === "fulfilled") setBudgets(budgetsRes.value.items || [])
        if (subsRes.status === "fulfilled") setSubscriptions(Array.isArray(subsRes.value) ? subsRes.value : [])
      })
    }
  }, [status])

  if (status === "loading" || loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "256px" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "16px" }}>
          <div style={{ height: "24px", width: "24px", animation: "spin 1s linear infinite", borderRadius: "9999px", border: "2px solid #E5E7EB", borderTopColor: "#2563EB" }} />
          <p style={{ fontSize: "13px", color: "#9CA3AF" }}>Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  if (!stats) return null

  const greeting = () => {
    const h = new Date().getHours()
    if (h < 12) return "Good morning"
    if (h < 18) return "Good afternoon"
    return "Good evening"
  }

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  })

  const netCashFlow = stats.monthlyIncome - stats.monthlyExpenses
  const savingsRate = stats.monthlyIncome > 0 ? ((netCashFlow / stats.monthlyIncome) * 100).toFixed(0) : "0"
  const activeSubCost = subscriptions.reduce((s, sub) => s + sub.monthlyCost, 0)
  const upcomingBills = (cashFlow?.projections || []).filter((p: any) => p.type === "expense").slice(0, 5)

  const monthlyStory = (() => {
    if (netCashFlow > 0) {
      return `You earned ${formatCurrency(stats.monthlyIncome)} and spent ${formatCurrency(stats.monthlyExpenses)} this month, saving ${savingsRate}% of your income. ${stats.categoryData.length > 0 ? `Your biggest expense was ${stats.categoryData[0]?.name}.` : ""} Keep up the positive momentum.`
    }
    return `You earned ${formatCurrency(stats.monthlyIncome)} and spent ${formatCurrency(stats.monthlyExpenses)} this month. You're spending more than you earn — consider reviewing your expenses to get back on track.`
  })()

  return (
    <>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
      <div style={{ display: "flex", flexDirection: "column", gap: "20px", maxWidth: "1400px" }}>

        <div style={{ display: "flex", alignItems: isMobile ? "flex-start" : "center", flexDirection: isMobile ? "column" : "row", justifyContent: "space-between", gap: "12px" }}>
          <div>
            <h1 style={{ fontSize: isMobile ? "22px" : "28px", fontWeight: 700, color: "#111111", letterSpacing: "-0.025em", margin: 0 }}>
              {greeting()}, {session?.user?.name?.split(" ")[0]}
            </h1>
            <p style={{ fontSize: "14px", color: "#6B7280", marginTop: "4px" }}>{today}</p>
          </div>
          <Link
            href="/dashboard/transactions"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              borderRadius: "9999px",
              background: "#2563EB",
              padding: "10px 20px",
              fontSize: "14px",
              fontWeight: 500,
              color: "white",
              transition: "all 0.15s",
              boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
              textDecoration: "none",
              flexShrink: 0,
            }}
          >
            <Plus style={{ height: "16px", width: "16px" }} />
            Add Transaction
          </Link>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, 1fr)", gap: isMobile ? "10px" : "16px" }}>
          {[
            { title: "Balance", value: formatCurrency(stats.totalBalance), icon: Wallet, iconBg: "#EFF6FF", iconColor: "#2563EB" },
            { title: "Income", value: formatCurrency(stats.monthlyIncome), icon: TrendingUp, iconBg: "#F0FDF4", iconColor: "#16A34A" },
            { title: "Expenses", value: formatCurrency(stats.monthlyExpenses), icon: TrendingDown, iconBg: "#FEF2F2", iconColor: "#DC2626" },
            { title: "Net Flow", value: formatCurrency(netCashFlow), icon: ArrowLeftRight, iconBg: netCashFlow >= 0 ? "#F0FDF4" : "#FEF2F2", iconColor: netCashFlow >= 0 ? "#16A34A" : "#DC2626" },
          ].map((card) => (
            <div
              key={card.title}
              style={{
                borderRadius: isMobile ? "16px" : "20px",
                background: "white",
                padding: isMobile ? "14px" : "20px",
                boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
                <span style={{ fontSize: "12px", fontWeight: 500, color: "#6B7280" }}>{card.title}</span>
                <div style={{ display: "flex", height: "32px", width: "32px", alignItems: "center", justifyContent: "center", borderRadius: "10px", background: card.iconBg }}>
                  <card.icon style={{ height: "16px", width: "16px", color: card.iconColor }} />
                </div>
              </div>
              <p style={{ fontSize: isMobile ? "18px" : "22px", fontWeight: 600, color: "#111111", letterSpacing: "-0.025em", margin: 0 }}>{card.value}</p>
            </div>
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 2fr", gap: "16px" }}>
          <div style={{ borderRadius: "20px", background: "white", padding: isMobile ? "20px" : "24px", boxShadow: "0 1px 3px rgba(0,0,0,0.04)", display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" }}>
            <div style={{ fontSize: "13px", fontWeight: 500, color: "#6B7280" }}>Financial Health</div>
            {healthScore ? (
              <>
                <CircularProgress score={healthScore.score} size={isMobile ? 100 : 120} />
                <span style={{ fontSize: "14px", fontWeight: 600, color: getHealthColor(healthScore.score) }}>{getHealthLabel(healthScore.score)}</span>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px", width: "100%", marginTop: "8px" }}>
                  {[
                    { label: "Savings", score: healthScore.breakdown.savings.score, max: healthScore.breakdown.savings.max },
                    { label: "Budget", score: healthScore.breakdown.budget.score, max: healthScore.breakdown.budget.max },
                    { label: "Goals", score: healthScore.breakdown.goals.score, max: healthScore.breakdown.goals.max },
                    { label: "Emergency", score: healthScore.breakdown.emergency.score, max: healthScore.breakdown.emergency.max },
                  ].map((item) => (
                    <div key={item.label} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span style={{ fontSize: "11px", color: "#9CA3AF", width: "56px", flexShrink: 0 }}>{item.label}</span>
                      <div style={{ flex: 1, height: "4px", borderRadius: "2px", background: "#F3F4F6" }}>
                        <div style={{ height: "100%", width: `${(item.score / item.max) * 100}%`, borderRadius: "2px", background: getHealthColor((item.score / item.max) * 100), transition: "width 1s ease" }} />
                      </div>
                      <span style={{ fontSize: "11px", color: "#6B7280", width: "24px", textAlign: "right" }}>{item.score}/{item.max}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "32px 0" }}>
                <Activity style={{ height: "32px", width: "32px", color: "#D1D5DB" }} />
                <p style={{ fontSize: "13px", color: "#9CA3AF", marginTop: "8px" }}>No data yet</p>
              </div>
            )}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
                <div style={{ height: "24px", width: "24px", borderRadius: "6px", background: "#EFF6FF", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Sparkles style={{ height: "14px", width: "14px", color: "#2563EB" }} />
                </div>
                <span style={{ fontSize: "15px", fontWeight: 600, color: "#111111" }}>AI Insights</span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)", gap: "10px" }}>
                {insights.length > 0 ? insights.slice(0, isMobile ? 2 : 3).map((insight) => (
                  <div
                    key={insight.id}
                    style={{
                      borderRadius: "14px",
                      background: insight.priority === "high" ? "#FEF2F2" : insight.priority === "medium" ? "#FFFBEB" : "#F0FDF4",
                      border: `1px solid ${insight.priority === "high" ? "#FECACA" : insight.priority === "medium" ? "#FEF3C7" : "#BBF7D0"}`,
                      padding: isMobile ? "12px" : "16px",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "6px" }}>
                      <Lightbulb style={{ height: "14px", width: "14px", color: insight.priority === "high" ? "#DC2626" : insight.priority === "medium" ? "#F59E0B" : "#16A34A" }} />
                      <span style={{ fontSize: "13px", fontWeight: 600, color: "#111111" }}>{insight.title}</span>
                    </div>
                    <p style={{ fontSize: "12px", color: "#6B7280", margin: 0, lineHeight: 1.5 }}>{insight.explanation}</p>
                  </div>
                )) : (
                  <>
                    <div style={{ borderRadius: "14px", background: "#F0FDF4", border: "1px solid #BBF7D0", padding: "12px" }}>
                      <p style={{ fontSize: "13px", fontWeight: 600, color: "#16A34A", margin: 0 }}>No overspending detected</p>
                      <p style={{ fontSize: "12px", color: "#6B7280", marginTop: "4px" }}>Your spending looks healthy this month.</p>
                    </div>
                    <div style={{ borderRadius: "14px", background: "#FFFBEB", border: "1px solid #FEF3C7", padding: "12px" }}>
                      <p style={{ fontSize: "13px", fontWeight: 600, color: "#F59E0B", margin: 0 }}>Keep tracking</p>
                      <p style={{ fontSize: "12px", color: "#6B7280", marginTop: "4px" }}>Add more data for better insights.</p>
                    </div>
                  </>
                )}
              </div>
            </div>

            <div style={{ borderRadius: "16px", background: "linear-gradient(135deg, #EFF6FF 0%, #F0FDF4 100%)", border: "1px solid #E5E7EB", padding: isMobile ? "16px" : "20px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
                <BookOpen style={{ height: "16px", width: "16px", color: "#2563EB" }} />
                <span style={{ fontSize: "13px", fontWeight: 600, color: "#2563EB", textTransform: "uppercase" as const, letterSpacing: "0.05em" }}>Monthly Story</span>
              </div>
              <p style={{ fontSize: "14px", color: "#374151", lineHeight: 1.7, margin: 0 }}>{monthlyStory}</p>
            </div>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: "16px" }}>
          <div style={{ borderRadius: "20px", background: "white", padding: isMobile ? "20px" : "24px", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
            <h3 style={{ fontSize: "15px", fontWeight: 600, color: "#111111", margin: "0 0 16px 0" }}>Cash Flow Forecast</h3>
            <div style={{ height: isMobile ? "180px" : "200px" }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats.monthlyTrend}>
                  <defs>
                    <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#16A34A" stopOpacity={0.2} />
                      <stop offset="100%" stopColor="#16A34A" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#DC2626" stopOpacity={0.2} />
                      <stop offset="100%" stopColor="#DC2626" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false} tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v} width={35} />
                  <Tooltip contentStyle={{ borderRadius: "12px", border: "1px solid #F3F4F6", boxShadow: "0 4px 12px rgba(0,0,0,0.08)", fontSize: "13px", padding: "8px 12px" }} formatter={(value) => formatCurrency(Number(value))} />
                  <Area type="monotone" dataKey="income" stroke="#16A34A" fill="url(#incomeGrad)" strokeWidth={2} name="Income" />
                  <Area type="monotone" dataKey="expenses" stroke="#DC2626" fill="url(#expenseGrad)" strokeWidth={2} name="Expenses" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div style={{ display: "flex", gap: "16px", marginTop: "12px", paddingTop: "12px", borderTop: "1px solid #F3F4F6" }}>
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

          <div style={{ borderRadius: "20px", background: "white", padding: isMobile ? "20px" : "24px", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
            <h3 style={{ fontSize: "15px", fontWeight: 600, color: "#111111", margin: "0 0 16px 0" }}>Spending by Category</h3>
            {stats.categoryData.length > 0 ? (
              <>
                <div style={{ height: isMobile ? "160px" : "180px" }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={stats.categoryData} cx="50%" cy="50%" innerRadius={isMobile ? 40 : 50} outerRadius={isMobile ? 60 : 75} paddingAngle={3} dataKey="amount" nameKey="name" strokeWidth={0}>
                        {stats.categoryData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ borderRadius: "12px", border: "1px solid #F3F4F6", boxShadow: "0 4px 12px rgba(0,0,0,0.08)", fontSize: "13px", padding: "8px 12px" }} formatter={(value) => formatCurrency(Number(value))} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {stats.categoryData.slice(0, 4).map((cat, i) => (
                    <div key={cat.name} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <div style={{ height: "8px", width: "8px", borderRadius: "9999px", background: CHART_COLORS[i % CHART_COLORS.length] }} />
                        <span style={{ fontSize: "13px", color: "#6B7280" }}>{cat.name}</span>
                      </div>
                      <span style={{ fontSize: "13px", fontWeight: 500, color: "#111111" }}>{formatCurrency(cat.amount)}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "280px" }}>
                <TrendingDown style={{ height: "24px", width: "24px", color: "#D1D5DB" }} />
                <p style={{ fontSize: "13px", color: "#9CA3AF", marginTop: "8px" }}>No expenses this month</p>
              </div>
            )}
          </div>
        </div>

        {goals.length > 0 && (
          <div style={{ borderRadius: "20px", background: "white", padding: isMobile ? "20px" : "24px", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Target style={{ height: "16px", width: "16px", color: "#2563EB" }} />
                <h3 style={{ fontSize: "15px", fontWeight: 600, color: "#111111", margin: 0 }}>Goals</h3>
              </div>
              <Link href="/dashboard/goals" style={{ fontSize: "13px", fontWeight: 500, color: "#2563EB", textDecoration: "none" }}>View all</Link>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              {goals.slice(0, isMobile ? 3 : 4).map((goal) => (
                <div key={goal.id}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
                    <span style={{ fontSize: "13px", fontWeight: 500, color: "#111111" }}>{goal.name}</span>
                    <div style={{ display: "flex", alignItems: "baseline", gap: "4px" }}>
                      <span style={{ fontSize: "13px", fontWeight: 600, color: "#111111" }}>{formatCurrency(goal.current)}</span>
                      <span style={{ fontSize: "11px", color: "#9CA3AF" }}>/ {formatCurrency(goal.target)}</span>
                    </div>
                  </div>
                  <div style={{ position: "relative", height: "6px", borderRadius: "3px", background: "#F3F4F6" }}>
                    <div style={{ position: "absolute", left: 0, top: 0, height: "100%", width: `${Math.min(goal.percentage, 100)}%`, borderRadius: "3px", background: goal.percentage >= 80 ? "#16A34A" : goal.percentage >= 50 ? "#F59E0B" : "#2563EB", transition: "width 1s ease" }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {budgets.length > 0 && (
          <div style={{ borderRadius: "20px", background: "white", padding: isMobile ? "20px" : "24px", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <CircleDollarSign style={{ height: "16px", width: "16px", color: "#16A34A" }} />
                <h3 style={{ fontSize: "15px", fontWeight: 600, color: "#111111", margin: 0 }}>Budgets</h3>
              </div>
              <Link href="/dashboard/budgets" style={{ fontSize: "13px", fontWeight: 500, color: "#2563EB", textDecoration: "none" }}>View all</Link>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, 1fr)", gap: "10px" }}>
              {budgets.slice(0, isMobile ? 4 : 4).map((b) => (
                <div
                  key={b.id}
                  style={{
                    borderRadius: "14px",
                    padding: isMobile ? "12px" : "16px",
                    background: b.status === "exceeded" ? "#FEF2F2" : b.status === "warning" ? "#FFFBEB" : "#F9FAFB",
                    border: `1px solid ${b.status === "exceeded" ? "#FECACA" : b.status === "warning" ? "#FEF3C7" : "#F3F4F6"}`,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "8px" }}>
                    <span style={{ fontSize: "14px" }}>{b.category?.icon || "💰"}</span>
                    <span style={{ fontSize: "12px", fontWeight: 500, color: "#111111", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>{b.category?.name || "Uncategorized"}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "6px" }}>
                    <span style={{ fontSize: isMobile ? "16px" : "18px", fontWeight: 600, color: b.status === "exceeded" ? "#DC2626" : "#111111" }}>{formatCurrency(b.spent)}</span>
                    <span style={{ fontSize: "11px", color: "#9CA3AF" }}>/ {formatCurrency(b.budgeted)}</span>
                  </div>
                  <div style={{ height: "4px", borderRadius: "2px", background: "#E5E7EB" }}>
                    <div style={{ height: "100%", width: `${Math.min(b.percentage, 100)}%`, borderRadius: "2px", background: b.status === "exceeded" ? "#DC2626" : b.status === "warning" ? "#F59E0B" : "#16A34A" }} />
                  </div>
                  <span style={{ fontSize: "10px", color: "#9CA3AF", marginTop: "4px", display: "block" }}>{b.percentage}% used</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr 1fr", gap: "16px" }}>
          <div style={{ borderRadius: "20px", background: "white", padding: isMobile ? "20px" : "24px", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Calendar style={{ height: "16px", width: "16px", color: "#F59E0B" }} />
                <h3 style={{ fontSize: "15px", fontWeight: 600, color: "#111111", margin: 0 }}>Upcoming Bills</h3>
              </div>
              <Link href="/dashboard/cashflow" style={{ fontSize: "13px", fontWeight: 500, color: "#2563EB", textDecoration: "none" }}>View all</Link>
            </div>
            {upcomingBills.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {upcomingBills.map((bill: any, i: number) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 12px", borderRadius: "12px", background: "#F9FAFB" }}>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <p style={{ fontSize: "13px", fontWeight: 500, color: "#111111", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>{bill.description}</p>
                      <p style={{ fontSize: "11px", color: "#9CA3AF", margin: "2px 0 0 0" }}>{formatDate(bill.date)}</p>
                    </div>
                    <span style={{ fontSize: "13px", fontWeight: 600, color: "#DC2626", flexShrink: 0, marginLeft: "8px" }}>-{formatCurrency(bill.amount)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "32px 0" }}>
                <Calendar style={{ height: "24px", width: "24px", color: "#D1D5DB" }} />
                <p style={{ fontSize: "13px", color: "#9CA3AF", marginTop: "8px" }}>No upcoming bills</p>
              </div>
            )}
          </div>

          <div style={{ borderRadius: "20px", background: "white", padding: isMobile ? "20px" : "24px", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <ArrowLeftRight style={{ height: "16px", width: "16px", color: "#2563EB" }} />
                <h3 style={{ fontSize: "15px", fontWeight: 600, color: "#111111", margin: 0 }}>Recent Transactions</h3>
              </div>
              <Link href="/dashboard/transactions" style={{ fontSize: "13px", fontWeight: 500, color: "#2563EB", textDecoration: "none" }}>View all</Link>
            </div>
            {stats.recentTransactions.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                {stats.recentTransactions.slice(0, 5).map((tx: any) => (
                  <div key={tx.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 12px", borderRadius: "12px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0, flex: 1 }}>
                      <div style={{ height: "32px", width: "32px", borderRadius: "8px", background: "#F9FAFB", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px", flexShrink: 0 }}>
                        {tx.category?.icon || "💰"}
                      </div>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <p style={{ fontSize: "13px", fontWeight: 500, color: "#111111", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>{tx.description}</p>
                        <p style={{ fontSize: "11px", color: "#9CA3AF", margin: "2px 0 0 0" }}>{formatDate(tx.date)}</p>
                      </div>
                    </div>
                    <span style={{ fontSize: "13px", fontWeight: 600, color: tx.type === "income" ? "#16A34A" : "#111111", flexShrink: 0 }}>
                      {tx.type === "income" ? "+" : "-"}{formatCurrency(tx.amount)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "32px 0" }}>
                <ArrowLeftRight style={{ height: "24px", width: "24px", color: "#D1D5DB" }} />
                <p style={{ fontSize: "13px", color: "#9CA3AF", marginTop: "8px" }}>No transactions yet</p>
              </div>
            )}
          </div>

          <div style={{ borderRadius: "20px", background: "white", padding: isMobile ? "20px" : "24px", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
              <CreditCard style={{ height: "16px", width: "16px", color: "#7C3AED" }} />
              <h3 style={{ fontSize: "15px", fontWeight: 600, color: "#111111", margin: 0 }}>Subscriptions</h3>
            </div>
            {subscriptions.length > 0 ? (
              <>
                <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "16px" }}>
                  {subscriptions.slice(0, 4).map((sub) => (
                    <div key={sub.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0, flex: 1 }}>
                        <div style={{ height: "8px", width: "8px", borderRadius: "9999px", background: sub.color || "#6B7280", flexShrink: 0 }} />
                        <span style={{ fontSize: "13px", color: "#6B7280", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>{sub.name}</span>
                      </div>
                      <span style={{ fontSize: "13px", fontWeight: 500, color: "#111111", flexShrink: 0 }}>{formatCurrency(sub.monthlyCost)}/mo</span>
                    </div>
                  ))}
                </div>
                <div style={{ padding: "12px", borderRadius: "12px", background: "#F9FAFB", borderTop: "1px solid #F3F4F6", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontSize: "13px", fontWeight: 600, color: "#6B7280" }}>Total monthly</span>
                  <span style={{ fontSize: "16px", fontWeight: 700, color: "#111111" }}>{formatCurrency(activeSubCost)}</span>
                </div>
              </>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "32px 0" }}>
                <CreditCard style={{ height: "24px", width: "24px", color: "#D1D5DB" }} />
                <p style={{ fontSize: "13px", color: "#9CA3AF", marginTop: "8px" }}>No subscriptions</p>
              </div>
            )}
          </div>
        </div>

        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
            <Zap style={{ height: "16px", width: "16px", color: "#F59E0B" }} />
            <h3 style={{ fontSize: "15px", fontWeight: 600, color: "#111111", margin: 0 }}>Quick Actions</h3>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, 1fr)", gap: isMobile ? "10px" : "12px" }}>
            {[
              { label: "Add Transaction", icon: Plus, href: "/dashboard/transactions", bg: "#EFF6FF", color: "#2563EB" },
              { label: "Scan Receipt", icon: Camera, href: "/dashboard/receipts", bg: "#F0FDF4", color: "#16A34A" },
              { label: "Ask Assistant", icon: MessageCircle, href: "/dashboard/assistant", bg: "#FAF5FF", color: "#7C3AED" },
              { label: "View Reports", icon: BarChart3, href: "/dashboard/reports", bg: "#FFFBEB", color: "#F59E0B" },
            ].map((action) => (
              <Link
                key={action.label}
                href={action.href}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: isMobile ? "8px" : "12px",
                  borderRadius: "14px",
                  background: "white",
                  padding: isMobile ? "14px" : "18px 20px",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                  border: "1px solid #F3F4F6",
                  textDecoration: "none",
                }}
              >
                <div style={{ height: isMobile ? "36px" : "40px", width: isMobile ? "36px" : "40px", borderRadius: "12px", background: action.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <action.icon style={{ height: isMobile ? "18px" : "20px", width: isMobile ? "18px" : "20px", color: action.color }} />
                </div>
                <span style={{ fontSize: "13px", fontWeight: 500, color: "#111111" }}>{action.label}</span>
                {!isMobile && <ArrowRight style={{ height: "16px", width: "16px", color: "#D1D5DB", marginLeft: "auto" }} />}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}
