"use client"

import { useSession } from "next-auth/react"
import { useEffect, useState } from "react"
import { GitBranch, Plus, ArrowRight, TrendingUp, BarChart3 } from "lucide-react"
import { Modal } from "@/components/ui/modal"

interface Scenario {
  id: string
  name: string
  type: string
  description: string
  assumptions: string
  result: {
    projectedSavings: number
    projectedBalance: number
    goalImpact: string
    monthlyChange: number
  } | null
  createdAt: string
}

interface ScenarioComparison {
  scenarios: Scenario[]
  summary: {
    bestSavings: string
    worstSavings: string
    recommendation: string
  }
}

const formatCurrency = (n: number) =>
  `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

export default function ScenariosPage() {
  const { status } = useSession()
  const [scenarios, setScenarios] = useState<Scenario[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [compareMode, setCompareMode] = useState(false)
  const [selectedForCompare, setSelectedForCompare] = useState<string[]>([])
  const [comparison, setComparison] = useState<ScenarioComparison | null>(null)
  const [comparing, setComparing] = useState(false)
  const [form, setForm] = useState({
    name: "",
    type: "salary_raise",
    description: "",
    raisePercentage: "",
    expenseAmount: "",
    expenseCategory: "",
    investMonthly: "",
    investReturn: "",
  })

  const [hoverAdd, setHoverAdd] = useState(false)
  const [hoverCompare, setHoverCompare] = useState(false)
  const [hoverCard, setHoverCard] = useState<string | null>(null)
  const [hoverCancel, setHoverCancel] = useState(false)
  const [hoverSubmit, setHoverSubmit] = useState(false)
  const [inputFocused, setInputFocused] = useState<string | null>(null)
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
    if (status === "authenticated") fetchScenarios()
  }, [status])

  const fetchScenarios = async () => {
    try {
      const res = await fetch("/api/scenarios")
      const data = await res.json()
      setScenarios(Array.isArray(data) ? data : data.scenarios || [])
    } catch {
      console.error("Failed to fetch scenarios")
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    const payload: any = {
      name: form.name,
      type: form.type,
      description: form.description,
    }

    if (form.type === "salary_raise") {
      payload.raisePercentage = parseFloat(form.raisePercentage)
      payload.assumptions = `Salary increase of ${form.raisePercentage}%`
    } else if (form.type === "new_expense") {
      payload.amount = parseFloat(form.expenseAmount)
      payload.category = form.expenseCategory
      payload.assumptions = `New monthly expense: ${form.expenseCategory} (${formatCurrency(parseFloat(form.expenseAmount))})`
    } else if (form.type === "investment") {
      payload.monthlyAmount = parseFloat(form.investMonthly)
      payload.expectedReturn = parseFloat(form.investReturn)
      payload.assumptions = `Monthly investment: ${formatCurrency(parseFloat(form.investMonthly))} at ${form.investReturn}% return`
    }

    await fetch("/api/scenarios", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })

    setModalOpen(false)
    setForm({ name: "", type: "salary_raise", description: "", raisePercentage: "", expenseAmount: "", expenseCategory: "", investMonthly: "", investReturn: "" })
    fetchScenarios()
  }

  const handleCompare = async () => {
    if (selectedForCompare.length < 2) return
    setComparing(true)
    try {
      const res = await fetch("/api/scenarios/compare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scenarioIds: selectedForCompare }),
      })
      const data = await res.json()
      setComparison(data)
    } catch {
      console.error("Failed to compare scenarios")
    } finally {
      setComparing(false)
    }
  }

  const toggleCompare = (id: string) => {
    setSelectedForCompare((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    )
  }

  const getTypeConfig = (type: string) => {
    switch (type) {
      case "salary_raise":
        return { label: "Salary Raise", color: "#16A34A", bg: "#F0FDF4" }
      case "new_expense":
        return { label: "New Expense", color: "#DC2626", bg: "#FEF2F2" }
      case "investment":
        return { label: "Investment", color: "#2563EB", bg: "#EFF6FF" }
      default:
        return { label: type, color: "#6B7280", bg: "#F3F4F6" }
    }
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
    boxShadow: inputFocused === field ? "0 0 0 2px rgba(37,99,235,0.1)" : "none",
    boxSizing: "border-box" as const,
  })

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
          <h1 style={{ fontSize: isMobile ? "22px" : "28px", fontWeight: 700, color: "#111111", letterSpacing: "-0.025em" }}>Scenario Planner</h1>
          <p style={{ fontSize: "15px", color: "#6B7280", marginTop: "2px" }}>Plan and compare financial scenarios</p>
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          {compareMode ? (
            <>
              <button
                onClick={() => { setCompareMode(false); setSelectedForCompare([]); setComparison(null) }}
                onMouseEnter={() => setHoverCancel(true)}
                onMouseLeave={() => setHoverCancel(false)}
                style={{
                  display: "inline-flex", alignItems: "center", gap: "8px",
                  borderRadius: "9999px", padding: "10px 20px",
                  background: hoverCancel ? "#F3F4F6" : "white",
                  border: "1px solid #E5E7EB", fontSize: "14px", fontWeight: 500,
                  color: "#6B7280", transition: "all 150ms ease", cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleCompare}
                disabled={selectedForCompare.length < 2 || comparing}
                onMouseEnter={() => setHoverCompare(true)}
                onMouseLeave={() => setHoverCompare(false)}
                style={{
                  display: "inline-flex", alignItems: "center", gap: "8px",
                  borderRadius: "9999px", padding: "10px 20px",
                  background: selectedForCompare.length >= 2 ? (hoverCompare ? "#1D4ED8" : "#2563EB") : "#E5E7EB",
                  fontSize: "14px", fontWeight: 500, color: "white",
                  transition: "all 150ms ease",
                  cursor: selectedForCompare.length >= 2 ? "pointer" : "not-allowed",
                  opacity: comparing ? 0.6 : 1, border: "none",
                }}
              >
                <BarChart3 style={{ width: "16px", height: "16px" }} />
                {comparing ? "Comparing..." : `Compare (${selectedForCompare.length})`}
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setCompareMode(true)}
                onMouseEnter={() => setHoverCompare(true)}
                onMouseLeave={() => setHoverCompare(false)}
                style={{
                  display: "inline-flex", alignItems: "center", gap: "8px",
                  borderRadius: "9999px", padding: "10px 20px",
                  background: hoverCompare ? "#F3F4F6" : "white",
                  border: "1px solid #E5E7EB", fontSize: "14px", fontWeight: 500,
                  color: "#6B7280", transition: "all 150ms ease", cursor: "pointer",
                }}
              >
                <BarChart3 style={{ width: "16px", height: "16px" }} />
                Compare
              </button>
              <button
                onClick={() => { setModalOpen(true) }}
                onMouseEnter={() => setHoverAdd(true)}
                onMouseLeave={() => setHoverAdd(false)}
                style={{
                  display: "inline-flex", alignItems: "center", gap: "8px",
                  borderRadius: "9999px", padding: "10px 20px",
                  background: hoverAdd ? "#1D4ED8" : "#2563EB",
                  fontSize: "14px", fontWeight: 500, color: "white",
                  transition: "all 150ms ease", cursor: "pointer",
                  boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
                }}
              >
                <Plus style={{ width: "16px", height: "16px" }} />
                Create Scenario
              </button>
            </>
          )}
        </div>
      </div>

      {comparison && (
        <div style={{ borderRadius: "20px", background: "white", padding: "24px", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
          <h3 style={{ fontSize: "17px", fontWeight: 600, color: "#111111", marginBottom: "20px" }}>Scenario Comparison</h3>
          <div style={{ display: "grid", gridTemplateColumns: `repeat(${comparison.scenarios.length}, 1fr)`, gap: "16px", marginBottom: "20px" }}>
            {comparison.scenarios.map((s) => {
              const typeConfig = getTypeConfig(s.type)
              return (
                <div key={s.id} style={{ borderRadius: "16px", background: "#F8F8F6", padding: "20px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
                    <span style={{
                      fontSize: "11px", fontWeight: 500, padding: "2px 8px",
                      borderRadius: "9999px", background: typeConfig.bg, color: typeConfig.color,
                    }}>
                      {typeConfig.label}
                    </span>
                  </div>
                  <p style={{ fontSize: "15px", fontWeight: 600, color: "#111111", margin: "0 0 8px" }}>{s.name}</p>
                  {s.result && (
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      <div>
                        <p style={{ fontSize: "11px", color: "#9CA3AF", margin: 0 }}>Projected Savings</p>
                        <p style={{ fontSize: "18px", fontWeight: 700, color: "#2563EB", margin: "2px 0 0" }}>{formatCurrency(s.result.projectedSavings)}</p>
                      </div>
                      <div>
                        <p style={{ fontSize: "11px", color: "#9CA3AF", margin: 0 }}>Monthly Change</p>
                        <p style={{ fontSize: "14px", fontWeight: 600, color: s.result.monthlyChange >= 0 ? "#16A34A" : "#DC2626", margin: "2px 0 0" }}>
                          {s.result.monthlyChange >= 0 ? "+" : ""}{formatCurrency(s.result.monthlyChange)}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
          {comparison.summary && (
            <div style={{ padding: "16px", background: "#EFF6FF", borderRadius: "12px", border: "1px solid #DBEAFE" }}>
              <p style={{ fontSize: "13px", fontWeight: 500, color: "#2563EB", margin: "0 0 4px" }}>Recommendation</p>
              <p style={{ fontSize: "14px", color: "#1E40AF", margin: 0, lineHeight: "1.5" }}>{comparison.summary.recommendation}</p>
            </div>
          )}
        </div>
      )}

      {scenarios.length > 0 ? (
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(2, 1fr)", gap: isMobile ? "12px" : "16px" }}>
          {scenarios.map((scenario) => {
            const typeConfig = getTypeConfig(scenario.type)
            const isHovered = hoverCard === scenario.id
            const isSelected = selectedForCompare.includes(scenario.id)
            return (
              <div
                key={scenario.id}
                onClick={() => compareMode ? toggleCompare(scenario.id) : undefined}
                onMouseEnter={() => setHoverCard(scenario.id)}
                onMouseLeave={() => setHoverCard(null)}
                style={{
                  background: "white", borderRadius: "20px", padding: isMobile ? "16px" : "24px",
                  boxShadow: isHovered ? "0 2px 8px rgba(0,0,0,0.06)" : "0 1px 3px rgba(0,0,0,0.04)",
                  transition: "all 200ms ease",
                  cursor: compareMode ? "pointer" : "default",
                  border: isSelected ? "2px solid #2563EB" : "2px solid transparent",
                }}
              >
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "14px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <div style={{
                      display: "flex", width: "40px", height: "40px", alignItems: "center", justifyContent: "center",
                      borderRadius: "10px", background: typeConfig.bg,
                    }}>
                      <GitBranch style={{ width: "18px", height: "18px", color: typeConfig.color }} />
                    </div>
                    <div>
                      <p style={{ fontSize: "15px", fontWeight: 600, color: "#111111", margin: 0 }}>{scenario.name}</p>
                      <span style={{
                        display: "inline-block", fontSize: "11px", fontWeight: 500,
                        padding: "2px 8px", borderRadius: "9999px", marginTop: "4px",
                        background: typeConfig.bg, color: typeConfig.color,
                      }}>
                        {typeConfig.label}
                      </span>
                    </div>
                  </div>
                  {compareMode && (
                    <div style={{
                      width: "20px", height: "20px", borderRadius: "6px",
                      border: isSelected ? "2px solid #2563EB" : "2px solid #D1D5DB",
                      background: isSelected ? "#2563EB" : "white",
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      {isSelected && <span style={{ color: "white", fontSize: "12px", fontWeight: 700 }}>✓</span>}
                    </div>
                  )}
                </div>

                {scenario.description && (
                  <p style={{ fontSize: "13px", color: "#6B7280", margin: "0 0 12px", lineHeight: "1.5" }}>{scenario.description}</p>
                )}

                {scenario.assumptions && (
                  <div style={{ padding: "10px 12px", background: "#F9FAFB", borderRadius: "10px", marginBottom: "14px" }}>
                    <p style={{ fontSize: "12px", color: "#6B7280", margin: 0, lineHeight: "1.5" }}>{scenario.assumptions}</p>
                  </div>
                )}

                {scenario.result && (
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", borderTop: "1px solid #F3F4F6", paddingTop: "14px" }}>
                    <div>
                      <p style={{ fontSize: "11px", color: "#9CA3AF", margin: 0, textTransform: "uppercase", letterSpacing: "0.05em" }}>Projected Savings</p>
                      <p style={{ fontSize: "16px", fontWeight: 600, color: "#2563EB", margin: "4px 0 0" }}>{formatCurrency(scenario.result.projectedSavings)}</p>
                    </div>
                    <div>
                      <p style={{ fontSize: "11px", color: "#9CA3AF", margin: 0, textTransform: "uppercase", letterSpacing: "0.05em" }}>Monthly Change</p>
                      <p style={{ fontSize: "16px", fontWeight: 600, color: scenario.result.monthlyChange >= 0 ? "#16A34A" : "#DC2626", margin: "4px 0 0" }}>
                        {scenario.result.monthlyChange >= 0 ? "+" : ""}{formatCurrency(scenario.result.monthlyChange)}
                      </p>
                    </div>
                  </div>
                )}
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
            <GitBranch style={{ width: "24px", height: "24px", color: "#9CA3AF" }} />
          </div>
          <p style={{ fontSize: "16px", fontWeight: 500, color: "#111111", marginBottom: "4px" }}>No scenarios yet</p>
          <p style={{ fontSize: "14px", color: "#9CA3AF", marginBottom: "24px" }}>Create a scenario to plan your financial future</p>
          <button
            onClick={() => setModalOpen(true)}
            onMouseEnter={() => setHoverAdd(true)}
            onMouseLeave={() => setHoverAdd(false)}
            style={{
              display: "inline-flex", alignItems: "center", gap: "8px",
              borderRadius: "9999px", padding: "10px 20px",
              background: hoverAdd ? "#1D4ED8" : "#2563EB",
              fontSize: "14px", fontWeight: 500, color: "white",
              transition: "all 150ms ease", cursor: "pointer",
            }}
          >
            <Plus style={{ width: "16px", height: "16px" }} />
            Create Scenario
          </button>
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Create Scenario">
        <form onSubmit={handleCreate} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div>
            <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "#111111", marginBottom: "6px" }}>Scenario Name</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              onFocus={() => setInputFocused("name")}
              onBlur={() => setInputFocused(null)}
              placeholder="e.g. What if I get a raise?"
              required
              style={inputStyle("name")}
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "#111111", marginBottom: "6px" }}>Type</label>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "8px" }}>
              {[
                { value: "salary_raise", label: "Salary Raise", color: "#16A34A" },
                { value: "new_expense", label: "New Expense", color: "#DC2626" },
                { value: "investment", label: "Investment", color: "#2563EB" },
              ].map((t) => {
                const isActive = form.type === t.value
                return (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setForm({ ...form, type: t.value })}
                    style={{
                      borderRadius: "12px", padding: "10px", fontSize: "13px", fontWeight: 500,
                      border: isActive ? `1px solid ${t.color}` : "1px solid #E5E7EB",
                      background: isActive ? t.color + "10" : "white",
                      color: isActive ? t.color : "#6B7280",
                      cursor: "pointer", transition: "all 150ms ease",
                    }}
                  >
                    {t.label}
                  </button>
                )
              })}
            </div>
          </div>

          <div>
            <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "#111111", marginBottom: "6px" }}>Description</label>
            <input
              type="text"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              onFocus={() => setInputFocused("description")}
              onBlur={() => setInputFocused(null)}
              placeholder="Brief description"
              style={inputStyle("description")}
            />
          </div>

          {form.type === "salary_raise" && (
            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "#111111", marginBottom: "6px" }}>Raise Percentage (%)</label>
              <input
                type="number"
                step="0.1"
                value={form.raisePercentage}
                onChange={(e) => setForm({ ...form, raisePercentage: e.target.value })}
                onFocus={() => setInputFocused("raisePercentage")}
                onBlur={() => setInputFocused(null)}
                placeholder="10"
                min="0.1"
                required
                style={inputStyle("raisePercentage")}
              />
            </div>
          )}

          {form.type === "new_expense" && (
            <>
              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "#111111", marginBottom: "6px" }}>Monthly Amount ($)</label>
                <input
                  type="number"
                  step="0.01"
                  value={form.expenseAmount}
                  onChange={(e) => setForm({ ...form, expenseAmount: e.target.value })}
                  onFocus={() => setInputFocused("expenseAmount")}
                  onBlur={() => setInputFocused(null)}
                  placeholder="0.00"
                  min="0.01"
                  required
                  style={inputStyle("expenseAmount")}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "#111111", marginBottom: "6px" }}>Category</label>
                <input
                  type="text"
                  value={form.expenseCategory}
                  onChange={(e) => setForm({ ...form, expenseCategory: e.target.value })}
                  onFocus={() => setInputFocused("expenseCategory")}
                  onBlur={() => setInputFocused(null)}
                  placeholder="e.g. Gym membership"
                  required
                  style={inputStyle("expenseCategory")}
                />
              </div>
            </>
          )}

          {form.type === "investment" && (
            <>
              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "#111111", marginBottom: "6px" }}>Monthly Investment ($)</label>
                <input
                  type="number"
                  step="0.01"
                  value={form.investMonthly}
                  onChange={(e) => setForm({ ...form, investMonthly: e.target.value })}
                  onFocus={() => setInputFocused("investMonthly")}
                  onBlur={() => setInputFocused(null)}
                  placeholder="0.00"
                  min="0.01"
                  required
                  style={inputStyle("investMonthly")}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "#111111", marginBottom: "6px" }}>Expected Annual Return (%)</label>
                <input
                  type="number"
                  step="0.1"
                  value={form.investReturn}
                  onChange={(e) => setForm({ ...form, investReturn: e.target.value })}
                  onFocus={() => setInputFocused("investReturn")}
                  onBlur={() => setInputFocused(null)}
                  placeholder="7"
                  min="0.1"
                  required
                  style={inputStyle("investReturn")}
                />
              </div>
            </>
          )}

          <div style={{ display: "flex", gap: "12px", paddingTop: "8px" }}>
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              onMouseEnter={() => setHoverCancel(true)}
              onMouseLeave={() => setHoverCancel(false)}
              style={{
                flex: 1, height: "44px", borderRadius: "9999px",
                border: "1px solid #E5E7EB", background: hoverCancel ? "#F9FAFB" : "white",
                fontSize: "14px", fontWeight: 500, color: "#111111",
                transition: "all 150ms ease", cursor: "pointer",
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              onMouseEnter={() => setHoverSubmit(true)}
              onMouseLeave={() => setHoverSubmit(false)}
              style={{
                flex: 1, height: "44px", borderRadius: "9999px",
                background: hoverSubmit ? "#1D4ED8" : "#2563EB",
                color: "white", fontSize: "14px", fontWeight: 500,
                transition: "all 150ms ease", cursor: "pointer",
                boxShadow: "0 1px 2px rgba(0,0,0,0.05)", border: "none",
              }}
            >
              Create Scenario
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
