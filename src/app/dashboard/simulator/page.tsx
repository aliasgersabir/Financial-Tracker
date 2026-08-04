"use client"

import { useSession } from "next-auth/react"
import { useEffect, useState, useMemo } from "react"
import { TrendingUp, Sliders, BarChart3 } from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts"

interface ExpenseCategory {
  id: string
  name: string
  amount: number
  color: string
}

const defaultCategories: ExpenseCategory[] = [
  { id: "housing", name: "Housing / Rent", amount: 15000, color: "#2563EB" },
  { id: "food", name: "Food & Groceries", amount: 8000, color: "#16A34A" },
  { id: "transport", name: "Transport", amount: 5000, color: "#F59E0B" },
  { id: "utilities", name: "Utilities", amount: 3000, color: "#8B5CF6" },
  { id: "entertainment", name: "Entertainment", amount: 4000, color: "#EC4899" },
  { id: "insurance", name: "Insurance", amount: 3000, color: "#06B6D4" },
  { id: "other", name: "Other Expenses", amount: 5000, color: "#6B7280" },
]

export default function SimulatorPage() {
  const { status } = useSession()
  const [loading, setLoading] = useState(true)
  const [isMobile, setIsMobile] = useState(false)
  const [inputFocused, setInputFocused] = useState<string | null>(null)
  const [hoveredCard, setHoveredCard] = useState<string | null>(null)

  const [monthlyIncome, setMonthlyIncome] = useState(80000)
  const [categories, setCategories] = useState<ExpenseCategory[]>(defaultCategories)
  const [annualReturn, setAnnualReturn] = useState(8)
  const [inflationRate, setInflationRate] = useState(6)
  const [activeTab, setActiveTab] = useState<"1" | "3" | "5" | "10">("5")

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
    if (status === "authenticated") setLoading(false)
  }, [status])

  const totalExpenses = useMemo(
    () => categories.reduce((sum, c) => sum + c.amount, 0),
    [categories]
  )

  const monthlySavings = useMemo(
    () => Math.max(monthlyIncome - totalExpenses, 0),
    [monthlyIncome, totalExpenses]
  )

  const savingsRate = useMemo(
    () => (monthlyIncome > 0 ? (monthlySavings / monthlyIncome) * 100 : 0),
    [monthlySavings, monthlyIncome]
  )

  const chartData = useMemo(() => {
    const years = parseInt(activeTab)
    const months = years * 12
    const monthlyRate = annualReturn / 100 / 12
    const monthlyInflation = inflationRate / 100 / 12
    const data: {
      month: number
      label: string
      nominal: number
      real: number
      contributed: number
    }[] = []

    let balance = 0
    let balanceReal = 0

    const step = years <= 1 ? 1 : years <= 3 ? 3 : years <= 5 ? 6 : 12

    for (let m = 0; m <= months; m++) {
      if (m > 0) {
        balance = balance * (1 + monthlyRate) + monthlySavings
        balanceReal =
          balanceReal * (1 + monthlyInflation) + monthlySavings
      }

      if (m % step === 0) {
        const year = Math.floor(m / 12)
        const month = m % 12
        data.push({
          month: m,
          label:
            m === 0
              ? "Now"
              : month === 0
              ? `Y${year}`
              : `${year}y${month}m`,
          nominal: Math.round(balance),
          real: Math.round(balanceReal),
          contributed: Math.round(monthlySavings * m),
        })
      }
    }
    return data
  }, [activeTab, monthlySavings, annualReturn, inflationRate])

  const projections = useMemo(() => {
    const results: { years: number; nominal: number; real: number }[] = []
    const monthlyRate = annualReturn / 100 / 12

    for (const yrs of [1, 3, 5, 10]) {
      let balance = 0
      for (let m = 0; m < yrs * 12; m++) {
        balance = balance * (1 + monthlyRate) + monthlySavings
      }
      results.push({ years: yrs, nominal: Math.round(balance), real: 0 })
    }

    const monthlyInflation = inflationRate / 100 / 12
    for (const r of results) {
      let balance = 0
      for (let m = 0; m < r.years * 12; m++) {
        balance = balance * (1 + monthlyInflation) + monthlySavings
      }
      r.real = Math.round(balance)
    }

    return results
  }, [monthlySavings, annualReturn, inflationRate])

  const updateCategory = (id: string, amount: number) => {
    setCategories((prev) =>
      prev.map((c) => (c.id === id ? { ...c, amount: Math.max(0, amount) } : c))
    )
  }

  const inputStyle = (field: string): React.CSSProperties => ({
    height: "44px",
    width: "100%",
    borderRadius: "12px",
    border: inputFocused === field ? "1px solid #2563EB" : "1px solid #E5E7EB",
    background: "white",
    padding: "0 14px",
    fontSize: "14px",
    color: "#111111",
    outline: "none",
    transition: "all 150ms ease",
    boxShadow:
      inputFocused === field ? "0 0 0 2px rgba(37,99,235,0.1)" : "none",
    boxSizing: "border-box" as const,
  })

  const rangeStyle: React.CSSProperties = {
    WebkitAppearance: "none",
    appearance: "none",
    width: "100%",
    height: "6px",
    borderRadius: "9999px",
    background: "#E5E7EB",
    outline: "none",
    cursor: "pointer",
  }

  const tabStyle = (tab: string): React.CSSProperties => ({
    padding: "8px 20px",
    borderRadius: "9999px",
    fontSize: "14px",
    fontWeight: 500,
    cursor: "pointer",
    transition: "all 150ms ease",
    border: "none",
    background: activeTab === tab ? "#2563EB" : "white",
    color: activeTab === tab ? "white" : "#6B7280",
    boxShadow:
      activeTab === tab ? "0 1px 2px rgba(0,0,0,0.05)" : "1px solid #E5E7EB",
  })

  if (status === "loading" || loading) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "256px",
        }}
      >
        <style
          dangerouslySetInnerHTML={{
            __html: `@keyframes spin { to { transform: rotate(360deg); } }`,
          }}
        />
        <div
          style={{
            width: "24px",
            height: "24px",
            animation: "spin 1s linear infinite",
            borderRadius: "9999px",
            border: "2px solid #E5E7EB",
            borderTopColor: "#2563EB",
          }}
        />
      </div>
    )
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: isMobile ? "12px" : "24px",
      }}
    >
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @keyframes spin { to { transform: rotate(360deg); } }
            input[type=range]::-webkit-slider-thumb {
              -webkit-appearance: none;
              appearance: none;
              width: 20px;
              height: 20px;
              border-radius: 9999px;
              background: #2563EB;
              cursor: pointer;
              box-shadow: 0 1px 3px rgba(0,0,0,0.2);
            }
            input[type=range]::-moz-range-thumb {
              width: 20px;
              height: 20px;
              border-radius: 9999px;
              background: #2563EB;
              cursor: pointer;
              border: none;
              box-shadow: 0 1px 3px rgba(0,0,0,0.2);
            }
          `,
        }}
      />

      <div>
        <h1
          style={{
            fontSize: isMobile ? "22px" : "28px",
            fontWeight: 700,
            color: "#111111",
            letterSpacing: "-0.025em",
          }}
        >
          Financial Simulator
        </h1>
        <p style={{ fontSize: "15px", color: "#6B7280", marginTop: "2px" }}>
          What-if planner &amp; compound growth calculator
        </p>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
          gap: isMobile ? "12px" : "16px",
        }}
      >
        <div
          style={{
            borderRadius: "20px",
            background: "white",
            padding: isMobile ? "16px" : "24px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
            border: "1px solid #E5E7EB",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              marginBottom: "16px",
            }}
          >
            <div
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "10px",
                background: "#EFF6FF",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Sliders style={{ width: "16px", height: "16px", color: "#2563EB" }} />
            </div>
            <p
              style={{
                fontSize: "15px",
                fontWeight: 600,
                color: "#111111",
              }}
            >
              Income &amp; Expenses
            </p>
          </div>

          <div style={{ marginBottom: "20px" }}>
            <label
              style={{
                display: "block",
                fontSize: "13px",
                fontWeight: 500,
                color: "#111111",
                marginBottom: "6px",
              }}
            >
              Monthly Income
            </label>
            <input
              type="number"
              value={monthlyIncome}
              onChange={(e) =>
                setMonthlyIncome(Math.max(0, parseFloat(e.target.value) || 0))
              }
              onFocus={() => setInputFocused("income")}
              onBlur={() => setInputFocused(null)}
              min="0"
              step="1000"
              style={inputStyle("income")}
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {categories.map((cat) => (
              <div key={cat.id}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "6px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    <div
                      style={{
                        width: "8px",
                        height: "8px",
                        borderRadius: "9999px",
                        background: cat.color,
                      }}
                    />
                    <span
                      style={{
                        fontSize: "13px",
                        fontWeight: 500,
                        color: "#111111",
                      }}
                    >
                      {cat.name}
                    </span>
                  </div>
                  <input
                    type="number"
                    value={cat.amount}
                    onChange={(e) =>
                      updateCategory(
                        cat.id,
                        Math.max(0, parseFloat(e.target.value) || 0)
                      )
                    }
                    onFocus={() => setInputFocused(cat.id)}
                    onBlur={() => setInputFocused(null)}
                    min="0"
                    step="500"
                    style={{
                      width: "100px",
                      height: "32px",
                      borderRadius: "8px",
                      border:
                        inputFocused === cat.id
                          ? "1px solid #2563EB"
                          : "1px solid #E5E7EB",
                      background: "white",
                      padding: "0 10px",
                      fontSize: "13px",
                      fontWeight: 500,
                      color: "#111111",
                      outline: "none",
                      textAlign: "right",
                      transition: "all 150ms ease",
                      boxSizing: "border-box" as const,
                    }}
                  />
                </div>
                <input
                  type="range"
                  min="0"
                  max={Math.max(monthlyIncome, cat.amount + 10000)}
                  step="500"
                  value={cat.amount}
                  onChange={(e) =>
                    updateCategory(cat.id, parseInt(e.target.value))
                  }
                  style={{
                    ...rangeStyle,
                    background: `linear-gradient(to right, ${cat.color} ${
                      (cat.amount / Math.max(monthlyIncome, 1)) * 100
                    }%, #E5E7EB ${
                      (cat.amount / Math.max(monthlyIncome, 1)) * 100
                    }%)`,
                  }}
                />
              </div>
            ))}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: isMobile ? "12px" : "16px",
          }}
        >
          <div
            style={{
              borderRadius: "20px",
              background: "white",
              padding: isMobile ? "16px" : "24px",
              boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
              border: "1px solid #E5E7EB",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                marginBottom: "20px",
              }}
            >
              <div
                style={{
                  width: "32px",
                  height: "32px",
                  borderRadius: "10px",
                  background: "#F0FDF4",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <TrendingUp
                  style={{ width: "16px", height: "16px", color: "#16A34A" }}
                />
              </div>
              <p
                style={{
                  fontSize: "15px",
                  fontWeight: 600,
                  color: "#111111",
                }}
              >
                Growth Assumptions
              </p>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              <div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: "8px",
                  }}
                >
                  <span
                    style={{ fontSize: "13px", fontWeight: 500, color: "#111111" }}
                  >
                    Annual Return
                  </span>
                  <span
                    style={{
                      fontSize: "14px",
                      fontWeight: 600,
                      color: "#2563EB",
                    }}
                  >
                    {annualReturn}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="20"
                  step="0.5"
                  value={annualReturn}
                  onChange={(e) =>
                    setAnnualReturn(parseFloat(e.target.value))
                  }
                  style={{
                    ...rangeStyle,
                    background: `linear-gradient(to right, #2563EB ${
                      (annualReturn / 20) * 100
                    }%, #E5E7EB ${(annualReturn / 20) * 100}%)`,
                  }}
                />
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginTop: "4px",
                  }}
                >
                  <span style={{ fontSize: "11px", color: "#9CA3AF" }}>0%</span>
                  <span style={{ fontSize: "11px", color: "#9CA3AF" }}>20%</span>
                </div>
              </div>

              <div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: "8px",
                  }}
                >
                  <span
                    style={{ fontSize: "13px", fontWeight: 500, color: "#111111" }}
                  >
                    Inflation Rate
                  </span>
                  <span
                    style={{
                      fontSize: "14px",
                      fontWeight: 600,
                      color: "#F59E0B",
                    }}
                  >
                    {inflationRate}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="15"
                  step="0.5"
                  value={inflationRate}
                  onChange={(e) =>
                    setInflationRate(parseFloat(e.target.value))
                  }
                  style={{
                    ...rangeStyle,
                    background: `linear-gradient(to right, #F59E0B ${
                      (inflationRate / 15) * 100
                    }%, #E5E7EB ${(inflationRate / 15) * 100}%)`,
                  }}
                />
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginTop: "4px",
                  }}
                >
                  <span style={{ fontSize: "11px", color: "#9CA3AF" }}>0%</span>
                  <span style={{ fontSize: "11px", color: "#9CA3AF" }}>15%</span>
                </div>
              </div>
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr",
              gap: isMobile ? "8px" : "12px",
            }}
          >
            <div
              style={{
                borderRadius: "20px",
                background: "white",
                padding: isMobile ? "14px" : "18px",
                boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                border: "1px solid #E5E7EB",
                textAlign: "center",
              }}
            >
              <p
                style={{
                  fontSize: "11px",
                  color: "#9CA3AF",
                  textTransform: "uppercase" as const,
                  letterSpacing: "0.05em",
                  fontWeight: 500,
                  marginBottom: "4px",
                }}
              >
                Monthly Savings
              </p>
              <p
                style={{
                  fontSize: isMobile ? "18px" : "20px",
                  fontWeight: 700,
                  color: monthlySavings > 0 ? "#16A34A" : "#DC2626",
                  letterSpacing: "-0.025em",
                }}
              >
                {formatCurrency(monthlySavings)}
              </p>
            </div>
            <div
              style={{
                borderRadius: "20px",
                background: "white",
                padding: isMobile ? "14px" : "18px",
                boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                border: "1px solid #E5E7EB",
                textAlign: "center",
              }}
            >
              <p
                style={{
                  fontSize: "11px",
                  color: "#9CA3AF",
                  textTransform: "uppercase" as const,
                  letterSpacing: "0.05em",
                  fontWeight: 500,
                  marginBottom: "4px",
                }}
              >
                Total Expenses
              </p>
              <p
                style={{
                  fontSize: isMobile ? "18px" : "20px",
                  fontWeight: 700,
                  color: "#111111",
                  letterSpacing: "-0.025em",
                }}
              >
                {formatCurrency(totalExpenses)}
              </p>
            </div>
            <div
              style={{
                borderRadius: "20px",
                background: "white",
                padding: isMobile ? "14px" : "18px",
                boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                border: "1px solid #E5E7EB",
                textAlign: "center",
              }}
            >
              <p
                style={{
                  fontSize: "11px",
                  color: "#9CA3AF",
                  textTransform: "uppercase" as const,
                  letterSpacing: "0.05em",
                  fontWeight: 500,
                  marginBottom: "4px",
                }}
              >
                Savings Rate
              </p>
              <p
                style={{
                  fontSize: isMobile ? "18px" : "20px",
                  fontWeight: 700,
                  color: savingsRate >= 20 ? "#16A34A" : savingsRate >= 10 ? "#F59E0B" : "#DC2626",
                  letterSpacing: "-0.025em",
                }}
              >
                {savingsRate.toFixed(1)}%
              </p>
            </div>
          </div>
        </div>
      </div>

      <div
        style={{
          borderRadius: "20px",
          background: "white",
          padding: isMobile ? "16px" : "24px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
          border: "1px solid #E5E7EB",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "20px",
            flexDirection: isMobile ? "column" : "row",
            gap: isMobile ? "12px" : "0",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <div
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "10px",
                background: "#EFF6FF",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <BarChart3
                style={{ width: "16px", height: "16px", color: "#2563EB" }}
              />
            </div>
            <p
              style={{
                fontSize: "15px",
                fontWeight: 600,
                color: "#111111",
              }}
            >
              Growth Projection
            </p>
          </div>
          <div style={{ display: "flex", gap: "6px" }}>
            {(["1", "3", "5", "10"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setActiveTab(t)}
                style={tabStyle(t)}
              >
                {t}Y
              </button>
            ))}
          </div>
        </div>

        <div style={{ width: "100%", height: isMobile ? "250px" : "320px" }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={chartData}
              margin={{
                top: 5,
                right: isMobile ? 5 : 20,
                left: isMobile ? -15 : 10,
                bottom: 5,
              }}
            >
              <defs>
                <linearGradient id="colorNominal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563EB" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorReal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#16A34A" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#16A34A" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorContributed" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.1} />
                  <stop offset="95%" stopColor="#F59E0B" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11, fill: "#9CA3AF" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "#9CA3AF" }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v: number) =>
                  v >= 100000
                    ? `${(v / 100000).toFixed(1)}L`
                    : v >= 1000
                    ? `${(v / 1000).toFixed(0)}K`
                    : `${v}`
                }
              />
              <Tooltip
                formatter={(value, name) => [
                  formatCurrency(Number(value)),
                  name === "nominal"
                    ? "Gross Value"
                    : name === "real"
                    ? "Inflation-Adjusted"
                    : "Contributed",
                ]}
                contentStyle={{
                  borderRadius: "12px",
                  border: "1px solid #E5E7EB",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                  fontSize: "13px",
                }}
              />
              <Legend
                formatter={(value: string) =>
                  value === "nominal"
                    ? "Gross Value"
                    : value === "real"
                    ? "Inflation-Adjusted"
                    : "Contributed"
                }
                iconType="circle"
                iconSize={8}
                wrapperStyle={{ fontSize: "12px", paddingTop: "12px" }}
              />
              <Area
                type="monotone"
                dataKey="contributed"
                stroke="#F59E0B"
                strokeWidth={1.5}
                fill="url(#colorContributed)"
                dot={false}
              />
              <Area
                type="monotone"
                dataKey="real"
                stroke="#16A34A"
                strokeWidth={2}
                fill="url(#colorReal)"
                dot={false}
              />
              <Area
                type="monotone"
                dataKey="nominal"
                stroke="#2563EB"
                strokeWidth={2}
                fill="url(#colorNominal)"
                dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, 1fr)",
          gap: isMobile ? "12px" : "16px",
        }}
      >
        {projections.map((p) => {
          const cardKey = `proj-${p.years}`
          const isHovered = hoveredCard === cardKey
          return (
            <div
              key={p.years}
              onMouseEnter={() => setHoveredCard(cardKey)}
              onMouseLeave={() => setHoveredCard(null)}
              style={{
                borderRadius: "20px",
                background: "white",
                padding: isMobile ? "16px" : "20px",
                boxShadow: isHovered
                  ? "0 2px 8px rgba(0,0,0,0.06)"
                  : "0 1px 3px rgba(0,0,0,0.04)",
                border: "1px solid #E5E7EB",
                transition: "all 200ms ease",
              }}
            >
              <p
                style={{
                  fontSize: "12px",
                  fontWeight: 500,
                  color: "#9CA3AF",
                  textTransform: "uppercase" as const,
                  letterSpacing: "0.05em",
                  marginBottom: "8px",
                }}
              >
                {p.years} {p.years === 1 ? "Year" : "Years"}
              </p>
              <p
                style={{
                  fontSize: isMobile ? "18px" : "22px",
                  fontWeight: 700,
                  color: "#2563EB",
                  letterSpacing: "-0.025em",
                  marginBottom: "4px",
                }}
              >
                {formatCurrency(p.nominal)}
              </p>
              <p
                style={{
                  fontSize: "12px",
                  color: "#9CA3AF",
                }}
              >
                {formatCurrency(p.nominal - p.real)} lost to inflation
              </p>
            </div>
          )
        })}
      </div>
    </div>
  )
}
